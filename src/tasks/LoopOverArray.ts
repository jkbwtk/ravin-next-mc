import { Task } from '#/tasks/Task';

type TASK<SINGLE_CTX> = Task<SINGLE_CTX, unknown, void>;

interface State<SINGLE_CTX> {
  ctx: SINGLE_CTX[];
  triggerCtx: unknown;

  hasFinished: boolean;
  hasFailed: boolean;
}

export class LoopOverArray<SINGLE_CTX> extends Task {
  private task: TASK<SINGLE_CTX>;

  private defaultState: State<SINGLE_CTX> = {
    ctx: [],
    triggerCtx: null,

    hasFinished: false,
    hasFailed: false,
  };

  private state: State<SINGLE_CTX>;

  constructor(task: TASK<SINGLE_CTX>) {
    super();

    this.task = task;

    this.state = structuredClone(this.defaultState);
  }

  public onStart(taskCtx: SINGLE_CTX[], triggerCtx: unknown): void {
    this.state = structuredClone(this.defaultState);

    this.state.ctx = taskCtx.slice();
    this.state.triggerCtx = triggerCtx;

    const singleCtx = this.state.ctx.shift();

    if (singleCtx === undefined) {
      this.state.hasFinished = true;
      return;
    }

    this.task.onStart(singleCtx, triggerCtx);
    this.task.running = true;
  }

  public tick = () => {
    this.task.tick();

    if (this.task.isDone()) {
      this.task.onDone();
      this.task.running = false;

      const singleCtx = this.state.ctx.shift();

      if (singleCtx === undefined) {
        this.state.hasFinished = true;
      } else {
        this.task.onStart(singleCtx, this.state.triggerCtx);
        this.task.running = true;
      }
    } else if (this.task.isFailed()) {
      this.task.onFailed();
      this.task.running = false;

      this.state.hasFailed = true;
    }
  };

  public isDone = () => this.state.hasFinished;

  public isFailed = () => this.state.hasFailed;
}
