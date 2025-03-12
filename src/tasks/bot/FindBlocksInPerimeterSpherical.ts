import type { Bot } from 'mineflayer';
import pBlock, { type Block } from 'prismarine-block';
import { Vec3 } from 'vec3';
import type { Perimeter } from '#/Perimeter';
import { BotTask } from '#/tasks/bot/BotTask';
import {
  FindBlocksInPerimeter,
  type FindBlocksInPerimeterOptions,
  type FullMatcher,
  type Matcher,
} from '#/tasks/bot/FindBlocksInPerimeter';
import { type RequiredDefaults, mergeOptions } from '#/utils';

interface State {
  perimeter: Perimeter;
  result: Block[];
  sphereRange: Range;
  minY: number;
  maxY: number;
  checkCounter: number;
  center: Vec3;
  cursor: Vec3;
  validChunks: Set<string>;
  invalidChunks: Set<string>;
  finished: boolean;
}

class Range extends Array<[number, number, number][]> {
  public distanceMin = Number.POSITIVE_INFINITY;
  public distanceMax = Number.NEGATIVE_INFINITY;

  // biome-ignore lint/complexity/noUselessConstructor: <explanation>
  constructor() {
    super();
  }

  public set(index: number, value: [number, number, number][]) {
    this[index] = value;

    this.distanceMin = Math.min(this.distanceMin, index);
    this.distanceMax = Math.max(this.distanceMax, index);
  }
}

export class FindBlocksInPerimeterSpherical extends BotTask<
  Perimeter,
  unknown,
  Block[]
> {
  protected options: Required<FindBlocksInPerimeterOptions>;

  protected matcher: Matcher;
  protected fullMatcher: FullMatcher;

  private defaultOptions: RequiredDefaults<FindBlocksInPerimeterOptions> = {
    count: Number.POSITIVE_INFINITY,
    useExtraInfo: false,
    chunksPerTick: 4,

    sortFn: false,
  };

  protected defaultState: State = {
    perimeter: null!,
    result: [],
    sphereRange: new Range(),
    minY: 0,
    maxY: 256,
    checkCounter: 0,
    center: new Vec3(0, 0, 0),
    cursor: new Vec3(0, 0, 0),
    validChunks: new Set(),
    invalidChunks: new Set(),
    finished: false,
  };

  protected state = structuredClone(this.defaultState);

  protected Block = pBlock(this.bot.registry);

  protected useExtraBlockInfo: boolean;

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

  public onStart(perimeter: Perimeter, _triggerCtx: unknown) {
    this.state = structuredClone(this.defaultState);

    this.state.perimeter = perimeter;

    this.state.center = this.bot.entity.position.floored();

    if ('minY' in this.bot.game && typeof this.bot.game.minY === 'number') {
      this.state.minY = this.bot.game.minY;
    }

    if ('height' in this.bot.game && typeof this.bot.game.height === 'number') {
      this.state.maxY = this.state.minY + this.bot.game.height;
    }

    console.time('Sphere range generation');
    this.state.sphereRange = this.generateSphereRange();
    console.timeEnd('Sphere range generation');
  }

  public onDone() {
    const result = this.state.result;

    console.log(
      `Found ${result.length} blocks, performed ${this.state.checkCounter} checks`,
    );

    this.state = structuredClone(this.defaultState);

    return this.options.sortFn ? result.sort(this.options.sortFn) : result;
  }

  public onFailed(): void {
    this.state = structuredClone(this.defaultState);
  }

  public isDone = () => {
    return this.state.finished;
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: yeah
  public tick = () => {
    if (this.state.finished) {
      return;
    }

    const sphereRange = this.state.sphereRange;

    for (const distance of sphereRange) {
      if (distance === undefined) {
        continue;
      }

      for (const [x, y, z] of distance) {
        const chunkX = x >> 4;
        const chunkY = y >> 4;
        const chunkZ = z >> 4;

        const subchunkKey = `${chunkX},${chunkY},${chunkZ}`;

        if (this.state.invalidChunks.has(subchunkKey)) {
          continue;
        }

        if (this.state.validChunks.has(subchunkKey) === false) {
          if (this.isBlockInSubchunk(chunkX, chunkY, chunkZ) === false) {
            this.state.invalidChunks.add(subchunkKey);
            continue;
          }

          this.state.validChunks.add(subchunkKey);
        }

        const block = this.bot.blockAt(
          new Vec3(x, y, z),
          this.useExtraBlockInfo,
        );

        this.state.checkCounter += 1;

        if (block !== null && this.fullMatcher(block)) {
          this.state.result.push(block);

          if (this.state.result.length >= this.options.count) {
            this.state.finished = true;
            return;
          }
        }
      }
    }

    this.state.finished = true;
  };

  private isBlockInSubchunk(
    chunkX: number,
    chunkY: number,
    chunkZ: number,
  ): boolean {
    const chunk = this.bot.world.getColumn(chunkX, chunkZ);

    if (chunk === undefined) {
      return false;
    }

    const subchunk = chunk.getSectionAtIndex(chunkY);

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

  private generateSphereRange(): Range {
    const e = this.state.perimeter.extremes;

    const minX = e.minX;
    const maxX = e.maxX;
    const minZ = e.minZ;
    const maxZ = e.maxZ;

    const minY = Math.max(e.minY, this.state.minY);
    const maxY = Math.min(e.maxY, this.state.maxY);

    const center = this.state.center;

    const result = new Range();

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
          const distance = Math.floor(
            Math.sqrt(
              (x - center.x) ** 2 + (y - center.y) ** 2 + (z - center.z) ** 2,
            ),
          );

          if (result.at(distance) === undefined) {
            result[distance] = [];
          }

          result.at(distance)!.push([x, y, z]);
        }
      }
    }

    return result;
  }
}
