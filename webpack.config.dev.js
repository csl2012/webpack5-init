const path = require('path');
const webpack = require('webpack');
const getCommonConfig = require('./webpack.config.base.js');

const common = getCommonConfig(false);

module.exports = {
  ...common,
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000,
    ignored: /node_modules/,
  },
  output: {
    ...common.output,
    filename: 'js/[name].js',
    chunkFilename: 'js/[id].js',
  },
  plugins: [
    ...common.plugins,
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
  ],
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    compress: true,
    hot: true,
    open: true,
    port: 8080,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '',
        },
        logLevel: 'info',
      },
    ],
  },
  optimization: {
    minimize: false,
    splitChunks: false,
    runtimeChunk: false,
    moduleIds: 'named',
    chunkIds: 'named',
  },
  stats: 'errors-warnings',
};
