import './main.scss';
import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router';
import router from './utils/routes';
import Vuex from 'vuex';
import Notifications from 'vue-notification'

const snap = require(`imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js`);
import BootstrapVue from 'bootstrap-vue';
import 'bootstrap';

import Environment from './utils/environment';

Vue.use(BootstrapVue);
Vue.config.productionTip = false;
Vue.use(VueRouter);
Vue.use(Vuex);
Vue.use(Notifications);
Vue.use(require('vue-moment'));

const store = new Vuex.Store({
    state: {
        isLogged: false,
        address: null,
        showModalSign: false,
        showModalLoginOptions : false,
        showModalLedgerNano: false,
        makingLogin: false,
        makingRequest: false,
        requestFinish: false,
        madeLogin: JSON.parse(window.localStorage.getItem('logged')),
        ws: null
    },
    mutations: {
        login(state, data) {
            state.isLogged = true;
            state.address = data.address;
            state.user = data;
            state.showModalSign = false;
            state.showModalLoginOptions = false;
            state.showModalLedgerNano = false;
            state.makingLogin = false;
        }, logout(state) {
            state.isLogged = false;
            state.address = null;
            state.showModalSign = false;
            state.showModalLoginOptions = false;
            state.showModalLedgerNano = false;
            state.madeLogin = 0;
            window.localStorage.setItem('logged', false);
        }, intelEnter(state) {
            state.madeLogin = true;
            window.localStorage.setItem('logged', true);
        }, loadingLogin(state) {
            state.makingLogin = true;
        }, stopLogin(state) {
            state.showModalSign = false;
            state.showModalLoginOptions = false;
            state.showModalLedgerNano = false;
            state.makingLogin = false;
        }, iniWs(state) {
            state.ws = new WebSocket (Environment.baseUrlSocket);
        }
    },
    actions: {
        login(context, address) {
            context.commit('login', address.address);
        }
    }
});
new Vue({
    render: h => h(App),
    router,
    store, snap
}).$mount('#app');