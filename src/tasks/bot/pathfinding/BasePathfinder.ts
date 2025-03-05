import type { Bot } from 'mineflayer';
import { Movements, type goals } from 'mineflayer-pathfinder';
import type { Vec3 } from 'vec3';
import { BotTask } from '#/tasks/bot/BotTask';
import { type RequiredDefaults, mergeOptions } from '#/utils';

interface State<CTX> {
  point: Vec3;
  movements: Movements;
  isFinished: boolean;
  idleTicksCounter: number;

  ctx: CTX;
}

export type BasePathfinderOptions = {
  canDig?: boolean;
  canOpenDoors?: boolean;
  allow1by1towers?: boolean;
  allowSprinting?: boolean;
  allowParkour?: boolean;

  idleTicksLimit?: number;
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

    idleTicksLimit: 20,
  };

  private defaultState: State<CTX> = {
    point: null!,
    movements: null!,

    ctx: null!,

    isFinished: false,
    idleTicksCounter: 0,
  };

  public options: Required<BasePathfinderOptions> & Required<O>;

  public state = structuredClone(this.defaultState);

  constructor(
    bot: Bot,
    options: O & BasePathfinderOptions,
    overrideDefaultOptions: RequiredDefaults<O>,
  ) {
    super(bot);

    //@ts-expect-error
    this.options = mergeOptions(options, {
      ...this.defaultOptions,
      ...overrideDefaultOptions,
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
    this.bot.pathfinder.setGoal(this.goalGenerator());

    this.bot.once('goal_reached', this.handleGoalReached);
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
    return this.state.isFinished;
  };

  public isFailed = () => {
    if (
      this.bot.pathfinder.isMoving() === false &&
      this.bot.pathfinder.isBuilding() === false &&
      this.bot.pathfinder.isMining() === false
    ) {
      this.state.idleTicksCounter += 1;
    }

    return this.state.idleTicksCounter > this.options.idleTicksLimit;
  };

  private cleanup() {
    this.bot.pathfinder.setGoal(null);

    this.state = structuredClone(this.defaultState);

    this.bot.off('goal_reached', this.handleGoalReached);
  }

  private handleGoalReached = () => {
    this.state.isFinished = true;
  };
}
