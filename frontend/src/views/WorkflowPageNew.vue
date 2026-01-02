<template>
  <div class="workflow-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-left">
        <ElButton @click="goBack" circle>
          <ElIcon><ArrowLeft /></ElIcon>
        </ElButton>
        <div class="project-info">
          <h1 class="project-title">{{ currentExhibition?.title }}</h1>
          <p class="project-theme">{{ currentExhibition?.theme }}</p>
        </div>
      </div>
      <div class="header-right">
        <ElButton v-if="isProcessing" type="danger" @click="cancelWorkflow">
          <ElIcon style="margin-right: 4px"><Close /></ElIcon>
          取消流程
        </ElButton>
        <ElButton v-else-if="!isCompleted" type="primary" @click="startWorkflow">
          <ElIcon style="margin-right: 4px"><VideoPlay /></ElIcon>
          开始执行
        </ElButton>
      </div>
    </div>

    <!-- 主内容区：左右分栏 -->
    <div class="page-content">
      <!-- 左侧：流程进度 -->
      <div class="left-panel">
        <WorkflowSteps
          :steps="workflowSteps"
          :current-step="currentStep"
          :completed-steps="completedSteps"
          @step-click="onStepClick"
        >
          <!-- 需求步骤 -->
          <template #requirements="{ step }">
            <div class="step-content">
              <div class="exhibition-details">
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">预算</span>
                    <span class="value">{{ currentExhibition?.budget?.total }} {{ currentExhibition?.budget?.currency }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">面积</span>
                    <span class="value">{{ currentExhibition?.venueSpace?.area }}㎡</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">受众</span>
                    <span class="value">{{ currentExhibition?.targetAudience }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 协作步骤 -->
          <template #collaboration="{ step }">
            <div class="step-content">
              <div v-if="!isProcessing && !isCompleted" class="empty-state">
                <ElIcon class="icon"><Clock /></ElIcon>
                <p>等待启动...</p>
              </div>
              <div v-else class="agents-grid">
                <AgentStatusCard
                  v-for="agent in singleAgents"
                  :key="agent.id"
                  :agent="agent"
                  :compact="true"
                />
              </div>
            </div>
          </template>

          <!-- 并行执行步骤 -->
          <template #parallel_execution="{ step }">
            <div class="step-content">
              <div v-if="parallelGroup" class="parallel-section">
                <ParallelExecution :members="parallelGroup.members" />
              </div>
            </div>
          </template>

          <!-- 审核步骤 -->
          <template #review="{ step }">
            <div class="step-content">
              <div v-if="reviewStatus === 'waiting'" class="review-waiting">
                <ElIcon class="icon"><View /></ElIcon>
                <p>等待人工审核...</p>
              </div>
              <div v-else-if="reviewStatus === 'completed'" class="review-completed">
                <ElIcon class="icon"><CircleCheck /></ElIcon>
                <p>审核已完成</p>
              </div>
            </div>
          </template>

          <!-- 结果步骤 -->
          <template #results="{ step }">
            <div class="step-content">
              <div v-if="!isCompleted" class="empty-state">
                <ElIcon class="icon"><Document /></ElIcon>
                <p>等待流程完成...</p>
              </div>
              <div v-else class="result-summary">
                <ElIcon class="icon" :size="40"><SuccessFilled /></ElIcon>
                <h3>设计完成！</h3>
                <p>展陈设计已全部完成，点击下方按钮查看详细结果</p>
                <ElButton type="primary" size="large" @click="viewResults">
                  查看完整方案
                </ElButton>
              </div>
            </div>
          </template>
        </WorkflowSteps>

        <!-- 迭代历史 -->
        <div v-if="iterations.length > 0" class="iteration-section">
          <IterationTimeline
            :iterations="iterations"
            @view="viewIteration"
            @compare="compareIteration"
          />
        </div>
      </div>

      <!-- 右侧：实时监控 -->
      <div class="right-panel">
        <div class="monitor-panel">
          <div class="panel-header">
            <h3>
              <ElIcon class="icon"><Monitor /></ElIcon>
              实时监控
            </h3>
            <div class="connection-status" :class="connectionStatus">
              <span class="status-dot"></span>
              {{ connectionLabel }}
            </div>
          </div>

          <div class="panel-content">
            <!-- 实时日志 -->
            <div class="logs-section">
              <div class="logs-header">
                <span>执行日志</span>
                <ElButton text size="small" @click="clearLogs">清空</ElButton>
              </div>
              <div class="logs-list" ref="logsContainer">
                <div
                  v-for="(log, index) in logs"
                  :key="index"
                  class="log-item"
                  :class="`log-${log.type}`"
                >
                  <span class="log-time">{{ log.time }}</span>
                  <ElIcon class="log-icon">
                    <component :is="getLogIcon(log.type)" />
                  </ElIcon>
                  <span class="log-message">{{ log.message }}</span>
                </div>
                <div v-if="logs.length === 0" class="logs-empty">
                  暂无日志
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 人工审核对话框 -->
        <HumanReviewDialogSimple
          v-model="showReviewDialog"
          :quality-evaluation="qualityEvaluation"
          :iteration-count="iterationCount"
          :max-iterations="maxIterations"
          :project-id="projectId"
          @decision="handleDecision"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useExhibitionStore } from '@/stores/exhibition'
import { useWebSocket } from '@/composables/useWebSocket'
import { ElMessage } from 'element-plus'
import WorkflowSteps from '@/components/WorkflowSteps.vue'
import ParallelExecution from '@/components/ParallelExecution.vue'
import IterationTimeline from '@/components/IterationTimeline.vue'
import AgentStatusCard from '@/components/AgentStatusCard.vue'
import HumanReviewDialogSimple from '@/components/HumanReviewDialogSimple.vue'
import {
  ArrowLeft,
  Close,
  VideoPlay,
  Clock,
  View,
  CircleCheck,
  Document,
  Monitor,
  Check,
  InfoFilled,
  SuccessFilled,
  Warning,
  CircleCloseFilled,
  Connection
} from '@element-plus/icons-vue'
import type { AgentGroup, AgentStatus } from '@/types/exhibition'

const router = useRouter()
const exhibitionStore = useExhibitionStore()
const { connectionStatus } = useWebSocket()

// 状态
const currentExhibition = computed(() => exhibitionStore.currentExhibition)
const isProcessing = computed(() => exhibitionStore.isProcessing)
const isCompleted = computed(() => exhibitionStore.currentWorkflow !== null)
const currentStep = ref('requirements')
const completedSteps = ref<string[]>([])

// 工作流步骤定义
const workflowSteps = ref([
  {
    id: 'requirements',
    title: '填写需求',
    description: '填写展览基本信息和需求',
    icon: Document
  },
  {
    id: 'collaboration',
    title: '多智能体协作',
    description: '6个专业智能体协同设计',
    icon: VideoPlay
  },
  {
    id: 'parallel_execution',
    title: '并行执行',
    description: '视觉设计和互动技术并行优化',
    icon: Connection
  },
  {
    id: 'review',
    title: '人工审核',
    description: '审核质量并决定是否修订',
    icon: View
  },
  {
    id: 'results',
    title: '查看结果',
    description: '查看完整的设计方案',
    icon: CircleCheck
  }
])

// 智能体状态
const singleAgents = ref<AgentStatus[]>([])
const parallelGroup = ref<AgentGroup | null>(null)
const reviewStatus = ref<'waiting' | 'completed' | 'pending'>('pending')

// 迭代历史
const iterations = ref<any[]>([])

// 日志
const logs = ref<Array<{ time: string; type: string; message: string }>>([])
const logsContainer = ref<HTMLElement | null>(null)

// 审核状态
const showReviewDialog = ref(false)
const qualityEvaluation = ref<any>(null)
const iterationCount = ref(0)
const maxIterations = ref(3)
const projectId = ref('')

// 连接状态
const connectionLabel = computed(() => {
  const labels = {
    connected: '已连接',
    connecting: '连接中',
    disconnected: '未连接',
    error: '错误'
  }
  return labels[connectionStatus.value as keyof typeof labels] || '未知'
})

// 初始化
onMounted(() => {
  addLog('info', '🚀 页面加载完成')
  addLog('info', `📋 当前项目: ${currentExhibition.value?.title || '未设置'}`)

  // 监听 store 状态变化
  // 实际使用时会通过 WebSocket 更新状态
})

const addLog = (type: string, message: string) => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    type,
    message
  })

  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }

  // 自动滚动到顶部
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = 0
    }
  })
}

const clearLogs = () => {
  logs.value = []
}

const getLogIcon = (type: string) => {
  const icons = {
    info: InfoFilled,
    success: Check,
    warning: Warning,
    error: CircleCloseFilled
  }
  return icons[type as keyof typeof icons] || InfoFilled
}

const goBack = () => {
  router.back()
}

const startWorkflow = async () => {
  addLog('info', '🚀 启动工作流程...')
  // 实际实现会调用 API
}

const cancelWorkflow = () => {
  addLog('warning', '⏹️ 工作流程已取消')
}

const onStepClick = (stepId: string) => {
  currentStep.value = stepId
  addLog('info', `📍 切换到步骤: ${workflowSteps.value.find(s => s.id === stepId)?.title}`)
}

const viewResults = () => {
  router.push(`/results/${projectId.value}`)
}

const handleDecision = async (data: any) => {
  addLog('info', `👤 人工决策: ${data.decision}`)
  // 实际实现会调用 API
}

const viewIteration = (id: string) => {
  addLog('info', `📂 查看迭代: ${id}`)
}

const compareIteration = (id: string) => {
  addLog('info', `🔄 对比版本: ${id}`)
}
</script>

<style scoped>
.workflow-page {
  min-height: 100vh;
  background: #f9fafb;
}

/* 顶部导航 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.project-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.project-theme {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 主内容区 */
.page-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .page-content {
    grid-template-columns: 1fr;
  }
}

/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.iteration-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 步骤内容 */
.step-content {
  color: #4b5563;
}

.exhibition-details {
  margin-top: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item .label {
  font-size: 12px;
  color: #6b7280;
}

.detail-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-state .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
}

/* 审核等待 */
.review-waiting,
.review-completed {
  text-align: center;
  padding: 40px 20px;
}

.review-waiting .icon,
.review-completed .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.review-waiting {
  color: #f59e0b;
}

.review-completed {
  color: #10b981;
}

/* 结果摘要 */
.result-summary {
  text-align: center;
  padding: 40px 20px;
}

.result-summary .icon {
  font-size: 64px;
  color: #10b981;
  margin-bottom: 16px;
}

.result-summary h3 {
  font-size: 20px;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.result-summary p {
  color: #6b7280;
  margin: 0 0 20px 0;
}

/* 右侧面板 */
.right-panel {
  position: sticky;
  top: 24px;
  height: fit-content;
}

.monitor-panel {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.panel-header h3 .icon {
  color: #3b82f6;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.connection-status.connected {
  background: #dcfce7;
  color: #166534;
}

.connection-status.connecting {
  background: #fef3c7;
  color: #92400e;
}

.connection-status.disconnected {
  background: #fee2e2;
  color: #991b1b;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.connection-status.connected .status-dot {
  animation: pulse 2s ease-in-out infinite;
}

.panel-content {
  padding: 16px 20px;
}

/* 日志 */
.logs-section {
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.logs-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 4px;
}

.log-info {
  background: #eff6ff;
  color: #1e40af;
}

.log-success {
  background: #dcfce7;
  color: #166534;
}

.log-warning {
  background: #fef3c7;
  color: #92400e;
}

.log-error {
  background: #fee2e2;
  color: #991b1b;
}

.log-time {
  color: #9ca3af;
  font-size: 11px;
  white-space: nowrap;
}

.log-icon {
  flex-shrink: 0;
  font-size: 14px;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.logs-empty {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
  font-size: 13px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
