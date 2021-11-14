import { Flatten } from './types/index'

export interface Transition<TName extends string = string, StateFrom extends string = string, StateTo extends string = string> {
  readonly name: TName
  readonly from: StateFrom | readonly StateFrom[]
  readonly to: StateTo
}

export type TransitionMethods<TTransitions extends readonly Transition[]> = {
  [K in keyof TTransitions as TTransitions[K] extends Transition ? TTransitions[K]['name'] : never]: (...args: any[]) => void
}

export type TransitionsFromTuple<TTransitions extends readonly Transition[]> = {
  [K in keyof TTransitions]: TTransitions[K] extends Transition ? TTransitions[K]['from'] : never
}

export type StateFromUnion<TTransitions extends readonly Transition[]> = Flatten<TransitionsFromTuple<TTransitions>>[number]

export type StateToUnion<TTransitions extends readonly Transition[]> = TTransitions[number]['to']

export type StateUnion<TTransitions extends readonly Transition[]> = StateFromUnion<TTransitions> | StateToUnion<TTransitions>
