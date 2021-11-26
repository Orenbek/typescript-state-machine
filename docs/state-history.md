# Remembering State History

By default, a state machine only tracks its current state. If you wish to track the state history
you can extend the state machine with the `state-machine-history` plugin.

```ts
import { StateMachineHistory } from 'typescript-state-machine/es/plugins'
```

```ts
var fsm = new StateMachine({
  init: 'A',
  transitions: [
    { name: 'step', from: 'A', to: 'B' },
    { name: 'step', from: 'B', to: 'C' },
    { name: 'step', from: 'C', to: 'D' },
  ] as const,
  plugins: [
    new StateMachineHistory(), //  <-- plugin enabled here
  ],
})

fsm.history // [ ]
fsm.step()
fsm.history // [ { transition: 'step', from: 'A', to: 'B' } ]
fsm.step()
fsm.history // [ { transition: 'step', from: 'A', to: 'B' }, { transition: 'step', from: 'B', to: 'C' } ]

fsm.clearHistory()

fsm.history // [ ]
```

## Traversing History

You can traverse back through history using the `historyBack` method:

```ts
var fsm = new StateMachine({
  init: 'A',
  transitions: [
    { name: 'step', from: 'A', to: 'B' },
    { name: 'step', from: 'B', to: 'C' },
    { name: 'step', from: 'C', to: 'D' },
  ] as const,
  plugins: [
    new StateMachineHistory(), //  <-- plugin enabled here
  ],
})

fsm.step()
fsm.step()
fsm.step()

fsm.state //                 'D'
fsm.history
// [ { transition: 'step', from: 'A', to: 'B' }, { transition: 'step', from: 'B', to: 'C' }, { transition: 'step', from: 'C', to: 'D' } ]

fsm.historyBack()

fsm.state //                  'C'
fsm.history // [ { transition: 'step', from: 'A', to: 'B' }, { transition: 'step', from: 'B', to: 'C' } ]

fsm.historyBack()
fsm.state //                  'B'
fsm.history // [ { transition: 'step', from: 'A', to: 'B' } ]
```

You can test if history traversal is allowed using the `canHistoryBack` property:

```ts
fsm.canHistoryBack // true/false
```

A full set of [Lifecycle Events](lifecycle-events.md) will still apply when traversing history with `historyBack`.

## Limiting History

By default, the state machine history is unbounded and will continue to grow until cleared. You
can limit storage to only the last N states by configuring the plugin:

```ts
var fsm = new StateMachine({
  transitions: [
    { name: 'step', from: 'A', to: 'B' },
    { name: 'step', from: 'B', to: 'C' },
  ] as const,
  plugins: [
    new StateMachineHistory({ max: 100 }), //  <-- plugin configuration
  ],
})
```
