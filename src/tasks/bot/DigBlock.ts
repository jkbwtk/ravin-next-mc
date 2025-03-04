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
  ignoreFailure?: boolean;
};

export class DigBlock extends BotTask<Block | Vec3, undefined, undefined> {
  defaultOptions: RequiredDefaults<DigBlockOptions> = {
    ignoreFailure: true,
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

    this.bot
      .dig(this.state.targetBlock)
      .then(() => {
        this.state.done = true;
      })
      .catch(() => {
        this.state.failed = true;
      });
  }

  public isDone = () =>
    this.options.ignoreFailure
      ? this.state.done || this.state.failed
      : this.state.done;

  public isFailed = () =>
    this.options.ignoreFailure ? false : this.state.failed;
}
