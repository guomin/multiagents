<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 顶部导航 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 flex items-center">
            <span class="mr-3 text-blue-600 text-2xl">🏗️</span>
            展陈设计多智能体系统
          </h1>
          <p class="text-gray-600 mt-2">基于 LangGraph 和 DeepSeek 的智能协作平台</p>
        </div>
        <button @click="createNewExhibition" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          创建新展览
        </button>
      </div>
    </div>

    <!-- 快速统计 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-full mr-4">
            <span class="text-blue-600 text-xl">📊</span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-700">总项目数</h3>
            <p class="text-2xl font-bold text-gray-900">12</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-full mr-4">
            <span class="text-green-600 text-xl">✅</span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-700">已完成</h3>
            <p class="text-2xl font-bold text-gray-900">8</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center">
          <div class="p-3 bg-yellow-100 rounded-full mr-4">
            <span class="text-yellow-600 text-xl">⏳</span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-700">进行中</h3>
            <p class="text-2xl font-bold text-gray-900">3</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center">
          <div class="p-3 bg-purple-100 rounded-full mr-4">
            <span class="text-purple-600 text-xl">🤖</span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-700">智能体</h3>
            <p class="text-2xl font-bold text-gray-900">6</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 智能体状态概览 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <span class="mr-2 text-purple-600">💻</span>
        智能体状态概览
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="agent in agents"
          :key="agent.id"
          class="border rounded-lg p-4"
          :class="getAgentStatusClass(agent.status)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-3 h-3 rounded-full mr-3" :class="getAgentStatusDotClass(agent.status)"></div>
              <div>
                <h4 class="font-semibold text-gray-800">{{ agent.name }}</h4>
                <p class="text-sm text-gray-600">{{ getAgentTypeLabel(agent.type) }}</p>
              </div>
            </div>
            <span class="text-2xl">{{ getAgentStatusIcon(agent.status) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近项目 -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800 flex items-center">
          <span class="mr-2 text-blue-600">📁</span>
          最近项目
        </h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="project in recentProjects"
          :key="project.id"
          class="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
          @click="viewProject(project.id)"
        >
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-semibold text-gray-800">{{ project.title }}</h3>
            <span
              :class="project.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
              class="px-2 py-1 rounded text-xs"
            >
              {{ project.status === 'completed' ? '已完成' : '进行中' }}
            </span>
          </div>
          <p class="text-sm text-gray-600 mb-3">{{ project.theme }}</p>
          <div class="flex justify-between items-center text-xs text-gray-500">
            <span>{{ formatDate(project.createdAt) }}</span>
            <span>{{ project.budget }} {{ project.currency }}</span>
          </div>
          <div class="mt-3">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                :class="project.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'"
                class="h-2 rounded-full"
                :style="`width: ${project.progress}%`"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExhibitionStore } from '@/stores/exhibition'

const router = useRouter()
const exhibitionStore = useExhibitionStore()

const agents = [
  { id: 'curator', name: '策划智能体', type: 'curator', status: 'completed' },
  { id: 'spatial', name: '空间设计智能体', type: 'spatial', status: 'completed' },
  { id: 'visual', name: '视觉设计智能体', type: 'visual', status: 'running' },
  { id: 'interactive', name: '互动技术智能体', type: 'interactive', status: 'pending' },
  { id: 'budget', name: '预算控制智能体', type: 'budget', status: 'pending' },
  { id: 'supervisor', name: '协调主管智能体', type: 'supervisor', status: 'pending' }
]

const recentProjects = [
  {
    id: '1',
    title: '数字艺术的未来',
    theme: '探索人工智能与数字艺术的融合创新',
    status: 'completed',
    progress: 100,
    createdAt: '2024-12-15',
    budget: '500,000',
    currency: 'CNY'
  },
  {
    id: '2',
    title: '科技与生活',
    theme: '展示现代科技如何改变日常生活',
    status: 'completed',
    progress: 100,
    createdAt: '2024-12-10',
    budget: '200,000',
    currency: 'CNY'
  },
  {
    id: '3',
    title: 'AI艺术创作展',
    theme: '人工智能赋能艺术创作的新时代',
    status: 'running',
    progress: 60,
    createdAt: '2024-12-18',
    budget: '300,000',
    currency: 'CNY'
  }
]

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
    pending: 'border-gray-300',
    running: 'border-blue-300 bg-blue-50',
    completed: 'border-green-300 bg-green-50',
    error: 'border-red-300 bg-red-50'
  }
  return classes[status as keyof typeof classes] || 'border-gray-300'
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

const getAgentStatusIcon = (status: string) => {
  const icons = {
    pending: '⏸️',
    running: '🔄',
    completed: '✅',
    error: '❌'
  }
  return icons[status as keyof typeof icons] || '⏸️'
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

onMounted(() => {
  exhibitionStore.initializeApp()
})
</script>