import camelize from './utils/camelize'
import { Exception } from './utils/exception'
import { isPromise } from './utils/types'

// We don’t need to care about the return value of all life-cycles method after the Transition life-cycles
export class StateLifecycleMixin {
  static Transition(instance, tranName) {
    if (instance.hasOwnProperty(tranName)) {
      throw new Error('transition name duplicated!')
    }

    Object.defineProperty(instance, tranName, {
      async value(...args) {
        const transition = this.transitions.find((tran) => tran.name === tranName)
        this.fireTransition(tranName, instance.state, transition.to, ...args)
      },
    })
  }

  static OnBeforeTransition(instance, tranName) {
    const funcName = camelize.prepended('onBefore', tranName)
    if (instance.hasOwnProperty(funcName)) {
      throw new Error('transition name duplicated!')
    }

    Object.defineProperty(instance, funcName, {
      async value(transition, from, to, ...args) {
        // trigger event add up later

        if (!this.life_cycles?.[funcName]) {
          return true
        }
        let res = this.life_cycles[funcName]?.(
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
      },
    })
  }

  static OnAfterTransition(instance, tranName) {
    const funcName1 = camelize.prepended('onAfter', tranName)
    const funcName2 = camelize.prepended('on', tranName)
    if (instance.hasOwnProperty(funcName1) || instance.hasOwnProperty(funcName2)) {
      throw new Error('transition name duplicated!')
    }

    Object.defineProperty(instance, funcName1, {
      async value(transition, from, to, ...args) {
        // trigger event add up later

        await this.life_cycles?.[funcName1]?.(
          {
            event: camelize.prepended('on', transition),
            from,
            to,
            transition,
          },
          ...args
        )
      },
    })
    Object.defineProperty(instance, funcName2, {
      async value(transition, from, to, ...args) {
        // trigger event add up later

        await this.life_cycles?.[funcName2]?.(
          {
            event: camelize.prepended('on', transition),
            from,
            to,
            transition,
          },
          ...args
        )
      },
    })
  }

  static OnLeaveState(instance, stateName) {
    const funcName = camelize.prepended('onLeave', stateName)
    if (instance.hasOwnProperty(funcName)) {
      throw new Error('state name duplicated!')
    }

    Object.defineProperty(instance, funcName, {
      async value(transition, from, to, ...args) {
        // trigger event add up later

        if (!this.life_cycles?.[funcName]) {
          return true
        }
        let res = this.life_cycles[funcName]?.(
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
      },
    })
  }

  static OnEnterState(instance, stateName) {
    const funcName1 = camelize.prepended('onEnter', stateName)
    const funcName2 = camelize.prepended('on', stateName)
    if (instance.hasOwnProperty(funcName1) || instance.hasOwnProperty(funcName2)) {
      throw new Error('state name duplicated!')
    }

    Object.defineProperty(instance, funcName1, {
      async value(transition, from, to, ...args) {
        // trigger event add up later

        await this.life_cycles?.[funcName1]?.(
          {
            event: camelize.prepended('on', transition),
            from,
            to,
            transition,
          },
          ...args
        )
      },
    })

    Object.defineProperty(instance, funcName2, {
      async value(transition, from, to, ...args) {
        // trigger event add up later

        await this.life_cycles?.[funcName2]?.(
          {
            event: camelize.prepended('on', transition),
            from,
            to,
            transition,
          },
          ...args
        )
      },
    })
  }
}
