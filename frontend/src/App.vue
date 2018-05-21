<template>
    <div id="app">
        <Navbar/>
        <router-view></router-view>
    </div>
</template>

<script>
    import Navbar from './components/Navbar.vue';
    import SplashDashboard from './components/Splash.vue';

    export default {
        name: 'App',
        components: {
            Navbar,
            SplashDashboard
        }
    };
</script>

<style lang="scss">
    @import './main';
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
