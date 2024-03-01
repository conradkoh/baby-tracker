// eslint-disable-next-line no-undef
module.exports = function (api) {
  api.cache(false);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
