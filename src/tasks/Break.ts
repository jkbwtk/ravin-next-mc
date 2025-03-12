import { Task } from '#/tasks/Task';

export class PickFirstFromArray<T> extends Task<T, undefined, T> {
  private ctx: T = null!;

  private shouldBreak: (ctx: T) => boolean;

  constructor(shouldBreak: (ctx: T) => boolean) {
    super();

    this.shouldBreak = shouldBreak;
  }

  public onStart(taskCtx: T, _triggerCtx: undefined): void {
    this.ctx = taskCtx;
  }

  public onDone(): T {
    const ctx = this.ctx;
    this.ctx = null!;

    return ctx;
  }

  public onFailed(): void {
    this.ctx = null!;
  }

  public isFailed = () => this.shouldBreak(this.ctx);
}
