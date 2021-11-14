module.exports = (api) => {
  if (api.env('test')) {
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ],
    }
  }
  return {
    presets: [['@babel/preset-env', { modules: true }], '@babel/preset-typescript'],
  }
}
