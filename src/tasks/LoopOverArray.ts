import { Task } from '#/tasks/Task';
import { type RequiredDefaults, mergeOptions } from '#/utils';

type TASK<SINGLE_CTX> = Task<SINGLE_CTX, unknown, void>;

interface State<SINGLE_CTX> {
  array: SINGLE_CTX[];
  triggerCtx: unknown;

  hasFinished: boolean;
  hasFailed: boolean;
}

export type LoopOverArrayOptions<ELEMENT_TYPE> = {
  ignoreFailure?: boolean;
  cloneArray?: boolean;

  selectNext?: (array: ELEMENT_TYPE[]) => ELEMENT_TYPE | undefined;
};

export class LoopOverArray<ELEMENT_TYPE> extends Task<
  ELEMENT_TYPE[],
  undefined,
  void
> {
  private defaultOptions: RequiredDefaults<LoopOverArrayOptions<ELEMENT_TYPE>> =
    {
      ignoreFailure: false,
      cloneArray: false,

      selectNext: (array: ELEMENT_TYPE[]) => array.shift(),
    };

  private defaultState: State<ELEMENT_TYPE> = {
    array: [],
    triggerCtx: null,

    hasFinished: false,
    hasFailed: false,
  };

  private options: Required<LoopOverArrayOptions<ELEMENT_TYPE>>;

  private task: TASK<ELEMENT_TYPE>;

  private state = structuredClone(this.defaultState);

  constructor(
    task: TASK<ELEMENT_TYPE>,
    options: LoopOverArrayOptions<ELEMENT_TYPE> = {},
  ) {
    super();

    this.task = task;
    this.options = mergeOptions(options, this.defaultOptions);
  }

  public onStart(array: ELEMENT_TYPE[], triggerCtx: unknown): void {
    this.state = structuredClone(this.defaultState);

    this.state.array = this.options.cloneArray ? array.slice() : array;
    this.state.triggerCtx = triggerCtx;

    const element = this.options.selectNext(this.state.array);

    if (element === undefined) {
      this.state.hasFinished = true;
      return;
    }

    this.task.onStart(element, triggerCtx);
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

      const singleCtx = this.options.selectNext(this.state.array);

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
