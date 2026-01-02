<template>
  <div class="exhibition-info-card">
    <div class="info-header">
      <ElIcon class="icon"><Document /></ElIcon>
      <h3>项目信息</h3>
    </div>
    <div class="info-grid">
      <div class="info-item">
        <span class="label">展览名称</span>
        <span class="value">{{ exhibition?.title }}</span>
      </div>
      <div class="info-item">
        <span class="label">主题</span>
        <span class="value">{{ exhibition?.theme }}</span>
      </div>
      <div class="info-item">
        <span class="label">预算</span>
        <span class="value">{{ exhibition?.budget?.total }} {{ exhibition?.budget?.currency }}</span>
      </div>
      <div class="info-item">
        <span class="label">面积</span>
        <span class="value">{{ exhibition?.venueSpace?.area }}㎡</span>
      </div>
      <div class="info-item full-width">
        <span class="label">目标受众</span>
        <span class="value">{{ exhibition?.targetAudience }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'

interface Exhibition {
  title?: string
  theme?: string
  budget?: {
    total?: string
    currency?: string
  }
  venueSpace?: {
    area?: string
  }
  targetAudience?: string
}

interface Props {
  exhibition: Exhibition | null
}

defineProps<Props>()
</script>

<style scoped>
.exhibition-info-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.info-header .icon {
  font-size: 18px;
  color: #3b82f6;
}

.info-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item .label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.info-item .value {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}
</style>
