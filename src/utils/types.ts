type UnknownRecord = Record<string | number, unknown>

export type Merge<F extends UnknownRecord, S extends UnknownRecord> = {
  [P in keyof F | keyof S]: P extends keyof Omit<F, keyof S> ? F[P] : P extends keyof S ? S[P] : never
}

// string operators
export type Concat<S1 extends string, S2 extends string> = `${S1}${S2}`
export type ToString<T extends string | number | boolean | bigint> = `${T}`

// tuple operators
export type FirstElem<T extends readonly unknown[]> = T[0]
export type LastElem<T extends readonly unknown[]> = T extends readonly [...infer _, infer U] ? U : undefined

export type RemoveFirst<T extends readonly unknown[]> = T extends readonly [unknown, ...infer U] ? U : [...T]
// [unknown, ...infer U] 可以替换为 [any, ...infer U]
export type RomoveLast<T extends readonly unknown[]> = T extends readonly [...infer U, unknown] ? U : [...T]
// [...infer U, unknown] 可以替换为 [...infer U, any]

export type MergeArr<T extends UnknownRecord[]> = T['length'] extends 0
  ? Record<string, never>
  : T['length'] extends 1
  ? T[0]
  : T extends [infer P, infer Q, ...infer U]
  ? P extends UnknownRecord
    ? Q extends UnknownRecord
      ? U extends UnknownRecord[]
        ? MergeArr<[Merge<P, Q>, ...U]>
        : MergeArr<[Merge<P, Q>]>
      : never
    : never
  : never

/*
** 这里写得这么麻烦全是因为typescript不够智能 **
按理来说 下面的代码已经足够了，但typescirpt报错
type MergeArr<T extends Record<string | number, unknown>[]> = T['length'] extends 0
  ? {}
  : T['length'] extends 1
  ? T[0]
  : T extends [infer P, infer Q, ...infer U]
  ? U extends Record<string | number, unknown>[]
    ? MergeArr<[Merge<P, Q>, ...U]>
    : MergeArr<[Merge<P, Q>]>
  : never;

** 另外 如果说typescript支持下面这种写法 也应该可以避免相当多的垃圾代码 但是typescript依然不支持
type MergeArr<T extends Record<string | number, unknown>[]> = T['length'] extends 0
  ? {}
  : T['length'] extends 1
  ? T[0]
  : T extends [infer P, infer Q, ...infer U]
  ? U extends Record<string | number, unknown>[]
    ? [P, Q] extends [Record<string | number, unknown>, Record<string | number, unknown>]
      ? MergeArr<[Merge<P, Q>, ...U]>
      : never
    : MergeArr<[Merge<P, Q>]>
  : never;
*/

export type Flatten<T> = T extends [] ? [] : T extends readonly [infer First, ...infer Rest] ? [...Flatten<First>, ...Flatten<Rest>] : [T]

export type TupleDeDuplication<T extends readonly unknown[], Result extends readonly unknown[] = []> = T['length'] extends 0
  ? Result
  : T['length'] extends 1
  ? T[0] extends Result[number]
    ? Result
    : [...Result, T[0]]
  : T extends readonly [infer First, ...infer Rest]
  ? First extends Result[number]
    ? TupleDeDuplication<Rest, Result>
    : TupleDeDuplication<Rest, [...Result, First]>
  : never

export function objectInGard<K extends string, T>(o: T, k: K): o is T & Record<K, unknown> {
  return typeof o === 'object' && Boolean(o) && k in o
}
