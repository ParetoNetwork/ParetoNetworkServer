import './main.scss';


import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router';
import router from './utils/routes';
import Meta from 'vue-meta';
import lineClamp from 'vue-line-clamp'

import Vuex from 'vuex';
import Notifications from 'vue-notification'

const snap = require(`imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js`);
import BootstrapVue from 'bootstrap-vue';
import 'bootstrap';
import Environment from './utils/environment';
import { dom } from '@fortawesome/fontawesome-svg-core';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(fas, fab);

dom.watch();

Vue.use(BootstrapVue);
Vue.config.productionTip = false;
Vue.use(VueRouter);
Vue.use(Vuex);
Vue.use(Notifications);
Vue.use(lineClamp);
Vue.use(require('vue-moment'));


Vue.use(Meta);
Vue.component('font-awesome-icon', FontAwesomeIcon)

const store = new Vuex.Store({
    state: {
        isLogged: false,
        address: null,
        showModalSign: false,
        showModalLoginOptions: false,
        showModalLedgerNano: false,
        showModalReward: false,
        makingLogin: false,
        makingRequest: false,
        requestFinish: false,
        madeLogin: JSON.parse(window.localStorage.getItem('logged')),
        signType: (window.localStorage.getItem('signType')) || 'Metamask',
        pathId: (window.localStorage.getItem('pathId')) || '',
        ws: null,
        pendingTransactions: [],
        currentDistributes: [],
        intelReward : {},
        myTokens : 0
    },
    mutations: {
        addReward(state, data){
            state.intelReward = data.intel;
            state.myTokens = data.tokens
        },
        login(state, data) {
            state.isLogged = true;
            state.address = data.address.address;
            state.user = data.address;
            state.showModalSign = false;
            state.showModalLoginOptions = false;
            state.showModalLedgerNano = false;
            state.makingLogin = false;
            const dataSign = data.dataSign;
            let signType = '';
            let pathId = '';
            if (dataSign) {
                signType = dataSign.signType;
                pathId = dataSign.pathId;
                window.localStorage.setItem('signType', dataSign.signType);
                window.localStorage.setItem('pathId', dataSign.pathId);
            } else {
                signType = (window.localStorage.getItem('signType'));
                pathId = (window.localStorage.getItem('pathId'));
            }
            state.signType = signType;
            state.pathId = pathId;
        }, logout(state) {
            state.isLogged = false;
            state.address = null;
            state.showModalSign = false;
            state.showModalLoginOptions = false;
            state.showModalLedgerNano = false;
            state.madeLogin = 0;
            window.localStorage.setItem('logged', false);
            window.localStorage.removeItem("signType");
            window.localStorage.removeItem("pathId");
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
            state.ws = new WebSocket(Environment.webSocketURL);
        }, addTransaction(state, item) {
            state.pendingTransactions.unshift(item);
        }, assignTransactions(state, transactions) {
            state.pendingTransactions = [...state.pendingTransactions, ...transactions];
        }, editTransaction(state, {hash, key, value}){
            state.pendingTransactions = state.pendingTransactions.map(item => {
                  if(item.txHash === hash){
                      item[key] = value;
                  }
                  return item;
            });
        }, addDistribute(state, item) {
            state.currentDistributes.unshift(item);
        }, editDistribute(state, {hash, key, value}){
            state.currentDistributes = state.currentDistributes.map(item => {
                if(item.txHash === hash){
                    item[key] = value;
                }
                return item;
            });
        }, deleteDistribute(state, intelId) {
            state.currentDistributes = state.currentDistributes.filter(item => item.intel !== intelId);
        }, openModalReward(state, open){
            state.showModalReward = open;
        }, deleteTransaction(state, txHash) {
            state.pendingTransactions = state.pendingTransactions.filter(item => item.txHash !== txHash);
        }
    },
    actions: {
        login(context, address) {
            context.commit('login', address.address);
        },
        addTransaction(context, item) {
            context.commit('addTransaction', item);
        },
        assignTransactions(context, transactions) {
            context.commit('assignTransactions', transactions);
        },
        editTransaction(context, params) {
            //console.log(params);
            context.commit('editTransaction', params);
        },
        transactionComplete(context, txHash) {
            context.commit('deleteTransaction', txHash);
        }
    }
});
new Vue({
    render: h => h(App),
    router,
    store, snap
}).$mount('#app');