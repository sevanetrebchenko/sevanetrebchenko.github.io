
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env) => {
  const isProduction = env === 'production';

  return {
    entry: {
      main: './src/index.js'
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname + '/build'),
    },
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    target: 'web',
    devServer: {
      port: '3000',
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
        // use index.html in the public directory as the base template for the generated html page
        template: path.join(__dirname, 'public', 'index.html')
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: './public/posts.json',
            to: './posts.json'
          },
          {
            from: './public/posts',
            to: './posts'
          }
        ],
      }),
    ]
  }
};