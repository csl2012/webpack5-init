// webpack.config.prod.js
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const getCommonConfig = require('./webpack.config.base.js');
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin');
const { globSync } = require('glob'); // 只用 glob，大厂标准

// 路径
const resolve = (pathStr) => path.resolve(__dirname, pathStr);
const PATHS = { src: resolve('src') };

// DLL 检查
const manifestPath = resolve('dist/dll/vendor-manifest.json');
if (!fs.existsSync(manifestPath)) {
  throw new Error('请先运行：npm run build:dll');
}
const dllManifest = require(manifestPath);
const dllFiles = globSync(resolve('dist/dll/*.dll.js'));

const common = getCommonConfig(true);

module.exports = {
  ...common,
  mode: 'production',
  output: {
    ...common.output,
    filename: 'js/[name].[contenthash].js',
    chunkFilename: 'js/[id].[contenthash].chunk.js',
    publicPath: '/', // 大厂必须加
  },

  plugins: [
    ...common.plugins,

    // CSS  Tree Shaking 清理死样式 ✅
    new PurgeCSSPlugin({
      paths: globSync([`${PATHS.src}/**/*.{js,ts,html,vue}`]),
      safelist: ['html', 'body'],
      defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
    }),

    // 提取 CSS ✅
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
      chunkFilename: 'css/[id].[contenthash].chunk.css',
    }),

    // 复制 public 文件夹
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve('public'),
          to: resolve('dist'),
          globOptions: { ignore: ['**/.gitkeep'] },
        },
      ],
    }),

    // DLL 加速
    new webpack.DllReferencePlugin({ manifest: dllManifest }),

    // 注入 DLL
    ...dllFiles.map(
      (file) =>
        new AddAssetHtmlPlugin({
          filepath: file,
          outputPath: 'dll',
          publicPath: 'dll',
        }),
    ),

    // GZIP 压缩 ✅
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 1024,
      minRatio: 0.99,
    }),

    // BROTLI 压缩（比 gzip 更小）✅
    new CompressionPlugin({
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      threshold: 1024,
      minRatio: 0.99,
      compressionOptions: { level: 11 },
    }),
  ],

  // 大厂级优化 ✅✅✅
  optimization: {
    minimize: true,
    usedExports: true, // 死代码标记
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: { drop_console: true, drop_debugger: true },
          output: { comments: false },
        },
      }),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: { name: 'vendors', test: /node_modules/, priority: 10 },
        common: { name: 'common', minChunks: 2, reuseExistingChunk: true },
      },
    },
    runtimeChunk: 'single', // 修复长期缓存问题 ✅
  },

  stats: 'errors-warnings', // 精简日志
};
