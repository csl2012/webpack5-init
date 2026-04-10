const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackBar = require('webpackbar');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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

function createHtmlPlugins(isProduction) {
  return pages.map((page) => {
    return new HtmlWebpackPlugin({
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
    });
  });
}

function getCommonConfig(isProduction = false) {
  return {
    entry,
    output: {
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          include: path.resolve(__dirname, 'src'), // 只处理 src 目录下的 js 文件
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
                    modules: 'auto',
                  },
                ],
              ],
              plugins: [
                // 运行时转换，减少重复代码
                [
                  '@babel/plugin-transform-runtime',
                  {
                    corejs: 3, // 使用 core-js 3 提供 polyfill
                  },
                ],
              ],
              cacheDirectory: true, // 开启缓存
              ...(!isProduction && {
                cacheCompression: false, // 开发环境不压缩缓存文件
                compact: false, // 开发环境不压缩代码
              }),
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
                implementation: require('sass'),
                sassOptions: {
                  api: 'modern-compiler',
                },
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
            filename: 'images/[name].[fullhash][ext]',
          },
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[fullhash][ext]',
          },
        },
        {
          test: /\.(mp3|wav|ogg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'audio/[name].[fullhash][ext]',
          },
        },
        {
          test: /\.(mp4|webm|ogg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'video/[name].[fullhash][ext]',
          },
        },
      ],
    },
    plugins: [new WebpackBar(), ...createHtmlPlugins(isProduction)],
    resolve: {
      extensions: ['.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@assets': path.resolve(__dirname, 'src/assets'),
      },
    },
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
    },
  };
}

module.exports = getCommonConfig;
