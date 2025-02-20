import type { Bot, BotEvents } from 'mineflayer';
import { ChatPattern } from '#/ChatPattern';
import { TaskExecutor } from '#/TaskExecutor';
import { TaskLink } from '#/TaskLink';
import { BotTask } from '#/tasks/bot/BotTask';

export class Worker {
  public readonly bot: Bot;
  public readonly credentialsId: number;

  public failed = false;

  private readonly executor;

  private readonly chatPatterns: Record<string, ChatPattern>;

  constructor(bot: Bot, credentialsId: number) {
    this.bot = bot;
    this.credentialsId = credentialsId;

    this.chatPatterns = {
      triggerFarming: new ChatPattern(
        `${this.bot.player.username.toLowerCase()} farm (\w+)$`,
      ),
    };

    const spawn = new BotTask(this.bot);
    const wait = new BotTask(this.bot);

    const links = {
      sayHi: new TaskLink({
        current: spawn,
        next: wait,
        fallback: wait,
        shouldAdvance: () => true,
        onSuccess: () => {
          this.bot.chat('Testy testy');
        },
      }),
    };

    this.executor = new TaskExecutor(links, spawn);
    this.executor.start();

    this.registerListeners();
  }

  private registerListeners() {
    this.bot.on('physicsTick', this.handleTick);
    this.bot.on('end', this.handleDisconnect);
    this.bot.on('chat', this.handleChat);
  }

  private handleTick: BotEvents['physicsTick'] = () => {
    this.executor.tick();
  };

  private handleDisconnect: BotEvents['end'] = (reason) => {
    console.log(reason);
    this.failed = true;
  };

  private handleChat: BotEvents['chat'] = (username, message) => {
    if (username === this.bot.username) {
      return;
    }
  };
}
