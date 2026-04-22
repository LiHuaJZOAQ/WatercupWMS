import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/home/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home/main',
      meta: { requiresAuth: true } // 需要登录
    },
    {
      path: '/home',
      name: 'Home',
      component: HomeView,
      meta: { requiresAuth: true }, // 需要登录
      children: [
        {
          path: 'main',
          name: 'MainView',
          component: () => import('../views/home/components/MainView.vue'),
        },
        {
          path: '/inStorage/rawMaterial',
          name: 'InStorageRawMaterial',
          component: () => import('../views/home/components/InStorage/RawMaterial.vue'),
        },
        {
          path: '/inStorage/rawMaterial/review',
          name: 'InStorageRawMaterialReview',
          component: () => import('../views/home/components/InStorage/Review.vue'),
        },
        {
          path: '/outStorage/rawMaterial',
          name: 'OutStorageRawMaterial',
          component: () => import('../views/home/components/OutStorage/OutRawMaterial.vue'),
        },
        {
          path: '/checkStorage/rawMaterial',
          name: 'CheckStorageRawMaterial',
          component: () => import('../views/home/components/CheckStorage/CheckRawMaterial.vue'),
        },
        {
          path: '/inventory/rawMaterial',
          name: 'InventoryRawMaterial',
          component: () => import('../views/home/components/InventoryManage/InventoryRawMaterial.vue'),
        },
        {
          path: '/location/rawMaterial',
          name: 'LocationRawMaterial',
          component: () => import('../views/home/components/LocationManage/LocationRawMaterial.vue'),
        }
      ],
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true } // 仅允许未登录用户访问
    },
  ],
})

export default router

