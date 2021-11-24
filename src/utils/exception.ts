export class Exception extends Error {
  constructor(public message: string, public transition: string, public from: string, public to: string | null, public current: string) {
    super(message)
  }
}
