import { ToCamelCase } from './utils/camelize'
import { Transition, StateUnion, StateFromUnion, TransitionUnion } from './transition'

// general lifecycle events
export type GeneralLifeCycle<TTransitions extends readonly Transition[]> = {
  onBeforeTransition: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<unknown> | void // fired before any transition: ;
  onLeaveState: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<unknown> | void // fired when leaving any state
  onTransition: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<unknown> | void // fired during any transition: ;
  onEnterState: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void // fired when entering any state
  onAfterTransition: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void // fired after any transition
}

export type TransitionLifeCycel<TTransitions extends readonly Transition[]> = {
  [K in TransitionUnion<TTransitions> as ToCamelCase<`on-before-${K & string}`>]: (
    event: LifeCycleEventPayload<TTransitions>,
    ...args: unknown[]
  ) => boolean | Promise<unknown> | void // fired before a specific TRANSITION begins
} & {
  [K in TransitionUnion<TTransitions> as ToCamelCase<`on-after-${K & string}`>]: (
    event: LifeCycleEventPayload<TTransitions>,
    ...args: unknown[]
  ) => void // fired after a specific TRANSITION completes
} & {
  [K in TransitionUnion<TTransitions> as ToCamelCase<`on-${K & string}`>]: (
    event: LifeCycleEventPayload<TTransitions>,
    ...args: unknown[]
  ) => void // convenience shorthand for onAfter<TRANSITION>
}

export type StateLifeCycel<TTransitions extends readonly Transition[]> = {
  [K in StateUnion<TTransitions> as ToCamelCase<`on-leave-${K & string}`>]: (
    event: LifeCycleEventPayload<TTransitions>,
    ...args: unknown[]
  ) => boolean | Promise<unknown> | void // fired when leaving a specific STATE
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

export type ExtraTransitionLifeCycel<TTransitions extends readonly Transition[]> = {
  onInvalidTransition: (event: LifeCycleEventPayload<TTransitions>) => void
  onPendingTransition: (event: LifeCycleEventPayload<TTransitions>) => void
}

export type InitTransitionLifeCycle<State extends string> = {
  onAfterInit: (event: { event: 'onInit'; from: 'none'; to: State; transition: 'init' }) => void
  onInit: (event: { event: 'onInit'; from: 'none'; to: State; transition: 'init' }) => void
}

// for now eventPayload is just a union type. is it possible to make it Generic to narrowdown type to a single precise type? i dont know.
// i think for now it's ok, dont need to push it to the limit.
export type LifeCycleEventPayload<TTransitions extends readonly Transition[]> = {
  event: ToCamelCase<`on-${TransitionUnion<TTransitions>}`>
  from: StateFromUnion<TTransitions> | 'none'
  to: StateUnion<TTransitions>
  transition: TransitionUnion<TTransitions>
}

export type LifeCycleMethodPayload<TTransitions extends readonly Transition[]> = [
  transition: TransitionUnion<TTransitions>,
  from: StateFromUnion<TTransitions> | 'none',
  to: StateUnion<TTransitions>,
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
