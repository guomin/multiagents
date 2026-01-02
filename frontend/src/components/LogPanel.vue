<template>
  <div class="log-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <ElIcon class="icon"><Document /></ElIcon>
        执行日志
      </h3>
      <div class="header-actions">
        <ElInput
          v-model="searchKeyword"
          placeholder="搜索日志..."
          size="small"
          clearable
          class="search-input"
        >
          <template #prefix>
            <ElIcon><Search /></ElIcon>
          </template>
        </ElInput>
        <ElDropdown trigger="click" @command="handleFilterCommand">
          <ElButton size="small" text>
            <ElIcon><Filter /></ElIcon>
            <span class="ml-1">筛选</span>
            <ElIcon class="el-icon--right"><ArrowDown /></ElIcon>
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem command="all">
                <ElIcon><Files /></ElIcon>
                全部
              </ElDropdownItem>
              <ElDropdownItem command="info">
                <ElIcon color="#3b82f6"><InfoFilled /></ElIcon>
                信息
              </ElDropdownItem>
              <ElDropdownItem command="success">
                <ElIcon color="#10b981"><SuccessFilled /></ElIcon>
                成功
              </ElDropdownItem>
              <ElDropdownItem command="warning">
                <ElIcon color="#f59e0b"><Warning /></ElIcon>
                警告
              </ElDropdownItem>
              <ElDropdownItem command="error">
                <ElIcon color="#ef4444"><CircleCloseFilled /></ElIcon>
                错误
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
        <ElButton size="small" text @click="clearLogs">
          <ElIcon><Delete /></ElIcon>
        </ElButton>
      </div>
    </div>

    <div class="panel-stats">
      <div class="stat-item" :class="{ active: currentFilter === 'all' }" @click="setFilter('all')">
        <span class="stat-number">{{ filteredLogs.length }}</span>
        <span class="stat-label">全部</span>
      </div>
      <div class="stat-item stat-info" :class="{ active: currentFilter === 'info' }" @click="setFilter('info')">
        <span class="stat-number">{{ logCounts.info }}</span>
        <span class="stat-label">信息</span>
      </div>
      <div class="stat-item stat-success" :class="{ active: currentFilter === 'success' }" @click="setFilter('success')">
        <span class="stat-number">{{ logCounts.success }}</span>
        <span class="stat-label">成功</span>
      </div>
      <div class="stat-item stat-warning" :class="{ active: currentFilter === 'warning' }" @click="setFilter('warning')">
        <span class="stat-number">{{ logCounts.warning }}</span>
        <span class="stat-label">警告</span>
      </div>
      <div class="stat-item stat-error" :class="{ active: currentFilter === 'error' }" @click="setFilter('error')">
        <span class="stat-number">{{ logCounts.error }}</span>
        <span class="stat-label">错误</span>
      </div>
    </div>

    <div class="panel-content">
      <div class="logs-container" ref="logsContainer">
        <div class="logs-list">
          <div
            v-for="(log, index) in filteredLogs"
            :key="index"
            class="log-item"
            :class="`log-${log.type}`"
            @click="copyLog(log)"
          >
            <span class="log-index">#{{ index + 1 }}</span>
            <span class="log-time">{{ log.time }}</span>
            <ElIcon class="log-icon">
              <component :is="getLogIcon(log.type)" />
            </ElIcon>
            <span class="log-message" v-html="highlightKeyword(log.message)"></span>
            <ElIcon class="log-copy" title="复制">
              <CopyDocument />
            </ElIcon>
          </div>
        </div>

        <div v-if="filteredLogs.length === 0" class="logs-empty">
          <ElIcon class="empty-icon"><Document /></ElIcon>
          <p>{{ searchKeyword ? '未找到匹配的日志' : '暂无日志' }}</p>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <span class="footer-info">
        共 {{ filteredLogs.length }} 条日志
        <span v-if="searchKeyword">（搜索: "{{ searchKeyword }}"）</span>
      </span>
      <ElButton size="small" text @click="scrollToBottom">
        <ElIcon><Bottom /></ElIcon>
        滚动到底部
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  Search,
  Filter,
  Delete,
  Files,
  InfoFilled,
  SuccessFilled,
  Warning,
  CircleCloseFilled,
  ArrowDown,
  CopyDocument,
  Bottom
} from '@element-plus/icons-vue'

interface Log {
  time: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp?: number
}

const props = defineProps<{
  logs: Log[]
}>()

const emit = defineEmits<{
  clear: []
}>()

const searchKeyword = ref('')
const currentFilter = ref<'all' | 'info' | 'success' | 'warning' | 'error'>('all')
const logsContainer = ref<HTMLElement>()

// 过滤后的日志
const filteredLogs = computed(() => {
  let logs = props.logs

  // 按类型筛选
  if (currentFilter.value !== 'all') {
    logs = logs.filter(log => log.type === currentFilter.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    logs = logs.filter(log =>
      log.message.toLowerCase().includes(keyword)
    )
  }

  return logs
})

// 日志统计
const logCounts = computed(() => {
  const counts = {
    all: props.logs.length,
    info: 0,
    success: 0,
    warning: 0,
    error: 0
  }

  props.logs.forEach(log => {
    counts[log.type]++
  })

  return counts
})

const getLogIcon = (type: string) => {
  const icons = {
    info: InfoFilled,
    success: SuccessFilled,
    warning: Warning,
    error: CircleCloseFilled
  }
  return icons[type as keyof typeof icons] || InfoFilled
}

const highlightKeyword = (message: string) => {
  if (!searchKeyword.value) return message

  const regex = new RegExp(`(${searchKeyword.value})`, 'gi')
  return message.replace(regex, '<span class="highlight">$1</span>')
}

const setFilter = (filter: 'all' | 'info' | 'success' | 'warning' | 'error') => {
  currentFilter.value = filter
}

const handleFilterCommand = (command: string) => {
  setFilter(command as any)
}

const clearLogs = () => {
  emit('clear')
}

const copyLog = async (log: Log) => {
  try {
    await navigator.clipboard.writeText(`[${log.time}] ${log.message}`)
    ElMessage.success('日志已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  })
}

// 监听日志变化，自动滚动到底部
watch(() => props.logs.length, () => {
  scrollToBottom()
}, { flush: 'post' })
</script>

<style scoped>
.log-panel {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: 500px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.panel-title .icon {
  color: #3b82f6;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 200px;
}

.ml-1 {
  margin-left: 4px;
}

/* 统计栏 */
.panel-stats {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  overflow-x: auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 60px;
}

.stat-item:hover {
  background: #f3f4f6;
}

.stat-item.active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #3b82f6;
}

.stat-number {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

.stat-info.active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #3b82f6;
}

.stat-success.active {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-color: #10b981;
}

.stat-warning.active {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
}

.stat-error.active {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #ef4444;
}

/* 内容区 */
.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.logs-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.log-item:hover {
  background: #f9fafb;
  transform: translateX(2px);
}

.log-index {
  font-size: 10px;
  color: #9ca3af;
  min-width: 35px;
  user-select: none;
}

.log-time {
  font-size: 11px;
  color: #9ca3af;
  min-width: 70px;
  font-family: 'Consolas', monospace;
}

.log-icon {
  flex-shrink: 0;
  font-size: 14px;
}

.log-message {
  flex: 1;
  word-break: break-word;
  line-height: 1.5;
}

.log-copy {
  opacity: 0;
  font-size: 14px;
  color: #9ca3af;
  transition: all 0.2s ease;
}

.log-item:hover .log-copy {
  opacity: 1;
}

.log-item:hover .log-copy:hover {
  color: #3b82f6;
}

/* 日志类型样式 */
.log-info {
  background: #eff6ff;
  color: #1e40af;
}

.log-info .log-icon {
  color: #3b82f6;
}

.log-success {
  background: #dcfce7;
  color: #166534;
}

.log-success .log-icon {
  color: #10b981;
}

.log-warning {
  background: #fef3c7;
  color: #92400e;
}

.log-warning .log-icon {
  color: #f59e0b;
}

.log-error {
  background: #fee2e2;
  color: #991b1b;
}

.log-error .log-icon {
  color: #ef4444;
}

/* 高亮 */
.highlight {
  background: #fef08a;
  color: #854d0e;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
}

/* 空状态 */
.logs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.logs-empty p {
  font-size: 13px;
  margin: 0;
}

/* 底部栏 */
.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.footer-info {
  font-size: 12px;
  color: #6b7280;
}

/* 滚动条样式 */
.logs-container::-webkit-scrollbar {
  width: 6px;
}

.logs-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.logs-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.logs-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
