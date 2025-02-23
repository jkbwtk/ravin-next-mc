import type { Task } from '#/tasks/Task';
import type { TaskResult, TriggerCtx } from '#/types/TaskUtilTypes';

export interface TaskLinkOverrides<CT extends Task> {
  shouldAdvance?: () => boolean;
  onSuccess?: (result: TaskResult<CT>) => void;
  onFailure?: () => void;
}

export interface TaskLinkConfigParams<
  CT extends Task,
  NT extends Task,
  FT extends Task,
> {
  current: CT;
  next: NT;
  fallback: FT;
}

export interface TaskLinkOptions<
  CT extends Task,
  NT extends Task,
  FT extends Task,
> extends TaskLinkOverrides<CT>,
    TaskLinkConfigParams<CT, NT, FT> {}

export class TaskLink<
  CT extends Task = Task,
  NT extends Task<TaskResult<CT>, unknown, unknown> = Task,
  FT extends Task = Task,
> implements
    Required<TaskLinkConfigParams<CT, NT, FT>>,
    Required<TaskLinkOverrides<CT>>
{
  current: CT;
  next: NT;
  fallback: FT;

  triggered = false;
  triggerCtx: TriggerCtx<NT> = null!;

  constructor(options: TaskLinkOptions<CT, NT, FT>) {
    this.current = options.current;
    this.next = options.next;
    this.fallback = options.fallback;

    this.shouldAdvance = options.shouldAdvance ?? this.shouldAdvance;
    this.onSuccess = options.onSuccess ?? this.onSuccess;
    this.onFailure = options.onFailure ?? this.onFailure;
  }

  public trigger(ctx: TriggerCtx<NT>) {
    if (this.current.running) {
      this.triggered = true;
      this.triggerCtx = ctx;
    }
  }

  public untrigger() {
    const ctx = this.triggerCtx;

    this.triggered = false;
    this.triggerCtx = null!;

    return ctx;
  }

  public shouldAdvance = () => false;

  public onSuccess = (_result: TaskResult<CT>) => {
    return;
  };

  public onFailure = () => {
    return;
  };
}
