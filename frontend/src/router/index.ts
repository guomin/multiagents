import { createRouter, createWebHistory } from 'vue-router'
import SimpleDashboard from '@/views/SimpleDashboard.vue'
import ExhibitionForm from '@/views/ExhibitionForm.vue'
import AgentWorkflow from '@/views/AgentWorkflow.vue'
import Results from '@/views/Results.vue'
import ProjectList from '@/views/ProjectList.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: SimpleDashboard,
    meta: { title: '控制台' }
  },
  {
    path: '/projects',
    name: 'ProjectList',
    component: ProjectList,
    meta: { title: '项目列表' }
  },
  {
    path: '/create',
    name: 'ExhibitionForm',
    component: ExhibitionForm,
    meta: { title: '创建展览' }
  },
  {
    path: '/workflow/:id?',
    name: 'AgentWorkflow',
    component: AgentWorkflow,
    meta: { title: '智能体工作流' }
  },
  {
    path: '/results/:id',
    name: 'Results',
    component: Results,
    meta: { title: '设计结果' }
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