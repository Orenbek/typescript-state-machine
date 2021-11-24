import type { Transition, TransitionMethods, StateUnion, TransitionTupleDeduplicate, TransitionUnion, StateFromUnion } from './transition'
import type {
  GeneralLifeCycle,
  TransitionLifeCycel,
  StateLifeCycel,
  ExtraTransitionLifeCycel,
  LifeCycleMethodPayload,
  LifeCycleEventPayload,
  ListenersLifeCycleEventType,
  InitTransitionLifeCycle,
} from './life-cycle'
import { Exception } from './utils/exception'
import camelize from './utils/camelize'
import { pipe } from './utils/pipe'
import { StateLifecycleMixin } from './mixin-functions'

export interface StateMachineImplInterface<TTransitions extends readonly Transition[], Data> {
  /**
   * current state property
   */
  state: StateUnion<TTransitions> | 'none'
  /**
   * get the list of all possible states
   */
  readonly allStates: Array<StateUnion<TTransitions> | 'none'> // 这里应该是所有state的组合 但是组合的数量根据state的数量会迅速夸大到无法理解的地步，对使用者没有帮助
  /**
   * get the list of all transitions
   */
  readonly allTransitions: TransitionTupleDeduplicate<TTransitions>
  /**
   * get the list of transitions that are allowed from the current state
   */
  readonly possibleTransitions: Array<TransitionUnion<TTransitions>>
  /**
   * check the current state if it's the final state
   */
  readonly isFinalState: boolean
  /**
   * return true if input transition can occur from the current state
   */
  can: (transition: TransitionUnion<TTransitions>) => boolean
  /**
   * return true if tinput ransition cannot occur from the current state
   */
  cannot: (transition: TransitionUnion<TTransitions>) => boolean
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

interface StateMachineParams<TTransitions extends readonly Transition[], Data, InitState extends StateFromUnion<TTransitions> = ''> {
  readonly init: InitState
  readonly transitions: readonly [...TTransitions]
  readonly data?: Data
  readonly lifecycles?: Partial<
    GeneralLifeCycle<TTransitions> &
      TransitionLifeCycel<TTransitions> &
      StateLifeCycel<TTransitions> &
      ExtraTransitionLifeCycel<TTransitions> &
      InitTransitionLifeCycle<InitState>
  >
}

class StateMachineImpl<TTransitions extends readonly Transition[], Data> implements StateMachineImplInterface<TTransitions, Data> {
  state: StateUnion<TTransitions> | 'none' = 'none'

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  data!: StateMachineParams<TTransitions, Data>['data']

  private pending = false

  private states: Array<StateUnion<TTransitions> | 'none'> = ['none'] // states不构成tuple

  // represent all the transition names
  private readonly transition_names: TransitionTupleDeduplicate<TTransitions> = [] as TransitionTupleDeduplicate<TTransitions>

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
    this.transitions = [...params.transitions]
    // De-duplication
    this.transition_names = Array.from(new Set(this.transitions.map((transit) => transit.name))) as TransitionTupleDeduplicate<TTransitions>
    this.states = Array.from(
      new Set(
        this.transitions.reduce((a, b) => {
          if (Array.isArray(b.from)) {
            return [...a, ...b.from, b.to]
          }
          return [...a, b.from, b.to]
        }, [] as TTransitions[])
      )
    ) as Array<StateUnion<TTransitions> | 'none'>
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
    // register init transition function
    StateLifecycleMixin.OnAfterTransition.bind(this)(this, 'init')

    if (
      this.transitions.every((transition) => {
        if (Array.isArray(transition.from)) {
          return !transition.from.includes(params.init)
        }
        return transition.from !== params.init
      })
    ) {
      this.onInvalidTransition('init', 'none', params.init)
    }
    // sync task
    this.init(params.init)
  }

  get allStates() {
    return this.states
  }

  get allTransitions() {
    return this.transition_names
  }

  get possibleTransitions() {
    return this.transitions
      .filter((transit) => transit.from === this.state || (Array.isArray(transit.from) && transit.from.includes(this.state)))
      .map((transit) => transit.name)
  }

  get isFinalState() {
    return this.possibleTransitions.length === 0
  }

  // is<T extends TTransitions[number]["name"]>(transition: T): this is this & { state: T } {
  //   return this.state === transition
  // }
  // function is been removed, cause this function cannot narrow down the type of this.state

  can(transition: TransitionUnion<TTransitions>) {
    return Boolean(this.possibleTransitions.find((name) => name === transition))
  }

  cannot(transition: TransitionUnion<TTransitions>) {
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
      throw new Exception('invalid transition!', transition, from as string, to as string, this.state as string)
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
      throw new Exception('transition on pending!', transition, from as string, to as string, this.state as string)
    }
  }

  // fired before any transition
  private onBeforeTransition(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads

    this.pending = true

    if (!this.life_cycles?.onBeforeTransition) {
      return true
    }
    return this.life_cycles.onBeforeTransition?.(
      {
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      },
      ...args
    )
  }

  // fired when leaving any state
  private onLeaveState(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads

    if (!this.life_cycles?.onLeaveState) {
      return true
    }
    return this.life_cycles.onLeaveState?.(
      {
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      },
      ...args
    )
  }

  // fired during any transition
  private onTransition(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads

    if (!this.life_cycles?.onTransition) {
      return true
    }
    return this.life_cycles.onTransition?.(
      {
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      },
      ...args
    )
  }

  // fired when entering any state
  private onEnterState(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads

    return this.life_cycles?.onEnterState?.(
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
  private onAfterTransition(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads

    return this.life_cycles?.onAfterTransition?.(
      {
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      },
      ...args
    )
  }

  private fireTransition(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads
    if (this.pending) {
      this.onPendingTransition(transition, from, to, ...args)
      return false
    }
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
    const beforeTransitionRes = this.beforeTransitionTasks(transition, from, to, ...args)
    if (beforeTransitionRes === false) {
      this.pending = false
      return false
    }
    if (beforeTransitionRes instanceof Promise) {
      return beforeTransitionRes.then((res) => {
        this.afterTransitionTasks(transition, from, to, ...args)
        return to
      })
    }
    this.afterTransitionTasks(transition, from, to, ...args)
    return to
  }

  // poorly designed. dont know how to write a better version.
  private beforeTransitionTasks(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads
    return pipe(
      [
        [this.onBeforeTransition.bind(this), [transition, from, to, ...args]],
        [this.fireListenerCallback.bind(this), ['onBeforeTransition', [transition, from, to, ...args]]],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [this[camelize.prepended('onBefore', transition)].bind(this), [transition, from, to, ...args]],
        [this.onLeaveState.bind(this), [transition, from, to, ...args]],
        [this.fireListenerCallback.bind(this), ['onLeaveState', [transition, from, to, ...args]]],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        [this[camelize.prepended('onLeave', this.state)].bind(this), [transition, from, to, ...args]],
        // because from can be a array of string, so use this.state instead of from
        [this.onTransition.bind(this), [transition, from, to, ...args]],
        [this.fireListenerCallback.bind(this), ['onTransition', [transition, from, to, ...args]]],
      ],
      (taskResult, taskName) => taskResult !== false
    )
  }

  private afterTransitionTasks(...payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads
    // update state
    this.state = to
    // it this function, we don't care if these tasks are async or sync.
    // because we dont need to wait these task's to resolve.
    // and for the same reason, we can't use pipe funcion.
    this.onEnterState(transition, from, to, ...args)
    this.fireListenerCallback('onEnterState', [transition, from, to, ...args])
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this[camelize.prepended('onEnter', to)](transition, from, to, ...args)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this[camelize.prepended('on', to)](transition, from, to, ...args)
    this.onAfterTransition(transition, from, to, ...args)
    this.fireListenerCallback('onAfterTransition', [transition, from, to, ...args])
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this[camelize.prepended('onAfter', transition)](transition, from, to, ...args)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this[camelize.prepended('on', transition)](transition, from, to, ...args)
    this.pending = false
  }

  private fireListenerCallback(type: ListenersLifeCycleEventType, payloads: LifeCycleMethodPayload<TTransitions>) {
    const [transition, from, to, ...args] = payloads
    this.listeners[type].forEach(function (callback) {
      callback(
        {
          event: camelize.prepended('on', transition),
          from,
          to,
          transition,
        },
        ...args
      )
    })
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

  private init(initState: StateUnion<TTransitions>) {
    this.pending = true
    const initialState = this.state // should be 'none'
    this.state = initState
    const params = ['init', initialState, initState] as const
    this.onEnterState(...params)
    this.fireListenerCallback('onEnterState', [...params])
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this[camelize.prepended('onEnter', initState)](...params)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this[camelize.prepended('on', initState)](...params)
    this.onAfterTransition(...params)
    this.fireListenerCallback('onAfterTransition', [...params])
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.onAfterInit(...params)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.onInit(...params)
    this.pending = false
  }
}

export interface StateMachineConstructor {
  new <
    TTransitions extends readonly Transition[],
    Data extends Record<PropertyKey, unknown>,
    InitState extends StateFromUnion<TTransitions>
  >(
    params: StateMachineParams<TTransitions, Data, InitState>
  ): TransitionMethods<TTransitions> & StateMachineImpl<TTransitions, Data>
}

export const StateMachine = StateMachineImpl as StateMachineConstructor
