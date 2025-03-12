import { Task } from '#/tasks/Task';
import { type RequiredDefaults, mergeOptions } from '#/utils';

interface State<T> {
  ctx: T;

  tickCount: number;
}

export type WaitOptions = {
  ticks?: number;
};

export class Wait<T> extends Task<T, undefined, T> {
  private defaultOptions: RequiredDefaults<WaitOptions> = {
    ticks: 20,
  };

  private defaultState: State<T> = {
    ctx: null!,
    tickCount: 0,
  };

  private options: Required<WaitOptions>;

  private state = structuredClone(this.defaultState);

  constructor(options: WaitOptions = {}) {
    super();

    this.options = mergeOptions(options, this.defaultOptions);
  }

  public onStart(taskCtx: T, _triggerCtx: undefined): void {
    this.state.ctx = taskCtx;
  }

  public onDone(): T {
    const ctx = this.state.ctx;
    this.state = structuredClone(this.defaultState);

    return ctx;
  }

  public isDone = () => this.state.tickCount >= this.options.ticks;

  public tick = () => {
    this.state.tickCount += 1;
  };
}
