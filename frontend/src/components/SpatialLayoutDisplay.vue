<template>
  <div class="spatial-layout-display">
    <!-- 头部 -->
    <div class="layout-header">
      <h3 class="title">
        <ElIcon class="icon"><Grid /></ElIcon>
        空间布局
      </h3>
      <ElTag type="success" size="small">空间规划</ElTag>
    </div>

    <!-- 布局概述 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><InfoFilled /></ElIcon>
        <span>布局概述</span>
      </div>
      <div class="layout-description">{{ layout.layout }}</div>
    </div>

    <!-- 展区分布 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><MapLocation /></ElIcon>
        <span>展区分布 ({{ layout.zones?.length || 0 }}个)</span>
      </div>
      <div class="zones-grid">
        <div
          v-for="(zone, index) in layout.zones"
          :key="index"
          class="zone-card"
        >
          <div class="zone-header">
            <div class="zone-number">{{ index + 1 }}</div>
            <div class="zone-info">
              <div class="zone-name">{{ zone.name }}</div>
              <div class="zone-area">{{ zone.area }}㎡</div>
            </div>
          </div>
          <div class="zone-function">
            <ElIcon class="function-icon"><Flag /></ElIcon>
            <span>{{ zone.function }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 参观路线 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><Position /></ElIcon>
        <span>参观路线</span>
      </div>
      <div class="visitor-route">
        <div class="route-path">
          <div
            v-for="(route, index) in layout.visitorRoute"
            :key="index"
            class="route-step"
          >
            <div class="step-dot"></div>
            <div class="step-label">{{ route }}</div>
            <div v-if="index < layout.visitorRoute.length - 1" class="step-line"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无障碍设计 -->
    <div class="content-section accessibility-section">
      <div class="section-title">
        <ElIcon><Position /></ElIcon>
        <span>无障碍设计</span>
      </div>
      <div class="accessibility-content">
        <div class="accessibility-icon">
          <ElIcon :size="48"><UserFilled /></ElIcon>
        </div>
        <div class="accessibility-text">{{ layout.accessibility }}</div>
      </div>
    </div>

    <!-- 空间统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon zones">
          <ElIcon><Grid /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ layout.zones?.length || 0 }}</div>
          <div class="stat-label">展区数量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon area">
          <ElIcon><Odometer /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalArea }}</div>
          <div class="stat-label">总面积(㎡)</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon route">
          <ElIcon><Guide /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ layout.visitorRoute?.length || 0 }}</div>
          <div class="stat-label">路线节点</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon, ElTag } from 'element-plus'
import {
  Grid,
  InfoFilled,
  MapLocation,
  Flag,
  Position,
  UserFilled,
  Odometer,
  Guide
} from '@element-plus/icons-vue'
import type { SpatialLayout } from '@/types/exhibition'

interface Props {
  layout: SpatialLayout
}

const props = defineProps<Props>()

// 计算总面积
const totalArea = computed(() => {
  if (!props.layout.zones) return 0
  return props.layout.zones.reduce((sum, zone) => sum + (zone.area || 0), 0)
})
</script>

<style scoped>
.spatial-layout-display {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
}

.layout-header {
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
  color: #10b981;
}

.content-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #10b981;
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

.layout-description {
  font-size: 15px;
  line-height: 1.8;
  color: #4b5563;
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.zones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.zone-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s;
}

.zone-card:hover {
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  transform: translateY(-2px);
}

.zone-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.zone-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
}

.zone-info {
  flex: 1;
}

.zone-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.zone-area {
  font-size: 13px;
  color: #10b981;
  font-weight: 500;
}

.zone-function {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
}

.function-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: #10b981;
}

.visitor-route {
  background: #fff;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.route-path {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.route-step {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-dot {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  background: #10b981;
  border: 3px solid #d1fae5;
  border-radius: 50%;
}

.step-label {
  padding: 6px 14px;
  background: #ecfdf5;
  border-radius: 6px;
  font-size: 14px;
  color: #065f46;
  font-weight: 500;
  white-space: nowrap;
}

.step-line {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, #10b981 0%, #d1fae5 100%);
}

.accessibility-section {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-left-color: #3b82f6;
}

.accessibility-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
}

.accessibility-icon {
  flex-shrink: 0;
  color: #3b82f6;
}

.accessibility-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.8;
  color: #1e40af;
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
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
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

.stat-icon.zones {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-icon.area {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-icon.route {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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
</style>
