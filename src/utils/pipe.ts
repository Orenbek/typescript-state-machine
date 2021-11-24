type ValidatorFn = (taskReturnValue: unknown, taskName: string) => boolean

function asyncOrSyncPromise(validatorFn?: ValidatorFn) {
  let isFirstTask = true
  let preTaskName: string
  return {
    next(callback: () => unknown, callbackName: string) {
      if (this.value instanceof Promise) {
        this.value = this.value.then((res) => {
          if (!validatorFn || validatorFn(res, preTaskName)) {
            return callback()
          }
          return Promise.reject()
        })
      } else if (!isFirstTask && validatorFn) {
        if (validatorFn(this.value, preTaskName)) {
          this.value = callback()
        }
      } else {
        this.value = callback()
      }
      preTaskName = callbackName
      isFirstTask = false
      return this
    },
    value: undefined as unknown,
  }
}

/**
 * @notice this function will wait for all the tasks to be resolved
 * @param inputs array of tasks
 * @param validatorFn optional validate function. it validate every tasks return value. if validate function return false then it will abort the pipeline process
 * @returns (1) inputs are sync tasks. if all tasks succeed then return true otherwise return false
 * (2) inputs contain async tasks. it'll return a promise. if all tasks succeed then it resolve with last task's return value otherwise will reject.
 */
export function pipe(inputs: Array<[(...params: any) => any, any[]]>, validatorFn?: ValidatorFn) {
  const result = inputs.reduce((acc, item) => acc.next(() => item[0](...item[1]), item[0].name), asyncOrSyncPromise(validatorFn))
  return result.value
}
