import { defineConfig } from 'rollup'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

const { name, version, author, license } = pkg

const banner =
  `${'/*!\n * '}${name}.js v${version}\n` +
  ` * (c) 2021-${new Date().getFullYear()} ${author}\n` +
  ` * Released under the ${license} License.\n` +
  ` */`

function getBabelConfig(module) {
  let modules
  switch (module) {
    case 'cjs':
      modules = 'commonjs'
      break
    case 'umd':
      modules = 'umd'
      break
    case 'esm':
      modules = false
      break
    default:
      throw new Error()
  }
  return {
    filename: 'index.js',
    allowAllFormats: true,
    presets: [
      [
        '@babel/preset-env',
        {
          modules,
          useBuiltIns: 'usage',
          corejs: '3.18',
        },
      ],
    ],
  }
}
// read more information about babel rollup config on https://github.com/rollup/plugins/tree/master/packages/babel
export default defineConfig({
  input: 'src/index.ts',
  external: [...Object.keys(pkg.peerDependencies || {})],
  output: [
    {
      dir: 'umd',
      sourcemap: true,
      generatedCode: 'es5', // This will not transpile any user code but only change the code Rollup uses in wrappers and helpers.
      format: 'esm',
      banner,
      plugins: [getBabelOutputPlugin(getBabelConfig('umd'))],
    },
    {
      dir: 'lib',
      sourcemap: true,
      generatedCode: 'es5', // This will not transpile any user code but only change the code Rollup uses in wrappers and helpers.
      format: 'esm',
      banner,
      plugins: [getBabelOutputPlugin(getBabelConfig('cjs'))],
    },
    {
      dir: './es',
      sourcemap: true,
      generatedCode: 'es5',
      format: 'esm',
      plugins: [getBabelOutputPlugin(getBabelConfig('esm'))],
    },
    {
      dir: './modern',
      sourcemap: true,
      generatedCode: 'es2015',
      format: 'esm',
    },
  ],
  plugins: [typescript()],
})
