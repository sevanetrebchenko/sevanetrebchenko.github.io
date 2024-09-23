
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env) => {
  const isProduction = env === 'production';

  return {
    entry: {
      main: './src/index.js'
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'build'),
    },
    devtool: isProduction ? 'source-map' : 'inline-source-map',
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
      fallback: {
        "path": require.resolve("path-browserify"),
        "process": require.resolve("process/browser")
      }
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
          test: /\.(css)$/,
          exclude: /node_modules/,
          use: [
            'style-loader', // Include this if you're using CSS
            'css-loader',
          ],
        },
        // {
        //   test: /\.svg/,
        //   exclude: /node_modules/,
        //   use: [
        //     '@svgr/webpack'
        //   ],
        // },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        // use index.html in the public directory as the base template for the generated html page
        template: path.join(__dirname, 'public', 'index.html')
      }),
      // Optionally add the ProvidePlugin if you're using process
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    ]
  }
};