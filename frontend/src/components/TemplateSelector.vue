<template>
  <div class="template-selector">
    <div class="selector-header">
      <h3 class="selector-title">
        <ElIcon><MagicStick /></ElIcon>
        选择模板或自定义
      </h3>
      <p class="selector-subtitle">快速开始或从零创建</p>
    </div>

    <div class="templates-grid">
      <!-- 自定义选项 -->
      <div
        class="template-card custom"
        :class="{ selected: selectedTemplate === 'custom' }"
        @click="selectTemplate('custom')"
      >
        <div class="card-icon custom-icon">
          <ElIcon><EditPen /></ElIcon>
        </div>
        <h4 class="card-title">自定义创建</h4>
        <p class="card-description">从零开始，完全自定义您的展览项目</p>
        <div class="card-badge">
          <ElIcon><Star /></ElIcon>
          推荐
        </div>
      </div>

      <!-- 预设模板 -->
      <div
        v-for="template in templates"
        :key="template.id"
        class="template-card"
        :class="{ selected: selectedTemplate === template.id }"
        @click="selectTemplate(template.id)"
      >
        <div class="card-icon" :style="{ background: template.color }">
          <span class="icon-emoji">{{ template.icon }}</span>
        </div>
        <h4 class="card-title">{{ template.name }}</h4>
        <p class="card-description">{{ template.description }}</p>
        <div class="card-tags">
          <ElTag
            v-for="tag in template.tags"
            :key="tag"
            size="small"
            type="info"
          >
            {{ tag }}
          </ElTag>
        </div>
      </div>
    </div>

    <!-- 模板预览 -->
    <div v-if="selectedTemplateData" class="template-preview">
      <div class="preview-header">
        <h4>模板预览</h4>
        <ElButton text type="primary" @click="clearSelection">
          清除选择
        </ElButton>
      </div>
      <div class="preview-content">
        <div class="preview-item">
          <span class="preview-label">展览名称</span>
          <span class="preview-value">{{ selectedTemplateData.defaults.title }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">主题方向</span>
          <span class="preview-value">{{ selectedTemplateData.defaults.theme }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">目标受众</span>
          <span class="preview-value">{{ selectedTemplateData.defaults.targetAudience }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">参考预算</span>
          <span class="preview-value">{{ selectedTemplateData.defaults.budget }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MagicStick, EditPen, Star } from '@element-plus/icons-vue'

interface Template {
  id: string
  name: string
  description: string
  icon: string
  color: string
  tags: string[]
  defaults: {
    title: string
    theme: string
    targetAudience: string
    budget: string
  }
}

const templates = ref<Template[]>([
  {
    id: 'history',
    name: '历史文化展',
    description: '展示历史文物和文化传承',
    icon: '🏛️',
    color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    tags: ['文化', '历史', '教育'],
    defaults: {
      title: '历史文化展览',
      theme: '展示历史文物，传承文化价值',
      targetAudience: 'general_public',
      budget: '300,000 CNY'
    }
  },
  {
    id: 'art',
    name: '艺术展览',
    description: '现代艺术与创意设计展示',
    icon: '🎨',
    color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    tags: ['艺术', '创意', '现代'],
    defaults: {
      title: '当代艺术展',
      theme: '探索现代艺术与创意设计的无限可能',
      targetAudience: 'students',
      budget: '200,000 CNY'
    }
  },
  {
    id: 'tech',
    name: '科技体验展',
    description: '互动科技与创新体验',
    icon: '🚀',
    color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    tags: ['科技', '互动', '创新'],
    defaults: {
      title: '科技创新体验展',
      theme: '展示最新科技成果，提供沉浸式体验',
      targetAudience: 'teenagers',
      budget: '500,000 CNY'
    }
  },
  {
    id: 'eco',
    name: '环保主题展',
    description: '环保理念与可持续发展',
    icon: '🌿',
    color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    tags: ['环保', '可持续', '教育'],
    defaults: {
      title: '绿色环保主题展',
      theme: '传播环保理念，倡导可持续发展',
      targetAudience: 'children_family',
      budget: '250,000 CNY'
    }
  }
])

const selectedTemplate = ref<string>('custom')

const selectedTemplateData = computed(() => {
  if (selectedTemplate.value === 'custom') return null
  return templates.value.find(t => t.id === selectedTemplate.value)
})

const selectTemplate = (id: string) => {
  selectedTemplate.value = id
}

const clearSelection = () => {
  selectedTemplate.value = 'custom'
}

const getTemplateDefaults = () => {
  if (selectedTemplate.value === 'custom') return null
  return selectedTemplateData.value?.defaults
}

defineExpose({
  getTemplateDefaults,
  selectedTemplate
})
</script>

<style scoped>
.template-selector {
  width: 100%;
}

.selector-header {
  text-align: center;
  margin-bottom: 32px;
}

.selector-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.selector-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.template-card {
  position: relative;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.template-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
  transform: translateY(-4px);
}

.template-card.selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 32px;
}

.custom-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 28px;
}

.icon-emoji {
  font-size: 32px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.card-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.card-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: auto;
}

/* 模板预览 */
.template-preview {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.preview-header h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.preview-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.preview-value {
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}
</style>
