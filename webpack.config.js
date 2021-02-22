// Webpack configuration
// ===\===================
/**
 * DÉPENDANCES
 */
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const chalk = require('chalk');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

// PLUGINS PERSONNALISER

// Plugin Supprimer inutilisé | Supprimer les entrées inutilisées
class deleteUnusedEntriesJsPlugin {
	constructor(entriesToDelete = []) {
		this.entriesToDelete = entriesToDelete;
	}
	apply(compiler) {
		const deleteEntries = (compilation) => {
			compilation.chunks.forEach((chunk) => {
				if (this.entriesToDelete.includes(chunk.name)) {
					const removedFiles = [];

				  // Recherchez d'abord les fichiers principaux à supprimer
				  for (const filename of Array.from(chunk.files)) {
				    if (/\.js?(\?[^.]*)?$/.test(filename)) {
				      removedFiles.push(filename);
				      // Supprimer le fichier de sortie
				      compilation.deleteAsset(filename);
				      // Supprimer le fichier afin qu'il ne soit pas vidé dans le manifeste
				      chunk.files.delete(filename);
				    }
				  }

				  // Puis recherchez également dans les fichiers auxiliaires les cartes source
				  for (const filename of Array.from(chunk.auxiliaryFiles)) {
				    if (removedFiles.map(name => `${name}.map`).includes(`${filename}`)) {
				      removedFiles.push(filename);
				      // Supprimer le fichier de sortie
				      compilation.deleteAsset(filename);
				      // Supprimer le fichier afin qu'il ne soit pas vidé dans le manifeste
				      chunk.auxiliaryFiles.delete(filename);
				    }
				  }

					// vérification de l'intégrité: assurez-vous que 1 ou 2 fichiers ont été supprimés
					// s'il y a un cas limite où plus de fichiers .js
					// ou 0 fichiers .js pourraient être supprimés, je préfère une erreur
				  if (removedFiles.length === 0 || removedFiles.length > 2) {
				    throw new Error(`Problem deleting JS entry for ${chunk.name}: ${removedFiles.length} files were deleted (${removedFiles.join(', ')})`);
				  }
				}
			});
		};

		compiler.hooks.compilation.tap('deleteUnusedEntriesJsPlugin', (compilation) => {
			// compilation.hooks.additionalAssets.tap('DeleteUnusedEntriesJsPlugin', function() {
			compilation.hooks.additionalAssets.tap('DeleteUnusedEntriesJsPlugin', function() {
				deleteEntries(compilation);
			});
		});
	}
}

//Plugin Friendly Errors Webpack Plugin
class assetOutputDisplayPlugin {
	constructor(outputPath, friendlyErrorsPlugin) {
    this.outputPath = outputPath;
    this.friendlyErrorsPlugin = friendlyErrorsPlugin;
	}
  apply(compiler) {
		// Réinitialisation complète des messages pour éviter d’ajouter de plus en plus de messages lors de l’utilisation de la "watch".
    compiler.hooks.emit.tapAsync('AssetOutputDisplayPlugin', (compilation, callback) => {
			this.friendlyErrorsPlugin.compilationSuccessInfo.messages = [
				`${chalk.yellow(Object.keys(compilation.assets).length)} fichiers écrits dans  ${chalk.yellow(this.outputPath)}`
			];
			callback();
    });
  }
}

// Variables
const log = console.log;
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
		{ loader: 'postcss-loader', options: { sourceMap: !isProdMode } },
	];

	log(chalk.hex('#DEADED').bold('Running webpack...'));
	log();

		// Base de configuration
	const config = {
		mode: isProdMode ? 'production' : 'development',
		context: __dirname,
		entry: settings.entry,
		output: {
			filename: isProdMode ? '[name].[contenthash].js' : '[name].js',
			path: setOutputPath,
			pathinfo: !isProdMode,
			publicPath: setPublicPath
		},
		module: {
			rules: [
				{// JAVASCRIPT
					test: /\.m?js$/,
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
				{// STYLE SASS
					test: /\.s[ac]ss$/i,
					use: [MiniCssExtractPlugin.loader, ...cssLoaders,
						{
							loader: 'sass-loader',
							options: {implementation: require('sass'), sourceMap: !isProdMode}
						},
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
				{// FONTS
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
		resolve: { extensions: ['.wasm', '.mjs', '.js', '.json', '.jsx', '.vue', '.ts', '.tsx'] },
		stats: false,
		devtool: isProdMode ? false : 'inline-cheap-module-source-map',
		// target: 'last 4 versions',
		target: isProdMode ? 'browserslist' : 'web',
		devServer: {
			port: settings.port,
			contentBase: path.join(__dirname, 'public'),
			publicPath: setPublicPath,
			headers: { 'Access-Control-Allow-Origin': '*' },
			hot: isProdMode ? false : true,
			overlay: {
				warnings: true,
				errors: true,
			},
			clientLogLevel: 'silent',
			quiet: true,
			compress: true,
			historyApiFallback: true,
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
			new WebpackManifestPlugin({
				// Par convention, nous supprimons la barre oblique d'ouverture sur les clés manifestes
				seed: {},
				basePath: setPublicPath.replace(/^\//, ''),
				writeToFileEmit: true
			}),
			// Nettoyer
			new CleanWebpackPlugin({
				root: setOutputPath,
				dry: false,
				cleanOnceBeforeBuildPatterns: ['**/*'],
			})
		]
	};

	// FUNCTION PLUGINS
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
			minimize: true,
			minimizer: [
				new TerserPlugin({
					parallel: true,
				}),
				new CssMinimizerPlugin()
			]
		};
	}

	// RETURN CONFIG
	return config;
}
