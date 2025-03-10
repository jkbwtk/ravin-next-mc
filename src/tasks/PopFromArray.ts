import { Task } from '#/tasks/Task';

interface State<TASK_CTX> {
  ctx: TASK_CTX;

  skip: boolean;
}

type CTX_MAPPER<TASK_CTX, WRAPPED_TASK_CTX> = (
  ctx: TASK_CTX,
) => WRAPPED_TASK_CTX;

export class PopFromArray<
  TASK_CTX,
  T,
  WRAPPED_TASK_CTX extends T[],
  TRIGGER_CTX,
> extends Task<TASK_CTX, TRIGGER_CTX, TASK_CTX> {
  private task: Task<T, TRIGGER_CTX, unknown>;

  private ctxMapper: CTX_MAPPER<TASK_CTX, WRAPPED_TASK_CTX>;

  private defaultState: State<TASK_CTX> = {
    ctx: null!,
    skip: false,
  };

  private state = structuredClone(this.defaultState);

  public get running(): boolean {
    return this.task.running;
  }

  public set running(state: boolean) {
    this.task.running = state;
  }

  constructor(
    task: Task<T, TRIGGER_CTX, unknown>,
    ctxMapper: CTX_MAPPER<TASK_CTX, WRAPPED_TASK_CTX>,
  ) {
    super();

    this.task = task;

    this.ctxMapper = ctxMapper;
  }

  public onStart(taskCtx: TASK_CTX, triggerCtx: TRIGGER_CTX): void {
    this.state = structuredClone(this.defaultState);
    this.state.ctx = taskCtx;

    const mappedCtx = this.ctxMapper(this.state.ctx);
    const ctxUnit = mappedCtx.shift();

    if (ctxUnit === undefined) {
      this.state.skip = true;
      return;
    }

    this.task.onStart(ctxUnit, triggerCtx);
  }

  public onDone(): TASK_CTX {
    if (this.state.skip === false) {
      this.task.onDone();
    }

    const ctx = this.state.ctx;
    this.cleanup();

    return ctx;
  }

  public onFailed(): void {
    if (this.state.skip === false) {
      this.task.onFailed();
    }

    this.cleanup();
  }

  public isDone = () => {
    if (this.state.skip) {
      return true;
    }

    return this.task.isDone();
  };

  public isFailed = () => {
    if (this.state.skip) {
      return false;
    }

    return this.task.isFailed();
  };

  public tick = () => {
    if (this.state.skip) {
      return;
    }

    this.task.tick();
  };

  private cleanup(): void {
    this.state = structuredClone(this.defaultState);
  }
}
