import type { ResourceDepot } from '#/ResourceDepot';
import { TaskExecutor } from '#/TaskExecutor';
import { TaskLink } from '#/TaskLink';
import type { Worker } from '#/Worker';
import { CreateWorker } from '#/tasks/CreateWorker';
import { RemoveWorkers } from '#/tasks/RemoveWorkers';
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
    const createWorker = new CreateWorker(this.options.credentialDepot, {
      colorsEnabled: false,
      respawn: true,
      port: 50000,
    });

    const removeWorkers = new RemoveWorkers(
      this.workers,
      this.options.credentialDepot,
    );

    const links = {
      createWorker: new TaskLink({
        current: wait,
        next: createWorker,
        fallback: wait,
        shouldAdvance: () => this.options.credentialDepot.getAvailable() > 0,
      }),

      returnToIdleFromCreator: new TaskLink({
        current: createWorker,
        next: wait,
        fallback: wait,
        shouldAdvance: () => true,
        onSuccess: (worker) => {
          console.log('Worker created');
          this.workers.add(worker);
        },
      }),

      // removeFailedWorkers: new TaskLink({
      //   current: wait,
      //   next: removeWorkers,
      //   fallback: wait,
      //   shouldAdvance: () => true,
      // }),

      returnToIdleFromRemover: new TaskLink({
        current: removeWorkers,
        next: wait,
        fallback: wait,
        shouldAdvance: () => true,
      }),
    };

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
