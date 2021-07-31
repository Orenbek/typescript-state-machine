import type { MergeArr } from '../types/index';

export default function mixin<
  T extends Record<string | number, unknown>,
  P extends [Record<string | number, unknown>, ...Record<string | number, unknown>[]]
>(target: T, ...rest: P): MergeArr<[T, ...P]> {
  return [target, ...rest].reduce(
    (a, b) => ({
      ...a,
      ...b,
    }),
    {}
  ) as MergeArr<[T, ...P]>;
}
