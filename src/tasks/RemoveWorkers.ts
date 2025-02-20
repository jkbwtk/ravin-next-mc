import type { ResourceDepot } from '#/ResourceDepot';
import type { Worker } from '#/Worker';
import { Task } from '#/tasks/Task';
import type { WorkerCredentials } from '#/types/Config';

export class RemoveWorkers extends Task<undefined, undefined, void> {
  workers: Set<Worker>;
  credentialDepot: ResourceDepot<WorkerCredentials>;

  constructor(
    workers: Set<Worker>,
    credentialDepot: ResourceDepot<WorkerCredentials>,
  ) {
    super();

    this.workers = workers;
    this.credentialDepot = credentialDepot;
  }

  public onStart(_taskCtx: undefined, _triggerCtx: undefined): void {
    for (const worker of this.workers) {
      if (worker.failed) {
        this.workers.delete(worker);
        this.credentialDepot.release(worker.credentialsId);
      }
    }
  }
}
