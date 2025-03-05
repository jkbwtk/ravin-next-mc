import type { Bot } from 'mineflayer';
import { goals } from 'mineflayer-pathfinder';
import type { Block } from 'prismarine-block';
import {
  BasePathfinder,
  type BasePathfinderOptions,
} from '#/tasks/bot/pathfinding/BasePathfinder';
import type { RequiredDefaults } from '#/utils';

export type LookAtBlockOptions = {
  reach?: number;
};

export class LookAtBlock extends BasePathfinder<
  Block,
  Block,
  LookAtBlockOptions
> {
  protected pointMapper = (ctx: Block) => ctx.position;

  protected resultMapper = (ctx: Block) => ctx;

  protected goalGenerator = () => {
    return new goals.GoalLookAtBlock(this.state.point, this.bot.world, {
      reach: this.options.reach,
    });
  };

  constructor(
    bot: Bot,
    options: LookAtBlockOptions & BasePathfinderOptions = {},
  ) {
    const overrideOptions: RequiredDefaults<LookAtBlockOptions> = {
      reach: 4.5,
    };

    super(bot, options, overrideOptions);
  }
}
