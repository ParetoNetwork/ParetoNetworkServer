import Vintel from '../components/VIntel';
import VProducts from '../components/VProducts'
import VProductsCheckout from '../components/VProductsCheckout'
import VProductsPayment from '../components/VProductsPayment'
import VPaymentThankyou from '../components/VPaymentThankyou'
import VCustomer from '../components/VCustomer'
import VIntel from '../components/VIntel';
import VAbout from '../components/VAbout';
import VLeaderboards from '../components/VLeaderboards';
import VCreateIntel from '../components/VCreateIntel';
import VueRouter from 'vue-router';
import AuthService from '../services/authService';
import VAuthorPage from '../components/VAuthorPage';
import VIntelDetail from '../components/VIntelDetail';
import VScoreCalculator from '../components/VScoreCalculator';

const routes = [
    {
      path: '/', component: VIntel
    },
    {
        path: '*',
        redirect: '/intel'
    },
    {
        path: '/intel/:address', component: VAuthorPage, name: 'VAuthorPage'
    },
    {
        path: '/intel', component: VIntel
    },
    {
        path: '/intel/:alias/:id', component: VIntelDetail, name: 'VIntelDetail'
    },
    {
        path: '/calculator', component: VScoreCalculator, name: 'VScoreCalculator'
    },
    {path: '/about', component: VAbout},
    {path: '/leaderboards', component: VLeaderboards},
    {path: '/create', component: VCreateIntel},
    {path: '/products', component: VProducts},
    {path: '/checkout', component: VProductsCheckout},
    {path: '/customer-details', component: VCustomer},
    {path: '/payment', component: VProductsPayment},
    {path: '/thankyou-payment', component: VPaymentThankyou},
];

const router = new VueRouter(
    {
        mode: 'history',
        routes,
        scrollBehavior(to, from, savedPosition) {
            return {x: 0, y: 0}
        }
    }
);

router.beforeEach((to, from, next) => {
    // ...
    const publicPages = ['/', '/leaderboards', '/about', '/products', '/checkout', '/customer-details', '/payment', '/thankyou-payment' ];
    const authRequired = !publicPages.includes(to.path);
    AuthService.auth(() => {
        next();
    }, () => {
        authRequired? next('/') : next();
    });
});

export default router;

