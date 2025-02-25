import { Task } from '#/tasks/Task';

type CTX_MAPPER<TASK_CTX, WRAPPED_TASK_CTX> = (
  ctx: TASK_CTX,
) => WRAPPED_TASK_CTX;
type RESULT_MAPPER<TASK_CTX, WRAPPED_TASK_RESULT, RESULT> = (
  ctx: TASK_CTX,
  result: WRAPPED_TASK_RESULT,
) => RESULT;

export class ExecuteWithMappers<
  TASK_CTX,
  TRIGGER_CTX,
  RESULT,
  WRAPPED_TASK_CTX,
  WRAPPED_TASK_RESULT,
> extends Task<TASK_CTX, TRIGGER_CTX, RESULT> {
  private task: Task<WRAPPED_TASK_CTX, TRIGGER_CTX, WRAPPED_TASK_RESULT>;

  private ctxMapper: CTX_MAPPER<TASK_CTX, WRAPPED_TASK_CTX>;
  private resultMapper: RESULT_MAPPER<TASK_CTX, WRAPPED_TASK_RESULT, RESULT>;

  private ctx: TASK_CTX = null!;

  public get running(): boolean {
    return this.task.running;
  }

  public set running(state: boolean) {
    this.task.running = state;
  }

  constructor(
    task: Task<WRAPPED_TASK_CTX, TRIGGER_CTX, WRAPPED_TASK_RESULT>,
    ctxMapper: CTX_MAPPER<TASK_CTX, WRAPPED_TASK_CTX>,
    resultMapper: RESULT_MAPPER<TASK_CTX, WRAPPED_TASK_RESULT, RESULT>,
  ) {
    super();

    this.task = task;

    this.ctxMapper = ctxMapper;
    this.resultMapper = resultMapper;

    this.tick = this.task.tick;
    this.isDone = this.task.isDone;
    this.isFailed = this.task.isFailed;
  }

  public onStart(taskCtx: TASK_CTX, triggerCtx: TRIGGER_CTX): void {
    const mappedCtx = this.ctxMapper(taskCtx);

    this.ctx = taskCtx;
    this.task.onStart(mappedCtx, triggerCtx);
  }

  public onDone(): RESULT {
    const result = this.task.onDone();

    const ctx = this.ctx;
    this.ctx = null!;

    return this.resultMapper(ctx, result);
  }
}
