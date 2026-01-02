<template>
  <div class="agent-detail-card" :class="[`status-${agent.status}`, { expanded, compact }]">
    <!-- 头部 -->
    <div class="card-header" @click="toggleExpand">
      <div class="header-left">
        <div class="agent-icon" :class="`icon-${agent.status}`">
          <ElIcon>
            <component :is="getStatusIcon(agent.status)" />
          </ElIcon>
        </div>
        <div class="agent-info">
          <h4 class="agent-name">{{ agent.name }}</h4>
          <p class="agent-role">{{ agent.role }}</p>
        </div>
      </div>
      <div class="header-right">
        <ElTag :type="getTagType(agent.status)" size="small">
          {{ getStatusLabel(agent.status) }}
        </ElTag>
        <ElIcon class="expand-icon" :class="{ expanded }">
          <ArrowDown />
        </ElIcon>
      </div>
    </div>

    <!-- 展开内容 -->
    <div v-if="expanded" class="card-body">
      <!-- 进度条 -->
      <div v-if="agent.progress !== undefined" class="progress-section">
        <div class="progress-header">
          <span class="progress-label">执行进度</span>
          <span class="progress-value">{{ agent.progress }}%</span>
        </div>
        <ElProgress
          :percentage="agent.progress"
          :color="getProgressColor(agent.status)"
          :stroke-width="8"
          :show-text="false"
        />
      </div>

      <!-- 状态消息 -->
      <div v-if="agent.message" class="message-section">
        <div class="message-header">
          <ElIcon><ChatDotRound /></ElIcon>
          <span>当前状态</span>
        </div>
        <p class="message-text">{{ agent.message }}</p>
      </div>

      <!-- 详细指标 -->
      <div v-if="!compact && agent.metrics" class="metrics-section">
        <div class="metric-row">
          <div class="metric-item">
            <span class="metric-label">耗时</span>
            <span class="metric-value">{{ formatDuration(agent.metrics.duration || 0) }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Tokens</span>
            <span class="metric-value">{{ formatNumber(agent.metrics.tokens || 0) }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">API调用</span>
            <span class="metric-value">{{ agent.metrics.apiCalls || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 输入输出 -->
      <div v-if="expanded && !compact" class="io-section">
        <ElTabs v-model="activeTab" type="border-card">
          <ElTabPane label="输入" name="input">
            <div class="code-block">
              <pre>{{ agent.input || '暂无输入数据' }}</pre>
            </div>
          </ElTabPane>
          <ElTabPane label="输出" name="output">
            <div class="code-block">
              <pre>{{ agent.output || '暂无输出数据' }}</pre>
            </div>
          </ElTabPane>
        </ElTabs>
      </div>

      <!-- 时间信息 -->
      <div class="time-section">
        <div class="time-item">
          <ElIcon><Clock /></ElIcon>
          <span>开始时间: {{ formatTime(agent.startTime) }}</span>
        </div>
        <div v-if="agent.endTime" class="time-item">
          <ElIcon><CircleCheck /></ElIcon>
          <span>结束时间: {{ formatTime(agent.endTime) }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
        <ElButton size="small" text @click.stop="viewLogs">
          <ElIcon><Document /></ElIcon>
          查看日志
        </ElButton>
        <ElButton size="small" text @click.stop="retry" v-if="agent.status === 'error'">
          <ElIcon><RefreshRight /></ElIcon>
          重试
        </ElButton>
        <ElButton size="small" text @click.stop="copyData">
          <ElIcon><CopyDocument /></ElIcon>
          复制数据
        </ElButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowDown,
  Clock,
  CircleCheck,
  ChatDotRound,
  Document,
  RefreshRight,
  CopyDocument,
  Loading,
  Check,
  Warning
} from '@element-plus/icons-vue'

interface AgentMetrics {
  duration?: number
  tokens?: number
  apiCalls?: number
}

interface Agent {
  id: string
  name: string
  role: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress?: number
  message?: string
  startTime?: Date | string
  endTime?: Date | string
  metrics?: AgentMetrics
  input?: string
  output?: string
}

interface Props {
  agent: Agent
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const emit = defineEmits<{
  viewLogs: [agentId: string]
  retry: [agentId: string]
}>()

const expanded = ref(false)
const activeTab = ref('output')

const toggleExpand = () => {
  expanded.value = !expanded.value
}

const getStatusIcon = (status: string) => {
  const icons = {
    pending: Clock,
    running: Loading,
    completed: Check,
    error: Warning
  }
  return icons[status as keyof typeof icons] || Clock
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

const getTagType = (status: string) => {
  const types = {
    pending: 'info',
    running: 'primary',
    completed: 'success',
    error: 'danger'
  }
  return types[status as keyof typeof types] || 'info'
}

const getProgressColor = (status: string) => {
  if (status === 'completed') return '#10b981'
  if (status === 'error') return '#ef4444'
  if (status === 'running') return '#3b82f6'
  return '#e5e7eb'
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

const formatNumber = (num: number) => {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

const formatTime = (time?: Date | string) => {
  if (!time) return '-'
  const date = typeof time === 'string' ? new Date(time) : time
  return date.toLocaleTimeString('zh-CN')
}

const viewLogs = () => {
  emit('viewLogs', props.agent.id)
}

const retry = () => {
  emit('retry', props.agent.id)
}

const copyData = async () => {
  try {
    const data = {
      agent: props.agent.name,
      status: props.agent.status,
      input: props.agent.input,
      output: props.agent.output,
      metrics: props.agent.metrics
    }
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    ElMessage.success('数据已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped>
.agent-detail-card {
  background: #fff;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;
}

.agent-detail-card.status-running {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.agent-detail-card.status-completed {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.agent-detail-card.status-error {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.agent-detail-card.compact {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.agent-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.icon-pending {
  background: #e5e7eb;
}

.icon-running {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  animation: pulse 2s ease-in-out infinite;
}

.icon-completed {
  background: #10b981;
}

.icon-error {
  background: #ef4444;
}

.agent-info {
  flex: 1;
  min-width: 0;
}

.agent-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 2px 0;
}

.agent-role {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-icon {
  color: #9ca3af;
  transition: transform 0.3s ease;
  font-size: 14px;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.card-body {
  padding: 0 16px 16px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

/* 进度部分 */
.progress-section {
  margin-bottom: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.progress-label {
  font-size: 12px;
  color: #6b7280;
}

.progress-value {
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
}

/* 消息部分 */
.message-section {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 12px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.message-text {
  font-size: 13px;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
}

/* 指标部分 */
.metrics-section {
  margin-bottom: 12px;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
}

.metric-label {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

/* IO部分 */
.io-section {
  margin-bottom: 12px;
}

.code-block {
  background: #1f2937;
  border-radius: 6px;
  padding: 12px;
  max-height: 200px;
  overflow: auto;
}

.code-block pre {
  font-size: 12px;
  color: #e5e7eb;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Consolas', monospace;
}

/* 时间部分 */
.time-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6b7280;
}

/* 操作部分 */
.actions-section {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
