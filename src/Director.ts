import type { ResourceDepot } from '#/ResourceDepot';
import { TaskExecutor } from '#/TaskExecutor';
import type { Worker } from '#/Worker';
import { Task } from '#/tasks/Task';
import type {
  DirectorOptions as DirectorOptionsConfig,
  WorkerCredentials,
} from '#/types/Config';
import { type RequiredDefaults, mergeOptions } from '#/utils';

export type DirectorOptions = DirectorOptionsConfig & {
  credentialDepot: ResourceDepot<WorkerCredentials>;
};

export class Director {
  private options: Required<DirectorOptions>;

  private workers: Set<Worker> = new Set();

  private timerRef = 0;

  private readonly executor;

  private readonly defaultOptions: RequiredDefaults<DirectorOptions> = {
    port: 25565,
    loopInterval: 1000,
  };

  constructor(partialOptions: DirectorOptions) {
    this.options = mergeOptions(partialOptions, this.defaultOptions);

    const wait = new Task();

    const links = {};

    this.executor = new TaskExecutor(links, wait);
  }

  public start() {
    clearInterval(this.timerRef);

    this.executor.start();

    this.timerRef = setInterval(
      this.executor.tick,
      this.options.loopInterval,
    ) as unknown as number;
  }
}
