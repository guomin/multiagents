<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 人工审核对话框 -->
    <HumanReviewDialog
      v-model="showReviewDialog"
      :quality-evaluation="qualityEvaluation"
      :iteration-count="iterationCount"
      :max-iterations="maxIterations"
      :project-id="currentProjectId"
      @decision="handleHumanDecision"
    />
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
          <template v-else-if="!isProcessing">
            <ElButton
              type="primary"
              @click="restartWorkflow"
              :icon="RefreshRight"
            >
              自动模式
            </ElButton>
            <ElButton
              type="success"
              @click="startHumanWorkflow"
              :icon="Star"
            >
              人工审核模式
            </ElButton>
          </template>
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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

      <!-- 迭代信息 -->
      <div v-if="exhibitionState" class="mt-4 pt-4 border-t border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 迭代次数 -->
          <div class="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
            <div class="p-2 rounded-lg bg-purple-100">
              <ElIcon class="text-purple-600"><RefreshRight /></ElIcon>
            </div>
            <div>
              <p class="text-xs text-gray-600">当前迭代</p>
              <p class="font-bold text-purple-700">
                第 {{ (exhibitionState.iterationCount || 0) + 1 }} / {{ exhibitionState.maxIterations || 3 }} 次
              </p>
            </div>
          </div>

          <!-- 质量分数 -->
          <div v-if="exhibitionState.qualityEvaluation" class="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-teal-50">
            <div class="p-2 rounded-lg bg-green-100">
              <ElIcon class="text-green-600"><Star /></ElIcon>
            </div>
            <div>
              <p class="text-xs text-gray-600">质量评分</p>
              <p class="font-bold text-green-700">
                {{ ((exhibitionState.qualityEvaluation.overallScore || 0) * 100).toFixed(1) }} 分
              </p>
            </div>
          </div>

          <!-- 状态标识 -->
          <div class="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <div class="p-2 rounded-lg bg-blue-100">
              <ElIcon class="text-blue-600"><InfoFilled /></ElIcon>
            </div>
            <div>
              <p class="text-xs text-gray-600">状态</p>
              <p class="font-bold text-blue-700">
                {{ exhibitionState.needsRevision ? '优化中' : '进行中' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 反馈历史 -->
        <div v-if="exhibitionState.feedbackHistory && exhibitionState.feedbackHistory.length > 0" class="mt-4">
          <ElDivider content-position="left">
            <span class="text-sm text-gray-600">迭代反馈历史</span>
          </ElDivider>
          <div class="space-y-2 mt-3">
            <div
              v-for="(feedback, idx) in exhibitionState.feedbackHistory"
              :key="idx"
              class="flex items-start space-x-2 p-3 rounded-lg bg-gray-50"
            >
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                <span class="text-xs font-bold text-purple-700">{{ idx + 1 }}</span>
              </div>
              <p class="text-sm text-gray-700 flex-1">{{ feedback }}</p>
            </div>
          </div>
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
import { ElMessage } from 'element-plus'
import axios from 'axios'
import HumanReviewDialog from '@/components/HumanReviewDialog.vue'
import type { QualityEvaluation } from '@/types/exhibition'
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
  Setting,
  Star
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

// 人工审核相关状态
const showReviewDialog = ref(false)
const currentProjectId = ref('')
const qualityEvaluation = ref<QualityEvaluation | undefined>(undefined)
const iterationCount = ref(0)
const maxIterations = ref(3)

// 进度颜色
const progressColor = computed(() => {
  if (progressPercentage.value === 100) return '#67c23a'
  if (progressPercentage.value > 50) return '#409eff'
  return '#e6a23c'
})

// 展览状态（用于显示迭代信息）
const exhibitionState = computed(() => exhibitionStore.currentExhibition)

// 当前展览
const currentExhibition = computed(() => exhibitionStore.currentExhibition?.requirements)

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

// 人在回路模式相关方法
const startHumanWorkflow = async () => {
  executionLogs.value = []
  addLog('info', '🚀 启动人在回路模式工作流程...')

  try {
    const exhibitionData = exhibitionStore.currentExhibition

    if (!exhibitionData) {
      addLog('error', '❌ 没有展览数据，无法启动工作流')
      addLog('warn', '💡 请先在创建展览页面填写展览需求')
      return
    }

    const requirements = exhibitionData.requirements || exhibitionData
    addLog('info', '📋 当前展览: ' + requirements.title)
    addLog('info', '🎯 展览主题: ' + requirements.theme)

    const response = await axios.post('/api/exhibition/start-with-human', {
      requirements,
      maxIterations: maxIterations.value
    })

    if (response.data.success) {
      currentProjectId.value = response.data.projectId

      if (response.data.status === 'waiting_for_human') {
        addLog('info', '⏸️ 工作流已暂停，等待人工审核')
        qualityEvaluation.value = response.data.data.qualityEvaluation
        iterationCount.value = response.data.data.iterationCount || 0
        showReviewDialog.value = true
      } else if (response.data.status === 'completed') {
        addLog('success', '🎉 展陈设计项目完成！')
      }
    }
  } catch (error) {
    addLog('error', '❌ 启动工作流失败')
    console.error('工作流启动失败:', error)
  }
}

const handleHumanDecision = async (decision: { type: string; feedback: string }) => {
  if (!currentProjectId.value) {
    ElMessage.error('项目ID不存在')
    return
  }

  addLog('info', `👤 提交人工决策: ${decision.type}`)

  try {
    const response = await axios.post(`/api/exhibition/human-decision/${currentProjectId.value}`, {
      decision: decision.type,
      feedback: decision.feedback,
      revisionTarget: qualityEvaluation.value?.revisionTarget
    })

    if (response.data.success) {
      ElMessage.success('决策已提交')

      if (response.data.status === 'waiting_for_human') {
        addLog('info', '⏸️ 继续等待人工审核')
        qualityEvaluation.value = response.data.data.qualityEvaluation
        iterationCount.value = response.data.data.iterationCount || 0
        showReviewDialog.value = true
      } else if (response.data.status === 'completed') {
        addLog('success', '🎉 展陈设计项目完成！')
        showReviewDialog.value = false
      }
    }
  } catch (error) {
    addLog('error', '❌ 提交决策失败')
    console.error('提交决策失败:', error)
    ElMessage.error('提交决策失败，请重试')
  }
}

// 监听 WebSocket 消息，处理 waitingForHuman 状态
const handleWebSocketMessage = (data: any) => {
  if (data.type === 'agentStatus' && exhibitionStore.currentExhibition) {
    const state = exhibitionStore.currentExhibition
    if (state.waitingForHuman && state.qualityEvaluation) {
      qualityEvaluation.value = state.qualityEvaluation
      iterationCount.value = state.iterationCount || 0
      showReviewDialog.value = true
      addLog('info', '⏸️ 收到人工审核请求')
    }
  }
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