import { Task } from '#/tasks/Task';

interface State<TASK_CTX> {
  ctx: TASK_CTX;
}

export class PassthroughContext<TASK_CTX> extends Task<
  TASK_CTX,
  unknown,
  TASK_CTX
> {
  private defaultState: State<TASK_CTX> = {
    ctx: null!,
  };

  private state = structuredClone(this.defaultState);

  public onStart(taskCtx: TASK_CTX, _triggerCtx: unknown): void {
    this.state = structuredClone(this.defaultState);
    this.state.ctx = taskCtx;
  }

  public onDone(): TASK_CTX {
    return this.state.ctx;
  }
}
