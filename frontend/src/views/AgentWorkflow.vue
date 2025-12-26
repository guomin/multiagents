<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 顶部信息 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 flex items-center">
            <ElIcon class="mr-3 text-purple-600"><Cpu /></ElIcon>
            智能体工作流
          </h1>
          <p class="text-gray-600 mt-2">实时监控多智能体协作过程</p>
        </div>
        <div class="flex items-center space-x-4">
          <ElButton
            v-if="!exhibitionStore.currentExhibition"
            type="primary"
            @click="goToCreateExhibition"
            :icon="Document"
          >
            创建展览
          </ElButton>
          <ElButton
            v-else-if="!isProcessing"
            type="primary"
            @click="restartWorkflow"
            :icon="RefreshRight"
          >
            重新开始
          </ElButton>
          <ElButton
            v-else
            type="danger"
            @click="cancelWorkflow"
            :icon="Close"
          >
            取消流程
          </ElButton>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="mt-6">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium text-gray-700">总体进度</span>
          <span class="text-sm font-medium text-gray-700">{{ progressPercentage }}%</span>
        </div>
        <ElProgress
          :percentage="progressPercentage"
          :color="progressColor"
          :stroke-width="12"
          :duration="1000"
        />
      </div>
    </div>

    <!-- 展览信息 -->
    <div v-if="currentExhibition" class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <ElIcon class="mr-2 text-blue-600"><Document /></ElIcon>
        当前展览项目
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p class="text-sm text-gray-600">展览名称</p>
          <p class="font-semibold">{{ currentExhibition.title }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">主题</p>
          <p class="font-semibold">{{ currentExhibition.theme }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">预算</p>
          <p class="font-semibold">{{ currentExhibition.budget.total }} {{ currentExhibition.budget.currency }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">场地面积</p>
          <p class="font-semibold">{{ currentExhibition.venueSpace.area }}㎡</p>
        </div>
      </div>
    </div>

    <!-- 工作流可视化 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <ElIcon class="mr-2 text-green-600"><Connection /></ElIcon>
        工作流程可视化
      </h2>
      <div class="relative">
        <!-- 时间线 -->
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-2">
          <div
            v-for="(agent, index) in agentStatuses"
            :key="agent.id"
            class="relative flex lg:flex-col items-center"
          >
            <!-- 连接线 -->
            <div
              v-if="index < agentStatuses.length - 1"
              class="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gray-300 z-0"
            ></div>

            <!-- 智能体节点 -->
            <div
              class="relative z-10 bg-white border-2 rounded-lg p-4 min-w-[160px] transition-all duration-300 hover:shadow-lg"
              :class="getWorkflowNodeClass(agent.status, agent.type)"
            >
              <div class="flex flex-col items-center text-center">
                <!-- 状态图标 -->
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                  :class="getWorkflowIconClass(agent.status, agent.type)"
                >
                  <ElIcon class="text-xl">
                    <component :is="getWorkflowIcon(agent.status)" />
                  </ElIcon>
                </div>

                <!-- 智能体名称 -->
                <h3 class="font-semibold text-gray-800 text-sm">{{ agent.name }}</h3>

                <!-- 状态标签 -->
                <ElTag
                  :type="getWorkflowTagType(agent.status)"
                  size="small"
                  class="mt-2"
                >
                  {{ getWorkflowStatusLabel(agent.status) }}
                </ElTag>

                <!-- 时间信息 -->
                <div v-if="agent.startTime" class="text-xs text-gray-500 mt-2">
                  <p>开始: {{ formatTime(agent.startTime) }}</p>
                  <p v-if="agent.endTime">结束: {{ formatTime(agent.endTime) }}</p>
                </div>

                <!-- 错误信息 -->
                <div v-if="agent.error" class="text-xs text-red-600 mt-2">
                  <ElIcon><Warning /></ElIcon>
                  {{ agent.error }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时日志 -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <ElIcon class="mr-2 text-orange-600"><Document /></ElIcon>
        实时执行日志
      </h2>
      <div class="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto custom-scrollbar">
        <div
          v-for="(log, index) in executionLogs"
          :key="index"
          class="flex items-start mb-2"
        >
          <span class="text-xs text-gray-500 mr-3">{{ log.timestamp }}</span>
          <ElIcon
            :class="getLogIconClass(log.type)"
            class="mr-2 text-sm"
          >
            <component :is="getLogIcon(log.type)" />
          </ElIcon>
          <span
            class="text-sm"
            :class="getLogTextColorClass(log.type)"
          >
            {{ log.message }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, toRefs } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExhibitionStore } from '@/stores/exhibition'
import { useWebSocket } from '@/composables/useWebSocket'
import {
  Cpu,
  RefreshRight,
  Close,
  Document,
  Connection,
  Loading,
  Check,
  Warning,
  Timer,
  InfoFilled,
  SuccessFilled,
  CircleCloseFilled,
  Setting
} from '@element-plus/icons-vue'
import type { AgentStatus, ExecutionLog } from '@/types/exhibition'

const route = useRoute()
const router = useRouter()
const exhibitionStore = useExhibitionStore()
const { connectionStatus } = useWebSocket()

const { agentStatuses, isProcessing, progressPercentage, currentRunningAgent } = toRefs(exhibitionStore)
// 注意：currentExhibition 不解构，直接使用 exhibitionStore.currentExhibition

// 执行日志
const executionLogs = ref<ExecutionLog[]>([])

// 进度颜色
const progressColor = computed(() => {
  if (progressPercentage.value === 100) return '#67c23a'
  if (progressPercentage.value > 50) return '#409eff'
  return '#e6a23c'
})

// 模拟执行过程
let simulationInterval: NodeJS.Timeout | null = null

const simulateExecution = () => {
  const agentSteps = [
    { id: 'curator', message: '🎨 策划智能体开始工作...', duration: 2000 },
    { id: 'spatial', message: '🏗️ 空间设计智能体开始工作...', duration: 2500 },
    { id: 'visual', message: '🎭 视觉设计智能体开始工作...', duration: 2000 },
    { id: 'interactive', message: '💻 互动技术智能体开始工作...', duration: 2200 },
    { id: 'budget', message: '💰 预算控制智能体开始工作...', duration: 1800 },
    { id: 'supervisor', message: '👔 协调主管分析进度...', duration: 1500 }
  ]

  let currentStep = 0

  simulationInterval = setInterval(() => {
    if (currentStep < agentSteps.length) {
      const step = agentSteps[currentStep]

      // 更新智能体状态为运行中
      exhibitionStore.updateProgress(step.id, 'running')
      addLog('info', step.message)

      setTimeout(() => {
        // 更新智能体状态为完成
        exhibitionStore.updateProgress(step.id, 'completed')
        addLog('success', `${getAgentName(step.id)} 工作完成`)

        if (currentStep === agentSteps.length - 1) {
          addLog('success', '🎉 展陈设计项目完成！')
          clearInterval(simulationInterval!)
          simulationInterval = null
        }
      }, step.duration)

      currentStep++
    } else {
      clearInterval(simulationInterval!)
      simulationInterval = null
    }
  }, 3000)
}

const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
  executionLogs.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    type,
    message
  })

  // 限制日志数量
  if (executionLogs.value.length > 50) {
    executionLogs.value = executionLogs.value.slice(0, 50)
  }
}

const restartWorkflow = async () => {
  executionLogs.value = []
  addLog('info', '🚀 重新启动工作流程...')

  try {
    // 使用 store 中的 currentExhibition，并添加类型检查
    const exhibitionData = exhibitionStore.currentExhibition

    if (!exhibitionData) {
      addLog('error', '❌ 没有展览数据，无法启动工作流')
      addLog('warn', '💡 请先在创建展览页面填写展览需求')
      return
    }

    addLog('info', '📋 当前展览: ' + exhibitionData.title)
    addLog('info', '🎯 展览主题: ' + exhibitionData.theme)
    addLog('info', '📡 正在连接后端服务器...')

    await exhibitionStore.runExhibition(exhibitionData)
    addLog('success', '✅ 工作流已启动，等待后端处理...')
  } catch (error) {
    addLog('error', '❌ 启动工作流失败')
    addLog('error', `错误信息: ${error}`)
    console.error('工作流启动失败:', error)
  }
}

const cancelWorkflow = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
  exhibitionStore.isProcessing = false
  addLog('warning', '⏹️ 工作流程已取消')
}

const goToCreateExhibition = () => {
  addLog('info', '🔄 跳转到创建展览页面')
  router.push('/create')
}

const getAgentName = (id: string) => {
  if (!agentStatuses.value) return id

  const agent = agentStatuses.value.find(a => a.id === id)
  return agent?.name || id
}

// 样式方法
const getWorkflowNodeClass = (status: string, type: string) => {
  const statusClasses = {
    pending: 'border-gray-300',
    running: 'border-blue-400 bg-blue-50',
    completed: 'border-green-400 bg-green-50',
    error: 'border-red-400 bg-red-50'
  }

  const typeColors = {
    curator: 'agent-curator',
    spatial: 'agent-spatial',
    visual: 'agent-visual',
    interactive: 'agent-interactive',
    budget: 'agent-budget',
    supervisor: 'agent-supervisor'
  }

  return `${statusClasses[status as keyof typeof statusClasses]} ${typeColors[type as keyof typeof typeColors]}`
}

const getWorkflowIconClass = (status: string, type: string) => {
  const bgColors = {
    pending: 'bg-gray-200',
    running: 'bg-blue-500',
    completed: 'bg-green-500',
    error: 'bg-red-500'
  }

  return bgColors[status as keyof typeof bgColors]
}

const getWorkflowIcon = (status: string) => {
  const icons = {
    pending: Timer,
    running: Loading,
    completed: Check,
    error: Warning
  }
  return icons[status as keyof typeof icons] || Timer
}

const getWorkflowTagType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    error: 'danger'
  }
  return types[status] || 'info'
}

const getWorkflowStatusLabel = (status: string) => {
  const labels = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    error: '错误'
  }
  return labels[status as keyof typeof labels] || status
}

const getLogIcon = (type: string) => {
  const icons = {
    info: InfoFilled,
    success: SuccessFilled,
    warning: Warning,
    error: CircleCloseFilled
  }
  return icons[type as keyof typeof icons] || InfoFilled
}

const getLogIconClass = (type: string) => {
  const classes = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500'
  }
  return classes[type as keyof typeof classes] || 'text-blue-500'
}

const getLogTextColorClass = (type: string) => {
  const classes = {
    info: 'text-gray-700',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    error: 'text-red-700'
  }
  return classes[type as keyof typeof classes] || 'text-gray-700'
}

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('zh-CN')
}

onMounted(() => {
  // 初始化日志
  addLog('info', '🚀 展陈设计多智能体系统启动')
  addLog('info', '📡 WebSocket 连接状态: ' + connectionStatus.value)

  // 检查是否有当前展览数据
  const exhibitionData = exhibitionStore.currentExhibition
  if (exhibitionData) {
    addLog('info', `📋 当前项目: ${exhibitionData.title}`)
    addLog('info', `🎯 展览主题: ${exhibitionData.theme}`)
    addLog('info', `💰 预算: ${exhibitionData.budget.total} ${exhibitionData.budget.currency}`)
    addLog('info', `🏠 场地面积: ${exhibitionData.venueSpace.area}㎡`)
  } else {
    addLog('warn', '⚠️ 没有找到展览数据，请先创建展览项目')
    addLog('info', '💡 导航到"创建展览"页面开始新项目')
  }

  // 如果有项目ID，加载对应项目
  if (route.params.id) {
    addLog('info', `📂 项目ID: ${route.params.id}`)
    // TODO: 实现项目数据加载
  }

  // 检查WebSocket连接状态
  if (connectionStatus.value === 'connected') {
    addLog('success', '✅ WebSocket 已连接，可实时接收智能体状态')
  } else if (connectionStatus.value === 'connecting') {
    addLog('info', '🔄 WebSocket 正在连接...')
  } else {
    addLog('warn', '⚠️ WebSocket 未连接，将尝试重新连接...')
  }
})

onUnmounted(() => {
  if (simulationInterval) {
    clearInterval(simulationInterval)
  }
})
</script>