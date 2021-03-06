# Typescript State Machine

A strongly typed library for finite state machines.

![matter state machine](examples/matter.png)

# Installation

```shell
npm install fsm-typescript --save-dev
```

# Usage

A state machine can be constructed using:

```javascript
const fsm = new StateMachine({
  init: 'solid',
  transitions: [
    { name: 'melt', from: 'solid', to: 'liquid' },
    { name: 'freeze', from: 'liquid', to: 'solid' },
    { name: 'vaporize', from: 'liquid', to: 'gas' },
    { name: 'condense', from: 'gas', to: 'liquid' },
  ],
  lifecycles: {
    onMelt: function () {
      console.log('I melted')
    },
    onFreeze: function () {
      console.log('I froze')
    },
    onVaporize: function () {
      console.log('I vaporized')
    },
    onCondense: function () {
      console.log('I condensed')
    },
  },
})
```

... which creates an object with a current state property:

- `fsm.state`

... methods to transition to a different state:

- `fsm.melt()`
- `fsm.freeze()`
- `fsm.vaporize()`
- `fsm.condense()`

... observer methods called automatically during the lifecycle of a transition:

- `onMelt()`
- `onFreeze()`
- `onVaporize()`
- `onCondense()`

... along with the following helper methods:

<!-- - `fsm.is(s)` - return true if state `s` is the current state -->

- `fsm.can(t)` - return true if transition `t` can occur from the current state
- `fsm.cannot(t)` - return true if transition `t` cannot occur from the current state
- `fsm.transitions()` - return list of transitions that are allowed from the current state
- `fsm.allTransitions()` - return list of all possible transitions
- `fsm.allStates()` - return list of all possible states

# Terminology

A state machine consists of a set of [**States**](docs/states-and-transitions.md)

- solid
- liquid
- gas

A state machine changes state by using [**Transitions**](docs/states-and-transitions.md)

- melt
- freeze
- vaporize
- condense

A state machine can perform actions during a transition by observing [**Lifecycle Events**](docs/lifecycle-events.md)

- onBeforeMelt
- onAfterMelt
- onLeaveSolid
- onEnterLiquid
- ...

A state machine can also have arbitrary [**Data**](docs/data.md).

# Documentation

Read more about

- [States and Transitions](docs/states-and-transitions.md)
- [Lifecycle Events](docs/lifecycle-events.md)
- [Asynchronous Transitions](docs/async-transitions.md)
- [Initialization](docs/initialization.md)
- [Error Handling](docs/error-handling.md)
- [State History](docs/state-history.md)
- [Observer Function](docs/observer.md)
<!-- - [Visualization](docs/visualization.md)
- [State Machine Factory](docs/state-machine-factory.md) -->

# License

See [MIT LICENSE](https://github.com/Orenbek/typescript-state-machine/blob/master/LICENSE) file.
