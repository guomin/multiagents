<template>
  <div class="parallel-execution">
    <div class="parallel-header">
      <div class="parallel-title">
        <ElIcon class="icon"><Connection /></ElIcon>
        <span>并行执行</span>
        <ElTag type="primary" size="small">{{ memberCount }}个任务</ElTag>
      </div>
      <div class="parallel-status">
        <span class="status-text">{{ getStatusText() }}</span>
        <span class="time-remaining">{{ timeRemaining }}</span>
      </div>
    </div>

    <div class="parallel-members">
      <div
        v-for="member in members"
        :key="member.id"
        class="member-card"
        :class="getMemberClass(member.status)"
      >
        <!-- 成员头部 -->
        <div class="member-header">
          <div class="member-icon" :class="getIconClass(member.status)">
            <ElIcon>
              <component :is="getMemberIcon(member.status)" />
            </ElIcon>
          </div>
          <div class="member-info">
            <h4 class="member-name">{{ member.name }}</h4>
            <p class="member-status">{{ getMemberStatusText(member.status) }}</p>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="member-progress">
          <ElProgress
            :percentage="member.progress || 0"
            :color="getProgressColor(member.status)"
            :stroke-width="6"
            :show-text="true"
          />
        </div>

        <!-- 时间信息 -->
        <div v-if="member.startTime" class="member-time">
          <span v-if="member.endTime">
            耗时: {{ formatDuration(member.startTime, member.endTime) }}
          </span>
          <span v-else>
            已运行: {{ formatDuration(member.startTime, new Date()) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 并行动画指示器 -->
    <div v-if="isRunning" class="parallel-indicator">
      <div class="indicator-line"></div>
      <div class="indicator-pulse"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Connection, Loading, Check, Clock, Warning } from '@element-plus/icons-vue'

interface Member {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress?: number
  startTime?: Date
  endTime?: Date
}

interface Props {
  members: Member[]
}

const props = defineProps<Props>()

const memberCount = computed(() => props.members.length)

const isRunning = computed(() => {
  return props.members.some(m => m.status === 'running')
})

const allCompleted = computed(() => {
  return props.members.length > 0 && props.members.every(m => m.status === 'completed')
})

const getStatusText = () => {
  if (allCompleted.value) return '已完成'
  if (isRunning.value) return '执行中...'
  return '等待中'
}

const timeRemaining = computed(() => {
  const runningMembers = props.members.filter(m => m.status === 'running')
  if (runningMembers.length === 0) return ''

  // 计算预计剩余时间（简单估算）
  const avgProgress = runningMembers.reduce((sum, m) => sum + (m.progress || 0), 0) / runningMembers.length
  if (avgProgress > 0) {
    const remaining = Math.round((100 - avgProgress) / 10) // 粗略估算
    return `预计剩余: ${remaining}秒`
  }
  return '计算中...'
})

const getMemberClass = (status: string) => {
  return {
    'member-running': status === 'running',
    'member-completed': status === 'completed',
    'member-error': status === 'error',
    'member-pending': status === 'pending'
  }
}

const getIconClass = (status: string) => {
  return {
    'icon-running': status === 'running',
    'icon-completed': status === 'completed',
    'icon-error': status === 'error',
    'icon-pending': status === 'pending'
  }
}

const getProgressColor = (status: string) => {
  if (status === 'completed') return '#10b981'
  if (status === 'error') return '#ef4444'
  if (status === 'running') return '#3b82f6'
  return '#e5e7eb'
}

const getMemberIcon = (status: string) => {
  const icons = {
    pending: Clock,
    running: Loading,
    completed: Check,
    error: Warning
  }
  return icons[status as keyof typeof icons] || Clock
}

const getMemberStatusText = (status: string) => {
  const texts = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    error: '错误'
  }
  return texts[status as keyof typeof texts] || '未知'
}

const formatDuration = (start: Date, end: Date) => {
  const duration = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000)
  return `${duration}秒`
}
</script>

<style scoped>
.parallel-execution {
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 2px dashed #8b5cf6;
  animation: fadeIn 0.4s ease-out;
}

.parallel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.parallel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.parallel-title .icon {
  color: #8b5cf6;
  font-size: 20px;
}

.parallel-status {
  text-align: right;
}

.status-text {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #8b5cf6;
}

.time-remaining {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.parallel-members {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.member-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.member-running {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
}

.member-completed {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #10b981;
}

.member-error {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #ef4444;
}

.member-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.member-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
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

.member-info {
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 2px 0;
}

.member-status {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.member-progress {
  margin: 10px 0;
}

.member-time {
  font-size: 11px;
  color: #9ca3af;
  text-align: right;
}

/* 并行动画指示器 */
.parallel-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.indicator-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6);
  background-size: 200% 100%;
  animation: flow 2s linear infinite;
}

.indicator-pulse {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: rgba(139, 92, 246, 0.3);
  animation: pulse-top 2s ease-in-out infinite;
}

@keyframes flow {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 200% 0%;
  }
}

@keyframes pulse-top {
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
