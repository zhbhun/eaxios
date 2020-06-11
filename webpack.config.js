const path = require('path');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, './lib/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'axios.js',
    library: 'axios',
    libraryExport: 'default',
    libraryTarget: 'umd'
  },
  optimization: {
    minimize: false,
  }
};
