const dotenv = require('dotenv');
const webpack = require('webpack');
const { URL } = require('url');
const { readFile } = require('fs');
const { join, resolve } = require('path');
const UglifyPlugin = require('uglifyjs-webpack-plugin');
const configureBabel = require('./babel.config.js');

// assign .env contents to process.env
dotenv.config();

// resolve directories
const dirRoot = resolve(__dirname);
const dirSource = resolve(dirRoot, 'src');
const dirOutput = resolve(dirRoot, 'web/js');
const dirModules = resolve(dirRoot, 'node_modules');

// ensure the public path is a valid URL
const publicPath = new URL(process.env.PUBLIC_PATH);

// mark dependencies for vendor bundle
const libs = ['react', 'react-dom', 'react-redux', 'react-router-dom', 'redux'];

module.exports = env => {
    const environment = [].concat(env);
    const babelOptions = configureBabel(environment);
    const isProd = environment.includes('production');

    console.log(`Environment: ${environment}`);

    // create the default config for development-like environments
    const config = {
        context: dirSource,
        entry: {
            client: resolve(dirSource, 'index.js')
        },
        output: {
            path: dirOutput,
            publicPath: publicPath.href,
            filename: '[name].js',
            chunkFilename: '[name].js'
        },
        module: {
            rules: [
                {
                    include: [dirSource],
                    test: /\.js$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: { ...babelOptions, cacheDirectory: true }
                        }
                    ]
                },
                {
                    test: /\.css$/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1
                            }
                        }
                    ]
                }
            ]
        },
        resolve: {
            modules: [dirRoot, dirModules],
            mainFiles: ['index'],
            extensions: ['.js']
        },
        plugins: [
            new webpack.NoEmitOnErrorsPlugin(),
            new webpack.EnvironmentPlugin({
                NODE_ENV: isProd ? 'production' : 'development'
            }),
            new webpack.DefinePlugin({
                PUBLIC_PATH: JSON.stringify(publicPath.origin)
            }),
            new webpack.DefinePlugin({
                THEME_PATH: JSON.stringify(process.env.THEME_PATH)
            })
        ],
        devServer: {
            contentBase: false,
            https: true,
            port: 8080,
            publicPath: '/'
        },
        devtool: 'source-map'
    };

    // modify the default config for production-like environments
    if (isProd) {
        // disable sourcemaps
        delete config.devtool;

        // add a second entry point for third-party runtime dependencies
        config.entry.vendor = libs;

        // add the CommonsChunk plugin to generate more than one bundle
        config.plugins.push(
            new webpack.optimize.CommonsChunkPlugin({
                names: ['vendor']
            })
        );

        // add the UglifyJS plugin to minify the bundle and eliminate dead code
        config.plugins.push(new UglifyPlugin());
    }

    return config;
};
