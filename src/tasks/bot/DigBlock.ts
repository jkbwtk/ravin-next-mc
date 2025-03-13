import type { Bot } from 'mineflayer';
import type { Block } from 'prismarine-block';
import { Vec3 } from 'vec3';
import { BotTask } from '#/tasks/bot/BotTask';
import { type RequiredDefaults, mergeOptions } from '#/utils';

interface State {
  targetBlock: Block;
  done: boolean;
  failed: boolean;
}

export type DigBlockOptions = {
  useBestTool?: boolean;

  ignoreFailure?: boolean;
  inSight?: boolean;
  verifyBlock?: boolean;
};

export class DigBlock extends BotTask<Block | Vec3, undefined, Block> {
  defaultOptions: RequiredDefaults<DigBlockOptions> = {
    useBestTool: true,

    ignoreFailure: true,
    inSight: true,
    verifyBlock: true,
  };

  options: Required<DigBlockOptions>;

  defaultState: State = {
    targetBlock: null!,
    done: false,
    failed: false,
  };

  state = structuredClone(this.defaultState);

  constructor(bot: Bot, options: DigBlockOptions = {}) {
    super(bot);

    this.options = mergeOptions(options, this.defaultOptions);
  }

  public onStart(target: Block | Vec3, _triggerCtx: undefined): void {
    this.state = structuredClone(this.defaultState);

    const block = target instanceof Vec3 ? this.bot.blockAt(target) : target;

    if (block === null) {
      this.state.failed = true;
      return;
    }

    this.state.targetBlock = block;

    if (this.isValid() === false) {
      this.state.failed = true;
      return;
    }

    if (this.options.useBestTool) {
      this.switchToBestTool();
    }

    this.bot
      .dig(this.state.targetBlock)
      .then(() => {
        this.state.done = true;
      })
      .catch(() => {
        this.state.failed = true;
      });
  }

  public onDone(): Block {
    const block = this.bot.blockAt(this.state.targetBlock.position)!;

    this.cleanup();

    return block;
  }

  public onFailed(): void {
    this.cleanup();
  }

  private isValid(): boolean {
    if (this.options.verifyBlock) {
      const currentBlock = this.bot.blockAt(this.state.targetBlock.position);

      if (currentBlock?.stateId !== this.state.targetBlock.stateId) {
        return false;
      }
    }

    if (
      this.options.inSight &&
      this.bot.canSeeBlock(this.state.targetBlock) === false
    ) {
      return false;
    }

    return true;
  }

  public isDone = () =>
    this.options.ignoreFailure
      ? this.state.done || this.state.failed
      : this.state.done;

  public isFailed = () =>
    this.options.ignoreFailure ? false : this.state.failed;

  private cleanup() {
    this.state = structuredClone(this.defaultState);
  }

  private switchToBestTool() {
    const bestTool = this.bot.pathfinder.bestHarvestTool(
      this.state.targetBlock,
    );

    if (bestTool) {
      this.bot.equip(bestTool, 'hand');
    }
  }
}
