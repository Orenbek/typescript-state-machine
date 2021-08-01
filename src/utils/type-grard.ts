export function isPromise(input: any): input is Promise<unknown> {
  return Boolean(input) && typeof input.then === 'function';
}
