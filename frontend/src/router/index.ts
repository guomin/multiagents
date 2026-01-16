import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SimpleDashboard from '@/views/SimpleDashboard.vue'
import Results from '@/views/Results.vue'
import ProjectList from '@/views/ProjectList.vue'

const routes = [
  // ========== 公开路由（无需认证） ==========
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', requiresAuth: false }
  },

  // ========== 需要认证的路由 ==========
  {
    path: '/',
    name: 'Dashboard',
    component: SimpleDashboard,
    meta: { title: '控制台', transition: 'slide-in-up', requiresAuth: true }
  },
  {
    path: '/projects',
    name: 'ProjectList',
    component: ProjectList,
    meta: { title: '项目列表', transition: 'slide-in-right', requiresAuth: true }
  },
  {
    path: '/create',
    name: 'ExhibitionForm',
    component: () => import('@/views/ExhibitionFormOptimized.vue'),
    meta: { title: '创建展览', transition: 'zoom-in', requiresAuth: true }
  },
  {
    path: '/workflow/:id?',
    name: 'AgentWorkflow',
    component: () => import('@/views/WorkflowPageOptimized.vue'),
    meta: { title: '智能体工作流', transition: 'fade', requiresAuth: true }
  },
  {
    path: '/results/:id',
    name: 'Results',
    component: Results,
    meta: { title: '设计结果', transition: 'slide-in-left', requiresAuth: true }
  },

  // ========== 管理员路由 ==========
  {
    path: '/admin/users',
    name: 'UserManagement',
    component: () => import('@/views/admin/UserManagement.vue'),
    meta: { title: '用户管理', transition: 'fade', requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 初始化认证状态（如果还没初始化）
  if (!authStore.user && !authStore.isLoading) {
    authStore.initialize()
  }

  const requiresAuth = to.meta.requiresAuth !== false // 默认需要认证
  const requiresAdmin = to.meta.requiresAdmin === true
  const isAuthenticated = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 展陈设计多智能体系统`
  }

  // 需要认证但未登录
  if (requiresAuth && !isAuthenticated) {
    return next({
      name: 'Login',
      query: { redirect: to.fullPath } // 保存原始路径用于登录后跳转
    })
  }

  // 需要管理员权限但不是管理员
  if (requiresAdmin && !isAdmin) {
    return next({ name: 'Dashboard' })
  }

  // 已登录但访问登录/注册页
  if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    return next({ name: 'Dashboard' })
  }

  next()
})

export default router
