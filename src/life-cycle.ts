import { ToCamelCase } from './utils/camelize'
import { Transition } from './transition'

// general lifecycle events
export interface GeneralLifeCycle<TTransitions extends readonly Transition<string, string>[]> {
  onBeforeTransition: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void> | void; // fired before any transition: ;
  onLeaveState: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void> | void; // fired when leaving any state
  onTransition: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void> | void; // fired during any transition: ;
  onEnterState: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void; //fired when entering any state
  onAfterTransition: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void; // fired after any transition
}

export type TransitionLifeCycel<TTransitions extends readonly Transition<string, string>[]> = {
  [K in TTransitions[number]["name"]as ToCamelCase<`on-before-${K & string}`>]:
  (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void> | void; // fired before a specific TRANSITION begins
}
  & {
    [K in TTransitions[number]["name"]as ToCamelCase<`on-after-${K & string}`>]:
    (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void; // fired after a specific TRANSITION completes
  }
  & {
    [K in TTransitions[number]["name"]as ToCamelCase<`on-${K & string}`>]:
    (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void;// convenience shorthand for onAfter<TRANSITION>
  }

export type StateLifeCycel<TTransitions extends readonly Transition<string, string>[]> = {
  [K in TTransitions[number]["from"] | TTransitions[number]["to"]as ToCamelCase<`on-leave-${K}`>]:
  (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => boolean | Promise<void> | void; // fired when leaving a specific STATE
}
  & {
    [K in TTransitions[number]["from"] | TTransitions[number]["to"]as ToCamelCase<`on-enter-${K}`>]:
    (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void; // fired when entering a specific STATE
  }
  & {
    [K in TTransitions[number]["from"] | TTransitions[number]["to"]as ToCamelCase<`on-${K}`>]:
    (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void; // convenience shorthand for onEnter<STATE>
  }

export interface ExtraTransitionLifeCycel<TTransitions extends readonly Transition<string, string>[]> {
  onInvalidTransition: (event: LifeCycleEventPayload<TTransitions>) => void;
  onPendingTransition: (event: LifeCycleEventPayload<TTransitions>) => void;
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
