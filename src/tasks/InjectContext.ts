import { Task } from '#/tasks/Task';

export class InjectContext<T> extends Task<unknown, unknown, T> {
  private ctx: T;

  constructor(ctx: T) {
    super();

    this.ctx = ctx;
  }

  public onDone(): T {
    return this.ctx;
  }
}
