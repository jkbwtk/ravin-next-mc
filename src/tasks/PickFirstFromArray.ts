import { Task } from '#/tasks/Task';

export class PickFirstFromArray<T> extends Task<T[], undefined, T> {
  private ctx: T = null!;

  public onStart(taskCtx: T[], _triggerCtx: undefined): void {
    this.ctx = taskCtx.shift()!;
  }

  public onDone(): T {
    const ctx = this.ctx;
    this.ctx = null!;

    return ctx;
  }

  public onFailed(): void {
    this.ctx = null!;
  }

  public isFailed = () => this.ctx === undefined;
}
