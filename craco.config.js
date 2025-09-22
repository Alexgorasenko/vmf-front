const { DefinePlugin } = require('webpack')

module.exports = {
    webpack: {
        alias: {
            '@ui': 'primereact',
            '@icons': 'primeicons',
            '@blocks': './src/Components/'
        },
        plugins: [
            new DefinePlugin({
                'process.env.INSTANCE': JSON.stringify(process.env.INSTANCE || 'origin')
            })
        ]
    }
}
