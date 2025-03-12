import { Task } from '#/tasks/Task';

interface State<T> {
  ctx: T;

  shouldBreak: boolean | null;
}

export class Break<T> extends Task<T, undefined, T> {
  private defaultState: State<T> = {
    ctx: null!,
    shouldBreak: null,
  };

  private state = structuredClone(this.defaultState);

  private breakChecker: (ctx: T) => boolean;

  constructor(breakChecker: (ctx: T) => boolean) {
    super();

    this.breakChecker = breakChecker;
  }

  public onStart(taskCtx: T, _triggerCtx: undefined): void {
    this.state = structuredClone(this.defaultState);

    this.state.ctx = taskCtx;
  }

  public onDone(): T {
    const ctx = this.state.ctx;

    this.cleanup();

    return ctx;
  }

  public onFailed(): void {
    this.cleanup();
  }

  public isDone = () => {
    return this.isFailed() === false;
  };

  public isFailed = () => {
    if (this.state.shouldBreak === null) {
      this.state.shouldBreak = this.breakChecker(this.state.ctx);
    }

    return this.state.shouldBreak;
  };

  private cleanup() {
    this.state = structuredClone(this.defaultState);
  }
}
