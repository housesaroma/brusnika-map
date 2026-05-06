import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'map',
    component: () => import('@/views/MapView.vue'),
  },
  {
    path: '/map',
    redirect: '/',
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
