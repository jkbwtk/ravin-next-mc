import { Task } from '#/tasks/Task';
import type { TaskCtx, TaskResult } from '#/types/TaskUtilTypes';

export class ExecuteWithMappers<
  TASK_CTX,
  RESULT,
  TASK extends Task,
  CTX_MAPPER extends (ctx: TASK_CTX) => TaskCtx<TASK>,
  RESULT_MAPPER extends (ctx: TASK_CTX, result: TaskResult<TASK>) => RESULT,
> extends Task<TASK_CTX, unknown, RESULT> {
  private task: TASK;

  private ctxMapper: CTX_MAPPER;
  private resultMapper: RESULT_MAPPER;

  private ctx: TASK_CTX = null!;

  public get running(): boolean {
    return this.task.running;
  }

  public set running(state: boolean) {
    this.task.running = state;
  }

  constructor(task: TASK, ctxMapper: CTX_MAPPER, resultMapper: RESULT_MAPPER) {
    super();

    this.task = task;

    this.ctxMapper = ctxMapper;
    this.resultMapper = resultMapper;

    this.tick = this.task.tick;
    this.isDone = this.task.isDone;
    this.isFailed = this.task.isFailed;
  }

  public onStart(taskCtx: TASK_CTX, triggerCtx: unknown): void {
    const mappedCtx = this.ctxMapper(taskCtx);

    this.ctx = taskCtx;
    this.task.onStart(mappedCtx, triggerCtx);
  }

  public onDone(): RESULT {
    const result = this.task.onDone();

    const ctx = this.ctx;
    this.ctx = null!;

    // @ts-expect-error
    return this.resultMapper(ctx, result);
  }
}
