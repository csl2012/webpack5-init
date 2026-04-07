const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const isProduction = process.env.NODE_ENV === 'production';

const pages = [
  {
    name: 'index',
    title: 'Home Page',
  },
  {
    name: 'about',
    title: 'About Page',
  },
];

const entry = {};
pages.forEach((page) => {
  entry[page.name] = `./src/${page.name}/index.js`;
});

const plugins = [];
pages.forEach((page) => {
  plugins.push(
    // 单页面配置
    // new HtmlWebpackPlugin({
    //   template: path.resolve(__dirname, 'public/index.html'),
    //   filename: 'index.html',
    //   title: 'Single Page Application',
    //   inject: 'body',
    //   favicon: path.resolve(__dirname, 'public/favicon.ico'),
    //   minify: isProduction ? {
    //     removeComments: true,
    //     collapseWhitespace: true,
    //     removeAttributeQuotes: true
    //   } : false
    // })

    // 多页面配置
    new HtmlWebpackPlugin({
      template: `./src/${page.name}/index.html`,
      filename: `${page.name}.html`,
      chunks: [page.name],
      title: page.title,
      inject: 'body',
      favicon: path.resolve(__dirname, 'public/favicon.ico'),
      minify: isProduction
        ? {
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
          }
        : false,
    }),
  );
});

plugins.push(
  new MiniCssExtractPlugin({
    filename: isProduction ? 'css/[name].[contenthash].css' : 'css/[name].css',
    chunkFilename: isProduction
      ? 'css/[id].[contenthash].chunk.css'
      : 'css/[id].chunk.css',
  }),
);

// 进度条
plugins.push(
  new webpack.ProgressPlugin({
    activeModules: false,
    entries: true,
    handler: (percentage, message, ...args) => {
      const percent = Math.round(percentage * 100);
      process.stdout.write(`\r${percent}% ${message}`);
    },
    modules: true,
    modulesCount: 5000,
    profile: false,
    dependencies: true,
    dependenciesCount: 10000,
  }),
);

// 复制静态文件
plugins.push(
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
);

// Gzip压缩
if (isProduction) {
  plugins.push(
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),
  );
}

module.exports = {
  entry,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[contenthash].js',
    chunkFilename: 'js/[id].[contenthash].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'usage',
                  corejs: 3,
                },
              ],
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-object-rest-spread',
              '@babel/plugin-proposal-optional-chaining',
              '@babel/plugin-proposal-nullish-coalescing-operator',
              [
                '@babel/plugin-transform-runtime',
                {
                  corejs: 3,
                },
              ],
            ],
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: false,
              sourceMap: !isProduction,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['postcss-preset-env', 'autoprefixer'],
              },
              sourceMap: !isProduction,
            },
          },
        ],
      },
      // SCSS
      {
        test: /\.scss$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: false,
              sourceMap: !isProduction,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['postcss-preset-env', 'autoprefixer'],
              },
              sourceMap: !isProduction,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: !isProduction,
            },
          },
        ],
      },
      // Less
      // {
      //   test: /\.less$/,
      //   use: [
      //     isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
      //     {
      //       loader: 'css-loader',
      //       options: {
      //         modules: false,
      //         sourceMap: !isProduction
      //       }
      //     },
      //     {
      //       loader: 'postcss-loader',
      //       options: {
      //         postcssOptions: {
      //           plugins: [
      //             'postcss-preset-env',
      //             'autoprefixer'
      //           ]
      //         },
      //         sourceMap: !isProduction
      //       }
      //     },
      //     {
      //       loader: 'less-loader',
      //       options: {
      //         lessOptions: {
      //           javascriptEnabled: true
      //         },
      //         sourceMap: !isProduction
      //       }
      //     }
      //   ]
      // },
      {
        test: /\.html$/,
        use: 'html-loader',
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8192,
          },
        },
        generator: {
          filename: 'images/[name].[hash][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash][ext]',
        },
      },
      {
        test: /\.(mp3|wav|ogg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'audio/[name].[hash][ext]',
        },
      },
      {
        test: /\.(mp4|webm|ogg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'video/[name].[hash][ext]',
        },
      },
    ],
  },
  plugins,
  // 解析
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
  },
  optimization: {
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
  // 缓存
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
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
