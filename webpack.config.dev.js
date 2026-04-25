const path = require('path');
const webpack = require('webpack');
const getCommonConfig = require('./webpack.config.base.js');
const { globSync } = require('glob');
const common = getCommonConfig(false);

// 自动扫描页面文件夹
const pageNames = globSync('src/pages/*').map((p) => p.split(/[\\/]/).pop());

// 🔥 【大厂标准】严格匹配：/index 、/about 、/login
const rewrites = [
  { from: /^\/$/, to: '/index.html' }, // 根目录 → 首页
  ...pageNames.map((name) => ({
    from: new RegExp(`^\\/${name}$`), // 👈 严格精确匹配
    to: `/${name}.html`,
  })),
];

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
    historyApiFallback: { rewrites },
    client: { overlay: false }, // 关闭浏览器红屏报错遮罩，只在控制台看错误 ✅ 大厂标准
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
