import type { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import { Perimeter } from '#/Perimeter';
import { BotTask } from '#/tasks/bot/BotTask';
import { FindBlocksInPerimeter } from '#/tasks/bot/FindBlocksInPerimeter';
import { type RequiredDefaults, mergeOptions } from '#/utils';

interface State {
  name: string;

  searchPerimeter: Perimeter;
  result: Perimeter | null;
  failed: boolean;
}
export type FindPerimeterOptions = {
  type: string;
  radius?: number;
};

export class FindPerimeter extends BotTask<string, unknown, Perimeter> {
  private supportedSigns = [
    'oak_sign',
    'oak_wall_sign',
    'oak_hanging_sign',
    'oak_wall_hanging_sign',
  ];

  private signIds = this.supportedSigns
    .map((sign) => this.bot.registry.blocksByName[sign]?.id)
    .filter((id) => id !== undefined) satisfies number[];

  private defaultState: State = {
    name: '',
    searchPerimeter: null!,
    result: null,
    failed: false,
  };

  private task: FindBlocksInPerimeter;

  private options: Required<FindPerimeterOptions>;

  private defaultOptions: RequiredDefaults<FindPerimeterOptions> = {
    radius: 16 * 16,
  };

  private state = structuredClone(this.defaultState);

  constructor(bot: Bot, options: FindPerimeterOptions) {
    super(bot);

    this.options = mergeOptions(options, this.defaultOptions);

    this.task = new FindBlocksInPerimeter(bot, {
      count: 8,
      chunksPerTick: 64,
      matching: this.signIds,
      useExtraInfo: (block) => {
        const text = block.getSignText().join(' ').toLocaleLowerCase();

        return (
          text.includes(
            `[${this.options.type}:${this.state.name}]`.toLowerCase(),
          ) && text.includes('[perm]')
        );
      },
    });
  }

  public onStart(permName: string, _triggerCtx: unknown) {
    this.state = structuredClone(this.defaultState);

    const pos = this.bot.player.entity.position;
    const minY =
      'minY' in this.bot.game && typeof this.bot.game.minY === 'number'
        ? this.bot.game.minY
        : 0;
    const maxY =
      'height' in this.bot.game && typeof this.bot.game.height === 'number'
        ? this.bot.game.height + minY
        : 256;

    this.state.searchPerimeter = new Perimeter([
      new Vec3(pos.x + this.options.radius, minY, pos.z + this.options.radius),
      new Vec3(pos.x - this.options.radius, maxY, pos.z - this.options.radius),
    ]);

    this.state.name = permName;

    this.task.onStart(this.state.searchPerimeter, null);
    this.task.running = true;
  }

  public onDone() {
    const perimeter = this.state.result;

    if (perimeter === null) {
      throw new Error('Task result is null');
    }

    return perimeter.adjust(new Vec3(0, 1, 0), new Vec3(0, 1, 0));
  }

  public isDone = () => {
    return this.state.result !== null;
  };

  public isFailed = () => {
    return this.state.failed;
  };

  public tick = () => {
    this.task.tick();

    if (this.task.isDone()) {
      const result = this.task.onDone();
      this.task.running = false;

      if (result.length < 2) {
        this.state.failed = true;
      } else {
        this.state.result = new Perimeter(result.map((b) => b.position)).adjust(
          new Vec3(0, 1, 0),
          new Vec3(0, 1, 0),
        );
      }
    } else if (this.task.isFailed()) {
      this.task.onFailed();
      this.task.running = false;

      this.state.failed = true;
    }
  };
}
