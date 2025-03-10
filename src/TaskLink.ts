import type { Task } from '#/tasks/Task';

export interface TaskLinkOptions<
  CT_CTX,
  CT_TRIGGER,
  CT_RESULT,
  NT_TRIGGER,
  NT_RESULT,
> {
  shouldAdvance?: (ctx: CT_RESULT) => boolean;
  onSuccess?: (result: CT_RESULT) => void;
  onFailure?: () => void;

  current: Task<CT_CTX, CT_TRIGGER, CT_RESULT>;
  next: Task<CT_RESULT, NT_TRIGGER, NT_RESULT>;
  fallback: Task;
}

export class TaskLink<CT_CTX, CT_TRIGGER, CT_RESULT, NT_TRIGGER, NT_RESULT> {
  public current: Task<CT_CTX, CT_TRIGGER, CT_RESULT>;
  public next: Task<CT_RESULT, NT_TRIGGER, NT_RESULT>;
  public fallback: Task;

  public triggered = false;
  public triggerCtx: NT_TRIGGER = null!;

  constructor(
    options: TaskLinkOptions<
      CT_CTX,
      CT_TRIGGER,
      CT_RESULT,
      NT_TRIGGER,
      NT_RESULT
    >,
  ) {
    this.current = options.current;
    this.next = options.next;
    this.fallback = options.fallback;

    this.shouldAdvance = options.shouldAdvance ?? this.shouldAdvance;
    this.onSuccess = options.onSuccess ?? this.onSuccess;
    this.onFailure = options.onFailure ?? this.onFailure;
  }

  public trigger(ctx: NT_TRIGGER) {
    this.triggered = true;
    this.triggerCtx = ctx;
  }

  public untrigger() {
    const ctx = this.triggerCtx;

    this.triggered = false;
    this.triggerCtx = null!;

    return ctx;
  }

  public shouldAdvance = (_ctx: CT_RESULT) => false;

  public onSuccess = (_result: CT_RESULT) => {
    return;
  };

  public onFailure = () => {
    return;
  };
}
