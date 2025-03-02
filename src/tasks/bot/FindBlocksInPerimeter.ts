import type { Bot, FindBlockOptions } from 'mineflayer';
import pBlock, { type Block } from 'prismarine-block';
import type { SubChunk } from 'prismarine-chunk';
import { Vec3 } from 'vec3';
import type { Perimeter } from '#/Perimeter';
import { BotTask } from '#/tasks/bot/BotTask';
import { type RequiredDefaults, arrayFrom, mergeOptions, range } from '#/utils';

interface State {
  perimeter: Perimeter;
  result: Block[];
  chunksToProcess: [number, number][];
  subchunksToProcess: number[];
  minY: number;
  maxY: number;
  finished: boolean;
  checkCounter: number;
}

type Matcher = (block: Block) => boolean;
type FullMatcher = (block: Block) => boolean;

export type FindBlocksInPerimeterOptions = Omit<
  FindBlockOptions,
  'maxDistance' | 'point'
> & {
  chunksPerTick?: number;
  sorted?: boolean;
};

export class FindBlocksInPerimeter extends BotTask<
  Perimeter,
  unknown,
  Block[]
> {
  private options: Required<FindBlocksInPerimeterOptions>;

  private matcher: Matcher;
  private fullMatcher: FullMatcher;

  private defaultOptions: RequiredDefaults<FindBlocksInPerimeterOptions> = {
    count: Number.POSITIVE_INFINITY,
    useExtraInfo: false,
    chunksPerTick: 4,
    sorted: true,
  };

  private defaultState: State = {
    perimeter: null!,
    result: [],
    chunksToProcess: [],
    subchunksToProcess: [],
    minY: 0,
    maxY: 256,
    finished: false,
    checkCounter: 0,
  };

  private state = structuredClone(this.defaultState);

  private Block = pBlock(this.bot.registry);

  private useExtraBlockInfo: boolean;

  constructor(bot: Bot, options: FindBlocksInPerimeterOptions) {
    super(bot);

    this.options = mergeOptions(options, this.defaultOptions);

    this.matcher = FindBlocksInPerimeter.createMatcher(this.options.matching);
    this.fullMatcher = FindBlocksInPerimeter.createFullMatcher(
      this.matcher,
      this.options.useExtraInfo,
    );

    this.useExtraBlockInfo =
      typeof this.options.useExtraInfo === 'function'
        ? true
        : this.options.useExtraInfo;
  }

  private static createMatcher(
    matching: FindBlockOptions['matching'],
  ): Matcher {
    if (typeof matching === 'function') {
      return matching;
    }

    const ids = arrayFrom(matching);

    return (block: Block) => ids.includes(block.type);
  }

  private static createFullMatcher(
    matcher: Matcher,
    useExtraInfo: FindBlockOptions['useExtraInfo'],
  ): FullMatcher {
    if (typeof useExtraInfo === 'function') {
      return (block) => matcher(block) && useExtraInfo(block);
    }

    return matcher;
  }

  public onStart(perimeter: Perimeter, _triggerCtx: unknown) {
    this.state = structuredClone(this.defaultState);

    this.state.perimeter = perimeter;

    if ('minY' in this.bot.game && typeof this.bot.game.minY === 'number') {
      this.state.minY = this.bot.game.minY;
    }

    if ('height' in this.bot.game && typeof this.bot.game.height === 'number') {
      this.state.maxY = this.state.minY + this.bot.game.height;
    }

    const e = this.state.perimeter.extremes;
    const rangeX = range(e.minX >> 4, e.maxX >> 4, true);
    const rangeZ = range(e.minZ >> 4, e.maxZ >> 4, true);

    //@ts-expect-error
    this.state.chunksToProcess = rangeX.flatMap(
      (x) => rangeZ.map((z) => [x, z]),
      true,
    );

    this.state.subchunksToProcess = range(e.minY >> 4, (e.maxY - 1) >> 4, true);
  }

  public onDone() {
    const result = this.state.result;

    console.log(
      `Found ${result.length} blocks, performed ${this.state.checkCounter} checks`,
    );

    this.state = structuredClone(this.defaultState);

    // const pos = this.bot.player.entity.position;

    // return result.sort(
    //   (a, b) => pos.distanceTo(a.position) - pos.distanceTo(b.position),
    // );

    return result;
  }

  public onFailed(): void {
    this.state = structuredClone(this.defaultState);
  }

  public isDone = () => {
    return this.state.chunksToProcess.length === 0;
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: yeah
  public tick = () => {
    const e = this.state.perimeter.extremes;

    for (let i = 0; i < this.options.chunksPerTick; i += 1) {
      const chunkCoords = this.state.chunksToProcess.shift();

      if (chunkCoords === undefined) {
        return;
      }

      const chunk = this.bot.world.getColumn(...chunkCoords);

      if (chunk === undefined) {
        continue;
      }

      const [chunkX, chunkZ] = chunkCoords.map((v) => v * 16) as [
        number,
        number,
      ];

      for (const subchunkIndex of this.state.subchunksToProcess) {
        const subchunk = chunk.getSectionAtIndex(subchunkIndex);
        const chunkY = Math.min(subchunkIndex * 16, this.state.maxY - 1);

        if (
          this.options.useExtraInfo === true ||
          this.isBlockInSubchunk(subchunk)
        ) {
          for (
            let y = Math.max(chunkY - 1, e.minY);
            y <= Math.min(chunkY + 15, e.maxY);
            y += 1
          ) {
            for (
              let x = Math.max(chunkX - 1, e.minX);
              x <= Math.min(chunkX + 15, e.maxX);
              x += 1
            ) {
              for (
                let z = Math.max(chunkZ - 1, e.minZ);
                z <= Math.min(chunkZ + 15, e.maxZ);
                z += 1
              ) {
                const block = this.bot.blockAt(
                  new Vec3(x, y, z),
                  this.useExtraBlockInfo,
                );

                this.state.checkCounter += 1;

                if (block !== null && this.fullMatcher(block)) {
                  this.state.result.push(block);

                  if (this.state.result.length >= this.options.count) {
                    this.state.chunksToProcess = [];
                    return;
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  private isBlockInSubchunk(subchunk: SubChunk): boolean {
    if ('palette' in subchunk && Array.isArray(subchunk.palette)) {
      for (const stateId of subchunk.palette) {
        if (this.matcher(this.Block.fromStateId(stateId, 0))) {
          return true;
        }
      }

      return false;
    }

    // empty subchunk
    return false;
  }
}
