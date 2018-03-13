// Webpack configuration
// ===\===================

const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const imageminMozjpeg = require('imagemin-mozjpeg');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = env => {
	const isDevelopment = env.development === true;

	let config = {
		mode: isDevelopment ? 'development' : 'production',
		entry: {
			app: ['./src/assets/javascripts/app.js', './src/assets/stylesheets/app.scss']
		},
		devServer: {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
				'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
			},
			overlay: true,
			clientLogLevel: 'warning',
			watchContentBase: true,
			contentBase: path.join('./src/html')
		},
		module: {
			rules: [
				{
					enforce: 'pre',
					test: /\.js$/,
					exclude: /node_modules/,
					loader: 'eslint-loader'
				},
				{
					test: /\.js$/,
					exclude: /node_modules/,
					use: 'babel-loader'
				},
				{
					test: /\.(scss|css)$/,
					use: ExtractTextPlugin.extract({
						fallback: 'style-loader',
						use: [
							{
								loader: 'css-loader',
								options: {
									minimize: !isDevelopment,
									sourceMap: isDevelopment
								}
							},
							{
								loader: 'postcss-loader',
								options: {
									sourceMap: isDevelopment
								}
							},
							{
								loader: 'sass-loader',
								options: {
									sourceMap: isDevelopment
								}
							}
						]
					})
				},
				{
					test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf|wav)(\?.*)?$/,
					loader: 'file-loader',
					options: {
						name: `[name]${isDevelopment ? '' : '.[hash]'}.[ext]`,
						useRelativePath: !isDevelopment
					}
				}
			]
		},
		plugins: [
			new HtmlWebpackPlugin({
				template: './src/html/index.html',
				inject: true
			}),
			new ExtractTextPlugin({
				filename: '[name].css',
				disable: isDevelopment
			}),
			new ImageminPlugin({
				disable: isDevelopment,
				jpegtran: false,
				plugins: [
					imageminMozjpeg({
						quality: 100,
						progressive: true
					})
				]
			})
		]
	};

	// Plugins spécifiques Env
	if (!isDevelopment) {
		config.plugins.push(new CleanWebpackPlugin(['dist'], {
			root: path.resolve('./'),
			verbose: true,
			dry: false
		}));
		config.plugins.push(new ManifestPlugin());
	}

	return config;
};
