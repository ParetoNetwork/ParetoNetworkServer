import Splash from '../components/Splash';
import Vintel from '../components/VIntel';
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
        path: '/', component: Splash, beforeEnter: (to, from, next) => {
            // ...
            AuthService.auth(() => {
                next('/intel');
            }, () => {
                next();
            });
        }
    },
    {
        path: '*',
        redirect: '/intel'
    },
    {
        path: '/intel/:address', component: VAuthorPage, name: 'VAuthorPage'
    },
    {
        path: '/intel', component: Vintel
    },
    {
        path: '/intel/:address/:id', component: VIntelDetail, name: 'VIntelDetail'
    },
    {
        path: '/calculator', component: VScoreCalculator, name: 'VScoreCalculator'
    },
    {path: '/about', component: VAbout},
    {path: '/leaderboards', component: VLeaderboards},
    {path: '/create', component: VCreateIntel},
];

const router = new VueRouter({routes});

router.beforeEach((to, from, next) => {
    // ...
    const publicPages = ['/', '/leaderboards', '/about'];
    const authRequired = !publicPages.includes(to.path);
    AuthService.auth(() => {
        next();
    }, () => {
        authRequired? next('/') : next();
    });
});

export default router;

