// Webpack configuration
// ===\===================

/**
 * DÉPENDANCES
 */
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const chalk = require('chalk');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

/**
 * PLUGINS
 */
// Plugin Supprimer inutilisé | Supprimer les entrées inutilisées
class DeleteUnused {
	constructor(entriesToDelete = []) {
		this.entriesToDelete = entriesToDelete;
	}
	apply(compiler) {
		compiler.hooks.emit.tapAsync('DeleteUnused', (compilation, callback) => {
			compilation.chunks.forEach((chunk) => {
				if (this.entriesToDelete.includes(chunk.name)) {
					let fileDeleteCount = 0; // eslint-disable-line
					chunk.files.forEach((filename) => {
						if (/\.js(\.map)?(\?[^.]*)?$/.test(filename)) {
							fileDeleteCount++;
							delete compilation.assets[filename];
							chunk.files.splice(chunk.files.indexOf(filename), 1);
						}
					});
				}
			});
			callback();
		});
	}
}
// Plugin Friendly Errors Webpack Plugin
class FriendlyErrors {
	constructor(outputPath, friendlyErrorsPlugin) {
		this.outputPath = outputPath;
		this.friendlyErrorsPlugin = friendlyErrorsPlugin;
	}
	apply(compiler) {
		compiler.hooks.emit.tapAsync('FriendlyErrors', (compilation, callback) => {
			this.friendlyErrorsPlugin.compilationSuccessInfo.messages = [
				`${chalk.yellow(Object.keys(compilation.assets).length)} fichiers écrits dans ${chalk.yellow(this.outputPath)}`
			];
			callback();
		});
	}
}

/**
 * VARIABLES
 */
let settings = {
	port: 8080,
	useDevServerInHttps: false,
};

// Le répertoire du projet où les ressources compilées seront stockées
const setOutputPath = path.resolve(__dirname, 'public/build/');
// Le chemin public utilisé par le serveur web pour accéder au répertoire précédent
const setPublicPath = '/build'.replace(/\/$/,'') + '/';
// Serveur d'URL
const devServerUrl = `${!settings.useDevServerInHttps ? 'http' : 'https'}://localhost:${settings.port}/`.replace(/\/$/,'') + setPublicPath;

module.exports = env => {
	const isProdMode = env.production === true;
	// Base de configuration
	const config = {
		mode: isProdMode ? 'production' : 'development',
		context: __dirname,
		entry: {
			'js/app': './assets/js/app.js',
			'css/app': './assets/scss/app.scss',
		},
		output: {
			filename: isProdMode ? '[name].[chunkhash:8].js' : '[name].js',
			path: setOutputPath,
			pathinfo: !isProdMode,
			publicPath: isProdMode ? setPublicPath : devServerUrl
		},
		module: {
			rules: [
				// Javascripts
				{
					enforce: 'pre',
					test: /\.jsx?$/,
					exclude: /node_modules/,
					loader: 'eslint-loader',
					options: { cache: true, emitWarning: true, }
				},
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: { cacheDirectory: true }
					}
				},
				// Stylesheets
				{
					test: /\.s[ac]ss$/,
					exclude: /node_modules/,
					use: [MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader', options: {
								sourceMap: !isProdMode,
								importLoaders: 1
							}
						},
						{ loader: 'postcss-loader', options: { sourceMap: !isProdMode } },
						{ loader: 'sass-loader', options: { sourceMap: !isProdMode } },
					]
				},
				// Images
				{
					test: /\.(png|jpe?g|gif|ico|svg|webp)$/,
					use: [{
						loader: 'file-loader',
						options: {
							name: `images/[name]${!isProdMode ? '' : '.[hash:8]'}.[ext]`,
							publicPath: !isProdMode ? devServerUrl : setPublicPath
						}
					}]
				},
				// Fonts
				{
					test: /\.(woff|woff2|ttf|eot|otf)$/,
					use: [{
						loader: 'file-loader',
						options: {
							name: `fonts/[name]${!isProdMode ? '' : '.[hash:8]'}.[ext]`,
							publicPath: !isProdMode ? devServerUrl : setPublicPath
						}
					}]
				}
			]
		},
		optimization: {},
		resolve: { extensions: ['.js', '.json', '.jsx'] },
		stats: false,
		devtool: isProdMode ? false : 'inline-cheap-module-source-map',
		devServer: {
			port: settings.port,
			contentBase: path.join(__dirname, 'public'),
			publicPath: setPublicPath,
			headers: { 'Access-Control-Allow-Origin': '*' },
			overlay: true,
			clientLogLevel: 'warning',
			quiet: true,
			compress: true,
			historyApiFallback: true,
			watchOptions: {
				ignored: /node_modules/
			},
			https: settings.useDevServerInHttps
		},
		plugins: [
			// Extrait css
			new MiniCssExtractPlugin({
				filename: isProdMode ? '[name].[contenthash:8].css' : '[name].css',
				chunkFilename: isProdMode ? '[id].[contenthash:8].css' : '[id].css',
			}),

			// Supprimer les entrées inutilisées
			new DeleteUnused(['css/app']),

			// Manifest
			new ManifestPlugin({
				// Par convention, nous supprimons la barre oblique d'ouverture sur les clés manifestes
				basePath: setPublicPath.replace(/^\//, ''),
				writeToFileEmit: true
			}),

			// Nettoyer
			new CleanWebpackPlugin(['**/*'], {
				root: setOutputPath,
				verbose: false,
				dry: false
			})
		]
	}; // Fin config

	// FriendlyErrorsWebpackPlugin
	function friendlyErrorPlugin() {
		// Renvoie le chemin de sortie, mais en tant que chaîne relative (par exemple, web/build)
		const getRelativeOutputPath = config.output.path.replace(config.context + path.sep, '');
		const FriendlyErrorsPluginOptions = {
			compilationSuccessInfo: { messages: [] },
			clearConsole: false,
			additionalFormatters: [],
			additionalTransformers: []
		};
		const FriendlyErrorPlugin = new FriendlyErrorsWebpackPlugin(FriendlyErrorsPluginOptions);

		if (isProdMode) {
			config.plugins.push(FriendlyErrorPlugin, new FriendlyErrors(getRelativeOutputPath, FriendlyErrorPlugin));
		} else { config.plugins.push(FriendlyErrorPlugin); }
	}
	friendlyErrorPlugin();

	// Optimization config
	if (isProdMode) {
		config.optimization = {
			minimizer: [
				new TerserPlugin({ sourceMap: false, }),
				new OptimizeCSSAssetsPlugin({
					cssProcessorPluginOptions: {map: { inline: false, annotation: true } },
				})
			]
		};
	}

	return config;
};
