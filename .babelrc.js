module.exports = function(api) {
  return {
    presets: [
      ["@babel/preset-env", {
        targets: {},
        modules: false,
        forceAllTransforms: api.env('production'),
        useBuiltIns: 'entry',
        corejs: '3.1.3',
      }]
		],
		sourceType: 'unambiguous'
  };
};

