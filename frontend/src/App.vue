<template>
    <div id="app">
        <Navbar/>
        <router-view></router-view>
        <notifications group="notification" position="bottom left">
            <template slot="body" slot-scope="props">
                <div
                        @click="props.close"
                        :class="{[props.item.type]: true}"
                        class="notification p-2 mb-1">
                    <div class="row">
                        <div class="col-9">
                            <b v-if="!props.item.title"> Notification </b>
                            <b><div v-html="props.item.title"></div></b>
                        </div>
                        <div class="offset-1 col-2">
                            <a class="close" @click="props.close">
                                <i class="fa fa-fw fa-close"></i>
                            </a>
                        </div>
                    </div>
                    <div v-html="props.item.text">
                    </div>
                </div>
            </template>
        </notifications>

        <VBottomNav></VBottomNav>
    </div>
</template>

<script>
    import Navbar from './components/Navbar.vue';
    import SplashDashboard from './components/Splash.vue';
    import VFab from './components/VFab.vue';
    import VBottomNav from './components/VBottomNav';
    import Auth from "./services/authService";
    import {mapMutations, mapState} from 'vuex';

    export default {
        name: 'App',
        components: {
            Navbar,
            SplashDashboard,
            VBottomNav
        },
        data: function(){
            return{
                bottomNav : {}
            }
        },
        mounted: function () {
            //window.addEventListener('scroll', this.foo);
            this.bottomNav = $('.hiden-navbar-bottom');
        },
        methods: {
            foo: function () {
                if (window.scrollY + window.innerHeight + 1 >= document.body.scrollHeight) {
                    this.bottomNav.addClass('show-navbar-bottom');
                }else{
                    this.bottomNav.removeClass('show-navbar-bottom');
                }
            }
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
        url('./assets/fonts/font-header.ttf') format('truetype'), /* Safari, Android, iOS */
        url('./assets/fonts/font-header.svg#svgFontName') format('svg'); /* Legacy iOS */
    }

    @font-face {
        font-family: 'Body';
        src: url('./assets/fonts/font-body.eot'); /* IE9 Compat Modes */
        src: url('./assets/fonts/font-body.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
        url('./assets/fonts/font-body.woff') format('woff'), /* Pretty Modern Browsers */
        url('./assets/fonts/font-body.ttf') format('truetype'), /* Safari, Android, iOS */
        url('./assets/fonts/font-body.svg#svgFontName') format('svg'); /* Legacy iOS */
    }

    @font-face {
        font-family: 'Body-Regular';
        src: url('./assets/fonts/font-body-regular.eot'); /* IE9 Compat Modes */
        src: url('./assets/fonts/font-body-regular.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
        url('./assets/fonts/font-body-regular.woff') format('woff'), /* Pretty Modern Browsers */
        url('./assets/fonts/font-body-regular.ttf') format('truetype'), /* Safari, Android, iOS */
        url('./assets/fonts/font-body-regular.svg#svgFontName') format('svg'); /* Legacy iOS */
    }

    a{
        color: #ffffff;
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

    .error{
        background-color: #dc3545 !important;
    }

    .success{
        background-color: rgb(107, 194, 123) !important;
    }

    .warning{
        background-color: #ffae42 !important;
    }

</style>
