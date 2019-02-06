const webpack = require('webpack');
module.exports = {
    configureWebpack: {
        module: {
            rules: [

                    {
                        test: require.resolve('snapsvg'),
                        use: 'imports-loader?this=>window,fix=>module.exports=0',
                    },
                    {
                        test: /\.(ogg|ogv)$/,
                        use: [
                            {
                                loader: 'file-loader',
                                options: {
                                    name: '/media/[name].[ext]'
                                }
                            }
                        ]
                    }
            ]
        },
        plugins: [
            new webpack.ProvidePlugin({
                $: 'jquery',
                jquery: 'jquery',
                'window.jQuery': 'jquery',
                'window.$': 'jquery',
                jQuery: 'jquery',
                Popper: ['popper.js', 'default'],
                summernote: 'summernote'
            })
        ]
    }
}