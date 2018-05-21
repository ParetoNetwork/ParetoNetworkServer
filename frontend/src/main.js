import './main.scss';
import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router';
import router from './utils/routes';
import VueCookie from 'vue-cookie';
import Vuex from 'vuex';


Vue.config.productionTip = false;
Vue.use(VueRouter);
Vue.use(VueCookie);
Vue.use(Vuex)
const store = new Vuex.Store({
    state: {
        isLogged: false
    },
    mutations: {
        changeLogin (state) {
            state.isLogged = true;
        }
    },
    actions: {
        increment (context) {
            context.commit('changeLogin')
        }
    }
});
new Vue({
    render: h => h(App),
    router,
    store
}).$mount('#app');
