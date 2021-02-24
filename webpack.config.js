const path = require('path');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, './lib/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'eaxios.js',
    library: 'eaxios',
    libraryExport: 'default',
    libraryTarget: 'umd'
  },
  optimization: {
    minimize: false,
  }
};
