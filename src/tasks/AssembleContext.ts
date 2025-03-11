import { Task } from '#/tasks/Task';

interface State<C> {
  context: C;

  tasks: [string, Task<C>][];
  activeTask?: [string, Task<C>];

  results: [string, ReturnType<Task<C>['onDone']>][];
}

type TasksShape<SHAPE extends Record<string, unknown>, CTX = unknown> = {
  [Key in keyof SHAPE]: Task<CTX, unknown, SHAPE[Key]>;
};

export class AssembleContext<
  // @ts-expect-error
  SHAPE extends Record<unknown, unknown>,
  CTX = unknown,
> extends Task {
  contextShape: TasksShape<SHAPE, CTX>;

  defaultState: State<CTX> = {
    context: null!,
    tasks: [],

    results: [],
  };

  state: State<CTX>;

  constructor(shape: TasksShape<SHAPE, CTX>) {
    super();
    this.contextShape = shape;

    this.state = structuredClone(this.defaultState);
  }

  public onStart(taskCtx: CTX, triggerCtx: unknown): void {
    this.state = structuredClone(this.defaultState);

    this.state.tasks = Object.entries(this.contextShape);
    this.state.context = taskCtx;
    this.state.activeTask = this.state.tasks.shift();

    if (this.state.activeTask) {
      this.state.activeTask[1].onStart(this.state.context, triggerCtx);
      this.state.activeTask[1].running = true;
    }
  }

  public onDone(): { [Key in keyof SHAPE]: SHAPE[Key] } {
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
        task.tick();

        if (task.isDone()) {
          this.state.results.push([key, task.onDone()]);
          task.running = false;

          this.state.activeTask = this.state.tasks.shift();

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
