import type { TaskLink } from '#/TaskLink';
import { Task } from '#/tasks/Task';
import { arrayFrom } from '#/utils';

type FirstTaskStartParams<T extends Task> = Parameters<T['onStart']>;

export class TaskExecutor<
  FT extends Task = Task,
  LT extends Task = Task,
  L extends Record<
    string,
    // biome-ignore lint/suspicious/noExplicitAny: yeah
    TaskLink<any, any, any, any, any, any>
  > = Record<
    string,
    // biome-ignore lint/suspicious/noExplicitAny: yeah
    TaskLink<any, any, any, any, any, any>
  >,
> extends Task {
  public readonly links: Map<keyof L, L[keyof L]>;
  public readonly tasks: Task[];

  public readonly firstTask: FT;
  public readonly lastTask?: LT;

  public activeTask?: Task;
  public activeTaskResult?: ReturnType<Task['onDone']>;

  constructor(links: L, firstTask: FT, lastTask?: LT) {
    super();

    this.firstTask = firstTask;
    this.lastTask = lastTask;

    // @ts-expect-error
    this.links = new Map(Object.entries(links));
    this.tasks = this.getAllTasks();
  }

  private getAllTasks(): Task[] {
    const tasks: Set<Task> = new Set([this.firstTask]);

    if (this.lastTask) {
      tasks.add(this.lastTask);
    }

    for (const link of this.links.values()) {
      for (const task of arrayFrom(link.current)) {
        tasks.add(task);
      }

      tasks.add(link.next);
    }

    return Array.from(tasks);
  }

  public getLink<K extends keyof L>(name: K): L[K] {
    // @ts-expect-error
    return this.links.get(name)!;
  }

  public start() {
    this.onStart(null, null);
    this.running = true;
  }

  public onStart(
    taskCtx: FirstTaskStartParams<FT>[0],
    triggerCtx: FirstTaskStartParams<FT>[1],
  ) {
    this.activeTask = this.firstTask;

    this.activeTask.onStart(taskCtx, triggerCtx);
    this.activeTask.running = true;
  }

  public onDone() {
    if (this.activeTask) {
      const result = this.activeTask.onDone();
      this.activeTask.running = false;

      this.activeTask = undefined;
      this.activeTaskResult = undefined;

      return result;
    }

    return null;
  }

  public override isDone = () => {
    if (!!this.lastTask === false) {
      return false;
    }

    return this.activeTask === this.lastTask && this.activeTask.isDone();
  };

  public override tick = () => {
    if (this.activeTask === undefined) {
      return;
    }

    this.activeTask.running && this.activeTask.tick();

    const validEntries = this.links
      .entries()
      .filter(([_name, link]) => link.current === this.activeTask);

    for (const [name, link] of validEntries) {
      if (this.activeTask.running && this.activeTask.isDone()) {
        this.activeTaskResult = this.activeTask.onDone();
        this.activeTask.running = false;
      } else if (this.activeTask.running && this.activeTask.isFailed()) {
        this.handleLinkFallback(name, link);

        break;
      }

      if (this.activeTask.running === false) {
        if (link.triggered || link.shouldAdvance(this.activeTaskResult)) {
          this.handleLinkAdvancement(name, link);

          break;
        }
      }
    }
  };

  private handleLinkAdvancement(name: keyof L, link: L[keyof L]) {
    console.log(`Advancing link ${String(name)}`);

    const triggerCtx = link.untrigger();

    link.onSuccess(this.activeTaskResult);

    this.activeTask = link.next;

    this.activeTask.onStart(this.activeTaskResult, triggerCtx);
    this.activeTask.running = true;

    this.activeTaskResult = undefined;
  }

  private handleLinkFallback(name: keyof L, link: L[keyof L]) {
    if (this.activeTask === undefined) {
      throw new Error('Missing active task');
    }

    console.log(`Falling back on link ${String(name)}`);

    const triggerCtx = link.untrigger();
    this.activeTask.onFailed();
    this.activeTask.running = false;

    link.onFailure();

    this.activeTask = link.fallback;

    this.activeTask.onStart(null, triggerCtx);
    this.activeTask.running = true;
  }
}
