import Splash from '../components/Splash';
import VDashboard from '../components/VDashboard';
import VAbout from '../components/VAbout';
import VLeaderboards from '../components/VLeaderboards';
import VIntel from '../components/VIntel';
import VueRouter from 'vue-router';
import AuthService from '../services/authService';
import VIntelDetail from '../components/VIntelDetail';
import VScoreCalculator from '../components/VScoreCalculator';

const routes = [
    {
        path: '/', component: Splash, beforeEnter: (to, from, next) => {
            // ...
            AuthService.auth(() => {
                next('/dashboard');
            }, () => {
                next();
            });
        }
    },
    {
        path: '/dashboard', component: VDashboard, beforeEnter: (to, from, next) => {
            // ...
            AuthService.auth(() => {
                next();
            }, () => {
                next('/');
            });
        }
    },
    {
        path: '/dashboard/:id', component: VIntelDetail, name: 'VIntelDetail'
    },

    {
        path: '/calculator', component: VScoreCalculator, name: 'VScoreCalculator'
    },
    {path: '/about', component: VAbout},
    {path: '/leaderboards', component: VLeaderboards},
    {path: '/intel', component: VIntel},
];
const router = new VueRouter({routes});
export default router;