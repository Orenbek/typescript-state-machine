type ToCamel<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Lowercase<Head>}${Capitalize<ToCamel<Tail>>}`
  : S extends `${infer Head}-${infer Tail}`
  ? `${Lowercase<Head>}${Capitalize<ToCamel<Tail>>}`
  : S extends Uppercase<S>
  ? Lowercase<S>
  : S extends `${Capitalize<infer Head>}${Capitalize<infer Tail>}`
  ? S
  : void
export type ToCamelCase<S extends string | number | bigint> = Uncapitalize<ToCamel<S & string>>
/**
  Convert a capital/dash/underscore/double--dash/mixed-case string to camelCase.

  @param label - String to convert to camel case.

  @example
  ```ts
  import camelize from '../util/camelize'

  camelize('WORD');
  //=> 'word'

  camelize('word-with-dash');
  //=> 'wordWithDash'

  camelize('word_with_underscore');
  //=> 'wordWithUnderscore'

  camelize('word-with--multi---dash');
  //=> 'wordWithDoubleDash'

  camelize('word_WITH_mixed_CASE');
  //=> 'word_WITH_mixed_CASE'
  ```
  */
export default function camelize<T extends string>(label: T): ToCamelCase<T> {
  let result = ''
  const regx = /([a-z1-9])([A-Z]{1,})(?=[a-z1-9]*)/g
  const words = label
    .replace(regx, (...args) => `${args[1]}-${args[2].toLowerCase()}`)
    .split(/[_-]/)
    .filter(Boolean)
  if (words.length === 0) {
    return '' as ToCamelCase<T>
  }
  result = words[0].toLowerCase()
  // single word with first character already lowercase, return untouched
  if (words.length === 1) {
    return result as ToCamelCase<T>
  }

  // eslint-disable-next-line no-plusplus
  for (let n = 1; n < words.length; n++) {
    result = result + words[n].charAt(0).toUpperCase() + words[n].substring(1).toLowerCase()
  }

  return result as ToCamelCase<T>
}
//-------------------------------------------------------------------------------------------------

camelize.prepended = function <T extends string, P extends string>(prepend: T, label: P): ToCamelCase<`${T}-${P}`> {
  const camelLabel = camelize(label)
  return (camelize(prepend) + camelLabel[0].toUpperCase() + camelLabel.substring(1)) as ToCamelCase<`${T}-${P}`>
}
