

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
    static: {
      directory: path.join(__dirname, 'public')
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
      // Note (webpack v5+): 
      // asset/resource - file-loader
      // asset/inline - url-loader
      // asset/source - raw-loader

      // Use 'babel-loader' for loading .js/.jsx files.
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        }
      },
      {
        // Use 'style-loader' + 'css-loader' for loading .css files.
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      // {
      //   // Use 'asset/resource' for images.
      //   test: /\.(png|svg|jpg|jpeg|gif)$/i,
      //   exclude: /node_modules/, 
      //   type: 'asset/resource'
      // },
      // {
      //   // Use 'asset/resource' for fonts.
      //   test: /\.(woff|woff2|eot|ttf|otf)$/i,
      //   type: 'asset/resource',
      // },
      {
        // Use raw-loader to load .md files as raw text
        test: /\.md$/,
        exclude: [
          path.resolve(__dirname, '/node_modules/')
        ],
        use: [
          {
            loader: 'raw-loader'
          }
        ]
      }
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