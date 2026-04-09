// webpack.config.prod.js
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');
const getCommonConfig = require('./webpack.config.base.js');

const dllFiles = glob.sync(path.resolve(__dirname, 'dist/dll/*.dll.js'));
const common = getCommonConfig(true);

module.exports = {
  ...common,
  mode: 'production',
  // devtool: false,
  devtool: 'source-map',
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
          from: path.resolve(__dirname, 'public'),
          to: path.resolve(__dirname, 'dist'),
          globOptions: {
            ignore: ['**/.gitkeep'],
          },
        },
      ],
    }),
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require('./dist/dll/vendor-manifest.json'),
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
  // 统计信息
  stats: {
    assets: true,
    colors: true,
    errors: true,
    errorDetails: true,
    hash: true,
  },
};
