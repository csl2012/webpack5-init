// webpack.config.prod.js
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.js');

// 处理函数形式的基础配置
module.exports = merge(baseConfig, {
  devtool: 'source-map',
  stats: 'errors-only', // 只显示错误信息
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          name: 'vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  },
});
