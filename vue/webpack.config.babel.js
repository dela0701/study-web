'use strict';


import webpack from "webpack";

import glob from "glob";
import path from "path";

import ExtractTextPlugin from "extract-text-webpack-plugin";
import AccessPlugin from "assets-webpack-plugin";
import HtmlPlugin from "html-webpack-plugin";
import CleanupPlugin from "webpack-cleanup-plugin";

const webConfig = {
    isProd: (process.env.NODE_ENV === 'production'),
    paths: {
        source: file => path.join('src/assets', file || ''),
        template: file => path.join('src/www', file || ''),
        dest: file => path.join('out', file || '')
    }
};

function makeEntries() {
    const src = `./${webConfig.paths.source('js')}/`;
    const entries = {};
    // glob.sync(path.join(src, '/**/main-*.js')).map((file) => './' + file)
    //     .forEach(file => {
    //         let name = file.replace(src, '').replace('main-', '');
    //         name = name.replace(path.extname(name), '');
    //         entries[name] = file;
    //     });

    glob.sync(path.join(src, '/**/main.js')).map(file => `./${file}`)
        .forEach(file => {
            let name = path.dirname(file);
            name = name.substr(name.lastIndexOf('/') + 1);
            entries[name] = file;
        });
    return entries;
}

function makeTemplates() {
    return glob.sync(path.join(webConfig.paths.template(), '/**/*.html'))
        .map(file => {
            return new HtmlPlugin({
                filename: file.substr(file.indexOf('/') + 1),
                template: file,
                inject: false,
                cache: true,
                minify: {
                    collapseWhitespace: webConfig.isProd,
                    removeComments: webConfig.isProd
                }
            });
        });
}

const plugins = (() => {
    const ProvidePlugin = webpack.ProvidePlugin;
    const CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
    const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

    return [
        new ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        }),
        new CommonsChunkPlugin({
            name: ['vendor', 'manifest']
        }),
        new ExtractTextPlugin({
            filename: webConfig.isProd ? 'assets/css/[name]-[chunkhash:8].css' : 'assets/css/[name].css',
            disable: false,
            allChunks: true,
        }),
        new CleanupPlugin()
    ]
        .concat(makeTemplates())
        .concat(webConfig.isProd ? [
            new AccessPlugin({
                filename: webConfig.paths.dest('assets/manifest.json')
            }),
            new UglifyJsPlugin({
                compress: {
                    warnings: false
                },
                output: {
                    comments: false,
                }
            })
        ] : []);
})();

module.exports = {
    entry: Object.assign({
        vendor: ['jquery', 'bootstrap', 'vue', 'moment', 'lodash']
    }, makeEntries()),
    output: {
        path: path.resolve(webConfig.paths.dest()),
        filename: webConfig.isProd ? 'assets/js/[name]-[chunkhash:8].js' : 'assets/js/[name].js',
        chunkFilename: webConfig.isProd ? 'assets/js/[name]-[chunkhash:8].js' : 'assets/js/[name].js',
    },
    resolve: {
        alias: {
            vue: webConfig.isProd ? 'vue/dist/vue.min.js' : 'vue/dist/vue.js'
        }
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: [/node_modules/],
            use: [{
                loader: 'babel-loader',
                options: {
                    presets: ['es2015']
                },
            }]
        }, {
            test: /\.less$/,
            use: ExtractTextPlugin.extract({
                use: [{
                    loader: 'css-loader',
                    options: {
                        minimize: webConfig.isProd
                    }
                }, {
                    loader: 'less-loader',
                    options: {importLoaders: 1}
                }],
                fallback: 'style-loader'
            })
        }, {
            test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
            use: [{
                loader: 'url-loader',
                options: {
                    limit: 30000,
                    name: webConfig.isProd ? 'assets/css/static/[name]-[hash:8].[ext]' : 'assets/css/static/[name].[ext]'
                }
            }]
        }, {
            test: /\.vue$/,
            exclude: [/node_modules/],
            loader: 'vue-loader'
        }]
    },
    plugins: plugins,
    devServer: {
        contentBase: path.resolve('www/')
    },
    devtool: 'cheap-source-map',
};