import { ToCamelCase } from './utils/camelize'
import { Transition } from './transition'

// general lifecycle events
export interface GeneralLifeCycle<TTransitions extends readonly Transition<string, string>[]> {
  onBeforeTransition: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void>; // fired before any transition: ;
  onLeaveState: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void>; // fired when leaving any state
  onTransition: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void>; // fired during any transition
  onEnterState: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void; //fired when entering any state
  onAfterTransition: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void; // fired after any transition
}

export type TransitionLifeCycel<ITransition extends string, TTransitions extends readonly Transition<string, string>[]> = {
  [_ in never as ToCamelCase<`onBefore-${ITransition}`>]: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void>; // fired before a specific TRANSITION begins
}
  & {
    [_ in never as ToCamelCase<`onAfter-${ITransition}`>]: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void; // fired after a specific TRANSITION completes
  }
  & {
    [_ in never as ToCamelCase<`on-${ITransition}`>]: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void;// convenience shorthand for onAfter<TRANSITION>
  }

export type StateLifeCycel<State extends string, TTransitions extends readonly Transition<string, string>[]> = {
  [_ in never as ToCamelCase<`onLeave-${State}`>]: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void>; // fired when leaving a specific STATE
}
  & {
    [_ in never as ToCamelCase<`onEnter-${State}`>]: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void; // fired when entering a specific STATE
  }
  & {
    [_ in never as ToCamelCase<`on-${State}`>]: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void; // convenience shorthand for onEnter<STATE>
  }

export type LifeCycleEventPayload<TTransitions extends readonly Transition<string, string>[]> = {
  event: ToCamelCase<`on-${TTransitions[number]["name"]}`>; // 不知道这里写的对不对
  from: TTransitions[number]["from"];
  to: TTransitions[number]["to"];
  transition: TTransitions[number]["name"];
}

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
