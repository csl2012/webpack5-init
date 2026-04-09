const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.js');

module.exports = merge(baseConfig, {
  devtool: 'eval-cheap-module-source-map',
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000,
    ignored: /node_modules/,
  },
  output: {
    filename: 'js/[name].[fullhash].js',
    chunkFilename: 'js/[id].[fullhash].js',
  },
  devServer: {
    static: {
      directory: './dist',
    },
    port: 3000,
    open: true,
    hot: true,
    compress: true,
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
  module: {
    rules: [],
  },
  optimization: {
    minimize: false,
    splitChunks: false,
    runtimeChunk: false,
    moduleIds: 'named',
    chunkIds: 'named',
  },
  stats: 'errors-warnings',
  // stats: 'minimal',
});
