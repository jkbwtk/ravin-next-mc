import { Task } from '#/tasks/Task';
import { type RequiredDefaults, mergeOptions } from '#/utils';

interface State {
  activeTask?: Task;
  cursor: number;
}

export type ChainOptions = {
  ignoreFailure?: boolean;
};

export class Chain<
  TF_CTX,
  TF_TCTX,
  TF_RES,
  T2_RES,
  T3_RES,
  T4_RES,
  T5_RES,
  T6_RES,
  T7_RES,
  T8_RES,
  T9_RES,
  TL_RES,
> extends Task<TF_CTX, TF_TCTX, TL_RES> {
  constructor(
    options: ChainOptions,

    firstTask: Task<TF_CTX, TF_TCTX, TF_RES>,
    task2: Task<TF_RES, unknown, T2_RES>,
    task3: Task<T2_RES, unknown, T3_RES>,
    task4: Task<T3_RES, unknown, T4_RES>,
    task5: Task<T4_RES, unknown, T5_RES>,
    task6: Task<T5_RES, unknown, T6_RES>,
    task7: Task<T6_RES, unknown, T7_RES>,
    task8: Task<T7_RES, unknown, T8_RES>,
    task9: Task<T8_RES, unknown, T9_RES>,
    lastTask: Task<T9_RES, unknown, TL_RES>,
  );
  constructor(
    options: ChainOptions,

    firstTask: Task<TF_CTX, TF_TCTX, TF_RES>,
    task2: Task<TF_RES, unknown, T2_RES>,
    task3: Task<T2_RES, unknown, T3_RES>,
    task4: Task<T3_RES, unknown, T4_RES>,
    task5: Task<T4_RES, unknown, T5_RES>,
    task6: Task<T5_RES, unknown, T6_RES>,
    task7: Task<T6_RES, unknown, T7_RES>,
    task8: Task<T7_RES, unknown, T8_RES>,
    lastTask: Task<T8_RES, unknown, TL_RES>,
  );
  constructor(
    options: ChainOptions,

    firstTask: Task<TF_CTX, TF_TCTX, TF_RES>,
    task2: Task<TF_RES, unknown, T2_RES>,
    task3: Task<T2_RES, unknown, T3_RES>,
    task4: Task<T3_RES, unknown, T4_RES>,
    task5: Task<T4_RES, unknown, T5_RES>,
    task6: Task<T5_RES, unknown, T6_RES>,
    task7: Task<T6_RES, unknown, T7_RES>,
    lastTask: Task<T7_RES, unknown, TL_RES>,
  );
  constructor(
    options: ChainOptions,

    firstTask: Task<TF_CTX, TF_TCTX, TF_RES>,
    task2: Task<TF_RES, unknown, T2_RES>,
    task3: Task<T2_RES, unknown, T3_RES>,
    task4: Task<T3_RES, unknown, T4_RES>,
    task5: Task<T4_RES, unknown, T5_RES>,
    task6: Task<T5_RES, unknown, T6_RES>,
    lastTask: Task<T6_RES, unknown, TL_RES>,
  );
  constructor(
    options: ChainOptions,

    firstTask: Task<TF_CTX, TF_TCTX, TF_RES>,
    task2: Task<TF_RES, unknown, T2_RES>,
    task3: Task<T2_RES, unknown, T3_RES>,
    task4: Task<T3_RES, unknown, T4_RES>,
    task5: Task<T4_RES, unknown, T5_RES>,
    lastTask: Task<T5_RES, unknown, TL_RES>,
  );
  constructor(
    options: ChainOptions,

    firstTask: Task<TF_CTX, TF_TCTX, TF_RES>,
    task2: Task<TF_RES, unknown, T2_RES>,
    task3: Task<T2_RES, unknown, T3_RES>,
    task4: Task<T3_RES, unknown, T4_RES>,
    lastTask: Task<T4_RES, unknown, TL_RES>,
  );
  constructor(
    options: ChainOptions,

    firstTask: Task<TF_CTX, TF_TCTX, TF_RES>,
    task2: Task<TF_RES, unknown, T2_RES>,
    task3: Task<T2_RES, unknown, T3_RES>,
    lastTask: Task<T3_RES, unknown, TL_RES>,
  );
  constructor(
    options: ChainOptions,

    firstTask: Task<TF_CTX, TF_TCTX, TF_RES>,
    task2: Task<TF_RES, unknown, T2_RES>,
    lastTask: Task<T2_RES, unknown, TL_RES>,
  );
  constructor(
    options: ChainOptions,

    firstTask: Task<TF_CTX, TF_TCTX, TF_RES>,
    lastTask: Task<TF_RES, unknown, TL_RES>,
  );
  constructor(options: ChainOptions, ...tasks: Task[]) {
    super();

    this.options = mergeOptions(options, this.defaultOptions);
    this.tasks = tasks;
  }

  private defaultOptions: RequiredDefaults<ChainOptions> = {
    ignoreFailure: false,
  };

  private options: Required<ChainOptions>;

  private tasks: Task[];

  private defaultState: State = {
    activeTask: undefined,
    cursor: 0,
  };

  private state = structuredClone(this.defaultState);

  private get activeTask(): Task {
    if (this.state.activeTask === undefined) {
      this.state.activeTask = this.tasks.at(0);

      if (this.state.activeTask === undefined) {
        throw new Error('Failed to set active task');
      }
    }

    return this.state.activeTask;
  }

  private set activeTask(task: Task) {
    this.state.activeTask = task;
  }

  public onStart(taskCtx: TF_CTX, triggerCtx: TF_TCTX): void {
    this.state = structuredClone(this.defaultState);

    this.activeTask.onStart(taskCtx, triggerCtx);
    this.activeTask.running = true;
  }

  public onDone(): TL_RES {
    const result = this.activeTask.onDone();

    this.state = structuredClone(this.defaultState);

    // @ts-expect-error
    return result;
  }

  public onFailed(): void {
    this.activeTask.onFailed();

    this.state = structuredClone(this.defaultState);
  }

  public isDone = () => {
    return (
      (this.state.cursor >= this.tasks.length && this.activeTask.isDone()) ||
      (this.options.ignoreFailure && this.activeTask.isFailed())
    );
  };

  public isFailed = () => {
    return this.options.ignoreFailure === false && this.activeTask.isFailed();
  };

  public tick = () => {
    if (this.activeTask.running === false) {
      return;
    }

    this.activeTask.tick();

    if (this.activeTask.isDone()) {
      this.activeTask.running = false;
      this.state.cursor += 1;

      const nextTask = this.tasks.at(this.state.cursor);

      if (nextTask) {
        const result = this.activeTask.onDone();

        this.activeTask = nextTask;

        this.activeTask.onStart(result, null);
        this.activeTask.running = true;
      }
    } else if (this.activeTask.isFailed()) {
      this.activeTask.running = false;

      if (this.options.ignoreFailure) {
        this.onFailed();
      }
    }
  };
}
