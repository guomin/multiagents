import { createRouter, createWebHistory } from 'vue-router'
import SimpleDashboard from '@/views/SimpleDashboard.vue'
import Results from '@/views/Results.vue'
import ProjectList from '@/views/ProjectList.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: SimpleDashboard,
    meta: { title: '控制台', transition: 'slide-in-up' }
  },
  {
    path: '/projects',
    name: 'ProjectList',
    component: ProjectList,
    meta: { title: '项目列表', transition: 'slide-in-right' }
  },
  {
    path: '/create',
    name: 'ExhibitionForm',
    component: () => import('@/views/ExhibitionFormOptimized.vue'),
    meta: { title: '创建展览', transition: 'zoom-in' }
  },
  {
    path: '/workflow/:id?',
    name: 'AgentWorkflow',
    component: () => import('@/views/WorkflowPageOptimized.vue'),
    meta: { title: '智能体工作流', transition: 'fade' }
  },
  {
    path: '/results/:id',
    name: 'Results',
    component: Results,
    meta: { title: '设计结果', transition: 'slide-in-left' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由标题设置
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - 展陈设计多智能体系统`
  next()
})

export default router