<template>
    <div id="app">
        <Navbar/>
        <router-view></router-view>
        <VFab/>
        <notifications group="foo" position="bottom left"/>
    </div>
</template>

<script>
    import Navbar from './components/Navbar.vue';
    import SplashDashboard from './components/Splash.vue';
    import VFab from './components/VFab.vue';
    import http from './services/HttpService';

    export default {
        name: 'App',
        components: {
            Navbar,VFab,
            SplashDashboard
        },
        mounted : function () {
            // this.interceptRequest();
            // this.interceptResponses();
        },
        methods: {
            // interceptRequest : function() {
            //     http.interceptors.request.use( (config) => {
            //         console.log('Request');
            //         return config;
            //     }, function(err) {
            //         console.log(err);
            //         return Promise.reject(err);
            //     });
            // },
            // interceptResponses : function(){
            //     http.interceptors.response.use( (config) => {
            //         this.$store.state.makingRequest = false;
            //         console.log('Response');
            //         return config;
            //     }, function(err) {
            //         console.log(err);
            //         return Promise.reject(err);
            //     });
            // }
        }
    };
</script>

<style lang="scss">
    @import './main';
    @font-face {
        font-family: 'FontAwesome';
        src: url('./assets/fonts/fontawesome-webfont.eot?v=4.7.0');
        src: url('./assets/fonts/fontawesome-webfont.eot?#iefix&v=4.7.0') format("embedded-opentype"), url("./assets/fonts/fontawesome-webfont.woff2?v=4.7.0") format("woff2"), url("./assets/fonts/fontawesome-webfont.woff?v=4.7.0") format("woff"), url("./assets/fonts/fontawesome-webfont.ttf?v=4.7.0") format("truetype"), url("./assets/fonts/fontawesome-webfont.svg?v=4.7.0#fontawesomeregular") format("svg");
        font-weight: normal;
        font-style: normal
    }

    @font-face {
        font-family: 'Header';
        src: url('./assets/fonts/font-header.eot'); /* IE9 Compat Modes */
        src: url('./assets/fonts/font-header.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
        url('./assets/fonts/font-header.woff') format('woff'), /* Pretty Modern Browsers */
        url('./assets/fonts/font-header.ttf')  format('truetype'), /* Safari, Android, iOS */
        url('./assets/fonts/font-header.svg#svgFontName') format('svg'); /* Legacy iOS */
    }

    @font-face {
        font-family: 'Body';
        src: url('./assets/fonts/font-body.eot'); /* IE9 Compat Modes */
        src: url('./assets/fonts/font-body.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
        url('./assets/fonts/font-body.woff') format('woff'), /* Pretty Modern Browsers */
        url('./assets/fonts/font-body.ttf')  format('truetype'), /* Safari, Android, iOS */
        url('./assets/fonts/font-body.svg#svgFontName') format('svg'); /* Legacy iOS */
    }

    @font-face {
        font-family: 'Body-Regular';
        src: url('./assets/fonts/font-body-regular.eot'); /* IE9 Compat Modes */
        src: url('./assets/fonts/font-body-regular.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
        url('./assets/fonts/font-body-regular.woff') format('woff'), /* Pretty Modern Browsers */
        url('./assets/fonts/font-body-regular.ttf')  format('truetype'), /* Safari, Android, iOS */
        url('./assets/fonts/font-body-regular.svg#svgFontName') format('svg'); /* Legacy iOS */
    }
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif, 'fontawesome';
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
    }

    body {
        margin: 0;
    }
</style>
