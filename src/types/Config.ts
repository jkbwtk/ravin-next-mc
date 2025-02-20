import z from 'zod';

export const WorkerCredentials = z.object({
  username: z.string(),
  auth: z.enum(['easyAuth', 'offline']),
  password: z.string().optional(),
  createAccount: z.boolean().default(false),
});

export type WorkerCredentials = z.infer<typeof WorkerCredentials>;

export const DirectorOptions = z.object({
  hostname: z.string(),
  port: z.number().optional(),

  loopInterval: z.number().optional(),
});

export type DirectorOptions = z.infer<typeof DirectorOptions>;

export const Config = z
  .object({
    credentials: z.array(WorkerCredentials),
  })
  .and(DirectorOptions);

export type Config = z.infer<typeof Config>;
