import type { Bot } from 'mineflayer';
import { goals } from 'mineflayer-pathfinder';
import type { Vec3 } from 'vec3';
import {
  BasePathfinder,
  type BasePathfinderOptions,
} from '#/tasks/bot/pathfinding/BasePathfinder';
import type { RequiredDefaults } from '#/utils';

export type MoveToPointOptions = {
  range?: number;
};

export class MoveToPoint extends BasePathfinder<
  Vec3,
  Vec3,
  MoveToPointOptions
> {
  protected pointMapper = (ctx: Vec3) => ctx;

  protected resultMapper = (ctx: Vec3) => ctx;

  protected goalGenerator = () => {
    const point = this.state.point;

    return new goals.GoalNearXZ(point.x, point.z, this.options.range);
  };

  constructor(
    bot: Bot,
    options: MoveToPointOptions & BasePathfinderOptions = {},
  ) {
    const overrideOptions: RequiredDefaults<MoveToPointOptions> = {
      range: 2,
    };

    super(bot, options, overrideOptions);
  }
}
