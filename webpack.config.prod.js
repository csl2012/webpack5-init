// webpack.config.prod.js
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const getCommonConfig = require('./webpack.config.base.js');

const resolve = (pathStr) => {
  return path.resolve(__dirname, pathStr);
};

const dllFiles = glob.sync(resolve('dist/dll/*.dll.js'));
const common = getCommonConfig(true);

const manifestPath = resolve('dist/dll/vendor-manifest.json');
if (!fs.existsSync(manifestPath)) {
  throw new Error('DLL manifest not found. Run "npm run build:dll" first.');
}
const dllManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
module.exports = {
  ...common,
  mode: 'production',
  // devtool: 'source-map',
  output: {
    ...common.output,
    filename: 'js/[name].[contenthash].js',
    chunkFilename: 'js/[id].[contenthash].js',
  },
  plugins: [
    ...common.plugins,
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
      chunkFilename: 'css/[id].[contenthash].chunk.css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve('public'),
          to: resolve('dist'),
          globOptions: {
            ignore: ['**/.gitkeep'],
          },
        },
      ],
    }),
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: dllManifest,
      // manifest: require('./dist/dll/vendor-manifest.json'),
    }),
    ...dllFiles.map((file) => {
      return new AddAssetHtmlPlugin({
        filepath: file,
        outputPath: 'dll',
        publicPath: 'dll',
        includeSourcemap: false,
      });
    }),
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),
  ],
  optimization: {
    usedExports: true, // 标记未使用导出
    minimize: true, // 压缩并删除死代码
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // 移除 console.log 等语句
            drop_debugger: true, // 移除 debugger 语句
          },
          output: {
            comments: false, // 移除所有注释
          },
        },
      }),
    ],
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
  stats: {
    assets: true,
    colors: true,
    errors: true,
    errorDetails: true,
    hash: true,
  },
};
