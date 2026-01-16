<template>
  <div class="budget-estimate-display">
    <!-- 头部 -->
    <div class="budget-header">
      <h3 class="title">
        <ElIcon class="icon"><Coin /></ElIcon>
        预算估算
      </h3>
      <ElTag type="danger" size="small">成本控制</ElTag>
    </div>

    <!-- 总预算概览 -->
    <div class="budget-overview">
      <div class="overview-card total">
        <div class="overview-icon">
          <ElIcon :size="48"><Wallet /></ElIcon>
        </div>
        <div class="overview-content">
          <div class="overview-label">总预算</div>
          <div class="overview-value">¥{{ formatNumber(budget.totalCost) }}</div>
        </div>
      </div>

      <div class="overview-card breakdown-count">
        <div class="overview-icon">
          <ElIcon :size="48"><Grid /></ElIcon>
        </div>
        <div class="overview-content">
          <div class="overview-label">预算项目</div>
          <div class="overview-value">{{ budget.breakdown?.length || 0 }} 项</div>
        </div>
      </div>
    </div>

    <!-- 预算明细 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><List /></ElIcon>
        <span>预算明细</span>
      </div>
      <div class="breakdown-list">
        <div
          v-for="(item, index) in budget.breakdown"
          :key="index"
          class="breakdown-item"
        >
          <div class="item-header">
            <div class="item-number">{{ index + 1 }}</div>
            <div class="item-info">
              <div class="item-category">{{ item.category }}</div>
              <div class="item-description">{{ item.description }}</div>
            </div>
            <div class="item-amount">¥{{ formatNumber(item.amount) }}</div>
          </div>
          <div class="item-bar">
            <div
              class="bar-fill"
              :style="{ width: `${(item.amount / budget.totalCost) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预算分配图表 -->
    <div class="content-section chart-section">
      <div class="section-title">
        <ElIcon><DataLine /></ElIcon>
        <span>预算分配</span>
      </div>
      <div class="distribution-chart">
        <div
          v-for="(item, index) in budget.breakdown"
          :key="index"
          class="chart-item"
        >
          <div class="chart-label">{{ item.category }}</div>
          <div class="chart-bar-container">
            <div
              class="chart-bar"
              :style="{
                width: `${(item.amount / budget.totalCost) * 100}%`,
                backgroundColor: getColor(index)
              }"
            ></div>
          </div>
          <div class="chart-percentage">
            {{ ((item.amount / budget.totalCost) * 100).toFixed(1) }}%
          </div>
        </div>
      </div>
    </div>

    <!-- 优化建议 -->
    <div class="content-section recommendations-section">
      <div class="section-title">
        <ElIcon><Bell /></ElIcon>
        <span>优化建议 ({{ budget.recommendations?.length || 0 }}条)</span>
      </div>
      <div class="recommendations-list">
        <div
          v-for="(recommendation, index) in budget.recommendations"
          :key="index"
          class="recommendation-item"
        >
          <div class="recommendation-icon">
            <ElIcon><Promotion /></ElIcon>
          </div>
          <div class="recommendation-text">{{ recommendation }}</div>
        </div>
      </div>
    </div>

    <!-- 预算统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon highest">
          <ElIcon><TrendCharts /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-label">最高项目</div>
          <div class="stat-value">{{ highestBudgetCategory }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon average">
          <ElIcon><DataBoard /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-label">平均项目</div>
          <div class="stat-value">¥{{ formatNumber(averageBudget) }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon items">
          <ElIcon><Grid /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-label">项目总数</div>
          <div class="stat-value">{{ budget.breakdown?.length || 0 }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon, ElTag } from 'element-plus'
import {
  Coin,
  Wallet,
  Grid,
  List,
  DataLine,
  Bell,
  Promotion,
  TrendCharts,
  DataBoard
} from '@element-plus/icons-vue'
import type { BudgetEstimate } from '@/types/exhibition'

interface Props {
  budget: BudgetEstimate
}

const props = defineProps<Props>()

// 格式化数字
const formatNumber = (num: number) => {
  return num.toLocaleString('zh-CN')
}

// 预算颜色列表
const colors = [
  '#3b82f6', // 蓝色
  '#10b981', // 绿色
  '#f59e0b', // 橙色
  '#ef4444', // 红色
  '#8b5cf6', // 紫色
  '#06b6d4', // 青色
  '#ec4899', // 粉色
  '#84cc16'  // 黄绿色
]

const getColor = (index: number) => {
  return colors[index % colors.length]
}

// 最高预算项目
const highestBudgetCategory = computed(() => {
  if (!props.budget.breakdown || props.budget.breakdown.length === 0) {
    return '无数据'
  }

  const highest = props.budget.breakdown.reduce((max, item) =>
    item.amount > max.amount ? item : max
  )

  return highest.category
})

// 平均预算
const averageBudget = computed(() => {
  if (!props.budget.breakdown || props.budget.breakdown.length === 0) {
    return 0
  }

  return props.budget.totalCost / props.budget.breakdown.length
})
</script>

<style scoped>
.budget-estimate-display {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
}

.budget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.icon {
  font-size: 24px;
  color: #ef4444;
}

.budget-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: 12px;
  border: 2px solid;
  transition: all 0.3s;
}

.overview-card.total {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
}

.overview-card.breakdown-count {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #3b82f6;
}

.overview-icon {
  flex-shrink: 0;
}

.overview-card.total .overview-icon {
  color: #f59e0b;
}

.overview-card.breakdown-count .overview-icon {
  color: #3b82f6;
}

.overview-content {
  flex: 1;
}

.overview-label {
  font-size: 13px;
  font-weight: 500;
  color: #78716c;
  margin-bottom: 4px;
}

.overview-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.content-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #ef4444;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.breakdown-item {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.breakdown-item:hover {
  border-color: #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.item-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}

.item-info {
  flex: 1;
}

.item-category {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.item-description {
  font-size: 13px;
  color: #6b7280;
}

.item-amount {
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
}

.item-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
  transition: width 0.5s ease;
}

.chart-section {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-left-color: #10b981;
}

.distribution-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-item {
  display: grid;
  grid-template-columns: 120px 1fr 80px;
  gap: 12px;
  align-items: center;
}

.chart-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.chart-bar-container {
  height: 24px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.chart-bar {
  height: 100%;
  transition: width 0.5s ease;
}

.chart-percentage {
  font-size: 14px;
  font-weight: 600;
  color: #10b981;
  text-align: right;
}

.recommendations-section {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-left-color: #f59e0b;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.recommendation-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fcd34d;
  border-radius: 50%;
  color: #92400e;
}

.recommendation-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
  color: #78716c;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.stat-card:hover {
  border-color: #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 24px;
  color: #fff;
}

.stat-icon.highest {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.stat-icon.average {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-icon.items {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}
</style>
