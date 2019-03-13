import Vintel from '../Views/VIntel';
import VAbout from '../Views/VAbout';
import VLeaderboards from '../Views/VLeaderboards';
import VCreateIntel from '../Views/VCreateIntel';
import VueRouter from 'vue-router';
import AuthService from '../services/authService';
import VAuthorPage from '../Views/VAuthorPage';
import VIntelDetail from '../Views/VIntelDetail';
import VPurchase from '../Views/VPurchase';
import VScoreCalculator from '../components/VScoreCalculator';

const routes = [
  {
    path: '/', component: Vintel
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
    path: '/intel/:alias/:id', component: VIntelDetail, name: 'VIntelDetail'
  },
  {
    path: '/calculator', component: VScoreCalculator, name: 'VScoreCalculator'
  },
  {
    path: '/purchase', component: VPurchase, name: 'VPurchase'
  },
  {path: '/about', component: VAbout},
  {path: '/leaderboards', component: VLeaderboards},
  {path: '/create', component: VCreateIntel},
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
  const publicPages = ['/', '/leaderboards', '/about', '/purchase'];
  const authRequired = !publicPages.includes(to.path);
  AuthService.auth(() => {
    next();
  }, () => {
    authRequired ? next('/') : next();
  });
});

export default router;

