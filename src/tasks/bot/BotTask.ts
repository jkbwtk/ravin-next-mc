import type { Bot } from 'mineflayer';
import { Task } from '#/tasks/Task';

export class BotTask<
  TASK_CTX = unknown,
  TRIGGER_CTX = unknown,
  RESULT = unknown,
> extends Task<TASK_CTX, TRIGGER_CTX, RESULT> {
  bot: Bot;

  constructor(bot: Bot) {
    super();
    this.bot = bot;
  }
}
