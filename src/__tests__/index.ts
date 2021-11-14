import { StateMachine } from '../state-machine'

describe('test generate function', () => {
  test('test transition method', () => {
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
    expect(fsm.melt).toEqual(expect.any(Function))
    expect(fsm.freeze).toEqual(expect.any(Function))
    expect(fsm.vaporize).toEqual(expect.any(Function))
    expect(fsm.condense).toEqual(expect.any(Function))
  })
})
