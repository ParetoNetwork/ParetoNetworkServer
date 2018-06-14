import Splash from '../components/Splash';
import VDashboard from '../components/VDashboard';
import VAbout from '../components/VAbout';
import VLeaderboards from '../components/VLeaderboards';
import VueRouter from 'vue-router';
import AuthService from '../services/authService';


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
    {path: '/about', component: VAbout},
    {path: '/leaderboards', component: VLeaderboards},
];
const router = new VueRouter({routes});
export default router;