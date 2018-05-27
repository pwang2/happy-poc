const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const WebpackBar = require('webpackbar')
const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const HtmlWebpackTemplateResourceReplacementPlugin = require('html-webpack-template-resource-replacement-plugin')

const dev = (process.env.NODE_ENV || 'development') === 'development'
const publicPath = 'dist/'
const context = process.env.PLUGIN_CWD

if (!context) {
  throw new Error('environment variable PLUGIN_CWD is required to process')
}

function getDevConfig() {
  const configFile = path.resolve(context, 'xe.config.js')
  const { dev } =require(configFile) //eslint-disable-line
  return { useCdk: true, ...dev } // use cdk by default
}

function instrumentViewFiles() {
  const views = glob.sync(path.resolve(context, 'src/server/views/*.html'))
  return views.map((template) => {
    const filename = path.relative(context, template)
    const options = { alwaysWriteToDisk: true, template, filename }
    return new HtmlWebpackPlugin(options)
  })
}

module.exports = {
  mode: dev ? 'development' : 'production',
  context,
  devtool: '#source-map',
  entry: path.resolve(__dirname, './clientEntry.js'),
  output: {
    path: path.resolve(context, 'dist'),
    publicPath,
    jsonpFunction: 'webpack4Jsonp',
    filename: dev ? `[name].js` : `[chunkhash].js`
  },
  resolve: {
    modules: [path.join(__dirname, 'node_modules'), 'node_modules'],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
      '@client': path.join(context, './src/client')
    }
  },
  resolveLoader: {
    modules: [path.join(__dirname, 'node_modules'), 'node_modules']
  },
  module: {
    rules: [
      { test: /\.vue$/, exclude: /node_modules/, loader: 'vue-loader' },
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      {
        test: /\.css$/,
        use: [{ loader: 'vue-style-loader' }, { loader: 'css-loader' }]
      },
      {
        test: /\.(jp|pn|sv)g$/,
        loader: 'url-loader',
        options: { limit: 8192, name: 'images/[hash].[ext]' }
      },
      {
        test: /\.(woff2?|ttf|eot)$/,
        loader: 'url-loader',
        options: { limit: 8192, name: 'fonts/[hash].[ext]' }
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    ...instrumentViewFiles(),
    new HtmlWebpackTemplateResourceReplacementPlugin(),
    new HtmlWebpackHarddiskPlugin(),
    new WebpackBar({ profile: process.env.WEBPACK_PROFILE === 'true' })
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: new RegExp(`${__dirname}[\\/]node_modules[\\/]`),
          name: 'xe-vendors',
          chunks: 'all'
        },
        appCommons: {
          test: new RegExp(`${context}[\\/]node_modules[\\/]`),
          name: 'vendors',
          chunks: 'initial'
        }
      }
    }
  }
}

if (process.env.WEBPACK_BUNDLE_ANALYZE === 'true') {
  // eslint-disable-next-line
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
  module.exports.plugins.push(new BundleAnalyzerPlugin())
}
// serve property is only legit when webpack.config.js to webpack-serve
if (process.env.WEBPACK_SERVE) {
  module.exports.serve = {
    port: process.env.WEBPACK_SERVE_PORT || 8888,
    dev: {
      logLevel: 'warn',
      publicPath: '/dist/'
    }
  }
}
