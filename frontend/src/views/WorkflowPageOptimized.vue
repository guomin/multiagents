<template>
  <div class="workflow-page-optimized">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <div class="header-left">
        <ElButton circle @click="goBack">
          <ElIcon><ArrowLeft /></ElIcon>
        </ElButton>
        <ProjectSwitcher
          :projects="recentProjects"
          :current-project-id="projectId"
          @select="selectProject"
          @create="createNew"
        />
      </div>
      <div class="header-center">
        <div class="status-indicators">
          <div class="indicator-item">
            <span class="indicator-label">连接</span>
            <span class="indicator-value" :class="{ 'score-excellent': isConnected, 'score-error': !isConnected }">
              {{ isConnected ? '✅' : '❌' }}
            </span>
          </div>
          <div class="indicator-item">
            <span class="indicator-label">迭代</span>
            <span class="indicator-value">{{ iterationCount }}</span>
          </div>
          <div class="indicator-item">
            <span class="indicator-label">质量分</span>
            <span class="indicator-value" :class="getScoreClass(qualityScore)">
              {{ qualityScore }}
            </span>
          </div>
          <div class="indicator-item">
            <span class="indicator-label">进度</span>
            <span class="indicator-value">{{ progressPercentage }}%</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <ElButton v-if="isProcessing" type="danger" @click="cancelWorkflow">
          <ElIcon style="margin-right: 4px"><Close /></ElIcon>
          取消
        </ElButton>
        <ElButton v-else-if="!isCompleted" type="primary" @click="startWorkflow">
          <ElIcon style="margin-right: 4px"><VideoPlay /></ElIcon>
          开始执行
        </ElButton>
        <ElButton v-else type="success" @click="viewResults">
          <ElIcon style="margin-right: 4px"><Document /></ElIcon>
          查看结果
        </ElButton>
      </div>
    </div>

    <!-- 主内容区：三栏布局 -->
    <div class="page-content">
      <!-- 左栏：步骤进度 -->
      <div class="left-panel">
        <WorkflowSteps
          :steps="workflowSteps"
          :current-step="currentStep"
          :completed-steps="completedSteps"
          @step-click="onStepClick"
        >
          <template #requirements="{ step }">
            <div class="step-content-custom">
              <ExhibitionInfoCard :exhibition="currentExhibition" />
            </div>
          </template>

          <template #collaboration="{ step }">
            <div class="step-content-custom">
              <div v-if="!isProcessing && !isCompleted" class="empty-state-card">
                <ElIcon class="icon"><Clock /></ElIcon>
                <p>等待启动...</p>
              </div>
              <div v-else class="agents-grid-custom">
                <AgentDetailCard
                  v-for="agent in singleAgents"
                  :key="agent.id"
                  :agent="agent"
                  @view-logs="viewAgentLogs"
                  @retry="retryAgent"
                />
              </div>
            </div>
          </template>

          <template #parallel_execution="{ step }">
            <div class="step-content-custom">
              <div v-if="parallelGroup" class="parallel-section-custom">
                <ParallelExecution :members="parallelGroup.members" />
              </div>
            </div>
          </template>

          <template #review="{ step }">
            <div class="step-content-custom">
              <!-- 调试信息 -->
              <div style="background: #f0f0f0; padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 12px;">
                <div><strong>调试信息:</strong></div>
                <div>reviewStatus: {{ reviewStatus }}</div>
                <div>currentQualityEvaluation: {{ currentQualityEvaluation ? '有数据' : '无数据' }}</div>
                <div>projectId: {{ projectId || 'undefined' }}</div>
              </div>

              <!-- 等待审核状态 - 显示决策面板 -->
              <div v-if="reviewStatus === 'waiting'" class="review-decision-panel">
                <div class="decision-header">
                  <ElIcon class="icon" :size="32"><View /></ElIcon>
                  <div>
                    <h3>等待人工审核</h3>
                    <p v-if="currentQualityEvaluation">
                      质量分数: <span class="quality-score">{{ (currentQualityEvaluation.overallScore * 100).toFixed(1) }}分</span>
                    </p>
                  </div>
                </div>

                <!-- 质量评估详情 -->
                <div v-if="currentQualityEvaluation" class="quality-details">
                  <div class="detail-item">
                    <span class="label">概念策划:</span>
                    <span class="score" :class="getScoreClass((currentQualityEvaluation.conceptScore || 0) * 100)">
                      {{ ((currentQualityEvaluation.conceptScore || 0) * 100).toFixed(0) }}分
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">空间设计:</span>
                    <span class="score" :class="getScoreClass((currentQualityEvaluation.spatialScore || 0) * 100)">
                      {{ ((currentQualityEvaluation.spatialScore || 0) * 100).toFixed(0) }}分
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">视觉设计:</span>
                    <span class="score" :class="getScoreClass((currentQualityEvaluation.visualScore || 0) * 100)">
                      {{ ((currentQualityEvaluation.visualScore || 0) * 100).toFixed(0) }}分
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">互动技术:</span>
                    <span class="score" :class="getScoreClass((currentQualityEvaluation.interactiveScore || 0) * 100)">
                      {{ ((currentQualityEvaluation.interactiveScore || 0) * 100).toFixed(0) }}分
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="label">预算合理性:</span>
                    <span class="score" :class="getScoreClass((currentQualityEvaluation.budgetScore || 0) * 100)">
                      {{ ((currentQualityEvaluation.budgetScore || 0) * 100).toFixed(0) }}分
                    </span>
                  </div>
                  <div v-if="currentQualityEvaluation.revisionTarget" class="revision-target">
                    <span class="label">修订建议:</span>
                    <span class="target">{{ getNodeName(currentQualityEvaluation.revisionTarget) }}</span>
                  </div>
                </div>

                <!-- 决策操作区 -->
                <div class="decision-actions">
                  <!-- 工作流已完成提示 -->
                  <div v-if="workflowCompleted" class="workflow-completed-notice">
                    <ElIcon class="completed-icon"><CircleCheck /></ElIcon>
                    <p><strong>工作流已完成</strong></p>
                    <p>设计方案已自动完成，无需人工审核决策</p>
                  </div>

                  <!-- 审核意见输入和按钮（仅在工作流未完成时显示） -->
                  <template v-if="!workflowCompleted">
                    <div class="feedback-section">
                      <label>审核意见 (可选):</label>
                      <textarea
                        v-model="decisionFeedback"
                        placeholder="请输入您的审核意见或修订建议..."
                        rows="3"
                        :disabled="decisionLoading"
                      ></textarea>
                    </div>

                    <div class="action-buttons">
                      <button
                        class="btn-decision btn-approve"
                        :disabled="decisionLoading"
                        @click="handleApprove"
                      >
                        <ElIcon><CircleCheck /></ElIcon>
                        <span>{{ decisionLoading ? '提交中...' : '批准' }}</span>
                      </button>
                      <button
                        class="btn-decision btn-revise"
                        :disabled="decisionLoading"
                        @click="handleRevise"
                      >
                        <ElIcon><RefreshRight /></ElIcon>
                        <span>{{ decisionLoading ? '提交中...' : '修订' }}</span>
                      </button>
                      <button
                        class="btn-decision btn-reject"
                        :disabled="decisionLoading"
                        @click="handleReject"
                      >
                        <ElIcon><Close /></ElIcon>
                        <span>{{ decisionLoading ? '提交中...' : '拒绝' }}</span>
                      </button>
                    </div>
                  </template>

                  <div class="decision-tips">
                    <p><strong>批准:</strong> 通过审核，系统将完成最终设计</p>
                    <p><strong>修订:</strong> 根据建议进行优化，系统将重新设计</p>
                    <p><strong>拒绝:</strong> 终止当前工作流</p>
                  </div>
                </div>
              </div>

              <div v-else-if="reviewStatus === 'completed'" class="review-completed-card">
                <ElIcon class="icon"><CircleCheck /></ElIcon>
                <h3>审核完成</h3>
                <p>审核已通过，继续执行</p>
              </div>
            </div>
          </template>

          <template #results="{ step }">
            <div class="step-content-custom">
              <div v-if="!isCompleted" class="empty-state-card">
                <ElIcon class="icon"><Document /></ElIcon>
                <p>等待流程完成...</p>
              </div>
              <div v-else class="result-completed-card">
                <ElIcon class="icon" :size="48"><SuccessFilled /></ElIcon>
                <h3>设计完成！</h3>
                <p>展陈设计已全部完成</p>
                <ElButton type="primary" @click="viewResults">
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

      <!-- 中栏：详细内容 -->
      <div class="center-panel">
        <div class="panel-content">
          <!-- 展览信息 -->
          <div v-if="currentExhibition" class="content-section">
            <div class="section-header">
              <h3>
                <ElIcon><Folder /></ElIcon>
                项目信息
              </h3>
            </div>
            <div class="exhibition-detail">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">展览名称</span>
                  <span class="value">{{ currentExhibition.title }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">主题</span>
                  <span class="value">{{ currentExhibition.theme }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">预算</span>
                  <span class="value">{{ currentExhibition.budget?.total }} {{ currentExhibition.budget?.currency }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">面积</span>
                  <span class="value">{{ currentExhibition.venueSpace?.area }}㎡</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 智能体协作流程 -->
          <div class="content-section">
            <div class="section-header">
              <h3>
                <ElIcon><Connection /></ElIcon>
                协作流程
              </h3>
            </div>
            <div class="workflow-visualization">
              <div
                v-for="(group, index) in agentGroups"
                :key="group.id"
                class="workflow-node"
                :class="getNodeClass(group)"
              >
                <!-- 单个智能体 -->
                <div v-if="group.type === 'single'" class="single-node">
                  <div class="node-indicator" :class="group.status"></div>
                  <span class="node-name">{{ group.name }}</span>
                  <ElTag :type="getTagType(group.status)" size="small">
                    {{ getStatusLabel(group.status) }}
                  </ElTag>
                </div>

                <!-- 并行组 -->
                <div v-else-if="group.type === 'parallel'" class="parallel-node">
                  <div class="parallel-header">
                    <ElIcon><Connection /></ElIcon>
                    <span>{{ group.name }}</span>
                    <ElTag :type="getTagType(group.status)" size="small">
                      {{ getStatusLabel(group.status) }}
                    </ElTag>
                  </div>
                  <div class="parallel-members">
                    <div
                      v-for="member in group.members"
                      :key="member.id"
                      class="parallel-member"
                      :class="member.status"
                    >
                      <div class="member-indicator"></div>
                      <span class="member-name">{{ member.name }}</span>
                    </div>
                  </div>
                </div>

                <!-- 审核节点 -->
                <div v-else-if="group.type === 'review'" class="review-node">
                  <div class="node-indicator" :class="group.status"></div>
                  <ElIcon class="node-icon"><View /></ElIcon>
                  <span class="node-name">{{ group.name }}</span>
                  <ElTag :type="getTagType(group.status)" size="small">
                    {{ getStatusLabel(group.status) }}
                  </ElTag>
                </div>

                <!-- 决策节点 -->
                <div v-else-if="group.type === 'decision'" class="decision-node">
                  <div class="node-indicator decision"></div>
                  <ElIcon class="node-icon"><User /></ElIcon>
                  <span class="node-name">{{ group.name }}</span>
                  <ElTag :type="getTagType(group.status)" size="small">
                    {{ getStatusLabel(group.status) }}
                  </ElTag>
                </div>

                <!-- 最终节点 -->
                <div v-else-if="group.type === 'final'" class="final-node">
                  <div class="node-indicator" :class="group.status"></div>
                  <ElIcon class="node-icon success"><CircleCheck /></ElIcon>
                  <span class="node-name">{{ group.name }}</span>
                  <ElTag :type="getTagType(group.status)" size="small">
                    {{ getStatusLabel(group.status) }}
                  </ElTag>
                </div>

                <!-- 连接线 -->
                <div v-if="index < agentGroups.length - 1" class="node-connector"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右栏：实时监控 -->
      <div class="right-panel">
        <!-- 性能监控 -->
        <PerformancePanel
          :total-duration="performanceData.totalDuration"
          :input-tokens="performanceData.inputTokens"
          :output-tokens="performanceData.outputTokens"
          :api-calls="performanceData.apiCalls"
          ref="performancePanelRef"
        />

        <!-- 执行日志 -->
        <LogPanel
          :logs="logs"
          @clear="clearLogs"
          ref="logPanelRef"
        />
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useExhibitionStore } from '@/stores/exhibition'
import { useWebSocket } from '@/composables/useWebSocket'
import { ElMessage, ElMessageBox } from 'element-plus'
import { exhibitionAPI } from '@/api/exhibition'
import WorkflowSteps from '@/components/WorkflowSteps.vue'
import ParallelExecution from '@/components/ParallelExecution.vue'
import IterationTimeline from '@/components/IterationTimeline.vue'
import AgentDetailCard from '@/components/AgentDetailCard.vue'
import PerformancePanel from '@/components/PerformancePanel.vue'
import LogPanel from '@/components/LogPanel.vue'
import ProjectSwitcher from '@/components/ProjectSwitcher.vue'
import HumanReviewDialogSimple from '@/components/HumanReviewDialogSimple.vue'
import ExhibitionInfoCard from '@/components/ExhibitionInfoCard.vue'
import {
  ArrowLeft,
  Close,
  VideoPlay,
  Document,
  Clock,
  View,
  CircleCheck,
  SuccessFilled,
  Connection,
  Folder,
  User,
  RefreshRight
} from '@element-plus/icons-vue'
import type { AgentGroup, AgentStatus } from '@/types/exhibition'

const router = useRouter()
const exhibitionStore = useExhibitionStore()

// 🔑 关键：调用 useWebSocket 建立 WebSocket 连接
const { isConnected, connectionStatus } = useWebSocket()

// 状态
const currentExhibition = computed(() => exhibitionStore.currentExhibition)
const isProcessing = computed(() => exhibitionStore.isProcessing)
const isCompleted = computed(() => exhibitionStore.currentWorkflow !== null)
const currentStep = ref('requirements')
const completedSteps = ref<string[]>([])
const projectId = computed(() => exhibitionStore.currentProjectId) // 使用 store 中的项目ID

// 工作流步骤
const workflowSteps = ref([
  { id: 'requirements', title: '需求', description: '填写展览基本信息', icon: Document },
  { id: 'collaboration', title: '协作', description: '6个专业智能体协同设计', icon: VideoPlay },
  { id: 'parallel_execution', title: '并行', description: '视觉设计和互动技术并行', icon: Connection },
  { id: 'review', title: '审核', description: '人工审核质量并决策', icon: View },
  { id: 'results', title: '结果', description: '查看完整设计方案', icon: CircleCheck }
])

// 后端流程节点配置（与后端 exhibition-graph-with-human.ts 完全对应）
const backendWorkflowNodes = [
  // 主要流程节点
  {
    id: 'curator',
    name: '策划智能体',
    type: 'single',
    category: 'design',
    order: 1,
    description: '概念策划和叙事结构'
  },
  {
    id: 'spatial_designer',
    name: '空间设计智能体',
    type: 'single',
    category: 'design',
    order: 2,
    description: '空间规划和布局设计'
  },
  {
    id: 'parallel_designs',
    name: '并行设计',
    type: 'parallel',
    category: 'design',
    order: 3,
    description: '视觉设计和互动技术并行执行',
    members: ['visual_designer', 'interactive_tech']
  },
  // 并行组成员（单独修订时使用）
  {
    id: 'visual_designer',
    name: '视觉设计智能体',
    type: 'parallel-member',
    category: 'design',
    order: 3.1,
    parentGroup: 'parallel_designs',
    description: '视觉风格和色彩方案'
  },
  {
    id: 'interactive_tech',
    name: '互动技术智能体',
    type: 'parallel-member',
    category: 'design',
    order: 3.2,
    parentGroup: 'parallel_designs',
    description: '互动技术方案'
  },
  {
    id: 'budget_controller',
    name: '预算控制智能体',
    type: 'single',
    category: 'control',
    order: 4,
    description: '预算评估和成本控制'
  },
  {
    id: 'supervisor_review',
    name: '主管审核',
    type: 'review',
    category: 'review',
    order: 5,
    description: '质量评估和人工审核'
  },
  {
    id: 'human_decision',
    name: '人工决策',
    type: 'decision',
    category: 'human',
    order: 6,
    description: '人工审核决策（批准/修订）'
  },
  {
    id: 'finalize',
    name: '生成报告',
    type: 'final',
    category: 'output',
    order: 7,
    description: '生成最终设计报告'
  }
]

// 🔑 关键：后端 agentId 到前端节点 ID 的映射
// 后端使用简短的 ID（spatial, visual, etc.）
// 前端使用完整的节点 ID（spatial_designer, visual_designer, etc.）
const agentIdMapping: Record<string, string> = {
  'curator': 'curator',
  'spatial': 'spatial_designer',
  'visual': 'visual_designer',
  'interactive': 'interactive_tech',
  'budget': 'budget_controller',
  'supervisor': 'supervisor_review'
}

// 智能体状态
const singleAgents = ref<AgentStatus[]>([])
const parallelGroup = ref<AgentGroup | null>(null)
const agentGroups = ref<any[]>([])
const reviewStatus = ref<'waiting' | 'completed' | 'pending'>('pending')

// 人工审核决策相关状态
const decisionFeedback = ref('')
const decisionLoading = ref(false)
const currentQualityEvaluation = ref<any>(null)
const workflowCompleted = ref(false)  // 新增：工作流是否已完成

// 节点状态映射（根据后端 agentStatus 消息更新）
const agentStatusMap = ref<Record<string, {
  status: 'pending' | 'running' | 'completed' | 'error'
  progress?: number
  startTime?: Date
  endTime?: Date
  error?: string
}>>({})

// 当前迭代信息
const currentIteration = ref(0)
const currentRevisionTarget = ref<string | null>(null)

// 迭代历史
const iterations = ref<any[]>([])
const iterationCount = ref(0)
const maxIterations = ref(3)
const qualityScore = ref(0)

// 项目
const recentProjects = ref<any[]>([])

// 日志
const logs = ref<Array<{ time: string; type: string; message: string }>>([])

// 性能数据
const performanceData = ref({
  totalDuration: 0,
  inputTokens: 0,
  outputTokens: 0,
  apiCalls: 0
})

// 审核状态
const showReviewDialog = ref(false)
const qualityEvaluation = ref<any>(null)

// 组件引用
const performancePanelRef = ref()
const logPanelRef = ref()

// 进度百分比
const progressPercentage = computed(() => {
  const stepIndex = workflowSteps.value.findIndex(s => s.id === currentStep.value)
  return Math.round(((stepIndex + 1) / workflowSteps.value.length) * 100)
})

// 获取分数样式
const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 75) return 'score-good'
  return 'score-normal'
}

// 获取节点样式
const getNodeClass = (group: any) => {
  return {
    'node-pending': group.status === 'pending',
    'node-running': group.status === 'running',
    'node-completed': group.status === 'completed',
    'node-error': group.status === 'error'
  }
}

const getTagType = (status: string) => {
  const types = {
    pending: 'info',
    running: 'primary',
    completed: 'success',
    error: 'danger'
  }
  return types[status as keyof typeof types] || 'info'
}

const getStatusLabel = (status: string) => {
  const labels = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    error: '错误'
  }
  return labels[status as keyof typeof labels] || '未知'
}

// ========== 人工审核决策处理函数 ==========
// 这些函数需要在 onMounted 之外定义，以便模板可以访问

// 提交人工审核决策
const submitDecision = async (decision: 'approve' | 'revise' | 'reject') => {
  console.log('📤 [决策] 开始提交:', decision)
  console.log('📤 [决策] projectId:', projectId.value)
  console.log('📤 [决策] feedback:', decisionFeedback.value)

  if (!projectId.value) {
    ElMessage.error('项目ID不存在，无法提交决策')
    return
  }

  try {
    decisionLoading.value = true

    if (decision === 'revise' && !decisionFeedback.value.trim()) {
      ElMessage.warning('请填写修订意见')
      decisionLoading.value = false
      return
    }

    addLog('info', `📤 提交决策: ${decision === 'approve' ? '批准' : decision === 'revise' ? '修订' : '拒绝'}`)

    const response = await exhibitionAPI.submitDecision(
      projectId.value,
      decision,
      decisionFeedback.value,
      currentRevisionTarget.value || undefined
    )

    console.log('✅ [决策] 响应:', response)

    if (response.success) {
      ElMessage.success(response.message || '决策已提交')

      if (response.status === 'completed') {
        addLog('success', '✅ 工作流已完成')
        reviewStatus.value = 'completed'
      } else if (response.status === 'waiting_for_human') {
        addLog('warning', '⏸️  工作流再次等待审核')
        // 保持等待状态，更新质量评估
        if (response.qualityEvaluation) {
          currentQualityEvaluation.value = response.qualityEvaluation
        }
      }

      // 清空反馈
      decisionFeedback.value = ''
    }
  } catch (error: any) {
    console.error('❌ [决策] 提交失败:', error)
    ElMessage.error(error.response?.data?.error || '提交决策失败，请重试')
    addLog('error', `❌ 提交决策失败: ${error.message}`)
  } finally {
    decisionLoading.value = false
  }
}

// 批准决策
const handleApprove = async () => {
  try {
    await ElMessageBox.confirm(
      '确认批准当前设计方案吗？系统将完成最终设计并生成报告。',
      '批准确认',
      {
        confirmButtonText: '确认批准',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    await submitDecision('approve')
  } catch {
    // 用户取消
  }
}

// 修订决策
const handleRevise = async () => {
  console.log('🔧 [修订] 点击修订按钮')
  console.log('🔧 [修订] decisionFeedback:', decisionFeedback.value)
  console.log('🔧 [修订] projectId:', projectId.value)

  if (!decisionFeedback.value.trim()) {
    console.log('⚠️  [修订] 没有填写修订意见')
    ElMessage.warning('请填写修订意见')
    return
  }

  console.log('✅ [修订] 开始提交修订决策')
  await submitDecision('revise')
}

// 拒绝决策
const handleReject = async () => {
  try {
    await ElMessageBox.confirm(
      '确认拒绝当前设计方案吗？这将终止当前工作流。',
      '拒绝确认',
      {
        confirmButtonText: '确认拒绝',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    await submitDecision('reject')
  } catch {
    // 用户取消
  }
}

// ========== 页面初始化 ==========
// 初始化
onMounted(() => {
  // 🔍 调试信息
  console.log('======================================')
  console.log('🎯 WorkflowPageOptimized 已挂载')
  console.log('📊 节点配置:', backendWorkflowNodes)
  console.log('🔌 WebSocket 连接状态:', connectionStatus.value)
  console.log('🔌 WebSocket 是否已连接:', isConnected.value)
  console.log('📋 store 中的项目ID:', projectId.value)

  // 尝试从 localStorage 恢复 projectId
  const savedProjectId = localStorage.getItem('current_project_id')
  console.log('📋 localStorage 中的项目ID:', savedProjectId)

  if (!projectId.value && savedProjectId) {
    console.log('✅ 从 localStorage 恢复项目ID:', savedProjectId)
    exhibitionStore.currentProjectId = savedProjectId
    addLog('info', `✅ 从缓存恢复项目ID: ${savedProjectId}`)
  }

  console.log('📋 最终的项目ID:', projectId.value)
  console.log('======================================')

  addLog('info', '🚀 页面加载完成')
  addLog('info', `📡 WebSocket 状态: ${connectionStatus.value}`)
  addLog('info', '📡 正在连接 WebSocket...')
  if (projectId.value) {
    addLog('info', `📋 项目ID: ${projectId.value}`)
  } else {
    addLog('warning', '⚠️  项目ID为空，可能无法提交人工审核决策')
  }
  loadRecentProjects()
  initializeAgentGroups()

  // 🔍 调试：测试事件监听器
  setTimeout(() => {
    console.log('🧪 测试事件系统...')
    window.dispatchEvent(new CustomEvent('workflow-log', {
      detail: { type: 'info', message: '📢 测试日志 - 事件系统正常' }
    }))
  }, 1000)

  // 监听 WebSocket 日志事件
  const handleWorkflowLog = (event: any) => {
    const log = event.detail
    console.log('✅ 收到 workflow-log 事件:', log)
    addLog(log.type, log.message)
  }

  // 监听智能体状态变化
  const handleAgentStatus = (event: any) => {
    console.log('✅ 收到 agentStatus 事件:', event.detail)
    const { agentId, status } = event.detail

    // 🔑 关键：映射后端 ID 到前端 ID
    const mappedId = agentIdMapping[agentId] || agentId

    // 更新主节点状态
    updateAgentStatus(agentId, status)

    // 更新性能数据
    if (status.status === 'completed' && status.endTime && status.startTime) {
      const startTime = new Date(status.startTime).getTime()
      const endTime = new Date(status.endTime).getTime()
      const duration = endTime - startTime

      performanceData.value.totalDuration += duration
      performanceData.value.apiCalls += 1

      // 估算 token 使用量（基于耗时和智能体类型）
      // 假设平均速度：50 tokens/s，不同智能体有不同的输入/输出比例
      const estimatedTokens = Math.round((duration / 1000) * 50)
      const inputOutputRatio = agentId === 'supervisor' ? 0.7 : 0.4 // 输入token占比
      const inputTokens = Math.round(estimatedTokens * inputOutputRatio)
      const outputTokens = Math.round(estimatedTokens * (1 - inputOutputRatio))

      performanceData.value.inputTokens += inputTokens
      performanceData.value.outputTokens += outputTokens

      console.log(`📊 [性能] ${agentId} 完成，耗时: ${duration}ms, 估算tokens: ${estimatedTokens}`)
      addLog('info', `⏱️  ${getNodeName(agentId)} 耗时: ${(duration / 1000).toFixed(1)}s, ~${estimatedTokens} tokens`)
    }

    // 如果是并行组成员，也要更新并行组的状态
    if (['visual', 'interactive'].includes(agentId)) {
      const parallelNode = agentGroups.value.find(g => g.type === 'parallel')
      if (parallelNode && parallelNode.members) {
        const member = parallelNode.members.find((m: any) => m.id === mappedId)
        if (member) {
          member.status = status.status
        }
      }
    }
  }

  // 监听人工审核请求
  const handleWaitingForHuman = (event: any) => {
    console.log('✅ 收到 waitingForHuman 事件:', event.detail)
    const { qualityEvaluation, iterationCount, revisionTarget } = event.detail
    addLog('warning', `⏸️  等待人工审核 - 质量分数: ${(qualityEvaluation.overallScore * 100).toFixed(1)}分`)

    // 设置审核状态
    reviewStatus.value = 'waiting'
    currentIteration.value = iterationCount
    currentRevisionTarget.value = revisionTarget
    currentQualityEvaluation.value = qualityEvaluation

    // 🔑 关键：自动切换到审核步骤，这样审核面板才会显示
    currentStep.value = 'review'
    completedSteps.value = ['requirements', 'collaboration', 'parallel_execution', 'review']

    console.log('📋 [DEBUG] reviewStatus 已设置为:', reviewStatus.value)
    console.log('📋 [DEBUG] currentStep 已切换到:', currentStep.value)
    console.log('📋 [DEBUG] currentQualityEvaluation:', currentQualityEvaluation.value)
    console.log('📋 [DEBUG] projectId:', projectId.value)

    // 检查 projectId
    if (!projectId.value) {
      const savedProjectId = localStorage.getItem('current_project_id')
      if (savedProjectId) {
        console.log('✅ 尝试从 localStorage 恢复 projectId')
        exhibitionStore.currentProjectId = savedProjectId
        addLog('info', `✅ 已从缓存恢复项目ID: ${savedProjectId}`)
      } else {
        console.error('❌ 项目ID缺失，无法提交审核决策')
        addLog('error', '❌ 项目ID缺失，请刷新页面或重新启动工作流')
        ElMessage.error('项目ID缺失，无法提交审核决策。请刷新页面重试。')
      }
    }

    addLog('info', `📋 请在下方的审核面板进行决策`)
    addLog('info', `📍 已自动切换到审核步骤`)
    if (projectId.value) {
      addLog('info', `📋 项目ID: ${projectId.value}`)
    }

    // 显示提示消息
    ElMessage.warning({
      message: '工作流已暂停，等待人工审核决策',
      duration: 5000,
      showClose: true
    })
  }

  // 监听迭代更新
  const handleIterationUpdate = (event: any) => {
    console.log('✅ 收到 iterationUpdate 事件:', event.detail)
    const { iterationCount, revisionTarget } = event.detail
    addLog('warning', `🔄 启动第 ${iterationCount} 次迭代 - 修订目标: ${getNodeName(revisionTarget)}`)
    currentIteration.value = iterationCount
    currentRevisionTarget.value = revisionTarget

    // 添加到迭代历史
    iterations.value.push({
      id: `iteration_${iterationCount}`,
      iterationCount,
      revisionTarget,
      timestamp: new Date().toISOString()
    })
  }

  // 监听工作流完成事件
  const handleWorkflowCompleted = (event: any) => {
    console.log('🎉 收到 workflow-completed 事件:', event.detail)
    const { currentStep: workflowCurrentStep, progress } = event.detail  // 重命名避免遮蔽

    // 标记工作流已完成
    workflowCompleted.value = true

    // 更新审核状态为已完成
    reviewStatus.value = 'completed'

    // 🔑 关键：更新 human_decision 和 finalize 节点状态为已完成
    const now = new Date()
    agentStatusMap.value['human_decision'] = {
      status: 'completed',
      startTime: now,
      endTime: now
    }
    agentStatusMap.value['finalize'] = {
      status: 'completed',
      startTime: now,
      endTime: now
    }

    // 更新完成步骤
    completedSteps.value = ['requirements', 'collaboration', 'parallel_execution', 'review', 'results']

    // 切换到最终结果步骤
    currentStep.value = 'results'

    // 重新初始化 agentGroups 以反映最新状态
    initializeAgentGroups()

    addLog('success', '✅ 工作流已完成')
    addLog('info', '📍 已自动切换到结果步骤')

    ElMessage.success({
      message: '🎉 展陈设计项目已完成！',
      duration: 5000,
      showClose: true
    })
  }

  // 注册所有事件监听器
  window.addEventListener('workflow-log', handleWorkflowLog)
  window.addEventListener('agentStatus', handleAgentStatus)
  window.addEventListener('waitingForHuman', handleWaitingForHuman)
  window.addEventListener('iterationUpdate', handleIterationUpdate)
  window.addEventListener('workflow-completed', handleWorkflowCompleted)

  console.log('✅ 所有事件监听器已注册')
  console.log('监听的事件:', ['workflow-log', 'agentStatus', 'waitingForHuman', 'iterationUpdate', 'workflow-completed'])
  console.log('======================================' )

  // 组件卸载时移除监听器
  onUnmounted(() => {
    console.log('🧹 清理事件监听器...')
    window.removeEventListener('workflow-log', handleWorkflowLog)
    window.removeEventListener('agentStatus', handleAgentStatus)
    window.removeEventListener('waitingForHuman', handleWaitingForHuman)
    window.removeEventListener('iterationUpdate', handleIterationUpdate)
    window.removeEventListener('workflow-completed', handleWorkflowCompleted)
    console.log('✅ 监听器已清理')
  })
})

const loadRecentProjects = () => {
  // 实际从API加载
  recentProjects.value = [
    {
      id: '1',
      title: '数字艺术的未来',
      theme: '探索人工智能与数字艺术的融合创新',
      status: 'completed',
      progress: 100,
      createdAt: '2024-12-15',
      budget: '500,000',
      currency: 'CNY'
    }
  ]
}

const initializeAgentGroups = () => {
  // 根据后端流程配置初始化节点
  agentGroups.value = backendWorkflowNodes
    .filter(node => node.type !== 'parallel-member') // 过滤掉并行组成员（它们会在父节点中显示）
    .map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      status: agentStatusMap.value[node.id]?.status || 'pending',
      description: node.description,
      category: node.category,
      order: node.order,
      // 如果是并行节点，添加成员信息
      ...(node.type === 'parallel' && {
        members: backendWorkflowNodes
          .filter(m => m.parentGroup === node.id)
          .map(member => ({
            id: member.id,
            name: member.name,
            status: agentStatusMap.value[member.id]?.status || 'pending',
            description: member.description
          }))
      })
    }))
    .sort((a, b) => a.order - b.order) // 按顺序排序

  // 单独更新并行组状态（用于左侧面板显示）
  const parallelNode = agentGroups.value.find(g => g.type === 'parallel')
  if (parallelNode) {
    parallelGroup.value = {
      id: parallelNode.id,
      name: parallelNode.name,
      type: 'parallel',
      status: parallelNode.status,
      members: parallelNode.members.map(m => ({
        ...m,
        progress: calculateProgress(m.status)
      }))
    }
  }

  // 更新单智能体列表
  singleAgents.value = agentGroups.value
    .filter(g => g.type === 'single')
    .map(agent => ({
      id: agent.id,
      name: agent.name,
      role: agent.description,
      status: agent.status,
      progress: calculateProgress(agent.status)
    }))
}

// 计算进度百分比
const calculateProgress = (status: string) => {
  switch (status) {
    case 'pending': return 0
    case 'running': return 50
    case 'completed': return 100
    case 'error': return 0
    default: return 0
  }
}

// 更新节点状态（根据 WebSocket agentStatus 消息）
const updateAgentStatus = (agentId: string, status: any) => {
  // 🔑 映射后端 agentId 到前端节点 ID
  const frontendNodeId = agentIdMapping[agentId] || agentId

  console.log('🔄 更新节点状态:', {
    backendId: agentId,
    frontendId: frontendNodeId,
    status: status.status
  })

  const previousStatus = agentStatusMap.value[frontendNodeId]?.status
  agentStatusMap.value[frontendNodeId] = {
    status: status.status,
    startTime: status.startTime,
    endTime: status.endTime,
    error: status.error
  }

  // 记录状态变化日志
  if (previousStatus !== status.status) {
    const statusMessages = {
      running: `🤖 ${getNodeName(frontendNodeId)} 开始工作`,
      completed: `✅ ${getNodeName(frontendNodeId)} 完成工作`,
      error: `❌ ${getNodeName(frontendNodeId)} 出现错误: ${status.error || '未知错误'}`
    }
    if (statusMessages[status.status]) {
      const logLevel = status.status === 'error' ? 'error' : status.status === 'completed' ? 'success' : 'info'
      addLog(logLevel, statusMessages[status.status])
    }
  }

  // 重新初始化显示
  initializeAgentGroups()
}

// 获取节点名称
const getNodeName = (agentId: string) => {
  const node = backendWorkflowNodes.find(n => n.id === agentId)
  return node?.name || agentId
}

const addLog = (type: string, message: string) => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    type,
    message
  })

  if (logs.value.length > 100) {
    logs.value = logs.value.slice(0, 100)
  }
}

const clearLogs = () => {
  logs.value = []
}

const selectProject = (id: string) => {
  projectId.value = id
  addLog('info', `📂 切换到项目: ${id}`)
}

const createNew = () => {
  router.push('/create')
}

const goBack = () => {
  router.back()
}

const startWorkflow = async () => {
  addLog('info', '🚀 启动工作流程...')
  isProcessing.value = true
  currentStep.value = 'collaboration'
}

const cancelWorkflow = () => {
  addLog('warning', '⏹️ 工作流程已取消')
  isProcessing.value = false
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
}

const viewAgentLogs = (agentId: string) => {
  addLog('info', `📋 查看智能体日志: ${agentId}`)
}

const retryAgent = (agentId: string) => {
  addLog('warning', `🔄 重试智能体: ${agentId}`)
}

const viewIteration = (id: string) => {
  addLog('info', `📂 查看迭代: ${id}`)
}

const compareIteration = (id: string) => {
  addLog('info', `🔄 对比版本: ${id}`)
}
</script>

<style scoped>
.workflow-page-optimized {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
}

/* 顶部导航 */
.page-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-center {
  display: flex;
  justify-content: center;
}

.status-indicators {
  display: flex;
  gap: 24px;
}

.indicator-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.indicator-label {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.indicator-value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.indicator-value.score-excellent {
  color: #10b981;
}

.indicator-value.score-good {
  color: #3b82f6;
}

.indicator-value.score-normal {
  color: #f59e0b;
}

.header-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

/* 主内容区 */
.page-content {
  display: grid;
  grid-template-columns: 320px 1fr 400px;
  gap: 24px;
  padding: 24px;
  max-width: 1800px;
  margin: 0 auto;
}

@media (max-width: 1400px) {
  .page-content {
    grid-template-columns: 1fr 400px;
  }
  .left-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1024px) {
  .page-content {
    grid-template-columns: 1fr;
  }
  .page-header {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .header-center {
    order: -1;
  }
}

/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.iteration-section {
  margin-top: 12px;
}

/* 中间面板 */
.center-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

/* 展览详情 */
.exhibition-detail {
  margin-top: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item .label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.detail-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

/* 工作流可视化 */
.workflow-visualization {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workflow-node {
  position: relative;
}

.single-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.single-node:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.node-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.node-indicator.pending {
  background: #d1d5db;
}

.node-indicator.running {
  background: #3b82f6;
  animation: pulse-dot 2s ease-in-out infinite;
}

.node-indicator.completed {
  background: #10b981;
}

.node-indicator.error {
  background: #ef4444;
}

.node-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

/* 并行节点 */
.parallel-node {
  border: 2px dashed #8b5cf6;
  border-radius: 10px;
  padding: 16px;
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
}

.parallel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #7c3aed;
}

.parallel-members {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.parallel-member {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.parallel-member.running {
  border-color: #3b82f6;
  background: #eff6ff;
}

.parallel-member.completed {
  border-color: #10b981;
  background: #f0fdf4;
}

.member-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
}

.parallel-member.running .member-indicator {
  background: #3b82f6;
}

.parallel-member.completed .member-indicator {
  background: #10b981;
}

.member-name {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

/* 连接线 */
.node-connector {
  height: 20px;
  width: 2px;
  background: #e5e7eb;
  margin-left: 20px;
}

/* 审核节点 */
.review-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 2px solid #fbbf24;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.review-node:hover {
  border-color: #f59e0b;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.2);
  transform: translateX(2px);
}

.review-node .node-icon {
  font-size: 20px;
  color: #f59e0b;
}

/* 决策节点 */
.decision-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
  border: 2px solid #ec4899;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.decision-node:hover {
  border-color: #db2777;
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.2);
  transform: translateX(2px);
}

.decision-node .node-indicator.decision {
  background: #ec4899;
  animation: pulse-dot 2s ease-in-out infinite;
}

.decision-node .node-icon {
  font-size: 20px;
  color: #ec4899;
}

/* 最终节点 */
.final-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border: 2px solid #10b981;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.final-node:hover {
  border-color: #059669;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
  transform: translateX(2px);
}

.final-node .node-icon {
  font-size: 20px;
  color: #10b981;
}

.final-node .node-icon.success {
  color: #059669;
}

/* 卡片状态 */
.empty-state-card,
.review-waiting-card,
.review-completed-card,
.result-completed-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}

.empty-state-card .icon,
.review-waiting-card .icon,
.review-completed-card .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.review-waiting-card {
  color: #f59e0b;
}

.review-waiting-card .icon {
  color: #f59e0b;
}

/* 人工审核决策面板 */
.review-decision-panel {
  padding: 20px;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-radius: 16px;
  border: 2px solid #f59e0b;
}

.decision-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f59e0b30;
}

.decision-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #92400e;
}

.decision-header p {
  margin: 0;
  font-size: 14px;
  color: #78716c;
}

.quality-score {
  font-weight: 600;
  color: #f59e0b;
}

.quality-details {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quality-details .detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fefce8;
  border-radius: 8px;
}

.quality-details .label {
  font-size: 13px;
  color: #78716c;
  font-weight: 500;
}

.quality-details .score {
  font-weight: 600;
  font-size: 14px;
}

.revision-target {
  grid-column: 1 / -1;
  background: #fef3c7;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.revision-target .target {
  font-weight: 600;
  color: #92400e;
}

.decision-actions {
  margin-top: 16px;
}

.feedback-section {
  margin-bottom: 16px;
}

.feedback-section label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #78716c;
  margin-bottom: 8px;
}

.feedback-section textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  transition: border-color 0.3s;
  font-family: inherit;
}

.feedback-section textarea:focus {
  outline: none;
  border-color: #f59e0b;
}

.feedback-section textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.btn-decision {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 80px;
}

.btn-decision:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-approve {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.btn-approve:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-revise {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
}

.btn-revise:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-reject {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.btn-reject:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.decision-tips {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  color: #78716c;
}

.decision-tips p {
  margin: 4px 0;
}

.decision-tips strong {
  color: #44403c;
}

.review-completed-card {
  color: #10b981;
}

.review-completed-card .icon {
  color: #10b981;
}

.result-completed-card .icon {
  font-size: 64px;
  color: #10b981;
  margin-bottom: 16px;
}

.result-completed-card h3 {
  font-size: 20px;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.result-completed-card p {
  color: #6b7280;
  margin: 0 0 20px 0;
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 24px;
  height: fit-content;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

/* 动画 */
@keyframes pulse-dot {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}
</style>
