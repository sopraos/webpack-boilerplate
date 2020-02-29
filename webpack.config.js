// Webpack configuration
// ===\===================

/**
 * DÉPENDANCES
 */
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const chalk = require('chalk');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

/**
 * PLUGINS
 */
// Plugin Supprimer inutilisé | Supprimer les entrées inutilisées
class deleteUnusedEntriesJsPlugin {
	constructor(entriesToDelete = []) {
		this.entriesToDelete = entriesToDelete;
	}
	apply(compiler) {
		compiler.hooks.emit.tapAsync('deleteUnusedEntriesJsPlugin', (compilation, callback) => {
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
class assetOutputDisplayPlugin {
	constructor(outputPath, friendlyErrorsPlugin) {
		this.outputPath = outputPath;
		this.friendlyErrorsPlugin = friendlyErrorsPlugin;
	}
	apply(compiler) {
		compiler.hooks.emit.tapAsync('assetOutputDisplayPlugin', (compilation, callback) => {
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
	allowedHosts: [], //.localhost
	entry: {
		'js/app': './assets/js/app.js',
		'css/app': './assets/scss/app.scss'
	},
	deleteUnusedEntries: ['css/app'],
};

// Le répertoire du projet où les ressources compilées seront stockées
const setOutputPath = path.resolve(__dirname, 'public/build/');
// Le chemin public utilisé par le serveur web pour accéder au répertoire précédent
const setPublicPath = '/build'.replace(/\/$/,'') + '/';
// Serveur d'URL
const devServerUrl = `${!settings.useDevServerInHttps ? 'http' : 'https'}://localhost:${settings.port}/`.replace(/\/$/,'') + setPublicPath;

module.exports = env => {
	const isProdMode = env.production === true;
	const cssLoaders = [
		{ loader: 'css-loader', options: { sourceMap: !isProdMode, importLoaders: 1 } },
		{ loader: 'postcss-loader', options: { ident: 'postcss', sourceMap: !isProdMode } },
	];

	console.log('Running webpack ...');
	console.log();

	// Base de configuration
	const config = {
		mode: isProdMode ? 'production' : 'development',
		context: __dirname,
		entry: settings.entry,
		output: {
			filename: isProdMode ? '[name].[contenthash].js' : '[name].js',
			path: setOutputPath,
			pathinfo: !isProdMode,
			publicPath: isProdMode ? setPublicPath : devServerUrl
		},
		module: {
			rules: [
				{// Js
					enforce: 'pre',
					test: /\.jsx?$/,
					exclude: /node_modules/,
					loader: 'eslint-loader',
					options: { cache: true, emitWarning: true, }
				},
				{
					test: /\.jsx?$/,
					exclude: /(node_modules|bower_components)/,
					loader: 'babel-loader',
					options: { cacheDirectory: true }
				},
				{// STYLE CSS
					test: /\.css$/i,
					oneOf: [
						{
							resourceQuery: /module/,
							use: [MiniCssExtractPlugin.loader,
								...cssLoaders,
							]
						},
						{
							use: [MiniCssExtractPlugin.loader,
								...cssLoaders,
							]
						}
					]
				},
				{// STYLE
					test: /\.s[ac]ss$/i,
					use: [MiniCssExtractPlugin.loader,
						...cssLoaders,
						{ loader: 'sass-loader', options: { sourceMap: !isProdMode } },
					]
				},
				{// Images
					test: /\.(png|jpe?g|gif|ico|svg|webp)$/i,
					use: [{
						loader: 'file-loader',
						options: {
							name: `images/[name]${!isProdMode ? '' : '.[contenthash]'}.[ext]`,
							publicPath: !isProdMode ? devServerUrl : setPublicPath
						}
					}]
				},
				// Fonts
				{
					test: /\.(woff|woff2|ttf|eot|otf)$/i,
					use: [{
						loader: 'file-loader',
						options: {
							name: `fonts/[name]${!isProdMode ? '' : '.[contenthash]'}.[ext]`,
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
			https: settings.useDevServerInHttps,
			allowedHosts: settings.allowedHosts,
		},
		plugins: [
			// Extrait css
			new MiniCssExtractPlugin({
				filename: isProdMode ? '[name].[contenthash].css' : '[name].css',
				chunkFilename: isProdMode ? '[id].[contenthash].css' : '[id].css',
				ignoreOrder: false,
			}),

			// Supprimer les entrées inutilisées
			new deleteUnusedEntriesJsPlugin(settings.deleteUnusedEntries),

			// Manifest
			new ManifestPlugin({
				// Par convention, nous supprimons la barre oblique d'ouverture sur les clés manifestes
				seed: {},
				basePath: setPublicPath.replace(/^\//, ''),
				writeToFileEmit: true
			}),

			// Nettoyer
			new CleanWebpackPlugin({
				root: setOutputPath,
				verbose: false,
				dry: false,
				cleanOnceBeforeBuildPatterns: ['**/*'],
			})
		]
	};

	// FriendlyErrorsWebpackPlugin
	function friendlyErrorPluginUtil() {
		const friendlyErrorsPluginOptions = {
			clearConsole: false,
			additionalTransformers: [],
			additionalFormatters: [],
			compilationSuccessInfo: { messages: [] }
		};

		return new FriendlyErrorsWebpackPlugin(friendlyErrorsPluginOptions);
	}
	const friendlyErrorPlugin = friendlyErrorPluginUtil();
	// Renvoie le chemin de sortie, mais en tant que chaîne relative (par exemple, web/build)
	const getRelativeOutputPath = config.output.path.replace(config.context + path.sep, '');

	if (isProdMode) {
		config.plugins.push(friendlyErrorPlugin, new assetOutputDisplayPlugin(getRelativeOutputPath, friendlyErrorPlugin));
	} else {
		config.plugins.push(friendlyErrorPlugin);
	}

	// Optimization config
	if (isProdMode) {
		config.optimization = {
			minimizer: [
				new TerserPlugin({
					sourceMap: false,
					cache: true,
					parallel: true,
				}),
				new OptimizeCSSAssetsPlugin({
					cssProcessorPluginOptions: {map: { inline: false, annotation: true } },
				})
			]
		};
	}

	return config;
};
