<template>
  <div class="exhibition-outline-display">
    <!-- 头部 -->
    <div class="outline-header">
      <h3 class="title">
        <ElIcon class="icon"><List /></ElIcon>
        展览大纲
      </h3>
      <ElTag type="success" size="small">详细策划</ElTag>
    </div>

    <!-- 关键指标 -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon zones">
          <ElIcon><Grid /></ElIcon>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ outline.zones?.length || 0 }}</div>
          <div class="metric-label">展区数量</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon exhibits">
          <ElIcon><Box /></ElIcon>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ outline.exhibits?.length || 0 }}</div>
          <div class="metric-label">展品数量</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon interactive">
          <ElIcon><Connection /></ElIcon>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ outline.interactivePlan?.length || 0 }}</div>
          <div class="metric-label">互动装置</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon budget">
          <ElIcon><Coin /></ElIcon>
        </div>
        <div class="metric-content">
          <div class="metric-value">{{ formatBudget(outline.budgetAllocation?.total || 0) }}</div>
          <div class="metric-label">预算框架</div>
        </div>
      </div>
    </div>

    <!-- 展区划分 -->
    <div class="section">
      <div class="section-header">
        <h4>
          <ElIcon><MapLocation /></ElIcon>
          展区划分
        </h4>
        <ElButton text @click="toggleSection('zones')">
          {{ expandedSections.zones ? '收起' : '展开' }}
          <ElIcon>
            <component :is="expandedSections.zones ? ArrowUp : ArrowDown" />
          </ElIcon>
        </ElButton>
      </div>
      <div v-show="expandedSections.zones" class="zones-grid">
        <div
          v-for="zone in outline.zones"
          :key="zone.id"
          class="zone-card"
        >
          <div class="zone-header">
            <h5>{{ zone.name }}</h5>
            <ElTag size="small">{{ zone.percentage }}%</ElTag>
          </div>
          <div class="zone-details">
            <div class="detail-item">
              <span class="label">面积：</span>
              <span class="value">{{ zone.area }}㎡</span>
            </div>
            <div class="detail-item">
              <span class="label">功能：</span>
              <span class="value">{{ zone.function }}</span>
            </div>
            <div class="detail-item">
              <span class="label">预算：</span>
              <span class="value">{{ formatBudget(zone.budgetAllocation) }}</span>
            </div>
            <div class="detail-item" v-if="zone.exhibitIds?.length">
              <span class="label">展品：</span>
              <span class="value">{{ zone.exhibitIds.length }} 件</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 展品清单 -->
    <div class="section">
      <div class="section-header">
        <h4>
          <ElIcon><Box /></ElIcon>
          展品清单
        </h4>
        <ElButton text @click="toggleSection('exhibits')">
          {{ expandedSections.exhibits ? '收起' : '展开' }}
          <ElIcon>
            <component :is="expandedSections.exhibits ? ArrowUp : ArrowDown" />
          </ElIcon>
        </ElButton>
      </div>
      <div v-show="expandedSections.exhibits" class="exhibits-table">
        <ElTable :data="outline.exhibits" stripe size="small" max-height="300">
          <ElTableColumn prop="name" label="展品名称" width="150" />
          <ElTableColumn prop="zoneId" label="所属展区" width="100">
            <template #default="{ row }">
              <ElTag size="small" type="info">{{ getZoneName(row.zoneId) }}</ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="type" label="类型" width="100" />
          <ElTableColumn prop="protectionLevel" label="保护等级" width="100">
            <template #default="{ row }">
              <ElTag
                :type="getProtectionLevelType(row.protectionLevel)"
                size="small"
              >
                {{ row.protectionLevel }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="保险+运输" width="120">
            <template #default="{ row }">
              {{ formatBudget(row.insurance + row.transportCost) }}
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </div>

    <!-- 互动装置规划 -->
    <div class="section">
      <div class="section-header">
        <h4>
          <ElIcon><Connection /></ElIcon>
          互动装置规划
        </h4>
        <ElButton text @click="toggleSection('interactives')">
          {{ expandedSections.interactives ? '收起' : '展开' }}
          <ElIcon>
            <component :is="expandedSections.interactives ? ArrowUp : ArrowDown" />
          </ElIcon>
        </ElButton>
      </div>
      <div v-show="expandedSections.interactives" class="interactives-grid">
        <div
          v-for="interactive in outline.interactivePlan"
          :key="interactive.id"
          class="interactive-card"
          :class="`priority-${interactive.priority}`"
        >
          <div class="interactive-header">
            <div class="interactive-icon">
              <ElIcon><Monitor /></ElIcon>
            </div>
            <div class="interactive-info">
              <h5>{{ interactive.name }}</h5>
              <ElTag
                :type="getPriorityType(interactive.priority)"
                size="small"
              >
                {{ getPriorityLabel(interactive.priority) }}
              </ElTag>
            </div>
          </div>
          <div class="interactive-details">
            <div class="detail-item">
              <span class="label">类型：</span>
              <span class="value">{{ interactive.type }}</span>
            </div>
            <div class="detail-item">
              <span class="label">预估成本：</span>
              <span class="value">{{ formatBudget(interactive.estimatedCost) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">放置展区：</span>
              <span class="value">{{ getZoneName(interactive.zoneId) }}</span>
            </div>
          </div>
          <p class="description">{{ interactive.description }}</p>
        </div>
      </div>
    </div>

    <!-- 空间约束 -->
    <div class="section">
      <div class="section-header">
        <h4>
          <ElIcon><Setting /></ElIcon>
          空间约束
        </h4>
      </div>
      <div class="constraints-grid">
        <div class="constraint-item">
          <span class="label">总面积：</span>
          <span class="value">{{ outline.spaceConstraints?.totalArea }} ㎡</span>
        </div>
        <div class="constraint-item">
          <span class="label">展区数量：</span>
          <span class="value">
            {{ outline.spaceConstraints?.minZoneCount }} - {{ outline.spaceConstraints?.maxZoneCount }} 个
          </span>
        </div>
        <div class="constraint-item">
          <span class="label">通道宽度：</span>
          <span class="value">≥ {{ outline.spaceConstraints?.minAisleWidth }} 米</span>
        </div>
        <div class="constraint-item">
          <span class="label">主展区占比：</span>
          <span class="value">≥ {{ (outline.spaceConstraints?.mainZoneRatio * 100).toFixed(0) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElIcon, ElTag, ElButton, ElTable, ElTableColumn } from 'element-plus'
import {
  List,
  Grid,
  Box,
  Connection,
  Coin,
  MapLocation,
  ArrowUp,
  ArrowDown,
  Monitor,
  Setting
} from '@element-plus/icons-vue'
import type { ExhibitionOutline } from '@/types/exhibition'

interface Props {
  outline: ExhibitionOutline
}

const props = defineProps<Props>()

// 折叠状态
const expandedSections = ref({
  zones: true,
  exhibits: false,
  interactives: false
})

const toggleSection = (section: keyof typeof expandedSections.value) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

// 获取展区名称
const getZoneName = (zoneId: string) => {
  const zone = props.outline.zones?.find(z => z.id === zoneId)
  return zone?.name || zoneId
}

// 格式化预算
const formatBudget = (amount: number) => {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)} 万元`
  }
  return `${amount.toLocaleString()} 元`
}

// 获取保护等级标签类型
const getProtectionLevelType = (level: string) => {
  const types: Record<string, any> = {
    '一级': 'danger',
    '二级': 'warning',
    '普通': 'info'
  }
  return types[level] || 'info'
}

// 获取优先级标签类型
const getPriorityType = (priority: string) => {
  const types: Record<string, any> = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'info'
  }
  return types[priority] || 'info'
}

// 获取优先级标签文本
const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    'high': '高优先级',
    'medium': '中优先级',
    'low': '低优先级'
  }
  return labels[priority] || priority
}
</script>

<style scoped>
.exhibition-outline-display {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}

.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}

.title .icon {
  color: #f97316;
  font-size: 24px;
}

/* 关键指标 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: #fff;
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  font-size: 24px;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.metric-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
}

/* 展区划分 */
.zones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.zone-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.zone-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.zone-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.zone-header h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.zone-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.detail-item .label {
  color: #6b7280;
  font-weight: 500;
}

.detail-item .value {
  color: #1a1a1a;
  font-weight: 600;
}

/* 互动装置 */
.interactives-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.interactive-card {
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.interactive-card.priority-high {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
}

.interactive-card.priority-medium {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
}

.interactive-card.priority-low {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
}

.interactive-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.interactive-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 20px;
}

.interactive-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.interactive-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.description {
  margin: 0;
  padding-top: 8px;
  font-size: 12px;
  color: #6b7280;
  border-top: 1px dashed #e5e7eb;
}

/* 空间约束 */
.constraints-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.constraint-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.constraint-item .label {
  color: #6b7280;
  font-weight: 500;
}

.constraint-item .value {
  color: #1a1a1a;
  font-weight: 600;
}

/* 通用样式 */
.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.section-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.exhibits-table {
  overflow-x: auto;
}
</style>
