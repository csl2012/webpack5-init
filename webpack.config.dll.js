// webpack.config.dll.js
const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const resolve = (pathStr) => {
  return path.resolve(__dirname, pathStr);
};

module.exports = {
  mode: 'production',
  entry: {
    // 配置需要打包的第三方依赖
    vendor: [
      'core-js',
      // 可以添加其他常用依赖，如：
      // 'react',
      // 'react-dom',
      // 'lodash',
      'axios',
      // 'vue',
      'mitt',
    ],
  },
  output: {
    path: resolve('dist/dll'),
    filename: '[name].[fullhash].dll.js',
    library: '[name]_[fullhash]',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DllPlugin({
      name: '[name]_[fullhash]',
      path: resolve('dist/dll/[name]-manifest.json'),
      context: __dirname,
    }),
  ],
};
