const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const ESLintPlugin = require("eslint-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const CopyPlugin = require("copy-webpack-plugin");

const path = require("path");
const argv = require("yargs").argv;

const debug = argv.debug !== undefined;
const lint = argv.linting;

const config = [{
    entry: {
        server: [
            path.join(__dirname, "/src/server/server.ts")
        ]
    },
    mode: debug ? "development" : "production",
    output: {
        path: path.join(__dirname, "/dist"),
        filename: "[name].js",
        devtoolModuleFilenameTemplate: debug ? "[absolute-resource-path]" : "[]"
    },
    externals: [nodeExternals()],
    devtool: "source-map",
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {}
    },
    target: "node",
    node: {
        __dirname: false,
        __filename: false
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            exclude: [/lib/, /dist/],
            loader: "ts-loader"
        }]
    },
    plugins: []
},
{
    entry: {
        client: [
            path.join(__dirname, "/src/client/client.tsx")
        ]
    },
    mode: debug ? "development" : "production",
    output: {
        path: path.join(__dirname, "/dist/web"),
        filename: "scripts/[name].js",
        libraryTarget: "umd",
        library: "team-request-app",
        publicPath: "/"
    },
    externals: {},
    devtool: "source-map",
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {}
    },
    target: "web",
    module: {
        rules: [{
            test: /\.tsx?$/,
            exclude: [/lib/, /dist/],
            loader: "ts-loader"
        },
        {
            test: /\.s[ac]ss$/i,
            use: [
                "style-loader",
                "css-loader",
                "sass-loader"
            ]
        }
        ]
    },
    plugins: [
        new Dotenv({
            systemvars: true
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: "src/public"
                }
            ]
        })
    ]
}
];

if (lint !== false) {
    config[0].plugins.push(new ESLintPlugin({ extensions: ["ts", "tsx"], failOnError: false }));
    config[1].plugins.push(new ESLintPlugin({ extensions: ["ts", "tsx"], failOnError: false }));
}

module.exports = config;
