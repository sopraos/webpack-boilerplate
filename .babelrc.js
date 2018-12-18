module.exports = function(api) {
  return {
    presets: [
      ["@babel/preset-env", {
        targets: {},
        modules: false,
        forceAllTransforms: api.env('production'),
        useBuiltIns: 'entry',
        debug: false
      }]
    ]
  };
};

