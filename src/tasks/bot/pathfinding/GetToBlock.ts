import type { Bot } from 'mineflayer';
import { goals } from 'mineflayer-pathfinder';
import type { Block } from 'prismarine-block';
import {
  BasePathfinder,
  type BasePathfinderOptions,
} from '#/tasks/bot/pathfinding/BasePathfinder';

export class GetToBlock extends BasePathfinder<
  Block,
  Block,
  Record<string, unknown>
> {
  protected pointMapper = (ctx: Block) => ctx.position;

  protected resultMapper = (ctx: Block) => ctx;

  protected goalGenerator = () => {
    const p = this.state.point;
    return new goals.GoalGetToBlock(p.x, p.y, p.z);
  };

  constructor(bot: Bot, options: BasePathfinderOptions = {}) {
    super(bot, options, {});
  }
}
