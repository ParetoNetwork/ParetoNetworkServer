import Splash from '../components/Splash';
import Vintel from '../components/VIntel';
import VAbout from '../components/VAbout';
import VLeaderboards from '../components/VLeaderboards';
import VCreateIntel from '../components/VCreateIntel';
import VueRouter from 'vue-router';
import AuthService from '../services/authService';
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
        path: '/intel', component: Vintel, beforeEnter: (to, from, next) => {
            // ...
            AuthService.auth(() => {
                next();
            }, () => {
                next('/');
            });
        }
    },
    {
        path: '/intel/:id', component: VIntelDetail, name: 'VIntelDetail'
    },

    {
        path: '/calculator', component: VScoreCalculator, name: 'VScoreCalculator'
    },
    {path: '/about', component: VAbout},
    {path: '/leaderboards', component: VLeaderboards},
    {path: '/create', component: VCreateIntel},
];
const router = new VueRouter({routes});
export default router;