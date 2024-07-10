var webpack = require("webpack");
// var HardSourceWebpackPlugin = require("hard-source-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  target: "node",
  output: {
    path: `${__dirname}/lib`,
    filename: "index.js",
    libraryTarget: "commonjs2",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      C3_VERSION: JSON.stringify(require("./package.json").version),
    }),
    // new HardSourceWebpackPlugin(),
  ],
  resolve: {
    modules: [
      "node_modules", // node_modules 内も対象とする
    ],
    extensions: [
      ".ts",
      ".js", // node_modulesのライブラリ読み込みに必要
    ],
  },
};
