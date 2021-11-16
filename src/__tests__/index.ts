import { StateMachine } from '../state-machine'
import { observer } from '../observer'

describe('test generate function', () => {
  const fsm = new StateMachine({
    init: 'solid',
    transitions: [
      { name: 'melt', from: 'solid', to: 'liquid' },
      { name: 'freeze', from: 'liquid', to: 'solid' },
      { name: 'vaporize', from: 'liquid', to: 'gas' },
      { name: 'condense', from: 'gas', to: 'liquid' },
    ] as const,
    data: {
      name: 'joe',
    },
  })
  test('test transition method', () => {
    expect(fsm.melt).toEqual(expect.any(Function))
    expect(fsm.freeze).toEqual(expect.any(Function))
    expect(fsm.vaporize).toEqual(expect.any(Function))
    expect(fsm.condense).toEqual(expect.any(Function))
  })
  test('test class states', () => {
    expect(fsm.allTransitions).toEqual(['melt', 'freeze', 'vaporize', 'condense', 'step'])
    expect(fsm.allStates).toEqual(['solid', 'liquid', 'gas', 'A', 'B', 'C', 'D'])
  })
  observer(fsm).onAfterTransition((event, ...args) => {
    event.from
    event.to
  })
})
