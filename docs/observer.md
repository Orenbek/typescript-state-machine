# Observer function

If you want to observe state-machine lifecycle functions after initilization could be difficult. Because all the lifecycle event function passed into class constructor as a parameter.

```typescript
const fsm = new StateMachine({
  init: 'menu',
  transitions: [
    { name: 'play', from: 'menu', to: 'game' },
    { name: 'quit', from: 'game', to: 'menu' },
  ] as const,

  lifecycles: {
    onBeforeTransition: function (event, ...args) {
      // lifecycel event.
    },
    onLeaveMenu: function (event, ...args) {
      // lifecycel event.
    },
  },
})
```

you can easily use observer function to listen for the following lifecycle events:

- `onBeforeTransition`
- `onLeaveState`
- `onTransition`
- `onEnterState`
- `onAfterTransition`

```typescript
import { observer } from 'typescript-state-machine/es/observer'
const fsm = new StateMachine({
  init: 'menu',
  transitions: [
    { name: 'play', from: 'menu', to: 'game' },
    { name: 'quit', from: 'game', to: 'menu' },
  ] as const,
})
observer(fsm)
  .onBeforeTransition((event, ...args) => {})
  .onAfterTransition((event, ...args) => {})
```

> Support chain calls.

> Observer function doesn't support canceling transition. You should place cancelling logic in lifecycles object.
