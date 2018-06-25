import './main.scss';
import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router';
import router from './utils/routes';
import Vuex from 'vuex';

const snap = require(`imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js`);

Vue.config.productionTip = false;
Vue.use(VueRouter);
Vue.use(Vuex);
const store = new Vuex.Store({
    state: {
        isLogged: false,
        address: null,
        makingLogin: false,
        madeLogin: JSON.parse(window.localStorage.getItem('logged'))
    },
    mutations: {
        login(state, {address}) {
            state.isLogged = true;
            state.address = address;
            state.makingLogin = false;
        }, logout(state) {
            state.isLogged = false;
            state.address = null;
            state.madeLogin = 0;
            window.localStorage.setItem('logged', false);

        }, intelEnter(state) {
            state.madeLogin = true;
            window.localStorage.setItem('logged', true);
        }, loadingLogin(state) {
            state.makingLogin = true;
        }, stopLogin(state) {
            state.makingLogin = false;
        }
    },
    actions: {
        login(context, address) {
            context.commit('login', address);
        }
    }
});
new Vue({
    render: h => h(App),
    router,
    store, snap
}).$mount('#app');
