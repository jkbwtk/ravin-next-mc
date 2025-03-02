import { Task } from '#/tasks/Task';

export class PassTriggerAsContext<T> extends Task<unknown, T, T> {
  triggerCtx: T = null!;

  public onStart(_taskCtx: unknown, triggerCtx: T): void {
    this.triggerCtx = triggerCtx;
  }

  public onDone(): T {
    return this.triggerCtx;
  }
}
