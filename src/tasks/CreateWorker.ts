import { type Bot, type BotOptions, createBot } from 'mineflayer';
import { pathfinder } from 'mineflayer-pathfinder';
import type { ChatMessage } from 'prismarine-chat';
import type { ResourceDepot } from '#/ResourceDepot';
import { Worker } from '#/Worker';
import { Task } from '#/tasks/Task';
import type { WorkerCredentials } from '#/types/Config';

export type WorkerBotOptions = Omit<
  BotOptions,
  'username' | 'password' | 'auth' | 'clientToken' | 'accessToken'
>;

interface State {
  bot: Bot | null;

  authorized: boolean;
  spawned: boolean;

  authAttemptCounter: number;
  startedAt: number;

  credentials: [number, WorkerCredentials];
}

export class CreateWorker extends Task<void, void, Worker> {
  authAttemptLimit = 5;
  timeout = 30 * 1000; // 30 seconds

  defaultState: State = {
    bot: null,
    authorized: true,
    spawned: false,
    authAttemptCounter: 0,
    startedAt: 0,
    // @ts-expect-error
    credentials: null,
  };

  botOptions: WorkerBotOptions;
  credentialsDepot: ResourceDepot<WorkerCredentials>;

  state: State;

  constructor(
    credentialDepot: ResourceDepot<WorkerCredentials>,
    botOptions: WorkerBotOptions,
  ) {
    super();

    this.botOptions = botOptions;
    this.credentialsDepot = credentialDepot;

    this.state = structuredClone(this.defaultState);
  }

  public override onStart = () => {
    this.state = structuredClone(this.defaultState);

    const [id, credentials] = this.credentialsDepot.claim();

    if (id === null) {
      this.state.startedAt = 0;
    } else {
      this.state.credentials = [id, credentials];

      this.state.bot = createBot({
        ...this.botOptions,
        username: credentials.username,
        auth: credentials.auth !== 'easyAuth' ? credentials.auth : undefined,
        password: credentials.password,
      });

      this.state.bot.loadPlugin(pathfinder);

      this.state.startedAt = Date.now();

      if (credentials.auth === 'easyAuth') {
        this.state.authorized = false;
        this.state.bot.on('message', this.handleAuthMessage);
      }

      this.state.bot.on('spawn', this.handleSpawn);
    }
  };

  public override onDone() {
    this.cleanup();
    return new Worker(this.state.bot!, this.state.credentials[0]);
  }

  public override onFailed(): void {
    this.state.bot?.end();
    this.cleanup();

    if (this.state.credentials) {
      this.credentialsDepot.release(this.state.credentials[0]);
    }
  }

  public override isDone = () => {
    return this.state.spawned && this.state.authorized;
  };

  public override isFailed = () => {
    return (
      this.state.startedAt + this.timeout < Date.now() ||
      this.state.authAttemptCounter > this.authAttemptLimit
    );
  };

  private handleSpawn = () => {
    this.state.bot?.respawn();
    this.state.spawned = true;
  };

  private handleAuthMessage = (message: ChatMessage) => {
    const credentials = this.state.credentials[1];

    switch (message.translate) {
      case 'text.easyauth.validSession':
        this.state.authorized = true;
        break;

      case 'text.easyauth.registerSuccess':
        this.state.authorized = true;
        break;

      case 'text.easyauth.successfullyAuthenticated':
        this.state.authorized = true;
        break;

      case 'text.easyauth.loginRequired': {
        this.state.bot?.chat(`/login ${credentials.password}`);
        this.state.authAttemptCounter += 1;
        break;
      }

      case 'text.easyauth.registerRequired': {
        if (credentials.createAccount) {
          this.state.bot?.chat(
            `/register ${credentials.password} ${credentials.password}`,
          );
        } else {
          this.state.authAttemptCounter = Number.POSITIVE_INFINITY;
          this.credentialsDepot.invalidate(this.state.credentials[0]);
        }

        this.state.authAttemptCounter += 1;
        break;
      }

      case 'text.easyauth.wrongPassword': {
        this.state.authAttemptCounter = Number.POSITIVE_INFINITY;
        this.credentialsDepot.invalidate(this.state.credentials[0]);

        break;
      }

      default:
        break;
    }
  };

  private cleanup() {
    this.state.bot?.off('message', this.handleAuthMessage);
    this.state.bot?.off('spawn', this.handleSpawn);
  }
}
