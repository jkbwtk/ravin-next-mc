import { Task } from '#/tasks/Task';

interface State<C> {
  context: C;

  tasks: [string, Task<C>][];
  activeTask?: [string, Task<C>];

  results: [string, ReturnType<Task<C>['onDone']>][];
}

export class AssembleContext<
  C,
  S extends Record<string, Task<C>>,
> extends Task {
  contextShape: S;

  defaultState: State<C> = {
    context: null!,
    tasks: [],

    results: [],
  };

  state: State<C>;

  constructor(shape: S) {
    super();
    this.contextShape = shape;

    this.state = structuredClone(this.defaultState);
  }

  public onStart(taskCtx: C, triggerCtx: unknown): void {
    this.state = structuredClone(this.defaultState);

    this.state.tasks = Object.entries(this.contextShape);
    this.state.context = taskCtx;
    this.state.activeTask = this.state.tasks.shift();

    if (this.state.activeTask) {
      this.state.activeTask[1].onStart(this.state.context, triggerCtx);
      this.state.activeTask[1].running = true;
    }
  }

  public onDone(): { [Key in keyof S]: ReturnType<S[Key]['onDone']> } {
    // @ts-expect-error
    return Object.fromEntries(this.state.results);
  }

  public isDone = () => {
    return (
      this.state.tasks.length === 0 &&
      (this.state.activeTask?.[1].running ?? false) === false &&
      (this.state.activeTask?.[1].isDone() ?? true)
    );
  };

  public isFailed = () => {
    return this.state.activeTask?.[1].isFailed() ?? false;
  };

  public tick = () => {
    if (this.state.activeTask) {
      const [key, task] = this.state.activeTask;

      if (task.running) {
        if (task.isDone()) {
          this.state.results.push([key, task.onDone()]);
          task.running = false;

          this.state.activeTask = this.state.tasks.pop();

          if (this.state.activeTask) {
            this.state.activeTask[1].onStart(this.state.context, null);
            this.state.activeTask[1].running = true;
          }
        }

        if (task.isFailed()) {
          task.running = false;
        }
      }
    }
  };
}
