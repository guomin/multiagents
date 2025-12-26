<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 顶部导航 -->
    <nav class="nav-glass slide-in-up">
      <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div class="flex items-center space-x-4">
          <div class="hero-gradient p-3 rounded-2xl shadow-lg float-animation text-white text-3xl">
              🖥️
            </div>
          <div>
            <h1 class="text-4xl font-bold text-gradient mb-2">展陈设计多智能体系统</h1>
            <p class="text-gray-600 text-lg flex items-center">
              <span class="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              基于 LangGraph 和 DeepSeek 的智能协作平台
            </p>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div v-if="modelConfig" class="flex items-center space-x-2 glass px-4 py-2 rounded-xl">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium">
              {{ modelConfig.provider.toUpperCase() }} - {{ modelConfig.modelName }}
            </span>
          </div>
          <button @click="createNewExhibition" class="btn-primary flex items-center space-x-2">
            <ElIcon><Plus /></ElIcon>
            <span>创建新展览</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 快速统计 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="stat-card card-hover slide-in-up" style="animation-delay: 0.1s">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="hero-gradient p-4 rounded-2xl shadow-lg">
              <ElIcon class="text-white text-2xl"><DataAnalysis /></ElIcon>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-700">总项目数</h3>
              <p class="text-3xl font-bold text-gradient">{{ stats.total }}</p>
            </div>
          </div>
          <div class="text-4xl font-bold text-blue-100 opacity-50">
            📊
          </div>
        </div>
      </div>

      <div class="stat-card card-hover slide-in-up" style="animation-delay: 0.2s">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="relative">
              <div class="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
              <div class="success-gradient p-4 rounded-2xl shadow-lg">
                <ElIcon class="text-white text-2xl"><SuccessFilled /></ElIcon>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-700">已完成</h3>
              <p class="text-3xl font-bold text-gradient-success">{{ stats.completed }}</p>
            </div>
          </div>
          <div class="text-4xl font-bold text-green-100 opacity-50">
            ✅
          </div>
        </div>
      </div>

      <div class="stat-card card-hover slide-in-up" style="animation-delay: 0.3s">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="warning-gradient p-4 rounded-2xl shadow-lg">
              <ElIcon class="text-white text-2xl animate-spin"><Loading /></ElIcon>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-700">进行中</h3>
              <p class="text-3xl font-bold text-gray-900">{{ stats.running }}</p>
            </div>
          </div>
          <div class="text-4xl font-bold text-yellow-100 opacity-50">
            ⚡
          </div>
        </div>
      </div>

      <div class="stat-card card-hover slide-in-up" style="animation-delay: 0.4s">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="info-gradient p-4 rounded-2xl shadow-lg">
              <ElIcon class="text-white text-2xl"><Setting /></ElIcon>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-700">智能体</h3>
              <p class="text-3xl font-bold text-gray-900">6</p>
            </div>
          </div>
          <div class="text-4xl font-bold text-blue-100 opacity-50">
            🤖
          </div>
        </div>
      </div>
    </div>

    <!-- 智能体状态概览 -->
    <div class="glass rounded-2xl p-8 mb-8 slide-in-up" style="animation-delay: 0.5s">
      <div class="flex items-center mb-8">
        <div class="hero-gradient p-3 rounded-xl mr-4">
          <ElIcon class="text-white text-2xl"><Cpu /></ElIcon>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gradient">智能体状态概览</h2>
          <p class="text-gray-600">实时监控6个专业智能体的工作状态</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(agent, index) in agents"
          :key="agent.id"
          class="agent-card rounded-xl p-6 micro-interaction"
          :class="getAgentStatusClass(agent.status)"
          :style="`animation-delay: ${0.6 + index * 0.1}s`"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="relative">
                <div
                  class="status-indicator"
                  :class="agent.status"
                ></div>
              </div>
              <div>
                <h4 class="font-bold text-gray-800 text-lg">{{ agent.name }}</h4>
                <p class="text-sm text-gray-600">{{ getAgentTypeLabel(agent.type) }}</p>
              </div>
            </div>
            <div
              class="p-2 rounded-full"
              :class="getAgentIconBgClass(agent.status)"
            >
              <ElIcon
                :class="getAgentStatusIconClass(agent.status)"
                class="text-xl"
              >
                <component :is="getAgentStatusIcon(agent.status)" />
              </ElIcon>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-1000"
              :class="getProgressBarClass(agent.status)"
              :style="`width: ${getProgressPercentage(agent.status)}%`"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近项目 -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800 flex items-center">
          <ElIcon class="mr-2 text-blue-600"><FolderOpened /></ElIcon>
          最近项目
        </h2>
        <ElButton text type="primary" @click="router.push('/projects')">
          查看全部
          <ElIcon class="ml-1"><ArrowRight /></ElIcon>
        </ElButton>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="project in recentProjects"
          :key="project.id"
          class="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
          @click="viewProject(project.id)"
        >
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-semibold text-gray-800 flex-1">{{ project.title }}</h3>
            <ElTag
              :type="project.status === 'completed' ? 'success' : 'warning'"
              size="small"
            >
              {{ project.status === 'completed' ? '已完成' : '进行中' }}
            </ElTag>
          </div>
          <p class="text-sm text-gray-600 mb-3">{{ project.theme }}</p>
          <div class="flex justify-between items-center text-xs text-gray-500">
            <span>{{ formatDate(project.createdAt) }}</span>
            <span>{{ project.budget }} {{ project.currency }}</span>
          </div>
          <div class="mt-3">
            <ElProgress
              :percentage="project.progress"
              :color="project.status === 'completed' ? '#67c23a' : '#e6a23c'"
              :show-text="false"
              :stroke-width="4"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useExhibitionStore } from '@/stores/exhibition'
import { exhibitionAPI, type Project } from '@/api/exhibition'

// 简化图标引用
const icons = {
  monitor: '🖥️',
  plus: '+',
  dataAnalysis: '📊',
  successFilled: '✅',
  loading: '⏳',
  setting: '⚙️',
  cpu: '💻'
}
import {
  Monitor,
  Plus,
  DataAnalysis,
  SuccessFilled,
  Loading,
  Setting,
  Cpu,
  FolderOpened,
  ArrowRight,
  Timer,
  Warning,
  Check,
  Close
} from '@element-plus/icons-vue'

const router = useRouter()
const exhibitionStore = useExhibitionStore()

const modelConfig = exhibitionStore.modelConfig

// 加载项目数据
const projects = ref<Project[]>([])
const projectStats = ref<any>(null)
const loading = ref(false)

// 智能体状态（静态展示）
const agents = [
  { id: 'curator', name: '策划智能体', type: 'curator', status: 'pending' },
  { id: 'spatial', name: '空间设计智能体', type: 'spatial', status: 'pending' },
  { id: 'visual', name: '视觉设计智能体', type: 'visual', status: 'pending' },
  { id: 'interactive', name: '互动技术智能体', type: 'interactive', status: 'pending' },
  { id: 'budget', name: '预算控制智能体', type: 'budget', status: 'pending' },
  { id: 'supervisor', name: '协调主管智能体', type: 'supervisor', status: 'pending' }
]

// 计算最近项目（最多显示3个）
const recentProjects = computed(() => {
  return projects.value.slice(0, 3).map(p => ({
    id: p.id,
    title: p.title,
    theme: p.theme,
    status: p.status,
    progress: p.status === 'completed' ? 100 : (p.status === 'running' ? 50 : 0),
    createdAt: p.created_at,
    budget: p.budget_total.toLocaleString(),
    currency: p.budget_currency
  }))
})

// 计算统计数据
const stats = computed(() => {
  if (projectStats.value) {
    return projectStats.value
  }
  // 默认值
  return {
    total: projects.value.length,
    pending: 0,
    running: 0,
    completed: 0,
    error: 0
  }
})

// 加载项目列表
const loadProjects = async () => {
  loading.value = true
  try {
    const [projectsData, statsData] = await Promise.all([
      exhibitionAPI.getProjects(50, 0),
      exhibitionAPI.getProjectStats()
    ])
    projects.value = projectsData
    projectStats.value = statsData
  } catch (error) {
    console.error('加载项目列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 方法
const createNewExhibition = () => {
  router.push('/create')
}

const viewProject = (id: string) => {
  router.push(`/results/${id}`)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const getAgentStatusClass = (status: string) => {
  const classes = {
    pending: 'agent-pending',
    running: 'agent-running',
    completed: 'agent-completed',
    error: 'agent-error'
  }
  return classes[status as keyof typeof classes] || 'agent-pending'
}

const getAgentStatusDotClass = (status: string) => {
  const classes = {
    pending: 'bg-gray-400',
    running: 'bg-blue-500 animate-pulse',
    completed: 'bg-green-500',
    error: 'bg-red-500'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-400'
}

const getAgentStatusIconClass = (status: string) => {
  const classes = {
    pending: 'text-gray-400',
    running: 'text-blue-500 animate-spin',
    completed: 'text-green-500',
    error: 'text-red-500'
  }
  return classes[status as keyof typeof classes] || 'text-gray-400'
}

const getAgentStatusIcon = (status: string) => {
  const icons = {
    pending: Timer,
    running: Loading,
    completed: Check,
    error: Warning
  }
  return icons[status as keyof typeof icons] || Timer
}

const getAgentTypeLabel = (type: string) => {
  const labels = {
    curator: '概念策划',
    spatial: '空间设计',
    visual: '视觉设计',
    interactive: '互动技术',
    budget: '预算控制',
    supervisor: '协调主管'
  }
  return labels[type as keyof typeof labels] || type
}

const getAgentIconBgClass = (status: string) => {
  const classes = {
    pending: 'bg-gray-200',
    running: 'bg-blue-500',
    completed: 'bg-green-500',
    error: 'bg-red-500'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-200'
}

const getProgressBarClass = (status: string) => {
  const classes = {
    pending: 'bg-gray-400',
    running: 'bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse',
    completed: 'bg-gradient-to-r from-green-400 to-green-600',
    error: 'bg-gradient-to-r from-red-400 to-red-600'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-400'
}

const getProgressPercentage = (status: string) => {
  const percentages = {
    pending: 0,
    running: 50,
    completed: 100,
    error: 0
  }
  return percentages[status as keyof typeof percentages] || 0
}

onMounted(() => {
  exhibitionStore.initializeApp()
  loadProjects()
})
</script>