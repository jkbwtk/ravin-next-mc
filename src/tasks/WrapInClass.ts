import { Task } from '#/tasks/Task';
import type { TaskCtx, TaskResult, TriggerCtx } from '#/types/TaskUtilTypes';

abstract class ComplexTask<P extends unknown[], T extends Task> extends Task<
  TaskCtx<T>,
  TriggerCtx<T>,
  TaskResult<T>
> {
  abstract generateTask: (...args: P) => T;

  private _task?: T;

  public get task(): T {
    if (this._task === undefined) {
      this._task = this.generateTask(...this.args);
    }

    return this._task;
  }

  public get running(): boolean {
    return this.task.running;
  }
  public set running(state: boolean) {
    this.task.running = state;
  }

  private args: P;

  constructor(...args: P) {
    super();

    this.args = args;
  }

  public onStart(taskCtx: TaskCtx<T>, triggerCtx: TriggerCtx<T>): void {
    this.task.onStart(taskCtx, triggerCtx);
  }

  public onDone(): TaskResult<T> {
    // @ts-expect-error
    return this.task.onDone();
  }

  public onFailed(): void {
    this.task.onFailed();
  }

  public isDone = () => this.task.isDone();

  public isFailed = () => this.task.isFailed();

  public tick = () => this.task.tick();
}

export function wrapInClass<P extends unknown[], T extends Task>(
  generator: (...args: P) => T,
) {
  return class extends ComplexTask<
    Parameters<typeof generator>,
    ReturnType<typeof generator>
  > {
    generateTask = generator;
  };
}
