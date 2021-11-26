import { StateUnion, StateToUnion, Transition, TransitionUnion } from './transition'

type HistoryItem = {
  from: string
  to: string
  transition: string
}
export class StateMachineHistory {
  max?: number

  history: Array<HistoryItem> = []

  constructor(param?: { max: number }) {
    if (param) {
      this.max = param.max
    }
  }

  get canHistoryBack() {
    return this.history.length >= 2
  }

  clearHistory() {
    this.history = []
  }

  addHistory(historyItem: HistoryItem) {
    this.history.push(historyItem)
    if (this.max && this.history.length > this.max) {
      this.history.shift()
    }
  }
}

export type HistoryPluginInstance = InstanceType<typeof StateMachineHistory>

export type PluginExtendsMethods<
  TTransitions extends readonly Transition[],
  Plugins extends [HistoryPluginInstance] | []
> = HistoryPluginInstance extends Plugins[number]
  ? {
      readonly history: Array<{
        transition: TransitionUnion<TTransitions>
        from: StateUnion<TTransitions>
        to: StateToUnion<TTransitions>
      }>
      readonly canHistoryBack: boolean
      clearHistory: () => void
      historyBack: () => StateToUnion<TTransitions> | Promise<StateToUnion<TTransitions>>
    }
  : Record<string, never>
