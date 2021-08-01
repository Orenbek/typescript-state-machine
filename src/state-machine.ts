import { Transition, TransitionMethods } from './transition'
import { GeneralLifeCycle, TransitionLifeCycel, StateLifeCycel, ExtraTransitionLifeCycel } from './life-cycle'

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
  data: Record<PropertyKey, unknown> | undefined
  private pending: boolean = false
  private states: Array<TTransitions[number]["from"] | TTransitions[number]["to"] | 'none'> = ['none'] // states不构成tuple
  private readonly _transition_names: TransitionTuple<TTransitions> = [] as unknown as TransitionTuple<TTransitions>
  private readonly _transitions: readonly [...TTransitions] = [] as unknown as TTransitions
  // 这里必须得 readonly [...TTransitions] 这么写 不能直接写 TTransitions。原因后续了解一下

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

  // is(transition: TTransitions[number]["name"]) {
  //   return this.state === transition
  // }
  // function is been removed, cause this function cannot narrow down the type of this.state

  can(transition: TTransitions[number]["name"]) {
    return !this.pending && !!this.seek(transition)
  }

  cannot(transition: TTransitions[number]["name"]) {
    return !this.can(transition)
  }

  private seek(transition: TTransitions[number]["name"]): boolean {
    return false
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

