import { ToCamelCase } from './utils/camelize'
import { Transition, StateUnion } from './transition'

// general lifecycle events
export interface GeneralLifeCycle<TTransitions extends readonly Transition[]> {
  onBeforeTransition: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void> | void // fired before any transition: ;
  onLeaveState: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void> | void // fired when leaving any state
  onTransition: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void> | void // fired during any transition: ;
  onEnterState: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void // fired when entering any state
  onAfterTransition: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void // fired after any transition
}

export type TransitionLifeCycel<TTransitions extends readonly Transition[]> = {
  [K in TTransitions[number]['name'] as ToCamelCase<`on-before-${K & string}`>]: (
    event: LifeCycleEventPayload<TTransitions>,
    ...args: unknown[]
  ) => boolean | Promise<void> | void // fired before a specific TRANSITION begins
} & {
  [K in TTransitions[number]['name'] as ToCamelCase<`on-after-${K & string}`>]: (
    event: LifeCycleEventPayload<TTransitions>,
    ...args: unknown[]
  ) => void // fired after a specific TRANSITION completes
} & {
  [K in TTransitions[number]['name'] as ToCamelCase<`on-${K & string}`>]: (
    event: LifeCycleEventPayload<TTransitions>,
    ...args: unknown[]
  ) => void // convenience shorthand for onAfter<TRANSITION>
}

export type StateLifeCycel<TTransitions extends readonly Transition[]> = {
  [K in StateUnion<TTransitions> as ToCamelCase<`on-leave-${K & string}`>]: (
    event: LifeCycleEventPayload<TTransitions>,
    ...args: unknown[]
  ) => boolean | Promise<void> | void // fired when leaving a specific STATE
} & {
  [K in StateUnion<TTransitions> as ToCamelCase<`on-enter-${K & string}`>]: (
    event: LifeCycleEventPayload<TTransitions>,
    ...args: unknown[]
  ) => void // fired when entering a specific STATE
} & {
  [K in StateUnion<TTransitions> as ToCamelCase<`on-${K & string}`>]: (
    event: LifeCycleEventPayload<TTransitions>,
    ...args: unknown[]
  ) => void // convenience shorthand for onEnter<STATE>
}

export interface ExtraTransitionLifeCycel<TTransitions extends readonly Transition[]> {
  onInvalidTransition: (event: LifeCycleEventPayload<TTransitions>) => void
  onPendingTransition: (event: LifeCycleEventPayload<TTransitions>) => void
}

// for now eventPayload is just a union type. is it possible to make it Generic to narrowdown type to a single precise type? i dont know.
// i think for now it's ok, dont need to push it to the limit.
export type LifeCycleEventPayload<TTransitions extends readonly Transition[]> = {
  event: ToCamelCase<`on-${TTransitions[number]['name']}`>
  from: TTransitions[number]['from']
  to: TTransitions[number]['to']
  transition: TTransitions[number]['name']
}

export type LifeCycleMethodPayload<TTransitions extends readonly Transition[]> = [
  transition: TTransitions[number]['name'],
  from: TTransitions[number]['from'],
  to: TTransitions[number]['to'],
  ...args: unknown[]
]

/** Lifecycle Events Listed in Order */
/**
 * onBeforeTransition - fired before any transition
 * onBefore<TRANSITION> - fired before a specific TRANSITION
 * onLeaveState - fired when leaving any state
 * onLeave<STATE> - fired when leaving a specific STATE
 * onTransition - fired during any transition
 * onEnterState - fired when entering any state
 * onEnter<STATE> - fired when entering a specific STATE
 * on<STATE> - convenience shorthand for onEnter<STATE>
 * onAfterTransition - fired after any transition
 * onAfter<TRANSITION> - fired after a specific TRANSITION
 * on<TRANSITION> - convenience shorthand for onAfter<TRANSITION>
 */

export type ListenersLifeCycleEventType = 'onBeforeTransition' | 'onLeaveState' | 'onTransition' | 'onEnterState' | 'onAfterTransition'
