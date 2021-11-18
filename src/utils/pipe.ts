export function* pipe(...inputs: Array<[(...params: any) => any, any[]]>) {
  // eslint-disable-next-line no-restricted-syntax
  for (const i of inputs) {
    yield i[0](...i[1])
  }
}
