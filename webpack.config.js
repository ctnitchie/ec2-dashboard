module.exports = {
  entry: {
    app: './www/src/start.js',
  },
  output: {
    path: __dirname + '/www/scripts',
    filename: '[name].js',
    sourceMapFilename: '[name].js.map'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'es2017', 'react', 'stage-2', 'stage-3']
        }
      },
      // Add jQuery global for Bootstrap
      {
        loader: 'imports',
        test: /\.js$/,
        query: {
          $: 'jquery',
          jQuery: 'jquery',
        }
      }
    ]
  }
};
