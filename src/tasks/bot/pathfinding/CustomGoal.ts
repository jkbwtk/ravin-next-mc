import type { Bot } from 'mineflayer';
import { goals } from 'mineflayer-pathfinder';
import type { Vec3 } from 'vec3';
import {
  BasePathfinder,
  type BasePathfinderOptions,
} from '#/tasks/bot/pathfinding/BasePathfinder';

export class CustomGoal<CTX, RET> extends BasePathfinder<CTX, RET> {
  protected pointMapper: (ctx: CTX) => Vec3;

  protected resultMapper: (ctx: CTX) => RET;

  protected goalGenerator: () => goals.Goal;

  constructor(
    bot: Bot,
    pointMapper: (ctx: CTX) => Vec3,
    resultMapper: (ctx: CTX) => RET,
    goal: goals.Goal | ((self: CustomGoal<CTX, RET>) => goals.Goal),
    options: BasePathfinderOptions = {},
  ) {
    super(bot, options, {});

    this.pointMapper = pointMapper;
    this.resultMapper = resultMapper;

    this.goalGenerator = () => {
      return goal instanceof goals.Goal ? goal : goal(this);
    };
  }
}
