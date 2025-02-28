import { createRouter, createWebHistory } from 'vue-router'
import LocalisationGps from '../components/LocalisationGps.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import TimeSheet from '../components/TimeSheet.vue'

const routes = [
  {
    path: '/',
    name: 'HomeView',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/localisation-gps',
    name: 'LocalisationGps',
    component: LocalisationGps
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../components/Login.vue')
  },
   {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '/timeSheet',
        name: 'TimeSheet',
        component: TimeSheet,
        meta: { requiresAuth: true }
      },
      {
        path: '/user-management',
        name: 'UserManagement',
        component: () => import(/* webpackChunkName: "user-management" */ '../components/UserManagement.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: '/messages',
        name: 'Messages',
        component: () => import(/* webpackChunkName: "messages" */ '../components/MessageList.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import(/* webpackChunkName: "settings" */ '../components/Settings.vue'),
        meta: { requiresAuth: true }
      }, 
      {
        path: '/history',
        name: 'History',
        component: () => import(/* webpackChunkName: "history" */ '../components/History.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
      }
     
    ]
   },
    // Route pour gérer les URLs non trouvées
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  
  const userData = localStorage.getItem('userData') 
    ? JSON.parse(localStorage.getItem('userData'))
    : null

  console.log('Navigation Guard - User Data:', userData) // Debug log
  console.log('Route:', to.path, 'Requires Auth:', requiresAuth, 'Requires Admin:', requiresAdmin) // Debug log

  if (requiresAuth && !userData) {
    next('/login')
  } else if (requiresAdmin && userData?.role !== 'admin' && userData?.role !== 'user-admin') {
    next('/')
  } else {
    next()
  }
})

export default router
