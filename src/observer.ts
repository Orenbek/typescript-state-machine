import { StateMachineConstructor } from './state-machine'
import { ListenersLifeCycleEventType } from './life-cycle'

export function observer<T extends InstanceType<StateMachineConstructor>>(instance: T) {
  const listeners: Array<{ type: ListenersLifeCycleEventType; callback: (...args: any[]) => any }> = []
  return {
    onBeforeTransition(callback: Parameters<T['addEventListener']>[1]) {
      instance.addEventListener('onBeforeTransition', callback)
      listeners.push({ type: 'onBeforeTransition', callback })
      return this
    },
    onLeaveState(callback: Parameters<T['addEventListener']>[1]) {
      instance.addEventListener('onLeaveState', callback)
      listeners.push({ type: 'onLeaveState', callback })
      return this
    },
    onTransition(callback: Parameters<T['addEventListener']>[1]) {
      instance.addEventListener('onTransition', callback)
      listeners.push({ type: 'onTransition', callback })
      return this
    },
    onEnterState(callback: Parameters<T['addEventListener']>[1]) {
      instance.addEventListener('onEnterState', callback)
      listeners.push({ type: 'onEnterState', callback })
      return this
    },
    onAfterTransition(callback: Parameters<T['addEventListener']>[1]) {
      instance.addEventListener('onAfterTransition', callback)
      listeners.push({ type: 'onAfterTransition', callback })
      return this
    },
    removeAllListeners() {
      listeners.forEach((listener) => {
        instance.removeEventListener(listener.type, listener.callback)
      })
      return this
    },
  }
}
