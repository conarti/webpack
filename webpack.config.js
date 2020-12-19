const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin')

const isDev = process.env.NODE_ENV === 'development'
const isProd = !isDev

const filename = (ext) => (isDev ? `[name].${ext}` : `[name].[fullhash].${ext}`)

const optimization = () => {
  const config = {}
  if (isProd) {
    config.minimizer = [new OptimizeCssAssetsPlugin(), new TerserPlugin()]
  }
  return config
}

const plugins = () => {
  const config = [
    new HTMLWebpackPlugin({
      template: './index.html',
      minify: {
        removeComments: isProd,
        collapseWhitespace: isProd,
      },
    }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: filename('css'),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'favicon.ico',
          to: 'favicon.ico',
        },
      ],
    }),
  ]
  return config
}

const cssLoaders = (extra) => {
  const loaders = [MiniCssExtractPlugin.loader, 'css-loader']
  if (extra) loaders.push(extra)
  return loaders
}

const fileLoaders = (dir, webp) => {
  const loaders = [
    {
      loader: 'file-loader',
      options: {
        outputPath: dir,
        name: `${isDev ? '[name].' : ''}${isDev ? '' : '[hash].'}${
          webp ? 'webp' : '[ext]'
        }`,
      },
    },
  ]
  if (webp) {
    loaders.push({
      loader: ImageMinimizerPlugin.loader,
      options: {
        deleteOriginalAssets: false,
        minimizerOptions: {
          plugins: ['imagemin-webp'],
        },
      },
    })
  }
  return loaders
}

const babelOptions = (preset) => {
  const options = {
    presets: ['@babel/preset-env'],
    plugins: ['@babel/plugin-proposal-class-properties'],
  }
  if (preset) {
    options.presets.push(preset)
  }
  return options
}

module.exports = {
  context: path.resolve(__dirname, 'src'),
  mode: 'development',
  entry: ['@babel/polyfill', './index.js'],
  output: {
    filename: filename('js'),
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
  },
  devServer: {
    port: 3000,
    contentBase: path.resolve(__dirname, 'dist'),
    open: true,
    compress: true,
    hot: true,
  },
  devtool: isDev ? 'source-map' : false,
  target: isDev ? 'web' : 'browserslist',
  optimization: optimization(),
  resolve: {
    alias: {
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: plugins(),
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              attributes: {
                urlFilter: (attribute, value, resourcePath) => {
                  if (attribute === 'srcset') {
                    return false
                  }
                  return true
                },
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: cssLoaders(),
      },
      {
        test: /\.s[ac]ss$/i,
        use: cssLoaders('sass-loader'),
      },
      {
        test: /\.(gif|svg)$/i,
        use: fileLoaders('images'),
      },
      {
        test: /\.(jpe?g|png)$/i,
        use: fileLoaders('images', true),
      },
      {
        test: /\.(ttf|woff|woff2|eot|otf)$/,
        use: fileLoaders('fonts'),
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelOptions(),
        },
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelOptions('@babel/preset-react'),
        },
      },
    ],
  },
}
