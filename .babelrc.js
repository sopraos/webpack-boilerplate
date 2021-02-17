module.exports = function(api) {
  return {
    presets: [
      ["@babel/preset-env", {
        targets: {},
        modules: false,
        forceAllTransforms: api.env('production'),
        useBuiltIns: 'usage',
        corejs: '3',
      }]
		],
		sourceType: 'unambiguous'
  };
};
