/// <reference path="node_modules/webpack/types.d.ts" />

const path = require('path');
const fs = require('fs');

/** @type {Configuration} */
module.exports = {
    entry: {
        // Auto-generate entry points for each .ts file
        ...(fs.readdirSync(path.join(__dirname, 'src'))
            .filter(file => file.endsWith('.ts'))
            .reduce((entries, file) => {
                const name = file.replace('.ts', '');
                entries[name] = path.join(__dirname, 'src', file);
                return entries;
            }, {}))
    },
    output: {
        globalObject: 'this',
        filename: '[name].js',
        library: { name: 'VisorCore', type: 'umd' },
        path: path.resolve(__dirname, 'dist'),
        chunkFormat: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: require.resolve('./tsconfig.json') // Absolute path
                    }
                },
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    mode: 'production',
    target: 'es2015'
};
