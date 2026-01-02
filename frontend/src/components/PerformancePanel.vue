<template>
  <div class="performance-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <ElIcon class="icon"><DataAnalysis /></ElIcon>
        性能监控
      </h3>
      <ElSwitch
        v-model="showDetails"
        size="small"
        active-text="详细"
        inactive-text="简略"
      />
    </div>

    <div class="panel-content">
      <!-- 总览指标 -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon metric-blue">
            <ElIcon><Timer /></ElIcon>
          </div>
          <div class="metric-content">
            <p class="metric-label">总耗时</p>
            <p class="metric-value">{{ formatDuration(totalDuration) }}</p>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-green">
            <ElIcon><Coin /></ElIcon>
          </div>
          <div class="metric-content">
            <p class="metric-label">Token使用</p>
            <p class="metric-value">{{ formatNumber(totalTokens) }}</p>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-purple">
            <ElIcon><Odometer /></ElIcon>
          </div>
          <div class="metric-content">
            <p class="metric-label">API调用</p>
            <p class="metric-value">{{ apiCalls }}次</p>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon metric-orange">
            <ElIcon><TrendCharts /></ElIcon>
          </div>
          <div class="metric-content">
            <p class="metric-label">平均速度</p>
            <p class="metric-value">{{ avgSpeed }} tokens/s</p>
          </div>
        </div>
      </div>

      <!-- 详细数据（展开时显示） -->
      <div v-if="showDetails" class="details-section">
        <ElDivider content-position="left">
          <span class="divider-text">各阶段耗时</span>
        </ElDivider>

        <div class="stage-breakdown">
          <div
            v-for="stage in stages"
            :key="stage.name"
            class="stage-item"
          >
            <div class="stage-header">
              <span class="stage-name">{{ stage.label }}</span>
              <span class="stage-time">{{ formatDuration(stage.duration) }}</span>
            </div>
            <div class="stage-progress">
              <div
                class="stage-progress-bar"
                :style="{
                  width: `${(stage.duration / totalDuration) * 100}%`,
                  background: stage.color
                }"
              ></div>
            </div>
            <div class="stage-meta">
              <span class="stage-percent">{{ ((stage.duration / totalDuration) * 100).toFixed(1) }}%</span>
              <span v-if="stage.tokens" class="stage-tokens">
                {{ formatNumber(stage.tokens) }} tokens
              </span>
            </div>
          </div>
        </div>

        <ElDivider content-position="left" class="mt-4">
          <span class="divider-text">Token消耗分布</span>
        </ElDivider>

        <div class="token-distribution">
          <div class="token-item">
            <span class="token-label">输入Token</span>
            <span class="token-value token-input">{{ formatNumber(inputTokens) }}</span>
          </div>
          <div class="token-item">
            <span class="token-label">输出Token</span>
            <span class="token-value token-output">{{ formatNumber(outputTokens) }}</span>
          </div>
          <div class="token-item total">
            <span class="token-label">总计</span>
            <span class="token-value">{{ formatNumber(totalTokens) }}</span>
          </div>
        </div>
      </div>

      <!-- 实时速率图表 -->
      <div v-if="showDetails" class="rate-chart">
        <ElDivider content-position="left" class="mb-3">
          <span class="divider-text">实时速率</span>
        </ElDivider>
        <div class="chart-container">
          <div
            v-for="(rate, index) in rateHistory"
            :key="index"
            class="chart-bar"
            :style="{ height: `${(rate / maxRate) * 100}%` }"
            :title="`${rate.toFixed(1)} tokens/s`"
          ></div>
        </div>
        <div class="chart-legend">
          <span class="legend-label">当前: {{ currentRate }} tokens/s</span>
          <span class="legend-label">峰值: {{ maxRate }} tokens/s</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  DataAnalysis,
  Timer,
  Coin,
  Odometer,
  TrendCharts
} from '@element-plus/icons-vue'

interface Stage {
  name: string
  label: string
  duration: number
  tokens?: number
  color: string
}

const props = defineProps<{
  totalDuration?: number
  inputTokens?: number
  outputTokens?: number
  apiCalls?: number
  stages?: Stage[]
}>()

const showDetails = ref(false)

const totalDuration = computed(() => props.totalDuration || 0)
const inputTokens = computed(() => props.inputTokens || 0)
const outputTokens = computed(() => props.outputTokens || 0)
const totalTokens = computed(() => inputTokens.value + outputTokens.value)
const apiCalls = computed(() => props.apiCalls || 0)

const avgSpeed = computed(() => {
  if (totalDuration.value === 0) return 0
  return Math.round(totalTokens.value / (totalDuration.value / 1000))
})

const currentRate = ref(0)
const maxRate = ref(0)
const rateHistory = ref<number[]>([])

// 模拟实时速率更新
const updateRate = (rate: number) => {
  currentRate.value = rate
  rateHistory.value.push(rate)
  if (rateHistory.value.length > 30) {
    rateHistory.value.shift()
  }
  maxRate.value = Math.max(maxRate.value, rate)
}

// 格式化时长
const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// 暴露方法供父组件调用
defineExpose({
  updateRate
})
</script>

<style scoped>
.performance-panel {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
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

.panel-content {
  padding: 16px 20px;
}

/* 指标卡片 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.metric-card:hover {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  flex-shrink: 0;
}

.metric-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.metric-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.metric-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.metric-orange {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 11px;
  color: #6b7280;
  margin: 0 0 2px 0;
}

.metric-value {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 详细数据 */
.details-section {
  margin-top: 16px;
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

.divider-text {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

/* 阶段分解 */
.stage-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stage-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stage-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.stage-time {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.stage-progress {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.stage-progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.stage-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stage-percent {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.stage-tokens {
  font-size: 11px;
  color: #9ca3af;
}

/* Token分布 */
.token-distribution {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.token-item.total {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
}

.token-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.token-value {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.token-input {
  color: #3b82f6;
}

.token-output {
  color: #10b981;
}

/* 速率图表 */
.rate-chart {
  margin-top: 16px;
}

.chart-container {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 60px;
  padding: 10px 0;
}

.chart-bar {
  flex: 1;
  min-width: 4px;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 2px 2px 0 0;
  transition: height 0.3s ease;
  opacity: 0.8;
}

.chart-bar:hover {
  opacity: 1;
}

.chart-legend {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.legend-label {
  font-size: 11px;
  color: #6b7280;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}
</style>
