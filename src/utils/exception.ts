export class Exception extends Error {
  constructor(public message: string, public transition: string, public from: string | readonly string[], public to: string, public current: string) {
    super(message)
  }
}