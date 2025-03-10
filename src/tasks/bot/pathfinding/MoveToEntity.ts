import type { Bot } from 'mineflayer';
import { goals } from 'mineflayer-pathfinder';
import type { Entity } from 'prismarine-entity';
import {
  BasePathfinder,
  type BasePathfinderOptions,
} from '#/tasks/bot/pathfinding/BasePathfinder';
import type { RequiredDefaults } from '#/utils';

export type MoveToEntityOptions = {
  range?: number;

  skipIfGone?: boolean;
};

export class MoveToEntity extends BasePathfinder<
  Entity,
  Entity,
  MoveToEntityOptions
> {
  protected pointMapper = (ctx: Entity) => ctx.position;

  protected resultMapper = (ctx: Entity) => ctx;

  protected goalGenerator = () => {
    const point = this.state.point;

    return new goals.GoalNearXZ(point.x, point.z, this.options.range);
  };

  constructor(
    bot: Bot,
    options: MoveToEntityOptions & BasePathfinderOptions = {},
  ) {
    const overrideOptions: RequiredDefaults<MoveToEntityOptions> = {
      range: 0,
      skipIfGone: true,
    };

    super(bot, options, overrideOptions);
  }

  public isDone = (): boolean => {
    if (
      this.options.skipIfGone &&
      this.bot.entities[this.state.ctx.id] === undefined
    ) {
      return true;
    }

    return this.state.isFinished;
  };
}
