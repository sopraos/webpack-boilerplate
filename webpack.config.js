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
// Le répertoire du projet où les ressources compilées seront stockées
const setOutputPath = path.resolve(__dirname, 'public/build/');
// Le chemin public utilisé par le serveur web pour accéder au répertoire précédent
const setPublicPath = '/build'.replace(/\/$/,'') + '/';
// Serveur d'URL
const devServerUrl = 'http://localhost:8080/'.replace(/\/$/,'') + setPublicPath;

module.exports = env => {
	const isDevMode = env.development === true;
	// Base de configuration
	const config = {
		mode: isDevMode ? 'development' : 'production',
		context: __dirname,
		entry: {
			'js/app': './src/javascripts/app.js',
			'css/app': './src/stylesheets/app.scss',
		},
		output: {
			filename: isDevMode ? '[name].js' : '[name].[chunkhash:8].js',
			path: setOutputPath,
			pathinfo: isDevMode,
			publicPath: isDevMode ? devServerUrl : setPublicPath
		},
		module: {
			rules: [
				// Javascripts
				{
					enforce: 'pre',
					test: /\.jsx?$/,
					exclude: /node_modules/,
					loader: 'eslint-loader',
					options: {  cache: true, emitWarning: true, }
				},
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: [
								['@babel/preset-env', {
									targets: {
										browsers: ['> 0.5%', 'last 2 versions', 'Firefox ESR', 'safari >= 7','not dead'],
										// forceAllTransforms: true
									},
									forceAllTransforms: true,
									modules: false,
									useBuiltIns: 'usage'
								}]
							],
							cacheDirectory: true
						}
					}
				},
				// Stylesheets
				{
					test: /\.s[ac]ss$/,
					exclude: /node_modules/,
					use: [
						isDevMode ? 'style-loader' : MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader', options: {
								minimize: !isDevMode,
								sourceMap: isDevMode,
								importLoaders: 1
							}
						}, {
							loader: 'postcss-loader', options: {
								sourceMap: isDevMode
							}
						}, {
							loader: 'sass-loader', options: {
								sourceMap: isDevMode,
							}
						}
					]
				},
				// Images
				{
					test: /\.(png|jpe?g|gif|ico|svg|webp)$/,
					use: [{
						loader: 'file-loader',
						options: {
							name: `images/[name]${isDevMode ? '' : '.[hash:8]'}.[ext]`,
							publicPath: isDevMode ? devServerUrl : setPublicPath // New fix url assets css
						}
					}]
				},
				// Fonts
				{
					test: /\.(woff|woff2|ttf|eot|otf)$/,
					use: [{
						loader: 'file-loader',
						options: {
							name: `fonts/[name]${isDevMode ? '' : '.[hash:8]'}.[ext]`,
							publicPath: isDevMode ? devServerUrl : setPublicPath // New fix url assets css
						}
					}]
				}
			]
		},
		resolve: { extensions: ['.js', '.json', '.jsx'] },
		stats: false,
		devtool: isDevMode ? 'inline-source-map' : false,
		// devtool: isDevMode ? 'inline-cheap-module-source-map' : false,
		devServer: {
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
			}
		},
		plugins: [
			// Extrait css
			new MiniCssExtractPlugin({
				filename: isDevMode ? '[name].css' : '[name].[contenthash:8].css',
				chunkFilename: isDevMode ? '[id].css' : '[id].[contenthash:8].css',
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
	};
	/**
	 * FriendlyErrorsWebpackPlugin
	 */
	// Renvoie le chemin de sortie, mais en tant que chaîne relative (par exemple, web/build)
	const getRelativeOutputPath = config.output.path.replace(config.context + path.sep, '');
	const FriendlyErrorsPluginOptions = {
		compilationSuccessInfo: { messages: [] },
		clearConsole: false,
		additionalFormatters: [],
		additionalTransformers: []
	};
	const FriendlyErrorPlugin = new FriendlyErrorsWebpackPlugin(FriendlyErrorsPluginOptions);
	if (isDevMode) {
		config.plugins.push(FriendlyErrorPlugin);
	} else {
		config.plugins.push(FriendlyErrorPlugin, new FriendlyErrors(getRelativeOutputPath, FriendlyErrorPlugin));
	}

	return config;
};
