import { Transition, TransitionMethods } from './transition'
import { GeneralLifeCycle, TransitionLifeCycel, StateLifeCycel, ExtraTransitionLifeCycel } from './life-cycle'
import { Exception } from './utils/exception'
import camelize from './utils/camelize'
import { isPromise } from './utils/type-grard'
import { TRANSITION, onBefore_TRANSITION, onAfter_TRANSITION, onLeave_STATE, onEnter_STATE } from './mixin-functions'

interface StateMachineParams<TTransitions extends readonly Transition<string, string>[], Data extends Record<PropertyKey, unknown>> {
  readonly init?: string;
  readonly transitions: readonly [...TTransitions];
  readonly data?: Data;
  readonly lifecycles?: Partial<GeneralLifeCycle<TTransitions> & TransitionLifeCycel<TTransitions> & StateLifeCycel<TTransitions> & ExtraTransitionLifeCycel<TTransitions>>
}

type TransitionTuple<T extends readonly Transition<string, string>[]> = {
  [K in keyof T]: T[K] extends Transition<string, string> ? T[K]["name"] : never
}

class StateMachineImpl<TTransitions extends readonly Transition<string, string>[], Data extends Record<PropertyKey, unknown>> {
  state: TTransitions[number]["from"] | TTransitions[number]["to"] | 'none' = 'none';
  data: StateMachineParams<TTransitions, Data>["data"]
  private pending: boolean = false
  private states: Array<TTransitions[number]["from"] | TTransitions[number]["to"] | 'none'> = ['none'] // states不构成tuple
  private readonly _transition_names: TransitionTuple<TTransitions> = [] as unknown as TransitionTuple<TTransitions>
  private readonly _transitions: StateMachineParams<TTransitions, Data>["transitions"] = [] as unknown as TTransitions
  // 这里必须得 readonly [...TTransitions] 这么写 不能直接写 TTransitions。原因后续了解一下
  private readonly _life_cycles: StateMachineParams<TTransitions, Data>["lifecycles"]

  // 这里的class的type是假的 这个class的实现对内可以认为没有type 对外有type
  constructor(params: StateMachineParams<TTransitions, Data>) {
    const that = this
    if (params.init) {
      this.state = params.init
    }
    this._transitions = [...params.transitions]
    this._transition_names = this._transitions.map(transit => transit.name) as unknown as TransitionTuple<TTransitions>
    this.states =
      Array.from(new Set(that._transitions.reduce((a, b) => ([...a, b.from, b.to]), ['none']))) as unknown as Array<TTransitions[number]["from"] | TTransitions[number]["to"] | 'none'>
    this.data = params.data
    this._life_cycles = params.lifecycles
    this._transition_names.forEach(tranName => {
      TRANSITION.bind(that)(StateMachineImpl, tranName)
      onBefore_TRANSITION.bind(that)(StateMachineImpl, tranName)
      onAfter_TRANSITION.bind(that)(StateMachineImpl, tranName)
    })
    this.states.forEach(state => {
      onLeave_STATE.bind(that)(StateMachineImpl, state)
      onEnter_STATE.bind(that)(StateMachineImpl, state)
    })
  }

  get allStates() {
    return this.states
  }

  get allTransitions() {
    return this._transition_names
  }

  get transitions() {
    const that = this
    return this._transitions.filter(transit => transit.from === that.state).map(transit => transit.name)
  }

  // is<T extends TTransitions[number]["name"]>(transition: T): this is this & { state: T } {
  //   return this.state === transition
  // }
  // function is been removed, cause this function cannot narrow down the type of this.state

  can(transition: TTransitions[number]["name"]) {
    return !this.pending && this.transitions.find(name => name === transition)
  }

  cannot(transition: TTransitions[number]["name"]) {
    return !this.can(transition)
  }

  // fired before any transition
  private async onBeforeTransition(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"]) {
    if (this.cannot(transition)) {
      throw new Exception('invalid transition!', transition, from, to, this.state)
    }

    // trigger event add up later

    const res = this._life_cycles?.onBeforeTransition?.({
      event: camelize.prepended('on', transition),
      from,
      to,
      transition,
    })
    if (!res) {
      return
    }
    if (isPromise(res)) {
      await res
    }
  }

  // fired when leaving any state
  private async onLeaveState(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"]) {
    // trigger event add up later

    const res = this._life_cycles?.onLeaveState?.({
      event: camelize.prepended('on', transition),
      from,
      to,
      transition,
    })
    if (!res) {
      return
    }
    if (isPromise(res)) {
      await res
    }
  }

  // fired during any transition
  private async onTransition(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"]) {
    // trigger event add up later

    const res = this._life_cycles?.onTransition?.({
      event: camelize.prepended('on', transition),
      from,
      to,
      transition,
    })
    if (!res) {
      return
    }
    if (isPromise(res)) {
      await res
    }
  }

  // fired when entering any state
  private onEnterState(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"]) {
    // trigger event add up later

    this._life_cycles?.onEnterState?.({
      event: camelize.prepended('on', transition),
      from,
      to,
      transition,
    })
  }

  // fired after any transition
  private onAfterTransition(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"]) {
    // trigger event add up later

    this._life_cycles?.onAfterTransition?.({
      event: camelize.prepended('on', transition),
      from,
      to,
      transition,
    })
  }

  private doTransition(transition: TTransitions[number]["name"]) {
    // this._life_cycles
  }
}


export interface StateMachineConstructor {
  new <TTransitions extends readonly Transition<string, string>[], Data extends Record<PropertyKey, unknown>>
    (params: StateMachineParams<TTransitions, Data>):
    TransitionMethods<TTransitions> &
    Data &
    {
      /**
       * current state property
       */
      state: TTransitions[number]["from"] | TTransitions[number]["to"] | "none"
      /**
       * get list of all possible states
       */
      readonly allStates: Array<TTransitions[number]["from"] | TTransitions[number]["to"]>  // 这里应该是所有state的组合 但是组合的数量根据state的数量会迅速夸大到无法理解的地步，对使用者没有帮助
      /**
       * get list of all possible transitions
       */
      readonly allTransitions: TransitionTuple<TTransitions>
      /**
       * get list of transitions that are allowed from the current state
       */
      readonly transitions: Array<TTransitions[number]["name"]>
      /**
       * return true if input transition can occur from the current state
       */
      can: (transition: TTransitions[number]["name"]) => boolean
      /**
       * return true if tinput ransition cannot occur from the current state
       */
      cannot: (transition: TTransitions[number]["name"]) => boolean
    }
}

const StateMachine = StateMachineImpl as StateMachineConstructor

const instance = new StateMachine({
  transitions: [{ name: "hover", from: "melt", to: "freeze" }, { name: "off", from: "freeze", to: "melt" }] as const,
  data: {
    color: 'ssss',
    colors: [{ name: 'joe' }, { age: 'xx' }, 32] as const
  },
  lifecycles: {
    onTransition: (e, a, b) => {
      return false
    },
    onbeforeHover: (e) => {
      // 这里的e为any 但到了typescript4.4就不会有这个问题了
      return false;
    },
    onMelt: (e) => {

    }
  }
})

instance.state // "none" | "melt" | "freeze"
