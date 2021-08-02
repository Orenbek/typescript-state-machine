export interface Transition<TName extends string, State extends string> {
  readonly name: TName;
  readonly from: State;
  readonly to: State;
}

export type TransitionMethods<TTransitions extends readonly Transition<string, string>[]> = {
  [K in keyof TTransitions as (TTransitions[K] extends Transition<string, string> ? TTransitions[K]['name'] : never)]: (...args: any[]) => void;
}
