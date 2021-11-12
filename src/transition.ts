import { Flatten } from './types/index'

export interface Transition<TName extends string, State extends string> {
  readonly name: TName
  readonly from: State | readonly State[]
  readonly to: State
}

export type TransitionMethods<TTransitions extends readonly Transition<string, string>[]> = {
  [K in keyof TTransitions as TTransitions[K] extends Transition<string, string> ? TTransitions[K]['name'] : never]: (...args: any[]) => void
}

export type TransitionsFromTuple<T extends readonly Transition<string, string>[]> = {
  [K in keyof T]: T[K] extends Transition<string, string> ? T[K]['from'] : never
}
// extract 'from' out of the Transitions as tuple

export type StateUnion<TTransitions extends readonly Transition<string, string>[]> =
  | Flatten<TransitionsFromTuple<TTransitions>>[number]
  | TTransitions[number]['to']
