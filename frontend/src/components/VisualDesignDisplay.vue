<template>
  <div class="visual-design-display">
    <!-- 头部 -->
    <div class="design-header">
      <h3 class="title">
        <ElIcon class="icon"><Brush /></ElIcon>
        视觉设计
      </h3>
      <ElTag type="warning" size="small">视觉风格</ElTag>
    </div>

    <!-- 色彩方案 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><Brush /></ElIcon>
        <span>色彩方案 ({{ design.colorScheme?.length || 0 }}色)</span>
      </div>
      <div class="color-palette">
        <div
          v-for="(color, index) in design.colorScheme"
          :key="index"
          class="color-chip"
          :style="{ backgroundColor: color }"
        >
          <div class="color-info">
            <div class="color-value">{{ color }}</div>
            <div class="color-number">{{ index + 1 }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 字体设计 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><EditPen /></ElIcon>
        <span>字体设计</span>
      </div>
      <div class="typography-preview">
        <div class="font-demo">
          <div class="demo-label">标题字体</div>
          <div class="demo-text" :style="{ fontFamily: design.typography }">
            {{ design.typography || '未指定' }}
          </div>
        </div>
        <div class="font-description">
          <p><strong>字体选择：</strong>{{ design.typography || '待定' }}</p>
          <p><strong>设计理念：</strong>根据展览主题和风格特点，选择合适的字体以确保可读性与美观性的平衡</p>
        </div>
      </div>
    </div>

    <!-- 品牌元素 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><Grid /></ElIcon>
        <span>品牌元素 ({{ design.brandElements?.length || 0 }}项)</span>
      </div>
      <div class="brand-elements">
        <div
          v-for="(element, index) in design.brandElements"
          :key="index"
          class="brand-item"
        >
          <div class="brand-icon">
            <ElIcon><Star /></ElIcon>
          </div>
          <div class="brand-text">{{ element }}</div>
        </div>
      </div>
    </div>

    <!-- 视觉风格 -->
    <div class="content-section style-section">
      <div class="section-title">
        <ElIcon><Picture /></ElIcon>
        <span>视觉风格</span>
      </div>
      <div class="style-description">
        <div class="style-icon">
          <ElIcon :size="64"><PictureFilled /></ElIcon>
        </div>
        <div class="style-text">{{ design.visualStyle }}</div>
      </div>
    </div>

    <!-- 设计统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon colors">
          <ElIcon><Brush /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ design.colorScheme?.length || 0 }}</div>
          <div class="stat-label">色彩数量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon elements">
          <ElIcon><Grid /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ design.brandElements?.length || 0 }}</div>
          <div class="stat-label">品牌元素</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon style">
          <ElIcon><Picture /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">1</div>
          <div class="stat-label">设计风格</div>
        </div>
      </div>
    </div>

    <!-- 色彩预览条 -->
    <div class="color-bar-section">
      <div class="section-title">
        <ElIcon><Sunny /></ElIcon>
        <span>色彩预览</span>
      </div>
      <div class="color-bar">
        <div
          v-for="(color, index) in design.colorScheme"
          :key="index"
          class="color-segment"
          :style="{ backgroundColor: color, flex: 1 }"
          :title="color"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElIcon, ElTag } from 'element-plus'
import {
  Brush,
  EditPen,
  Grid,
  Star,
  Picture,
  PictureFilled,
  Sunny
} from '@element-plus/icons-vue'
import type { VisualDesign } from '@/types/exhibition'

interface Props {
  design: VisualDesign
}

const props = defineProps<Props>()
</script>

<style scoped>
.visual-design-display {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
}

.design-header {
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
  color: #f59e0b;
}

.content-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
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

.color-palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.color-chip {
  position: relative;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.color-chip:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.color-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
}

.color-value {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
  font-family: 'Courier New', monospace;
}

.color-number {
  font-size: 11px;
  opacity: 0.8;
}

.typography-preview {
  background: #fff;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.font-demo {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.demo-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.demo-text {
  font-size: 32px;
  font-weight: 600;
  color: #1f2937;
}

.font-description {
  font-size: 14px;
  line-height: 1.8;
  color: #4b5563;
}

.font-description p {
  margin: 8px 0;
}

.brand-elements {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.brand-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.brand-item:hover {
  border-color: #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
}

.brand-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 8px;
  color: #f59e0b;
}

.brand-text {
  flex: 1;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.style-section {
  background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
  border-left-color: #ec4899;
}

.style-description {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
}

.style-icon {
  flex-shrink: 0;
  color: #ec4899;
}

.style-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.8;
  color: #9f1239;
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
  border-color: #f59e0b;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
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

.stat-icon.colors {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon.elements {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.stat-icon.style {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
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

.color-bar-section {
  margin-top: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.color-bar {
  display: flex;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.color-segment {
  transition: all 0.3s;
}

.color-segment:hover {
  flex: 1.5 !important;
}
</style>
