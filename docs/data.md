# Data

In addition to [States](states-and-transitions.md) and [Transitions](states-and-transitions.md), a state machine can
also contain arbitrary data:

```typescript
const fsm = new StateMachine({
  init: 'A',
  transitions: [{ name: 'step', from: 'A', to: 'B' }],
  data: {
    color: 'red',
  },
})

fsm.state // 'A'
fsm.data.color // 'red'
```
