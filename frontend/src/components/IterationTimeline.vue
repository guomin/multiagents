<template>
  <div class="iteration-timeline">
    <div class="timeline-header">
      <h3 class="timeline-title">
        <ElIcon class="icon"><RefreshRight /></ElIcon>
        迭代历史
      </h3>
      <ElButton
        v-if="iterations.length > 1"
        text
        type="primary"
        size="small"
        @click="toggleExpand"
      >
        {{ isExpanded ? '收起全部' : '展开全部' }}
      </ElButton>
    </div>

    <div class="timeline-container">
      <div
        v-for="(iteration, index) in iterations"
        :key="iteration.id"
        class="timeline-item"
        :class="{
          'current': iteration.isCurrent,
          'expanded': isExpanded || iteration.isCurrent || index === 0
        }"
      >
        <!-- 时间线指示器 -->
        <div class="timeline-indicator">
          <div class="timeline-dot" :class="getStatusClass(iteration.status)"></div>
          <div v-if="index < iterations.length - 1" class="timeline-line"></div>
        </div>

        <!-- 时间线内容 -->
        <div class="timeline-content">
          <!-- 迭代头部 -->
          <div class="iteration-header" @click="toggleIteration(iteration.id)">
            <div class="iteration-badge" :class="getStatusClass(iteration.status)">
              <span class="iteration-number">#{{ iteration.number }}</span>
              <span class="iteration-label">{{ getStatusLabel(iteration.status) }}</span>
            </div>

            <div class="iteration-meta">
              <span class="iteration-time">{{ iteration.time }}</span>
              <ElTag
                v-if="iteration.score"
                :type="getScoreType(iteration.score)"
                size="small"
              >
                {{ iteration.score }}分
              </ElTag>
              <ElTag
                v-if="iteration.scoreDiff"
                :type="iteration.scoreDiff > 0 ? 'success' : 'danger'"
                size="small"
              >
                {{ iteration.scoreDiff > 0 ? '+' : '' }}{{ iteration.scoreDiff }}分
              </ElTag>
            </div>

            <ElIcon class="expand-icon" :class="{ expanded: isExpanded || iteration.isCurrent }">
              <ArrowDown />
            </ElIcon>
          </div>

          <!-- 迭代详情 -->
          <div class="iteration-details">
            <!-- 修订原因 -->
            <div v-if="iteration.reason" class="iteration-reason">
              <span class="reason-label">修订原因：</span>
              <span class="reason-text">{{ iteration.reason }}</span>
            </div>

            <!-- 智能体状态 -->
            <div class="agents-status">
              <div
                v-for="agent in iteration.agents"
                :key="agent.id"
                class="agent-status-item"
                :class="getStatusClass(agent.status)"
              >
                <ElIcon class="agent-icon">
                  <component :is="getAgentIcon(agent.status)" />
                </ElIcon>
                <span class="agent-name">{{ agent.name }}</span>
                <span v-if="agent.progress" class="agent-progress">{{ agent.progress }}%</span>
              </div>
            </div>

            <!-- 并行执行展示 -->
            <div v-if="iteration.parallelGroups && iteration.parallelGroups.length > 0" class="parallel-groups">
              <div
                v-for="group in iteration.parallelGroups"
                :key="group.id"
                class="parallel-group-mini"
              >
                <div class="parallel-label">
                  <ElIcon class="icon"><Connection /></ElIcon>
                  {{ group.name }}
                </div>
                <div class="parallel-members-mini">
                  <div
                    v-for="member in group.members"
                    :key="member.id"
                    class="parallel-member-mini"
                  >
                    <span class="member-name">{{ member.name }}</span>
                    <ElProgress
                      :percentage="member.progress"
                      :stroke-width="4"
                      :show-text="true"
                      :color="getProgressColor(member.status)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div v-if="!iteration.isCurrent" class="iteration-actions">
              <ElButton size="small" text @click="viewIteration(iteration.id)">
                <ElIcon class="mr-1"><View /></ElIcon>
                查看详情
              </ElButton>
              <ElButton
                v-if="iteration.canCompare"
                size="small"
                text
                type="primary"
                @click="compareIteration(iteration.id)"
              >
                <ElIcon class="mr-1"><DocumentCopy /></ElIcon>
                版本对比
              </ElButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  RefreshRight,
  ArrowDown,
  Check,
  Clock,
  Warning,
  Loading,
  View,
  DocumentCopy,
  Connection
} from '@element-plus/icons-vue'

interface Agent {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress?: number
}

interface ParallelGroup {
  id: string
  name: string
  members: Agent[]
}

interface Iteration {
  id: string
  number: number
  time: string
  status: 'completed' | 'running' | 'pending'
  isCurrent: boolean
  score?: number
  scoreDiff?: number
  reason?: string
  agents: Agent[]
  parallelGroups?: ParallelGroup[]
  canCompare?: boolean
}

interface Props {
  iterations: Iteration[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'view', iterationId: string): void
  (e: 'compare', iterationId: string): void
}>()

const isExpanded = ref(false)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const toggleIteration = (id: string) => {
  const iteration = props.iterations.find(i => i.id === id)
  if (iteration && !iteration.isCurrent) {
    isExpanded.value = !isExpanded.value
  }
}

const getStatusClass = (status: string) => {
  return {
    'status-completed': status === 'completed',
    'status-running': status === 'running',
    'status-pending': status === 'pending',
    'status-error': status === 'error'
  }
}

const getStatusLabel = (status: string) => {
  const labels = {
    completed: '已完成',
    running: '进行中',
    pending: '等待中',
    error: '错误'
  }
  return labels[status as keyof typeof labels] || status
}

const getScoreType = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 75) return 'warning'
  return 'danger'
}

const getAgentIcon = (status: string) => {
  const icons = {
    pending: Clock,
    running: Loading,
    completed: Check,
    error: Warning
  }
  return icons[status as keyof typeof icons] || Clock
}

const getProgressColor = (status: string) => {
  if (status === 'completed') return '#10b981'
  if (status === 'error') return '#ef4444'
  if (status === 'running') return '#3b82f6'
  return '#e5e7eb'
}

const viewIteration = (id: string) => {
  emit('view', id)
}

const compareIteration = (id: string) => {
  emit('compare', id)
}
</script>

<style scoped>
.iteration-timeline {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.timeline-title .icon {
  color: #8b5cf6;
}

.timeline-container {
  position: relative;
}

.timeline-item {
  display: flex;
  margin-bottom: 20px;
  animation: slideInRight 0.4s ease-out;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item:not(.expanded) .iteration-details {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
}

.timeline-item.expanded .iteration-details {
  max-height: 1000px;
  opacity: 1;
}

/* 时间线指示器 */
.timeline-indicator {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16px;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.status-completed .timeline-dot {
  background: #10b981;
}

.status-running .timeline-dot {
  background: #3b82f6;
  animation: pulse-dot 2s ease-in-out infinite;
}

.status-pending .timeline-dot {
  background: #d1d5db;
}

.status-error .timeline-dot {
  background: #ef4444;
}

.timeline-line {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: calc(100% + 20px);
  background: #e5e7eb;
  z-index: 0;
}

/* 时间线内容 */
.timeline-content {
  flex: 1;
}

.iteration-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.iteration-header:hover {
  background: #f3f4f6;
}

.iteration-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.status-completed .iteration-badge {
  background: #dcfce7;
  color: #166534;
}

.status-running .iteration-badge {
  background: #dbeafe;
  color: #1e40af;
}

.status-pending .iteration-badge {
  background: #e5e7eb;
  color: #4b5563;
}

.iteration-number {
  font-size: 14px;
}

.iteration-label {
  font-size: 12px;
  opacity: 0.9;
}

.iteration-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.iteration-time {
  font-size: 12px;
  color: #6b7280;
}

.expand-icon {
  color: #9ca3af;
  transition: transform 0.3s ease;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* 迭代详情 */
.iteration-details {
  margin-top: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.iteration-reason {
  padding: 10px;
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 13px;
}

.reason-label {
  font-weight: 600;
  color: #92400e;
}

.agents-status {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.agent-status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.status-completed.agent-status-item {
  background: #dcfce7;
  color: #166534;
}

.status-running.agent-status-item {
  background: #dbeafe;
  color: #1e40af;
}

.agent-icon {
  font-size: 14px;
}

.agent-progress {
  font-weight: 500;
}

/* 并行组展示 */
.parallel-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.parallel-group-mini {
  padding: 12px;
  background: #f5f3ff;
  border: 1px dashed #8b5cf6;
  border-radius: 8px;
}

.parallel-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #7c3aed;
  margin-bottom: 8px;
}

.parallel-label .icon {
  font-size: 14px;
}

.parallel-members-mini {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.parallel-member-mini {
  padding: 8px;
  background: #fff;
  border-radius: 6px;
}

.member-name {
  display: block;
  font-size: 12px;
  color: #4b5563;
  margin-bottom: 6px;
}

.iteration-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse-dot {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}
</style>
