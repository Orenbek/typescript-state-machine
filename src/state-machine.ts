import { Transition, TransitionMethods, TransitionsFromTuple, StateUnion } from './transition'
import { GeneralLifeCycle, TransitionLifeCycel, StateLifeCycel, ExtraTransitionLifeCycel } from './life-cycle'
import { Exception } from './utils/exception'
import camelize from './utils/camelize'
import { isPromise, Flatten } from './types/index'
import { TRANSITION, onBefore_TRANSITION, onAfter_TRANSITION, onLeave_STATE, onEnter_STATE } from './mixin-functions'

interface StateMachineParams<TTransitions extends readonly Transition<string, string>[], Data extends Record<PropertyKey, unknown>> {
  readonly init?: StateUnion<TTransitions>;
  readonly transitions: readonly [...TTransitions];
  readonly data?: Data;
  readonly lifecycles?: Partial<GeneralLifeCycle<TTransitions> & TransitionLifeCycel<TTransitions> & StateLifeCycel<TTransitions> & ExtraTransitionLifeCycel<TTransitions>>
}

type TransitionTuple<T extends readonly Transition<string, string>[]> = {
  [K in keyof T]: T[K] extends Transition<string, string> ? T[K]["name"] : never
}

async function pipe<T extends (...params: any) => any>(inputs: [T, [...Parameters<T>]][], abortWhenResFalse: boolean = false) {
  let abort = false
  for (let i of inputs) {
    const res = await i[0](...i[1])
    if (abortWhenResFalse && !res) {
      abort = true
      break
    }
  }
  return abort
}

class StateMachineImpl<TTransitions extends readonly Transition<string, string>[], Data extends Record<PropertyKey, unknown>> {
  state: StateUnion<TTransitions> | "none" = 'none';
  data: StateMachineParams<TTransitions, Data>["data"]
  private pending: boolean = false
  private states: Array<Flatten<TransitionsFromTuple<TTransitions>>[number] | TTransitions[number]["to"] | 'none'> = ['none'] // states不构成tuple
  // represent all the transition names
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
    // De-duplication
    this._transition_names = Array.from(new Set(this._transitions.map(transit => transit.name))) as unknown as TransitionTuple<TTransitions>
    this.states =
      Array.from(new Set(that._transitions.reduce((a, b) => {
        if (Array.isArray(b.from)) {
          return [...a, ...b.from, b.to]
        } else {
          return [...a, b.from, b.to]
        }
      }, ['none']))) as unknown as Array<Flatten<TransitionsFromTuple<TTransitions>>[number] | TTransitions[number]["to"] | 'none'>
    this.data = params.data
    this._life_cycles = params.lifecycles
    this._transition_names.forEach(tranName => {
      TRANSITION.bind(that)(that, tranName)
      onBefore_TRANSITION.bind(that)(that, tranName)
      onAfter_TRANSITION.bind(that)(that, tranName)
    })
    this.states.forEach(state => {
      onLeave_STATE.bind(that)(that, state)
      onEnter_STATE.bind(that)(that, state)
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
    return this._transitions
      .filter(transit => transit.from === that.state || (Array.isArray(transit.from) && transit.from.includes(that.state as string)))
      .map(transit => transit.name)
  }

  // is<T extends TTransitions[number]["name"]>(transition: T): this is this & { state: T } {
  //   return this.state === transition
  // }
  // function is been removed, cause this function cannot narrow down the type of this.state

  can(transition: TTransitions[number]["name"]) {
    return !this.pending && Boolean(this.transitions.find(name => name === transition))
  }

  cannot(transition: TTransitions[number]["name"]) {
    return !this.can(transition)
  }

  private onInvalidTransition(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"], ...args: unknown[]) {
    if (this._life_cycles?.onInvalidTransition) {
      this._life_cycles.onInvalidTransition?.({
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      }, ...args)
    } else {
      throw new Exception('invalid transition!', transition, from, to, this.state as string)
    }
  }

  private onPendingTransition(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"], ...args: unknown[]) {
    if (this._life_cycles?.onPendingTransition) {
      this._life_cycles.onPendingTransition?.({
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      }, ...args)
    } else {
      throw new Exception('transition on pending!', transition, from, to, this.state as string)
    }
  }

  // fired before any transition
  private async onBeforeTransition(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"], ...args: unknown[]) {
    if (this.cannot(transition)) {
      this.onInvalidTransition(transition, from, to, ...args)
      return
    }
    if (this.pending) {
      this.onPendingTransition(transition, from, to, ...args)
      return
    }
    this.pending = true

    // trigger event add up later

    if (!this._life_cycles?.onBeforeTransition) {
      return true
    }
    let res = this._life_cycles.onBeforeTransition?.({
      event: camelize.prepended('on', transition),
      from,
      to,
      transition,
    }, ...args)
    // is return false or rejected, then should abort transition
    if (isPromise(res)) {
      res = await res
    }
    return res !== false;
  }

  // fired when leaving any state
  private async onLeaveState(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"], ...args: unknown[]) {
    // trigger event add up later

    if (!this._life_cycles?.onLeaveState) {
      return true
    }
    let res = this._life_cycles?.onLeaveState?.({
      event: camelize.prepended('on', transition),
      from,
      to,
      transition,
    }, ...args)
    // is return false or rejected, then should abort transition
    if (isPromise(res)) {
      res = await res
    }
    return res !== false;
  }

  // fired during any transition
  private async onTransition(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"], ...args: unknown[]) {
    // trigger event add up later

    if (!this._life_cycles?.onTransition) {
      return true
    }
    let res = this._life_cycles?.onTransition?.({
      event: camelize.prepended('on', transition),
      from,
      to,
      transition,
    }, ...args)
    // is return false or rejected, then should abort transition
    if (isPromise(res)) {
      res = await res
    }
    return res !== false;
  }

  // fired when entering any state
  private async onEnterState(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"], ...args: unknown[]) {
    // trigger event add up later

    await this._life_cycles?.onEnterState?.({
      event: camelize.prepended('on', transition),
      from,
      to,
      transition,
    }, ...args)
  }

  // fired after any transition
  private async onAfterTransition(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"], ...args: unknown[]) {
    // trigger event add up later

    await this._life_cycles?.onAfterTransition?.({
      event: camelize.prepended('on', transition),
      from,
      to,
      transition,
    }, ...args)
  }

  private async fireTransition(transition: TTransitions[number]["name"], from: TTransitions[number]["from"], to: TTransitions[number]["to"], ...args: unknown[]) {
    const that = this;
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
    // @ts-ignore
    const aborted = await pipe([
      // @ts-ignore
      [that.onBeforeTransition.bind(that), [transition, from, to, ...args]],
      // @ts-ignore
      [that[camelize.prepended('onBefore', transition)].bind(that), [transition, from, to, ...args]],
      [that.onLeaveState.bind(that), [transition, from, to, ...args]],
      // @ts-ignore
      [that[camelize.prepended('onLeave', this.state)].bind(that), [transition, from, to, ...args]],
      // because from can be a string array, so use this.state instead of from
      [that.onTransition.bind(that), [transition, from, to, ...args]],
    ], true)
    if (aborted) {
      that.pending = false
      return
    }
    // update state
    this.state = to
    await pipe([
      // @ts-ignore
      [that.onEnterState.bind(that), [transition, from, to, ...args]],
      // @ts-ignore
      [that[camelize.prepended('onEnter', to)].bind(that), [transition, from, to, ...args]],
      // @ts-ignore
      [that[camelize.prepended('on', to)].bind(that), [transition, from, to, ...args]],
      [that.onAfterTransition.bind(that), [transition, from, to, ...args]],
      // @ts-ignore
      [that[camelize.prepended('onAfter', transition)].bind(that), [transition, from, to, ...args]],
      // @ts-ignore
      [that[camelize.prepended('on', transition)].bind(that), [transition, from, to, ...args]],
    ])
    that.pending = false
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
      state: StateUnion<TTransitions> | "none"
      /**
       * get list of all possible states
       */
      readonly allStates: Array<Flatten<TransitionsFromTuple<TTransitions>>[number] | TTransitions[number]["to"] | 'none'>  // 这里应该是所有state的组合 但是组合的数量根据state的数量会迅速夸大到无法理解的地步，对使用者没有帮助
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
  init: 'A',
  transitions: [
    { name: 'step', from: 'A', to: 'B' },
    { name: 'step', from: 'B', to: 'C' },
    { name: 'step', from: 'C', to: 'D' }
  ] as const,
  data: {
    color: 'ssss',
    colors: [{ name: 'joe' }, { age: 'xx' }, 32] as const
  },
  lifecycles: {
    onStep: (...args) => {
      // 这里的e为any 但到了typescript4.4就不会有这个问题了
      console.log(args, 'onStep', instance.state)
    },
    onA: (...args) => {
      console.log(args, 'onA')
    }
  }
})

instance.state // "none" | "melt" | "freeze"
instance.allStates
instance.step()
setTimeout(() => {
  instance.step()
}, 100);