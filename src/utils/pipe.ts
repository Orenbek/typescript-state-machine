export async function pipe<T extends (...params: any) => any>(inputs: [T, [...Parameters<T>]][], abortWhenResFalse = false) {
  let abort = false
  // eslint-disable-next-line no-restricted-syntax
  for (const i of inputs) {
    // eslint-disable-next-line no-await-in-loop
    const res = await i[0](...i[1])
    if (abortWhenResFalse && res === false) {
      abort = true
      break
    }
  }
  return abort
}
