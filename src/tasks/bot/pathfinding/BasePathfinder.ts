import type { Bot } from 'mineflayer';
import { Movements, type goals } from 'mineflayer-pathfinder';
import type { Vec3 } from 'vec3';
import { BotTask } from '#/tasks/bot/BotTask';
import { type RequiredDefaults, mergeOptions } from '#/utils';

interface State<CTX> {
  point: Vec3;
  movements: Movements;

  ctx: CTX;
}

export type BasePathfinderOptions = {
  canDig?: boolean;
  canOpenDoors?: boolean;
  allow1by1towers?: boolean;
  allowSprinting?: boolean;
  allowParkour?: boolean;
};

export abstract class BasePathfinder<
  CTX,
  RES,
  O extends Record<string, unknown> = Record<string, unknown>,
> extends BotTask<CTX, unknown, RES> {
  protected abstract pointMapper: (ctx: CTX) => Vec3;

  protected abstract resultMapper: (ctx: CTX) => RES;

  protected abstract goalGenerator: () => goals.Goal;

  private defaultOptions: RequiredDefaults<BasePathfinderOptions> = {
    canDig: false,
    canOpenDoors: true,
    allow1by1towers: false,
    allowSprinting: true,
    allowParkour: true,
  };

  private defaultState: State<CTX> = {
    point: null!,
    movements: null!,

    ctx: null!,
  };

  protected options: Required<BasePathfinderOptions> & Required<O>;

  protected state = structuredClone(this.defaultState);

  constructor(
    bot: Bot,
    options: O & BasePathfinderOptions,
    overrideDefaultOptions: RequiredDefaults<O>,
  ) {
    super(bot);

    //@ts-expect-error
    this.options = mergeOptions(options, {
      ...this.defaultOptions,
      overrideDefaultOptions,
    });
  }

  public onStart(taskCtx: CTX, _triggerCtx: unknown): void {
    this.state = structuredClone(this.defaultState);

    this.state.ctx = taskCtx;
    this.state.point = this.pointMapper(taskCtx);

    this.state.movements = new Movements(this.bot);

    this.state.movements.canDig = this.options.canDig;
    this.state.movements.canOpenDoors = this.options.canOpenDoors;
    this.state.movements.allow1by1towers = this.options.allow1by1towers;
    this.state.movements.allowSprinting = this.options.allowSprinting;
    this.state.movements.allowParkour = this.options.allowParkour;

    this.bot.pathfinder.setMovements(this.state.movements);

    const goal = this.goalGenerator();

    this.bot.pathfinder.setGoal(goal);
  }

  public onDone(): RES {
    const response = this.resultMapper(this.state.ctx);

    this.cleanup();

    return response;
  }

  public onFailed(): void {
    this.cleanup();
  }

  public override isDone = () => {
    return !this.bot.pathfinder.isMoving();
  };

  private cleanup() {
    this.bot.pathfinder.setGoal(null);

    this.state = structuredClone(this.defaultState);
  }
}
