import { Transition, TransitionMethods } from './transition'
import { GeneralLifeCycle, TransitionLifeCycel, StateLifeCycel } from './life-cycle'

interface StateMachineParams<TTransitions extends readonly Transition<string, string>[], Data extends Record<PropertyKey, unknown>> {
  readonly init?: string;
  readonly transitions: readonly [...TTransitions];
  readonly data?: Data;
  readonly methods?: Partial<TransitionLifeCycel<TTransitions[number]["name"], TTransitions>> &
  Partial<StateLifeCycel<TTransitions[number]["from"] | TTransitions[number]["to"], TTransitions>> & Partial<GeneralLifeCycle<TTransitions>>
}

class StateMachineImpl<TTransitions extends readonly Transition<string, string>[], Data extends Record<PropertyKey, unknown>> {
  state: string = 'none';
  constructor(params: StateMachineParams<TTransitions, Data>) { }
  // 这里的class的type是假的 这个class的实现对内可以认为没有type 对外有type
}


export interface StateMachineConstructor {
  new <TTransitions extends readonly Transition<string, string>[], Data extends Record<PropertyKey, unknown>>
    (params: StateMachineParams<TTransitions, Data>):
    TransitionMethods<TTransitions> &
    Data &
    {
      state: TTransitions[number]["from"] | TTransitions[number]["to"] | "none"
    }
}

const StateMachine = StateMachineImpl as StateMachineConstructor

const instance = new StateMachine({
  transitions: [{ name: "hover", from: "melt", to: "freeze" }, { name: "off", from: "freeze", to: "melt" }] as const,
  data: {
    color: 'ssss',
    colors: [{ name: 'joe' }, { age: 'xx' }, 32] as const
  },
  methods: {
    onTransition: (e, a, b) => {
      return false
    },
    onbeforeHover: (e) => {
      return false;
    },
    onMelt: (e) => {

    }
  }
})

instance.hover
instance.off
instance.state
