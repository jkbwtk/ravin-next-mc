import type { Bot } from 'mineflayer';
import { Movements, goals } from 'mineflayer-pathfinder';
import type { Vec3 } from 'vec3';
import { BotTask } from '#/tasks/bot/BotTask';
import { type RequiredDefaults, mergeOptions } from '#/utils';

export type MoveToPointOptions = {
  canDig?: boolean;
  canOpenDoors?: boolean;
  allow1by1towers?: boolean;
  allowSprinting?: boolean;
  allowParkour?: boolean;
};

export class MoveToPoint extends BotTask<Vec3> {
  movements: Movements = null!;

  defaultOptions: RequiredDefaults<MoveToPointOptions> = {
    canDig: false,
    canOpenDoors: true,
    allow1by1towers: false,
    allowSprinting: true,
    allowParkour: true,
  };

  options: Required<MoveToPointOptions>;

  constructor(bot: Bot, options: MoveToPointOptions = {}) {
    super(bot);
    this.options = mergeOptions(options, this.defaultOptions);
  }

  public override onStart = (point: Vec3, _triggerCtx: unknown) => {
    this.movements = new Movements(this.bot);

    this.movements.canDig = this.options.canDig;
    this.movements.canOpenDoors = this.options.canOpenDoors;
    this.movements.allow1by1towers = this.options.allow1by1towers;
    this.movements.allowSprinting = this.options.allowSprinting;
    this.movements.allowParkour = this.options.allowParkour;

    this.bot.pathfinder.setMovements(this.movements);

    const goal = new goals.GoalNearXZ(point.x, point.z, 0);

    this.bot.pathfinder.setGoal(goal);
  };

  public override isDone = () => {
    return !this.bot.pathfinder.isMoving();
  };

  public override onDone = () => {
    this.cleanup();
  };

  public override onFailed() {
    this.cleanup();
  }

  private cleanup() {
    this.bot.pathfinder.setGoal(null);
    this.movements = null!;
  }
}
