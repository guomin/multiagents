<template>
  <div class="concept-plan-display">
    <!-- 头部 -->
    <div class="plan-header">
      <h3 class="title">
        <ElIcon class="icon"><Edit /></ElIcon>
        策划方案
      </h3>
      <ElTag type="primary" size="small">概念策划</ElTag>
    </div>

    <!-- 核心概念 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><Star /></ElIcon>
        <span>核心概念</span>
      </div>
      <div class="concept-text">{{ concept.concept }}</div>
    </div>

    <!-- 叙事结构 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><Document /></ElIcon>
        <span>叙事结构</span>
      </div>
      <div class="narrative-text">{{ concept.narrative }}</div>
    </div>

    <!-- 关键展品 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><Box /></ElIcon>
        <span>关键展品 ({{ concept.keyExhibits?.length || 0 }}件)</span>
      </div>
      <div class="exhibits-grid">
        <div
          v-for="(exhibit, index) in concept.keyExhibits"
          :key="index"
          class="exhibit-item"
        >
          <div class="exhibit-number">{{ index + 1 }}</div>
          <div class="exhibit-name">{{ exhibit }}</div>
        </div>
      </div>
    </div>

    <!-- 参观流线 -->
    <div class="content-section">
      <div class="section-title">
        <ElIcon><Position /></ElIcon>
        <span>参观流线</span>
      </div>
      <div class="visitor-flow">
        <div class="flow-steps">
          <div
            v-for="(step, index) in parseVisitorFlow(concept.visitorFlow)"
            :key="index"
            class="flow-step"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <div class="step-content">{{ step }}</div>
            <ElIcon v-if="index < parseVisitorFlow(concept.visitorFlow).length - 1" class="step-arrow">
              <ArrowRight />
            </ElIcon>
          </div>
        </div>
      </div>
    </div>

    <!-- 策划亮点 -->
    <div class="content-section highlight-section">
      <div class="section-title">
        <ElIcon><Sunny /></ElIcon>
        <span>策划亮点</span>
      </div>
      <div class="highlights-grid">
        <div class="highlight-item">
          <ElIcon class="highlight-icon"><Collection /></ElIcon>
          <div class="highlight-text">
            <strong>{{ concept.keyExhibits?.length || 0 }}</strong> 件精选展品
          </div>
        </div>
        <div class="highlight-item">
          <ElIcon class="highlight-icon"><Guide /></ElIcon>
          <div class="highlight-text">
            <strong>完整叙事</strong> 故事线
          </div>
        </div>
        <div class="highlight-item">
          <ElIcon class="highlight-icon"><User /></ElIcon>
          <div class="highlight-text">
            <strong>沉浸式</strong> 参观体验
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElIcon, ElTag } from 'element-plus'
import {
  Edit,
  Star,
  Document,
  Box,
  Position,
  ArrowRight,
  Sunny,
  Collection,
  Guide,
  User
} from '@element-plus/icons-vue'
import type { ConceptPlan } from '@/types/exhibition'

interface Props {
  concept: ConceptPlan
}

const props = defineProps<Props>()

// 解析参观流线（按箭头或换行分割）
const parseVisitorFlow = (flow: string) => {
  if (!flow) return []

  // 尝试按箭头分割
  const byArrow = flow.split(/->|→|=>/).map(s => s.trim()).filter(s => s)
  if (byArrow.length > 1) return byArrow

  // 按换行或逗号分割
  return flow.split(/[\n,，]/).map(s => s.trim()).filter(s => s)
}
</script>

<style scoped>
.concept-plan-display {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
}

.plan-header {
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
  color: #3b82f6;
}

.content-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
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

.concept-text {
  font-size: 16px;
  line-height: 1.8;
  color: #4b5563;
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.narrative-text {
  font-size: 15px;
  line-height: 1.8;
  color: #4b5563;
  white-space: pre-line;
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.exhibits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.exhibit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.exhibit-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.exhibit-number {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
}

.exhibit-name {
  flex: 1;
  font-size: 14px;
  color: #374151;
}

.visitor-flow {
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.flow-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.flow-step {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
}

.step-content {
  padding: 8px 16px;
  background: #eff6ff;
  border-radius: 6px;
  font-size: 14px;
  color: #1e40af;
  font-weight: 500;
  white-space: nowrap;
}

.step-arrow {
  color: #9ca3af;
  font-size: 18px;
}

.highlight-section {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left-color: #f59e0b;
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.highlight-icon {
  font-size: 24px;
  color: #f59e0b;
}

.highlight-text {
  font-size: 14px;
  color: #92400e;
}

.highlight-text strong {
  color: #78716c;
  font-size: 16px;
}
</style>
