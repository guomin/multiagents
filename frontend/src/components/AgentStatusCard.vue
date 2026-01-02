<template>
  <div class="agent-status-card" :class="[`status-${agent.status}`, { compact }]">
    <div class="card-header">
      <div class="agent-icon" :class="`icon-${agent.status}`">
        <ElIcon>
          <component :is="getAgentIcon(agent.status)" />
        </ElIcon>
      </div>
      <div class="agent-info">
        <h4 class="agent-name">{{ agent.name }}</h4>
        <p class="agent-role">{{ agent.role || '智能体' }}</p>
      </div>
      <ElTag :type="getStatusType(agent.status)" size="small">
        {{ getStatusText(agent.status) }}
      </ElTag>
    </div>

    <div v-if="!compact && agent.progress !== undefined" class="card-progress">
      <ElProgress
        :percentage="agent.progress"
        :color="getProgressColor(agent.status)"
        :stroke-width="6"
        :show-text="true"
      />
    </div>

    <div v-if="!compact && agent.message" class="card-message">
      <ElIcon class="message-icon"><ChatDotRound /></ElIcon>
      <span class="message-text">{{ agent.message }}</span>
    </div>

    <div v-if="agent.lastActivity" class="card-footer">
      <span class="activity-time">{{ formatTime(agent.lastActivity) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Clock, Loading, Check, Warning, ChatDotRound } from '@element-plus/icons-vue'

interface Agent {
  id: string
  name: string
  role?: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress?: number
  message?: string
  lastActivity?: Date | string
}

interface Props {
  agent: Agent
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const getAgentIcon = (status: string) => {
  const icons = {
    pending: Clock,
    running: Loading,
    completed: Check,
    error: Warning
  }
  return icons[status as keyof typeof icons] || Clock
}

const getStatusType = (status: string) => {
  const types = {
    pending: 'info',
    running: 'primary',
    completed: 'success',
    error: 'danger'
  }
  return types[status as keyof typeof types] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    error: '错误'
  }
  return texts[status as keyof typeof texts] || '未知'
}

const getProgressColor = (status: string) => {
  if (status === 'completed') return '#10b981'
  if (status === 'error') return '#ef4444'
  if (status === 'running') return '#3b82f6'
  return '#e5e7eb'
}

const formatTime = (time: Date | string) => {
  const date = typeof time === 'string' ? new Date(time) : time
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return `${diff}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  return date.toLocaleTimeString()
}
</script>

<style scoped>
.agent-status-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  animation: slideIn 0.4s ease-out;
}

.agent-status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.agent-status-card.status-running {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.agent-status-card.status-completed {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.agent-status-card.status-error {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.agent-status-card.compact {
  padding: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
  transition: all 0.3s ease;
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

.compact .agent-icon {
  width: 32px;
  height: 32px;
  font-size: 16px;
}

.agent-info {
  flex: 1;
  min-width: 0;
}

.agent-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-role {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.card-progress {
  margin-top: 12px;
}

.card-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  font-size: 13px;
  color: #4b5563;
}

.message-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: #3b82f6;
}

.message-text {
  flex: 1;
  word-break: break-word;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.activity-time {
  font-size: 11px;
  color: #9ca3af;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
</style>
