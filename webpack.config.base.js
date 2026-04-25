// webpack.config.base.js
const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackBar = require('webpackbar');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const GlobalAssetsPlugin = require('./src/utils/webpack-plugins/GlobalAssetsPlugin');
const { globSync } = require('glob');
const { VueLoaderPlugin } = require('vue-loader');

const resolve = (pathStr) => path.resolve(__dirname, pathStr);

const pagesPath = {
  pages: 'src/pages',
  components: 'src/components',
  assets: 'src/assets',
  utils: 'src/utils',
};

// ==============================================
// 🔥 唯一入口：base 自动扫描 JS + TS，prod 不覆盖
// ==============================================
// 自动扫描入口（跨平台 Windows / Mac / Linux 100% 不炸）
const entryFiles = globSync('src/pages/*/index.{js,ts}');
const entry = {};

entryFiles.forEach((file) => {
  // 🔥 核心：统一把 \ 换成 /，解决 Windows 路径报错
  const correctPath = file.replace(/\\/g, '/');
  const parts = correctPath.split('/');
  const pageName = parts[2]; // index / about

  entry[pageName] = `./${correctPath}`;
});

// 自动生成 HTML 插件
function createHtmlPlugins(isProduction) {
  return Object.keys(entry).map((pageName) => {
    return new HtmlWebpackPlugin({
      template: `./${pagesPath.pages}/${pageName}/index.html`,
      filename: `${pageName}.html`,
      chunks: [pageName],
      inject: 'body',
      favicon: resolve('public/favicon.ico'),
      // 👇 核心：把 WebP 检测内联 script 插到 HEAD 最顶部
      meta: {
        // 随便一个 key，用来占位
        webpDetect: {
          content: '',
          // 关键：这段内容会被放到 head 最前面
          position: 'headPrepend',
        },
      },
      minify: isProduction
        ? {
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            minifyCSS: true,
            minifyJS: true,
            keepClosingSlash: true,
          }
        : false,
    });
  });
}

function getCommonConfig(isProduction = false) {
  return {
    entry,
    output: {
      path: resolve('dist'),
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          include: resolve('src'),
          exclude: /node_modules/,
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          include: resolve('src'),
          exclude: /node_modules/,
          options: {
            transpileOnly: true,
            appendTsSuffixTo: [/\.vue$/], // 👈 支持 Vue + TS
          },
        },
        // JS Babel
        {
          test: /\.js$/,
          include: resolve('src'),
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }],
              ],
              plugins: [['@babel/plugin-transform-runtime', { corejs: 3 }]],
              cacheDirectory: true,
              ...(!isProduction && { cacheCompression: false, compact: false }),
            },
          },
        },
        // CSS
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
          ],
        },
        // SCSS
        {
          test: /\.scss$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
            'sass-loader',
          ],
        },
        // 图片
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 8192 } },
          generator: { filename: 'images/[name].[fullhash][ext]' },
        },
        // 字体
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: { filename: 'fonts/[name].[fullhash][ext]' },
        },
        // 音频
        {
          test: /\.(mp3|wav|ogg)$/i,
          type: 'asset/resource',
          generator: { filename: 'audio/[name].[fullhash][ext]' },
        },
        // 视频
        {
          test: /\.(mp4|webm|ogg)$/i,
          type: 'asset/resource',
          generator: { filename: 'video/[name].[fullhash][ext]' },
        },
      ],
    },
    plugins: [
      new WebpackBar(),
      new GlobalAssetsPlugin({
        assets: [
          {
            path: resolve(
              'src/utils/webpack-plugins/assets/styles/normalize.min.css',
            ),
            position: 'head',
            type: 'style',
          },
          {
            path: resolve('src/utils/webpack-plugins/assets/styles/reset.scss'),
            position: 'head',
            type: 'style',
          },
          {
            path: resolve('src/utils/webpack-plugins/assets/styles/mixin.scss'),
            position: 'head',
            type: 'style',
          },
          {
            path: resolve('src/utils/webpack-plugins/assets/styles/theme.css'),
            position: 'head',
            type: 'style',
          },
          {
            path: resolve(
              'src/utils/webpack-plugins/assets/js/global-scripts.js',
            ),
            position: 'head',
            type: 'script',
          },
          // {
          //   path: resolve('src/utils/webpack-plugins/assets/styles/border-1px.css'),
          //   position: 'head',
          //   type: 'style',
          // },
          // {
          //   path: resolve('src/utils/webpack-plugins/assets/js/webp-background-replacer.js'),
          //   position: 'head-end',
          //   type: 'script',
          //   attributes: { defer: true },
          // },
        ],
      }),
      new VueLoaderPlugin(),
      ...createHtmlPlugins(isProduction),
    ],
    resolve: {
      extensions: ['.js', '.ts', '.vue', '.json'],
      alias: {
        '@': resolve('src'),
        '@components': resolve(pagesPath.components),
        '@pages': resolve(pagesPath.pages),
        '@utils': resolve(pagesPath.utils),
        '@assets': resolve(pagesPath.assets),
      },
    },
    cache: {
      type: 'filesystem',
      buildDependencies: { config: [__filename] },
      cacheDirectory: resolve('.webpack-cache'),
    },
  };
}

module.exports = getCommonConfig;
