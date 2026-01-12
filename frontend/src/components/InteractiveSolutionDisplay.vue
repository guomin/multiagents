<template>
  <div class="interactive-solution-display">
    <!-- 头部 -->
    <div class="solution-header">
      <h3 class="title">
        <ElIcon class="icon"><Connection /></ElIcon>
        互动技术方案
      </h3>
      <ElTag type="info" size="small">互动体验</ElTag>
    </div>

    <!-- 技术栈 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><Cpu /></ElIcon>
        <span>技术栈 ({{ solution.technologies?.length || 0 }}项)</span>
      </div>
      <div class="tech-stack">
        <div
          v-for="(tech, index) in solution.technologies"
          :key="index"
          class="tech-chip"
        >
          <ElIcon class="tech-icon"><Monitor /></ElIcon>
          <span>{{ tech }}</span>
        </div>
      </div>
    </div>

    <!-- 互动项目 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><Grid /></ElIcon>
        <span>互动项目 ({{ solution.interactives?.length || 0 }}个)</span>
      </div>
      <div class="interactives-grid">
        <div
          v-for="(interactive, index) in solution.interactives"
          :key="index"
          class="interactive-card"
        >
          <div class="card-header">
            <div class="header-icon">
              <ElIcon><Pointer /></ElIcon>
            </div>
            <div class="header-text">
              <div class="interactive-name">{{ interactive.name }}</div>
              <ElTag :type="getTagType(interactive.type)" size="small">
                {{ interactive.type }}
              </ElTag>
            </div>
          </div>
          <div class="card-body">
            <div class="description">{{ interactive.description }}</div>
            <div v-if="interactive.cost" class="cost-info">
              <ElIcon><Coin /></ElIcon>
              <span>预算: ¥{{ interactive.cost.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 技术要求 -->
    <div class="content-section requirements-section">
      <div class="section-title">
        <ElIcon><Document /></ElIcon>
        <span>技术要求</span>
      </div>
      <div class="requirements-content">
        <div class="requirements-icon">
          <ElIcon :size="48"><Setting /></ElIcon>
        </div>
        <div class="requirements-text">{{ solution.technicalRequirements }}</div>
      </div>
    </div>

    <!-- 互动统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon tech">
          <ElIcon><Cpu /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ solution.technologies?.length || 0 }}</div>
          <div class="stat-label">技术类型</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon items">
          <ElIcon><Grid /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ solution.interactives?.length || 0 }}</div>
          <div class="stat-label">互动项目</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon budget">
          <ElIcon><Coin /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalCost }}</div>
          <div class="stat-label">总预算(万)</div>
        </div>
      </div>
    </div>

    <!-- 技术分类展示 -->
    <div v-if="solution.interactives && solution.interactives.length > 0" class="type-distribution">
      <div class="section-title">
        <ElIcon><DataLine /></ElIcon>
        <span>项目类型分布</span>
      </div>
      <div class="distribution-grid">
        <div
          v-for="(count, type) in typeDistribution"
          :key="type"
          class="distribution-item"
        >
          <div class="distribution-label">{{ type }}</div>
          <div class="distribution-bar">
            <div
              class="bar-fill"
              :style="{ width: `${(count / solution.interactives.length) * 100}%` }"
            ></div>
          </div>
          <div class="distribution-count">{{ count }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon, ElTag } from 'element-plus'
import {
  Connection,
  Cpu,
  Monitor,
  Grid,
  Pointer,
  Coin,
  Document,
  Setting,
  DataLine
} from '@element-plus/icons-vue'
import type { InteractiveSolution } from '@/types/exhibition'

interface Props {
  solution: InteractiveSolution
}

const props = defineProps<Props>()

// 计算总预算
const totalCost = computed(() => {
  if (!props.solution.interactives) return 0
  const total = props.solution.interactives.reduce(
    (sum, item) => sum + (item.cost || 0),
    0
  )
  return (total / 10000).toFixed(1) // 转换为万元
})

// 计算类型分布
const typeDistribution = computed(() => {
  if (!props.solution.interactives) return {}

  const distribution: Record<string, number> = {}
  props.solution.interactives.forEach(item => {
    const type = item.type || '未分类'
    distribution[type] = (distribution[type] || 0) + 1
  })

  return distribution
})

// 获取标签类型
const getTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    'AR/VR': 'danger',
    '互动投影': 'warning',
    '数字屏幕': 'primary',
    '传感器': 'success',
    '声音装置': 'info'
  }
  return typeMap[type] || 'info'
}
</script>

<style scoped>
.interactive-solution-display {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
}

.solution-header {
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
  color: #8b5cf6;
}

.content-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #8b5cf6;
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

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tech-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: all 0.3s;
}

.tech-chip:hover {
  border-color: #8b5cf6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
  transform: translateY(-2px);
}

.tech-icon {
  color: #8b5cf6;
}

.interactives-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.interactive-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s;
}

.interactive-card:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.header-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 8px;
  color: #fff;
}

.header-text {
  flex: 1;
}

.interactive-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.card-body {
  padding-top: 8px;
}

.description {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 12px;
}

.cost-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fef3c7;
  border-radius: 6px;
  font-size: 13px;
  color: #92400e;
  font-weight: 500;
}

.cost-info .el-icon {
  color: #f59e0b;
}

.requirements-section {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-left-color: #6366f1;
}

.requirements-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
}

.requirements-icon {
  flex-shrink: 0;
  color: #6366f1;
}

.requirements-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.8;
  color: #3730a3;
  white-space: pre-line;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
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

.stat-icon.tech {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.stat-icon.items {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}

.stat-icon.budget {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.type-distribution {
  margin-top: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.distribution-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-item {
  display: grid;
  grid-template-columns: 100px 1fr 40px;
  gap: 12px;
  align-items: center;
}

.distribution-label {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.distribution-bar {
  height: 24px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%);
  transition: width 0.5s ease;
}

.distribution-count {
  font-size: 14px;
  font-weight: 600;
  color: #8b5cf6;
  text-align: center;
}
</style>
