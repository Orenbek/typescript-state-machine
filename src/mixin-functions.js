import camelize from './utils/camelize';
import { Exception } from './utils/exception';
import { isPromise } from './utils/type-grard';

export function TRANSITION(instance, tranName) {
  if (instance.hasOwnProperty(tranName)) {
    throw new Error('transition name duplicated!');
  }

  Object.defineProperty(instance, tranName, {
    value: async function (...args) {
      const transition = this._transitions.find(tran => tran.name === tranName);
      this.fireTransition(tranName, transition.from, transition.to, ...args);
    },
  });
}

export function onBefore_TRANSITION(instance, tranName) {
  const funcName = camelize.prepended('onBefore', tranName);
  if (instance.hasOwnProperty(funcName)) {
    throw new Error('transition name duplicated!');
  }

  Object.defineProperty(instance, funcName, {
    value: async function (transition, from, to, ...args) {
      // trigger event add up later

      if (!this._life_cycles?.[funcName]) {
        return true;
      }
      const res = this._life_cycles[funcName]?.(
        {
          event: camelize.prepended('on', transition),
          from,
          to,
          transition,
        },
        ...args
      );
      // is return false or rejected, then should abort transition
      if (isPromise(res)) {
        await res;
      }
      return res === false ? false : true;
    },
  });
}

export function onAfter_TRANSITION(instance, tranName) {
  const funcName1 = camelize.prepended('onAfter', tranName);
  const funcName2 = camelize.prepended('on', tranName);
  if (instance.hasOwnProperty(funcName1) || instance.hasOwnProperty(funcName2)) {
    throw new Error('transition name duplicated!');
  }

  Object.defineProperty(instance, funcName1, {
    value: async function (transition, from, to, ...args) {
      // trigger event add up later

      this._life_cycles?.[funcName1]?.(
        {
          event: camelize.prepended('on', transition),
          from,
          to,
          transition,
        },
        ...args
      );
    },
  });
  Object.defineProperty(instance, funcName2, {
    value: async function (transition, from, to, ...args) {
      // trigger event add up later

      this._life_cycles?.[funcName2]?.(
        {
          event: camelize.prepended('on', transition),
          from,
          to,
          transition,
        },
        ...args
      );
    },
  });
}

export function onLeave_STATE(instance, stateName) {
  const funcName = camelize.prepended('onLeave', stateName);
  if (instance.hasOwnProperty(funcName)) {
    throw new Error('state name duplicated!');
  }

  Object.defineProperty(instance, funcName, {
    value: async function (transition, from, to, ...args) {
      // trigger event add up later

      if (!this._life_cycles?.[funcName]) {
        return true;
      }
      const res = this._life_cycles?.[funcName]?.(
        {
          event: camelize.prepended('on', transition),
          from,
          to,
          transition,
        },
        ...args
      );
      // is return false or rejected, then should abort transition
      if (isPromise(res)) {
        await res;
      }
      return res === false ? false : true;
    },
  });
}

export function onEnter_STATE(instance, stateName) {
  const funcName1 = camelize.prepended('onEnter', stateName);
  const funcName2 = camelize.prepended('on', stateName);
  if (instance.hasOwnProperty(funcName1) || instance.hasOwnProperty(funcName2)) {
    throw new Error('state name duplicated!');
  }

  Object.defineProperty(instance, funcName1, {
    value: async function (transition, from, to, ...args) {
      // trigger event add up later

      this._life_cycles?.[funcName1]?.(
        {
          event: camelize.prepended('on', transition),
          from,
          to,
          transition,
        },
        ...args
      );
    },
  });

  Object.defineProperty(instance, funcName2, {
    value: async function (transition, from, to, ...args) {
      // trigger event add up later

      this._life_cycles?.[funcName2]?.(
        {
          event: camelize.prepended('on', transition),
          from,
          to,
          transition,
        },
        ...args
      );
    },
  });
}
