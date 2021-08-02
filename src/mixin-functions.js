import camelize from './utils/camelize';
import { Exception } from './utils/exception';
import { isPromise } from './utils/type-grard';

export function TRANSITION(constructor, tranName) {
  if (constructor.hasOwnProperty(tranName)) {
    throw new Error('transition name duplicated!');
  }

  Object.defineProperty(constructor.prototype, tranName, {
    value: async function (...args) {
      const transition = this._transitions.find(tran => tran.name === tranName);
      this.fireTransition(tranName, transition.from, transition.to, args);
    },
  });
}

export function onBefore_TRANSITION(constructor, tranName) {
  const funcName = camelize.prepended('onBefore', tranName);
  if (constructor.hasOwnProperty(funcName)) {
    throw new Error('transition name duplicated!');
  }

  Object.defineProperty(constructor.prototype, funcName, {
    value: async function (transition, from, to) {
      if (this.cannot(transition)) {
        throw new Exception('invalid transition!', transition, from, to, this.state);
      }
      // trigger event add up later

      const res = this._life_cycles?.[funcName]?.({
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      });
      if (!res) {
        return;
      }
      if (isPromise(res)) {
        await res;
      }
    },
  });
}

export function onAfter_TRANSITION(constructor, tranName) {
  const funcName1 = camelize.prepended('onAfter', tranName);
  const funcName2 = camelize.prepended('on', tranName);
  if (constructor.hasOwnProperty(funcName1) || constructor.hasOwnProperty(funcName2)) {
    throw new Error('transition name duplicated!');
  }

  Object.defineProperty(constructor.prototype, funcName1, {
    value: async function (transition, from, to) {
      // trigger event add up later

      this._life_cycles?.[funcName1]?.({
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      });
    },
  });
  Object.defineProperty(constructor.prototype, funcName2, {
    value: async function (transition, from, to) {
      // trigger event add up later

      this._life_cycles?.[funcName2]?.({
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      });
    },
  });
}

export function onLeave_STATE(constructor, stateName) {
  const funcName = camelize.prepended('onLeave', stateName);
  if (constructor.hasOwnProperty(funcName)) {
    throw new Error('state name duplicated!');
  }

  Object.defineProperty(constructor.prototype, funcName, {
    value: async function (transition, from, to) {
      // trigger event add up later

      const res = this._life_cycles?.[funcName]?.({
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      });
      if (!res) {
        return;
      }
      if (isPromise(res)) {
        await res;
      }
    },
  });
}

export function onEnter_STATE(constructor, stateName) {
  const funcName1 = camelize.prepended('onEnter', stateName);
  const funcName2 = camelize.prepended('on', stateName);
  if (constructor.hasOwnProperty(funcName1) || constructor.hasOwnProperty(funcName2)) {
    throw new Error('state name duplicated!');
  }

  Object.defineProperty(constructor.prototype, funcName1, {
    value: async function (transition, from, to) {
      // trigger event add up later

      this._life_cycles?.[funcName1]?.({
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      });
    },
  });

  Object.defineProperty(constructor.prototype, funcName2, {
    value: async function (transition, from, to) {
      // trigger event add up later

      this._life_cycles?.[funcName2]?.({
        event: camelize.prepended('on', transition),
        from,
        to,
        transition,
      });
    },
  });
}
