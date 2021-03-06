import webpack from "webpack";

import glob from "glob";
import path from "path";

import ExtractTextPlugin from "extract-text-webpack-plugin";
import HtmlPlugin from "html-webpack-plugin";
import CleanupPlugin from "webpack-cleanup-plugin";
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";

const CONFIG = {
    isProd: (process.env.NODE_ENV === 'production'),
    paths: {
        src: (file?: string) => path.join('src/assets', file || ''),
        dst: (file?: string) => path.join('out', file || ''),
        www: (file?: string) => path.join('src/www', file || '')
    }
};

function makeEntries() {
    type Entries = { [name: string]: string }

    const src = `./${CONFIG.paths.src('js')}/`;
    const entries: Entries = {};

    glob.sync(path.join(src, '/**/main.ts'))
        .map(file => `./${file}`)
        .forEach(file => {
            let name = path.dirname(file);
            name = name.substr(name.lastIndexOf('/') + 1);
            entries[name] = file;
        });
    return entries;
}

function makeTemplates() {
    return glob.sync(path.join(CONFIG.paths.www(), '/**/*.html'))
        .map(file => {
            let chunk: string = file.replace(CONFIG.paths.www() + '/', '');
            chunk = chunk.substr(0, chunk.indexOf('/')) || 'home';
            const chunks = ['manifest', 'vendor', 'common', chunk];

            return new HtmlPlugin({
                filename: file.substr(file.indexOf('/') + 1),
                template: file,
                inject: true,
                chunks: chunks,
                cache: true,
                chunksSortMode(a: any, b: any) {
                    return chunks.indexOf(a.names[0]) - chunk.indexOf(b.names[0]);
                },
                minify: {
                    collapseWhitespace: CONFIG.isProd,
                    removeComments: CONFIG.isProd
                }
            });
        });
}

const extractCss = new ExtractTextPlugin({
    filename: CONFIG.isProd ? 'static/css/[name]-[chunkhash:8].css' : 'static/css/[name].css',
    disable: false,
    allChunks: true,
});

const plugins = (() => {
    const ProvidePlugin = webpack.ProvidePlugin;
    const HotModuleReplacementPlugin = webpack.HotModuleReplacementPlugin;

    let plugins = [
        new ProvidePlugin({
            // $: 'jquery'
        }),
        extractCss,
        new CleanupPlugin()
    ].concat(makeTemplates());

    if (CONFIG.isProd) {
        plugins = plugins.concat([
            new OptimizeCssAssetsPlugin({
                assetNameRegExp: /\.css$/,
                cssProcessor: require('cssnano'),
                cssProcessorOptions: {discardComments: {removeAll: true}},
                canPrint: true
            })
        ]);
    } else {
        plugins = plugins.concat([
            new HotModuleReplacementPlugin()
        ]);
    }
    return plugins;
})();

export default {
    mode: CONFIG.isProd ? 'production' : 'development',
    entry: Object.assign({vendor: ['common']}, makeEntries()),
    output: {
        path: path.resolve(CONFIG.paths.dst()),
        filename: CONFIG.isProd ? 'static/js/[name]-[chunkhash:8].js' : 'static/js/[name].js',
        publicPath: "/",
        chunkFilename: CONFIG.isProd ? 'static/js/[name]-[chunkhash:8].js' : 'static/js/[name].js',
    },
    resolve: {
        alias: {
            common: `./${CONFIG.paths.src('js')}/common/common.ts`
        },
        extensions: ['.js', '.ts', '.json']
    },
    optimization: {
        minimize: CONFIG.isProd,
        removeEmptyChunks: true,
        splitChunks: {
            chunks: 'all',
            name: 'vendor'
        },
        runtimeChunk: {
            name: 'manifest',
        }
    },
    module: {
        rules: [{
            test: /\.ts$/,
            use: [{
                loader: 'ts-loader'
            }, {
                loader: 'angular2-template-loader'
            }]
        }, {
            test: /\.html$/,
            use: 'raw-loader'
        }, {
            test: /\.css/,
            use: extractCss.extract({
                use: [{
                    loader: 'css-loader'
                }],
                fallback: 'style-loader'
            })
        }, {
            test: /\.less$/,
            use: extractCss.extract({
                use: [{
                    loader: 'css-loader',
                }, {
                    loader: 'less-loader',
                    options: {importLoaders: 1}
                }],
                fallback: 'style-loader'
            })
        }, {
            test: /\.(eot|woff|woff2|ttf)$/,
            use: [{
                loader: 'file-loader',
                options: {
                    limit: 10240,
                    name: CONFIG.isProd ? 'static/fonts/[name]-[hash:8].[ext]' : 'static/fonts/[name].[ext]',
                    publicPath: '/'
                }
            }]
        }, {
            test: /\.(svg|png|jpg|gif)$/,
            use: [{
                loader: 'file-loader',
                options: {
                    limit: 10240,
                    name: CONFIG.isProd ? 'static/images/[name]-[hash:8].[ext]' : 'static/images/[name].[ext]',
                    publicPath: '/'
                }
            }]
        }]
    },
    plugins: plugins,
    devServer: {
        contentBase: path.resolve('out/'),
        inline: true,
        hot: true
    },
    devtool: 'cheap-source-map',
};
