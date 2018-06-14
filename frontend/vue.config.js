module.exports = {
    configureWebpack: {
        module: {
            rules: [

                    {
                        test: require.resolve('snapsvg'),
                        use: 'imports-loader?this=>window,fix=>module.exports=0',
                    },

            ]
        }
    }
}