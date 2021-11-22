# Asynchronous Transitions

> You should be familiar with the state machine [Lifecycle Events](lifecycle-events.md) before reading this article.

Sometimes, you need to execute some asynchronous code during a state transition and ensure the new
state is not entered until your code has completed. A good example of this is when you transition
out of a state and want to gradually fade a UI component away, or slide it off the screen, and
don't want to transition to the next state until after that animation has completed.

You can achieve this by returning a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) object from the following lifecycle events.

- `onBeforeTransition`
- `onBefore<TRANSITION>`
- `onLeaveState`
- `onLeave<STATE>`
- `onTransition`

Read more on [Lifecycle Events](lifecycle-events.md).

Returning a Promise from a lifecycle event will cause the lifecycle for that transition to pause.
It can be continued by resolving the promise, or cancelled by rejecting the promise or return false.

For example (using jQuery effects):

```typescript
const fsm = new StateMachine({
  init: 'menu',

  transitions: [
    { name: 'play', from: 'menu', to: 'game' },
    { name: 'quit', from: 'game', to: 'menu' },
  ] as const,

  lifecycles: {
    onBeforeTransition: function () {
      return new Promise(function (resolve, reject) {
        $('#menu').fadeIn('fast', resolve)
      })
    },

    onLeaveMenu: function () {
      return new Promise(function (resolve, reject) {
        $('#menu').fadeOut('fast', resolve)
      })
    },

    onLeaveGame: function () {
      return new Promise(function (resolve, reject) {
        $('#game').fadeOut('fast', resolve)
      })
    },

    onTransition: function () {
      // return Promise.resolve(false) // **transition can be cancled by return false or rejecting the promise.**
    },
  },
})
```

> Be sure that you always resolve (or reject) your Promise eventually, otherwise the state machine will be stuck forever within that pending transition.

When any of the `onBeforeTransition`, `onBefore<TRANSITION>`, `onLeaveState`, `onLeave<STATE>`, `onTransition` lifecycle event
return a promise, transition method would automatically return a promise. In this case, you should wait it until it resolved.

```typescript
async function foo {
  const currentState = await fsm.play() // Promise<'game'>
  console.log(currentState) // 'game'
  await fsm.game() // Promise<'menu'>
}

```
