

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './index.js',

  output: {
    filename: 'index.js',
    path: path.resolve(__dirname + '/dist'),
    chunkFilename: '[name].js'
  },

  mode: 'development',

  target: 'web',
  devServer: {
    port: '3000',

    // serve content rooted at the 'public' directory
    static: {
      directory: 'public'
    },
    open: true,
    hot: true,
    liveReload: true,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        // .js/.jsx files
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        }
      },
      {
        // .css files
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'public', 'index.html')
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/structure.json', to: './structure.json' },
      ],
    }),
  ]
};