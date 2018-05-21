import Splash from '../components/Splash'
import VDashboard from '../components/VDashboard'
import VAbout from '../components/VAbout'
import VLeaderboards from '../components/VLeaderboards'
import VueRouter from 'vue-router'



const routes = [
    { path: '/', component: Splash },
    { path: '/dashboard', component: VDashboard },
    { path: '/about', component: VAbout },
    { path: '/leaderboards', component: VLeaderboards },
];
const router = new VueRouter({routes});
export default router;