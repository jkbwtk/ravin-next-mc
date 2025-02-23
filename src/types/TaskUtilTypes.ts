import type { Task } from '#/tasks/Task';

export type TaskCtx<T extends Task> = Parameters<T['onStart']>[0];

export type TriggerCtx<T extends Task> = Parameters<T['onStart']>[1];

export type TaskResult<T extends Task> = ReturnType<T['onDone']>;
