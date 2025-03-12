import { Task } from '#/tasks/Task';
import { type RequiredDefaults, mergeOptions } from '#/utils';

type TASK<SINGLE_CTX> = Task<SINGLE_CTX, unknown, void>;

interface State<SINGLE_CTX> {
  ctx: SINGLE_CTX[];
  triggerCtx: unknown;

  hasFinished: boolean;
  hasFailed: boolean;
}

export type LoopOverArrayOptions = {
  ignoreFailure?: boolean;
};

export class LoopOverArray<SINGLE_CTX> extends Task<
  SINGLE_CTX[],
  undefined,
  void
> {
  private defaultOptions: RequiredDefaults<LoopOverArrayOptions> = {
    ignoreFailure: false,
  };

  private defaultState: State<SINGLE_CTX> = {
    ctx: [],
    triggerCtx: null,

    hasFinished: false,
    hasFailed: false,
  };

  private options: Required<LoopOverArrayOptions>;

  private task: TASK<SINGLE_CTX>;

  private state = structuredClone(this.defaultState);

  constructor(task: TASK<SINGLE_CTX>, options: LoopOverArrayOptions = {}) {
    super();

    this.task = task;
    this.options = mergeOptions(options, this.defaultOptions);
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

  public onDone(): void {
    this.cleanup();
  }

  public onFailed(): void {
    this.cleanup();
  }

  public tick = () => {
    if (this.task.running === false) {
      return;
    }

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

  public isDone = () => {
    if (this.options.ignoreFailure) {
      return this.state.hasFinished || this.state.hasFailed;
    }

    return this.state.hasFinished;
  };

  public isFailed = () =>
    this.options.ignoreFailure === false && this.state.hasFailed;

  private cleanup() {
    this.state = structuredClone(this.defaultState);
  }
}
