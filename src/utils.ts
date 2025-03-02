export type QuickSwitchKeyTypes = number | string;

export type QuickSwitchCases<T, K extends QuickSwitchKeyTypes> = Record<
  K,
  T
> & { default: T };

export const quickSwitch = <T, K extends QuickSwitchKeyTypes = string>(
  value: QuickSwitchKeyTypes,
  cases: QuickSwitchCases<T, K>,
): T => {
  if (value in cases) {
    const option = cases[value as keyof typeof cases];
    if (option !== undefined) {
      return option;
    }
  }

  return cases.default;
};

type Defined = string | number | boolean | symbol | object | bigint | null;

export const mergeOptions = <T extends Record<string, Defined>>(
  options: T,
  defaults: RequiredDefaults<T>,
): Required<T> => {
  const definedOptions = Object.entries(options).filter(
    ([, value]) => value !== undefined,
  ) as [keyof T, Defined][];

  return Object.assign(
    {},
    defaults,
    Object.fromEntries(definedOptions),
  ) as Required<T>;
};

export const arrayFrom = <T>(variable: T[] | T): T[] => {
  return Array.isArray(variable) ? variable.slice() : [variable];
};

// https://stackoverflow.com/questions/57593022/reverse-required-and-optional-properties
type OptionalKeys<T> = {
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

export type RequiredDefaults<T extends Record<string, unknown>> = Required<
  Pick<T, OptionalKeys<T>>
>;

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export function range(end: number, inclusive?: boolean): number[];
export function range(
  start: number,
  end: number,
  inclusive?: boolean,
): number[];
export function range(a: number, b?: number | boolean, c = false): number[] {
  const start = typeof b === 'number' ? a : 0;
  const end = typeof b === 'number' ? b : a;
  const inclusive = typeof b === 'boolean' ? b : c;

  const length = Math.abs(end - start) + (inclusive ? 1 : 0);

  const mapper =
    end >= start
      ? (_v: unknown, i: number) => i + start
      : (_v: unknown, i: number) => start - i;

  return Array.from({ length }).map(mapper);
}
