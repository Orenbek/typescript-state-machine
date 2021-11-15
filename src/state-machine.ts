import type { Transition, TransitionMethods, StateUnion, TransitionTupleDeduplicate } from './transition'
import type {
  GeneralLifeCycle,
  TransitionLifeCycel,
  StateLifeCycel,
  ExtraTransitionLifeCycel,
  LifeCycleMethodPayload,
  LifeCycleEventPayload,
  ListenersLifeCycleEventType,
} from './life-cycle'
import { Exception } from './utils/exception'
import camelize from './utils/camelize'
import { isPromise } from './utils/types'
import { StateLifecycleMixin } from './mixin-functions'

interface StateMachineParams<TTransitions extends readonly Transition[], Data extends Record<PropertyKey, unknown>> {
  readonly init?: StateUnion<TTransitions>
  readonly transitions: readonly [...TTransitions]
  readonly data?: Data
  readonly lifecycles?: Partial<
    GeneralLifeCycle<TTransitions> &
      TransitionLifeCycel<TTransitions> &
      StateLifeCycel<TTransitions> &
      ExtraTransitionLifeCycel<TTransitions>
  >
}

async function pipe<T extends (...params: any) => any>(inputs: [T, [...Parameters<T>]][], abortWhenResFalse = false) {
  let abort = false
  // eslint-disable-next-line no-restricted-syntax
  for (const i of inputs) {
    // eslint-disable-next-line no-await-in-loop
    const res = await i[0](...i[1])
    if (abortWhenResFalse && res === false) {
      abort = true
      break
    }
  }
  return abort
}

class StateMachineImpl<TTransitions extends readonly Transition[], Data extends Record<PropertyKey, unknown>> {
  state: StateUnion<TTransitions> | 'none' = 'none'

  data: StateMachineParams<TTransitions, Data>['data']

  private pending = false

  private states: Array<StateUnion<TTransitions> | 'none'> = ['none'] // states不构成tuple

  // represent all the transition names
  private readonly transition_names: TransitionTupleDeduplicate<TTransitions> = [] as unknown as TransitionTupleDeduplicate<TTransitions>

  private readonly transitions: StateMachineParams<TTransitions, Data>['transitions'] = [] as unknown as TTransitions

  // 这里必须得 readonly [...TTransitions] 这么写 不能直接写 TTransitions。原因后续了解一下
  private readonly life_cycles: StateMachineParams<TTransitions, Data>['lifecycles']

  private listeners: {
    onBeforeTransition: Array<(event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void>
    onLeaveState: Array<(event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void>
    onTransition: Array<(event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void>
    onEnterState: Array<(event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void>
    onAfterTransition: Array<(event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void>
  } = {
    onBeforeTransition: [],
    onLeaveState: [],
    onTransition: [],
    onEnterState: [],
    onAfterTransition: [],
  }

  // 这里的class的type是假的 这个class的实现对内可以认为没有type 对外有type
  constructor(params: StateMachineParams<TTransitions, Data>) {
    if (params.init) {
      this.state = params.init
    }
    this.transitions = [...params.transitions]
    // De-duplication
    this.transition_names = Array.from(
      new Set(this.transitions.map((transit) => transit.name))
    ) as unknown as TransitionTupleDeduplicate<TTransitions>
    this.states = Array.from(
      new Set(
        this.transitions.reduce(
          (a, b) => {
            if (Array.isArray(b.from)) {
              return [...a, ...b.from, b.to]
            }
            return [...a, b.from, b.to]
          },
          params.init ? [] : ['none']
        )
      )
    ) as unknown as Array<StateUnion<TTransitions> | 'none'>
    this.data = params.data
    this.life_cycles = params.lifecycles
    this.transition_names.forEach((tranName) => {
      StateLifecycleMixin.Transition.bind(this)(this, tranName)
      StateLifecycleMixin.OnBeforeTransition.bind(this)(this, tranName)
      StateLifecycleMixin.OnAfterTransition.bind(this)(this, tranName)
    })
    this.states.forEach((state) => {
      StateLifecycleMixin.OnLeaveState.bind(this)(this, state)
      StateLifecycleMixin.OnEnterState.bind(this)(this, state)
    })
  }

  get allStates() {
    return this.states
  }

  get allTransitions() {
    return this.transition_names
  }

  get possibleTransitions() {
    return this.transitions
      .filter((transit) => transit.from === this.state || (Array.isArray(transit.from) && transit.from.includes(this.state as string)))
      .map((transit) => transit.name)
  }

  get isFinalState() {
    return this.possibleTransitions.length === 0
  }

  // is<T extends TTransitions[number]["name"]>(transition: T): this is this & { state: T } {
  //   return this.state === transition
  // }
  // function is been removed, cause this function cannot narrow down the type of this.state

  can(transition: TTransitions[number]['name']) {
    return !this.pending && Boolean(this.possibleTransitions.find((name) => name === transition))
  }

  cannot(transition: TTransitions[number]['name']) {
    return !this.can(transition)
  }

  private onInvalidTransition(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads
    if (this.life_cycles?.onInvalidTransition) {
      this.life_cycles.onInvalidTransition?.(
        {
          event: camelize.prepended('on', transition),
          from,
          to,
          transition,
        },
        ...args
      )
    } else {
      throw new Exception('invalid transition!', transition, from, to, this.state as string)
    }
  }

  private onPendingTransition(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads
    if (this.life_cycles?.onPendingTransition) {
      this.life_cycles.onPendingTransition?.(
        {
          event: camelize.prepended('on', transition),
          from,
          to,
          transition,
        },
        ...args
      )
    } else {
      throw new Exception('transition on pending!', transition, from, to, this.state as string)
    }
  }

  private stateTransitionAssert(
    transition: TTransitions[number]['name'],
    from: TTransitions[number]['from'],
    to: TTransitions[number]['to'],
    ...args: unknown[]
  ): asserts transition {
    if (this.cannot(transition)) {
      this.onInvalidTransition(transition, from, to, ...args)
    }
    if (this.pending) {
      this.onPendingTransition(transition, from, to, ...args)
    }
  }

  // fired before any transition
  private async onBeforeTransition(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads
    this.stateTransitionAssert(transition, from, to, ...args)

    this.pending = true

    // trigger event add up later

    if (!this.life_cycles?.onBeforeTransition) {
      return true
    }
    let res = this.life_cycles.onBeforeTransition?.(
      {
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      },
      ...args
    )
    // is return false or rejected, then should abort transition
    if (isPromise(res)) {
      res = await res
    }
    return res !== false
  }

  // fired when leaving any state
  private async onLeaveState(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads
    // trigger event add up later

    if (!this.life_cycles?.onLeaveState) {
      return true
    }
    let res = this.life_cycles.onLeaveState?.(
      {
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      },
      ...args
    )
    // is return false or rejected, then should abort transition
    if (isPromise(res)) {
      res = await res
    }
    return res !== false
  }

  // fired during any transition
  private async onTransition(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads
    // trigger event add up later

    if (!this.life_cycles?.onTransition) {
      return true
    }
    let res = this.life_cycles.onTransition?.(
      {
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      },
      ...args
    )
    // is return false or rejected, then should abort transition
    if (isPromise(res)) {
      res = await res
    }
    return res !== false
  }

  // fired when entering any state
  private async onEnterState(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads
    // trigger event add up later

    await this.life_cycles?.onEnterState?.(
      {
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      },
      ...args
    )
  }

  // fired after any transition
  private async onAfterTransition(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads
    // trigger event add up later

    await this.life_cycles?.onAfterTransition?.(
      {
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      },
      ...args
    )
  }

  private async fireTransition(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads
    /** execute order
     * onBeforeTransition
     * onBefore<TRANSITION>
     * onLeaveState
     * onLeave<STATE>
     * onTransition
     * onEnterState
     * onEnter<STATE>
     * on<STATE>
     * onAfterTransition
     * onAfter<TRANSITION>
     * on<TRANSITION>
     */
    const aborted = await pipe(
      [
        [this.onBeforeTransition.bind(this), [transition, from, to, ...args]],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [this[camelize.prepended('onBefore', transition)].bind(this), [transition, from, to, ...args]],
        [this.onLeaveState.bind(this), [transition, from, to, ...args]],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [this[camelize.prepended('onLeave', this.state)].bind(this), [transition, from, to, ...args]],
        // because from can be a array of string, so use this.state instead of from
        [this.onTransition.bind(this), [transition, from, to, ...args]],
      ],
      true
    )
    if (aborted) {
      this.pending = false
      return
    }
    // update state
    this.state = to
    await pipe([
      [this.onEnterState.bind(this), [transition, from, to, ...args]],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      [this[camelize.prepended('onEnter', to)].bind(this), [transition, from, to, ...args]],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      [this[camelize.prepended('on', to)].bind(this), [transition, from, to, ...args]],
      [this.onAfterTransition.bind(this), [transition, from, to, ...args]],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      [this[camelize.prepended('onAfter', transition)].bind(this), [transition, from, to, ...args]],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      [this[camelize.prepended('on', transition)].bind(this), [transition, from, to, ...args]],
    ])
    this.pending = false
  }

  addEventListener(type: ListenersLifeCycleEventType, callback: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void) {
    this.listeners[type].push(callback)
  }

  removeEventListener(
    type: ListenersLifeCycleEventType,
    callback: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void
  ) {
    this.listeners[type] = this.listeners[type].filter((listener) => callback !== listener)
  }
}

export interface StateMachineConstructor {
  new <TTransitions extends readonly Transition[], Data extends Record<PropertyKey, unknown>>(
    params: StateMachineParams<TTransitions, Data>
  ): TransitionMethods<TTransitions> & {
    /**
     * current state property
     */
    state: StateUnion<TTransitions> | 'none'
    /**
     * get list of all possible states
     */
    readonly allStates: Array<StateUnion<TTransitions> | 'none'> // 这里应该是所有state的组合 但是组合的数量根据state的数量会迅速夸大到无法理解的地步，对使用者没有帮助
    /**
     * get list of all possible transitions
     */
    readonly allTransitions: TransitionTupleDeduplicate<TTransitions>
    /**
     * get list of transitions that are allowed from the current state
     */
    readonly possibleTransitions: Array<TTransitions[number]['name']>
    /**
     * check the current state if it's the final state
     */
    readonly isFinalState: boolean
    /**
     * return true if input transition can occur from the current state
     */
    can: (transition: TTransitions[number]['name']) => boolean
    /**
     * return true if tinput ransition cannot occur from the current state
     */
    cannot: (transition: TTransitions[number]['name']) => boolean
    /** custom data property */
    data: Data
    /** add event listener */
    addEventListener: (
      type: ListenersLifeCycleEventType,
      callback: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void
    ) => void
    /** remove event listener */
    removeEventListener: (
      type: ListenersLifeCycleEventType,
      callback: (event: LifeCycleEventPayload<TTransitions>, ...args: unknown[]) => void
    ) => void
  }
}

export const StateMachine = StateMachineImpl as unknown as StateMachineConstructor
