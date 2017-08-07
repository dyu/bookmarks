var srcDir = process.env.SRC_DIR || './src'
var destFile = process.env.DEST_FILE || 'build.js'
var path = require('path')
var webpack = require('webpack')
var postcssPlugins = [require('autoprefixer')]
var webpackPlugins = [
  new webpack.LoaderOptionsPlugin({
    test: /\.vue$/i,
    options: {
      vue: {
        postcss: postcssPlugins
      },
      context: __dirname
    }
  })
]
var extensions = ['.js', '.ts', '.vue', '.json']
var alias = { 'vue$': 'v_/dist/vue.common.js' }
var loaders = [
  {
    test: /\.vue$/,
    loader: 'vue-loader',
    options: {
      loaders: {
        'scss': 'vue-style-loader!css-loader!sass-loader',
        'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax'
      }
    }
  },
  {
    test: /\.ts$/,
    loader: 'ts-loader'
  },
  {
    test: /\.json$/,
    loader: 'json-loader'
  },
  {
    test: /\.less$/,
    loader: 'less-loader!postcss-loader'
  },
  {
    test: /\.(png|jpg|gif|svg|ttf)$/,
    loader: 'file-loader',
    query: {
      name: '[name].[ext]?[hash]'
    }
  }
]

module.exports = {
  entry: srcDir + '/main.ts',
  target: destFile.endsWith('nw.js') ? 'node' : 'web',
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/dist/',
    filename: destFile
  },
  resolve: {
    extensions: extensions,
    alias: alias
  },
  module: {
    loaders: loaders
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true
  },
  devtool: '#eval-source-map',
  plugins: webpackPlugins
}

if (process.env.NODE_ENV === 'production') {
  var ClosureCompilerPlugin = require('webpack-closure-compiler')
  postcssPlugins.push(require('cssnano')())

  module.exports.devtool = '#source-map'
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = webpackPlugins.concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new ClosureCompilerPlugin({
      compiler: {
        language_in: 'ECMASCRIPT6',
        language_out: 'ECMASCRIPT5',
        compilation_level: 'SIMPLE'/*,
        create_source_map: true*/
      },
      concurrency: 3
    })
    /*new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })*/
  ])
} else {
  postcssPlugins.push(require('postcss-unique-selectors'))
}
