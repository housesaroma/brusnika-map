import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('@/views/MapView.vue'),
  },
  {
    path: '/properties',
    name: 'properties',
    component: () => import('@/views/PropertiesView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard (optional - can be enabled when auth is implemented)
// router.beforeEach((to, from, next) => {
//   const isAuthenticated = localStorage.getItem('authToken');
//   const requiresAuth = to.meta.requiresAuth;
//
//   if (requiresAuth && !isAuthenticated) {
//     next({ name: 'login' });
//   } else {
//     next();
//   }
// });

export default router;
