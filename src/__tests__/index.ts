import { StateMachine } from '../state-machine'
import { Exception } from '../utils/exception'
import { StateMachineHistory } from '../plugins'
import { observer } from '../observer'

function wait(num: number, returnVal: unknown) {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve(returnVal)
    }, num)
  )
}

describe('test class initilization', () => {
  const fn1 = jest.fn()
  const fn2 = jest.fn()
  const fn3 = jest.fn()
  const fn4 = jest.fn()
  const fn5 = jest.fn()
  const fn6 = jest.fn()
  const fn7 = jest.fn()
  const fsm = new StateMachine({
    init: 'solid',
    transitions: [
      { name: 'melt', from: 'solid', to: 'liquid' },
      { name: 'freeze', from: 'liquid', to: 'solid' },
      { name: 'vaporize', from: 'liquid', to: 'gas' },
    ] as const,
    data: {
      name: 'joe',
    },
    lifecycles: {
      onEnterState: fn1,
      onEnterSolid: fn2,
      onSolid: fn3,
      onAfterTransition: fn4,
      onAfterInit: fn5,
      onInit: fn6,
      onBeforeTransition: fn7,
    },
  })
  test('test init state', () => {
    expect(fsm.state).toBe('solid')
  })
  test('test transition method', () => {
    expect(fsm.melt).toEqual(expect.any(Function))
    expect(fsm.freeze).toEqual(expect.any(Function))
    expect(fsm.vaporize).toEqual(expect.any(Function))
  })
  test('test getters', () => {
    expect(fsm.allTransitions).toEqual(['melt', 'freeze', 'vaporize'])
    expect(fsm.allStates).toEqual(['solid', 'liquid', 'gas'])
    expect(fsm.possibleTransitions).toEqual(['melt'])
    expect(fsm.isFinalState).toBe(false)
  })
  test('test data object', () => {
    expect(fsm.data).toEqual({
      name: 'joe',
    })
  })

  /** test init transition lifecycle. place out of test function because test function will clear mocks
   * so that i cant get currect calls value in callback.
   */
  expect(fn1.mock.calls.length).toBe(1)
  expect(fn2.mock.calls.length).toBe(1)
  expect(fn3.mock.calls.length).toBe(1)
  expect(fn4.mock.calls.length).toBe(1)
  expect(fn5.mock.calls.length).toBe(1)
  expect(fn6.mock.calls.length).toBe(1)
  expect(fn7.mock.calls.length).toBe(0)

  expect(fn1.mock.calls[0][0]).toEqual({
    event: 'onInit',
    from: 'none',
    to: 'solid',
    transition: 'init',
  })
})

describe('test transitions', () => {
  test('test same name transition', () => {
    const spy = jest.fn()
    const fsm = new StateMachine({
      init: 'A',
      transitions: [
        { name: 'step', from: 'A', to: 'B' },
        { name: 'step', from: 'B', to: 'C' },
        { name: 'step', from: 'C', to: 'D' },
        { name: 'reset', from: 'B', to: 'A' },
        { name: 'reset', from: 'C', to: 'A' },
        { name: 'reset', from: 'D', to: 'A' },
      ] as const,
      lifecycles: {
        onTransition: spy,
      },
    })

    expect(fsm.state).toBe('A')
    expect(fsm.step).toEqual(expect.any(Function))
    expect(fsm.reset).toEqual(expect.any(Function))
    expect(fsm.allTransitions).toEqual(['step', 'reset'])
    expect(fsm.allStates).toEqual(['A', 'B', 'C', 'D'])
    expect(fsm.possibleTransitions).toEqual(['step'])
    expect(() => {
      fsm.reset()
    }).toThrowError(new Exception('invalid transition!', 'reset', 'A', null, 'A'))
    fsm.step()
    expect(fsm.state).toBe('B')
    fsm.step()
    expect(fsm.state).toBe('C')
    fsm.step()
    expect(fsm.state).toBe('D')
    expect(() => {
      fsm.step()
    }).toThrowError(new Exception('invalid transition!', 'step', 'D', null, 'D'))
    expect(fsm.reset('hello')).toEqual('A')
    expect(fsm.state).toEqual('A')
    expect(spy.mock.calls.length).toBe(4)
    expect(spy.mock.calls[0][0]).toEqual({
      event: 'onStep',
      from: 'A',
      to: 'B',
      transition: 'step',
    })
    expect(spy.mock.calls[3][0]).toEqual({
      event: 'onReset',
      from: 'D',
      to: 'A',
      transition: 'reset',
    })
    expect(spy.mock.calls[3][1]).toEqual('hello')

    const fsm2 = new StateMachine({
      init: 'A',
      transitions: [
        { name: 'step', from: 'A', to: 'B' },
        { name: 'step', from: 'B', to: 'C' },
        { name: 'step', from: 'C', to: 'D' },
        { name: 'reset', from: ['B', 'C', 'D'], to: 'A' },
      ] as const,
    })
    fsm2.step()
    fsm2.step()
    expect(fsm2.state).toBe('C')
    expect(fsm2.reset()).toBe('A')
    expect(fsm2.state).toBe('A')
  })

  test('test async transition', async () => {
    const spy = jest.fn((event: any) => (event.from === 'B' ? Promise.resolve(false) : Promise.resolve(1)))
    const fsm = new StateMachine({
      init: 'A',
      transitions: [
        { name: 'step', from: 'A', to: 'B' },
        { name: 'step', from: 'B', to: 'C' },
        { name: 'step', from: 'C', to: 'D' },
        { name: 'reset', from: ['B', 'C', 'D'], to: 'A' },
      ] as const,
      lifecycles: {
        onTransition: spy,
      },
    })
    const res = fsm.step()
    expect(res).toBeInstanceOf(Promise)
    expect(res).resolves.toBe('B')
    expect(() => {
      fsm.step()
    }).toThrowError(new Exception('transition on pending!', 'step', 'B', 'C', 'B'))
    await res
    await expect(fsm.step()).rejects.toEqual(undefined)

    const fsm2 = new StateMachine({
      init: 'A',
      transitions: [
        { name: 'step', from: 'A', to: 'B' },
        { name: 'step', from: 'B', to: 'C' },
        { name: 'step', from: 'C', to: 'D' },
        { name: 'reset', from: ['B', 'C', 'D'], to: 'A' },
      ] as const,
      lifecycles: {
        onEnterB: jest.fn(() => {
          Promise.resolve()
        }),
      },
    })
    expect(fsm2.step()).toBe('B')
  })

  test('test lifecycle event cancelation and executed order', async () => {
    const fn1 = jest.fn(() => {
      console.log('task1')
    })
    const fn2 = jest.fn(() => {
      console.log('task2')
      return wait(100, 2)
    })
    const fn3 = jest.fn(() => {
      console.log('task3')
      return true
    })
    const fn4 = jest.fn(() => {
      console.log('task4')
    })
    const fn5 = jest.fn(() => {
      console.log('task5')
      return wait(50, 5)
    })
    // all the lifecycles below won't be waited.
    const fn6 = jest.fn(() => {
      console.log('task6')
      return wait(50, 5)
    })
    const fn7 = jest.fn(() => {
      console.log('task7')
      return null
    })
    const fn8 = jest.fn(() => {
      console.log('task8')
      return wait(10, 8)
    })
    const fn9 = jest.fn(() => {
      console.log('task9')
      return wait(300, 9)
    })
    const fn10 = jest.fn(() => {
      console.log('task10')
    })
    const fn11 = jest.fn(() => {
      console.log('task11')
    })
    const fsm = new StateMachine({
      init: 'A',
      transitions: [
        { name: 'step', from: 'A', to: 'B' },
        { name: 'step', from: 'B', to: 'C' },
        { name: 'step', from: 'C', to: 'D' },
        { name: 'reset', from: ['B', 'C', 'D'], to: 'A' },
      ] as const,
      lifecycles: {
        onBeforeTransition: fn1,
        onBeforeStep: fn2,
        onLeaveState: fn3,
        onLeaveA: fn4,
        onTransition: fn5,
        onEnterState: fn6,
        onEnterB: fn7,
        onB: fn8,
        onAfterTransition: fn9,
        onAfterStep: fn10,
        onStep: fn11,
      },
    })
    await fsm.step()
    const mocks = [fn1, fn2, fn3, fn4, fn5, fn6, fn7, fn8, fn9, fn10, fn11]
    mocks.forEach((item) => {
      expect(item).toBeCalled()
    })
    expect(fn7).toBeCalled()
    const rightOrder = mocks.find(
      (i, index) =>
        i.mock.invocationCallOrder[0] < (index === 0 ? 0 : mocks[index - 1].mock.invocationCallOrder[index === 5 || index === 8 ? 1 : 0])
    )
    expect(rightOrder).toBe(undefined)
  })
})

describe('test history', () => {
  test('test history functionality', () => {
    const fsm = new StateMachine({
      init: 'A',
      transitions: [
        { name: 'step', from: 'A', to: 'B' },
        { name: 'step', from: 'B', to: 'C' },
        { name: 'step', from: 'C', to: 'D' },
        { name: 'reset', from: 'B', to: 'A' },
        { name: 'reset', from: 'C', to: 'A' },
        { name: 'reset', from: 'D', to: 'A' },
      ] as const,
      plugins: [new StateMachineHistory()],
    })
    expect(fsm.history).toEqual([])
    expect(fsm.canHistoryBack).toBe(false)
    expect(fsm.historyBack).toEqual(expect.any(Function))
    expect(fsm.clearHistory).toEqual(expect.any(Function))
    fsm.step()
    expect(fsm.history).toEqual([{ transition: 'step', from: 'A', to: 'B' }])
    expect(fsm.canHistoryBack).toBe(false)
    fsm.step()
    expect(fsm.history).toEqual([
      { transition: 'step', from: 'A', to: 'B' },
      { transition: 'step', from: 'B', to: 'C' },
    ])
    expect(fsm.canHistoryBack).toBe(true)
    expect(fsm.historyBack()).toBe('B')
    expect(fsm.history).toEqual([{ transition: 'step', from: 'A', to: 'B' }])
    expect(fsm.canHistoryBack).toBe(false)
    fsm.clearHistory()
    expect(fsm.history).toEqual([])
  })

  test('test history length', () => {
    const fsm = new StateMachine({
      init: 'A',
      transitions: [
        { name: 'step', from: 'A', to: 'B' },
        { name: 'step', from: 'B', to: 'C' },
        { name: 'step', from: 'C', to: 'D' },
        { name: 'reset', from: 'B', to: 'A' },
        { name: 'reset', from: 'C', to: 'A' },
        { name: 'reset', from: 'D', to: 'A' },
      ] as const,
      plugins: [new StateMachineHistory({ max: 3 })],
    })
    fsm.step()
    fsm.step()
    fsm.step()
    fsm.reset()
    expect(fsm.history).toEqual([
      { transition: 'step', from: 'B', to: 'C' },
      { transition: 'step', from: 'C', to: 'D' },
      { transition: 'reset', from: 'D', to: 'A' },
    ])
  })
})
