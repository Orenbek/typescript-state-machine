# Initialization Options

## Implicit Init Transition

You must specify the name of your initial state,
when initilizing, an `init` transition will be fired (along with appropriate
lifecycle events) when the state machine is constructed.

```typescript
const fsm = new StateMachine({
  init: 'A',
  transitions: [
    { name: 'step', from: 'A', to: 'B' },
    { name: 'step', from: 'B', to: 'C' },
  ],
}) // 'init()' transition fires from 'none' to 'A' during construction
fsm.state // 'A'
```
