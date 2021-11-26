import { StateMachineConstructor } from './state-machine'
import { ListenersLifeCycleEventType } from './life-cycle'

export function observer<T extends InstanceType<StateMachineConstructor>>(instance: T) {
  // 这个函数在外部被调用时的type是正确的，但是函数内部判断不出来T的类型。不用纠结，直接ignore即可，应该是TypeScript问题。
  // 只关注外部用户的使用即可。
  // @ts-ignore
  type CallbackType = Parameters<T['addEventListener']>[1]
  const listeners: Array<{ type: ListenersLifeCycleEventType; callback: CallbackType }> = []
  return {
    onBeforeTransition(callback: CallbackType) {
      // @ts-ignore
      instance.addEventListener('onBeforeTransition', callback)
      listeners.push({ type: 'onBeforeTransition', callback })
      return this
    },
    onLeaveState(callback: CallbackType) {
      // @ts-ignore
      instance.addEventListener('onLeaveState', callback)
      listeners.push({ type: 'onLeaveState', callback })
      return this
    },
    onTransition(callback: CallbackType) {
      // @ts-ignore
      instance.addEventListener('onTransition', callback)
      listeners.push({ type: 'onTransition', callback })
      return this
    },
    onEnterState(callback: CallbackType) {
      // @ts-ignore
      instance.addEventListener('onEnterState', callback)
      listeners.push({ type: 'onEnterState', callback })
      return this
    },
    onAfterTransition(callback: CallbackType) {
      // @ts-ignore
      instance.addEventListener('onAfterTransition', callback)
      listeners.push({ type: 'onAfterTransition', callback })
      return this
    },
    removeAllListeners() {
      listeners.forEach((listener) => {
        // @ts-ignore
        instance.removeEventListener(listener.type, listener.callback)
      })
      return this
    },
  }
}
