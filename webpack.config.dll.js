// webpack.config.dll.js
const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

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
      // 'axios'
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist/dll'),
    filename: '[name].[fullhash].dll.js',
    library: '[name]_[fullhash]',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DllPlugin({
      name: '[name]_[fullhash]',
      path: path.resolve(__dirname, 'dist/dll/[name]-manifest.json'),
      context: __dirname,
    }),
  ],
};
