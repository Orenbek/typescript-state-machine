import { Flatten, TupleDeDuplication } from './utils/types'

export interface Transition<TName extends string = string, StateFrom extends string = string, StateTo extends string = string> {
  readonly name: TName
  readonly from: StateFrom | readonly StateFrom[]
  readonly to: StateTo
}

export type TransitionMethods<TTransitions extends readonly Transition[]> = {
  [K in keyof TTransitions as TTransitions[K] extends Transition ? TTransitions[K]['name'] : never]: (...args: unknown[]) => void
}

export type TransitionTuple<TTransitions extends readonly Transition[]> = {
  [K in keyof TTransitions]: TTransitions[K] extends Transition ? TTransitions[K]['name'] : never
}

export type TransitionTupleDeduplicate<TTransitions extends readonly Transition[]> = TupleDeDuplication<TransitionTuple<TTransitions>>

export type TransitionUnion<TTransitions extends readonly Transition[]> = TTransitions[number]['name']

export type StateFromTuple<TTransitions extends readonly Transition[]> = {
  [K in keyof TTransitions]: TTransitions[K] extends Transition ? TTransitions[K]['from'] : never
}

export type StateFromUnion<TTransitions extends readonly Transition[]> = Flatten<StateFromTuple<TTransitions>>[number]

export type StateToUnion<TTransitions extends readonly Transition[]> = TTransitions[number]['to']

export type StateUnion<TTransitions extends readonly Transition[]> = StateFromUnion<TTransitions> | StateToUnion<TTransitions>
