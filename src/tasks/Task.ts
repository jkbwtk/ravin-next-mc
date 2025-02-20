export class Task<TASK_CTX = unknown, TRIGGER_CTX = unknown, RESULT = unknown> {
  public running = false;

  public onStart(_taskCtx: TASK_CTX, _triggerCtx: TRIGGER_CTX) {
    return;
  }

  public onDone(): RESULT {
    return null!;
  }

  public onFailed(): void {
    return;
  }

  public tick = () => {
    return;
  };

  public isDone = () => {
    return true;
  };

  public isFailed = () => {
    return false;
  };
}
