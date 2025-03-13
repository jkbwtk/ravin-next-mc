import type { Bot } from 'mineflayer';
import type { Block } from 'prismarine-block';
import { Vec3 } from 'vec3';
import { BotTask } from '#/tasks/bot/BotTask';
import { type RequiredDefaults, mergeOptions } from '#/utils';

interface State {
  referenceBlock: Block;
  done: boolean;
  failed: boolean;
}

export type PlaceBlockOptions = {
  itemType?: number | null;
  faceVector?: Vec3;
  adjustReference?: Vec3;

  ignoreFailure?: boolean;
  inSight?: boolean;
  verifyEmpty?: boolean;
};

export class PlaceBlock extends BotTask<Block | Vec3, undefined, Block> {
  defaultOptions: RequiredDefaults<PlaceBlockOptions> = {
    itemType: null,
    faceVector: new Vec3(0, 1, 0),
    adjustReference: new Vec3(0, 0, 0),

    ignoreFailure: true,
    inSight: true,
    verifyEmpty: true,
  };

  options: Required<PlaceBlockOptions>;

  defaultState: State = {
    referenceBlock: null!,
    done: false,
    failed: false,
  };

  state = structuredClone(this.defaultState);

  constructor(bot: Bot, options: PlaceBlockOptions = {}) {
    super(bot);

    this.options = mergeOptions(options, this.defaultOptions);
  }

  public onStart(target: Block | Vec3, _triggerCtx: undefined): void {
    this.state = structuredClone(this.defaultState);

    const position = target instanceof Vec3 ? target : target.position;
    const block = this.bot.blockAt(position.plus(this.options.adjustReference));

    if (block === null) {
      this.state.failed = true;
      return;
    }

    this.state.referenceBlock = block;

    if (this.isValid() === false) {
      this.state.failed = true;
      return;
    }

    this.switchToItem();

    this.bot
      .placeBlock(this.state.referenceBlock, this.options.faceVector)
      .then(() => {
        this.state.done = true;
      })
      .catch(() => {
        this.state.failed = true;
      });
  }

  public onDone(): Block {
    const block = this.bot.blockAt(this.state.referenceBlock.position)!;

    this.cleanup();

    return block;
  }

  public onFailed(): void {
    this.cleanup();
  }

  private isValid(): boolean {
    if (this.options.verifyEmpty) {
      const currentBlock = this.bot.blockAt(
        this.state.referenceBlock.position.plus(this.options.faceVector),
      );

      if (currentBlock?.type !== this.bot.registry.blocksByName.air!.id) {
        return false;
      }
    }

    if (
      this.options.inSight &&
      this.bot.canSeeBlock(this.state.referenceBlock) === false
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

  public cleanup() {
    this.state = structuredClone(this.defaultState);
  }

  private switchToItem() {
    const requiredItem = this.options.itemType;

    if (requiredItem === null) {
      return;
    }

    const item = this.bot.inventory
      .items()
      .find((item) => item.type === requiredItem);

    if (item === undefined) {
      return;
    }

    this.bot.equip(item, 'hand');
  }
}
