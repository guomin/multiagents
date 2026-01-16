<template>
  <div class="results-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <ElIcon class="is-loading"><Loading /></ElIcon>
      <p>正在加载项目数据...</p>
    </div>

    <!-- 导出进度对话框 -->
    <ElDialog
      v-model="exportProgress.visible"
      title="导出报告"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="export-progress-content">
        <!-- 进度动画 -->
        <div class="progress-animation">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>

        <!-- 进度文本 -->
        <div class="progress-text">
          <h3>{{ exportProgress.title }}</h3>
          <p>{{ exportProgress.message }}</p>
        </div>

        <!-- 进度条 -->
        <div v-if="exportProgress.showProgress" class="progress-bar-wrapper">
          <ElProgress
            :percentage="exportProgress.percentage"
            :status="exportProgress.status"
            :stroke-width="12"
            :indeterminate="exportProgress.indeterminate"
          >
            <template #default="{ percentage }">
              <span class="progress-percentage">{{ percentage }}%</span>
            </template>
          </ElProgress>
        </div>

        <!-- 预计时间 -->
        <div v-if="exportProgress.estimatedTime" class="estimated-time">
          <ElIcon><Clock /></ElIcon>
          <span>预计需要 {{ exportProgress.estimatedTime }}</span>
        </div>
      </div>
    </ElDialog>

    <!-- 页面内容 -->
    <div v-if="!loading && currentWorkflow">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <ElButton @click="goBack" :icon="ArrowLeft" circle text class="back-button" />
            <div>
              <h1 class="page-title">
                <ElIcon><SuccessFilled /></ElIcon>
                展陈设计方案
              </h1>
              <p class="page-subtitle">{{ currentWorkflow?.requirements.title }}</p>
            </div>
          </div>
          <div class="action-buttons">
            <ElDropdown @command="handleExportCommand" placement="bottom-end">
              <ElButton :icon="Document">
                导出报告
                <ElIcon class="el-icon--right"><ArrowRight /></ElIcon>
              </ElButton>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem command="markdown">
                    <ElIcon><Document /></ElIcon>
                    Markdown 格式
                  </ElDropdownItem>
                  <ElDropdownItem command="pdf">
                    <ElIcon><Download /></ElIcon>
                    PDF 格式
                  </ElDropdownItem>
                  <ElDropdownItem divided command="pdf-force">
                    <ElIcon><Download /></ElIcon>
                    <ElIcon style="color: #f59e0b;"><Refresh /></ElIcon>
                    强制重新生成 PDF
                  </ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
            <ElButton type="primary" @click="createNewProject" :icon="Plus">
              新建项目
            </ElButton>
          </div>
        </div>
      </div>

      <!-- 项目概览卡片 -->
      <div class="overview-section">
        <div class="stat-card stat-budget">
          <div class="stat-icon">
            <ElIcon><Wallet /></ElIcon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ currentWorkflow?.requirements.budget.total.toLocaleString() }}</div>
            <div class="stat-label">总预算 ({{ currentWorkflow?.requirements.budget.currency }})</div>
          </div>
        </div>
        <div class="stat-card stat-area">
          <div class="stat-icon">
            <ElIcon><OfficeBuilding /></ElIcon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ currentWorkflow?.requirements.venueSpace.area }}</div>
            <div class="stat-label">场地面积 (㎡)</div>
          </div>
        </div>
        <div class="stat-card stat-duration">
          <div class="stat-icon">
            <ElIcon><Calendar /></ElIcon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ projectDuration }}</div>
            <div class="stat-label">展期天数</div>
          </div>
        </div>
        <div class="stat-card stat-completed">
          <div class="stat-icon">
            <ElIcon><CircleCheck /></ElIcon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ completedAgents }}</div>
            <div class="stat-label">完成步骤</div>
          </div>
        </div>
      </div>

      <!-- 设计方案展示 -->
      <div class="design-grid">
        <!-- 概念策划 -->
        <div class="design-card card-concept">
          <div class="card-header">
            <div class="header-icon">
              <ElIcon><Star /></ElIcon>
            </div>
            <h3 class="card-title">概念策划</h3>
          </div>
          <div v-if="currentWorkflow?.conceptPlan" class="card-body">
            <div class="info-section">
              <h4 class="section-title">核心概念</h4>
              <p class="section-content">{{ currentWorkflow.conceptPlan.concept }}</p>
            </div>
            <div class="info-section">
              <h4 class="section-title">叙事结构</h4>
              <p class="section-content">{{ currentWorkflow.conceptPlan.narrative }}</p>
            </div>
            <div class="info-section">
              <h4 class="section-title">重点展品</h4>
              <div class="tag-list">
                <ElTag
                  v-for="exhibit in currentWorkflow.conceptPlan.keyExhibits"
                  :key="exhibit"
                  type="info"
                  size="small"
                  effect="plain"
                >
                  {{ exhibit }}
                </ElTag>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细大纲 -->
        <div class="design-card card-outline">
          <div class="card-header">
            <div class="header-icon">
              <ElIcon><Document /></ElIcon>
            </div>
            <h3 class="card-title">详细大纲</h3>
          </div>
          <div v-if="currentWorkflow?.detailedOutline" class="card-body">
            <div class="info-section">
              <h4 class="section-title">展区划分</h4>
              <div class="outline-structure">
                <div
                  v-for="zone in currentWorkflow.detailedOutline.zones"
                  :key="zone.id"
                  class="outline-section"
                >
                  <div class="section-header-inline">
                    <span class="section-title-text">{{ zone.name }}</span>
                    <div class="zone-tags">
                      <ElTag size="small" type="info">{{ zone.area }}㎡</ElTag>
                      <ElTag size="small" type="success">{{ zone.percentage }}%</ElTag>
                    </div>
                  </div>
                  <p class="section-desc">{{ zone.function }}</p>
                  <div class="zone-details">
                    <div class="detail-item-inline">
                      <span class="detail-label">预算:</span>
                      <span class="detail-value">¥{{ zone.budgetAllocation.toLocaleString() }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="currentWorkflow.detailedOutline.exhibits && currentWorkflow.detailedOutline.exhibits.length" class="info-section">
              <h4 class="section-title">展品清单</h4>
              <div class="exhibits-grid">
                <div
                  v-for="exhibit in currentWorkflow.detailedOutline.exhibits"
                  :key="exhibit.id"
                  class="exhibit-item"
                >
                  <div class="exhibit-header">
                    <span class="exhibit-name">{{ exhibit.name }}</span>
                    <ElTag size="small" type="warning">{{ exhibit.type }}</ElTag>
                  </div>
                  <div class="exhibit-info">
                    <div class="info-row">
                      <span class="label">保护级别:</span>
                      <span class="value">{{ exhibit.protectionLevel }}</span>
                    </div>
                    <div v-if="exhibit.dimensions" class="info-row">
                      <span class="label">尺寸:</span>
                      <span class="value">{{ exhibit.dimensions.length }}×{{ exhibit.dimensions.width }}×{{ exhibit.dimensions.height }}m</span>
                    </div>
                    <div class="info-row">
                      <span class="label">保险:</span>
                      <span class="value">¥{{ exhibit.insurance.toLocaleString() }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="currentWorkflow.detailedOutline.interactivePlan && currentWorkflow.detailedOutline.interactivePlan.length" class="info-section">
              <h4 class="section-title">互动装置规划</h4>
              <div class="interactive-grid">
                <div
                  v-for="interactive in currentWorkflow.detailedOutline.interactivePlan"
                  :key="interactive.id"
                  class="interactive-item-compact"
                >
                  <div class="interactive-header-compact">
                    <span class="interactive-name-compact">{{ interactive.name }}</span>
                    <div class="interactive-meta">
                      <ElTag size="small" type="primary">{{ interactive.type }}</ElTag>
                      <ElTag
                        size="small"
                        :type="interactive.priority === 'high' ? 'danger' : interactive.priority === 'medium' ? 'warning' : 'info'"
                      >
                        {{ interactive.priority === 'high' ? '高优先级' : interactive.priority === 'medium' ? '中优先级' : '低优先级' }}
                      </ElTag>
                    </div>
                  </div>
                  <p class="interactive-desc-compact">{{ interactive.description }}</p>
                  <div class="interactive-cost-compact">
                    <span class="cost-label">预估成本:</span>
                    <span class="cost-value">¥{{ interactive.estimatedCost.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空间设计 -->
        <div class="design-card card-spatial">
          <div class="card-header">
            <div class="header-icon">
              <ElIcon><Menu /></ElIcon>
            </div>
            <h3 class="card-title">空间设计</h3>
          </div>
          <div v-if="currentWorkflow?.spatialLayout" class="card-body">
            <div class="info-section">
              <h4 class="section-title">布局方案</h4>
              <p class="section-content">{{ currentWorkflow.spatialLayout.layout }}</p>
            </div>
            <div class="info-section">
              <h4 class="section-title">功能区域</h4>
              <div class="zone-list">
                <div
                  v-for="zone in currentWorkflow.spatialLayout.zones"
                  :key="zone.name"
                  class="zone-item"
                >
                  <span class="zone-name">{{ zone.name }}</span>
                  <span class="zone-info">{{ zone.area }}㎡ · {{ zone.function }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 视觉设计 -->
        <div class="design-card card-visual">
          <div class="card-header">
            <div class="header-icon">
              <ElIcon><EditPen /></ElIcon>
            </div>
            <h3 class="card-title">视觉设计</h3>
          </div>
          <div v-if="currentWorkflow?.visualDesign" class="card-body">
            <div class="info-section">
              <h4 class="section-title">色彩方案</h4>
              <div class="color-palette">
                <div
                  v-for="color in currentWorkflow.visualDesign.colorScheme"
                  :key="color"
                  class="color-swatch"
                  :style="{ backgroundColor: color }"
                  :title="color"
                ></div>
              </div>
            </div>
            <div class="info-section">
              <h4 class="section-title">字体设计</h4>
              <p class="section-content">{{ currentWorkflow.visualDesign.typography }}</p>
            </div>
            <div class="info-section">
              <h4 class="section-title">品牌元素</h4>
              <div class="tag-list">
                <ElTag
                  v-for="element in currentWorkflow.visualDesign.brandElements"
                  :key="element"
                  type="primary"
                  size="small"
                  effect="plain"
                >
                  {{ element }}
                </ElTag>
              </div>
            </div>
          </div>
        </div>

        <!-- 互动技术 -->
        <div class="design-card card-interactive">
          <div class="card-header">
            <div class="header-icon">
              <ElIcon><Link /></ElIcon>
            </div>
            <h3 class="card-title">互动技术</h3>
          </div>
          <div v-if="currentWorkflow?.interactiveSolution" class="card-body">
            <div class="info-section">
              <h4 class="section-title">使用技术</h4>
              <div class="tag-list">
                <ElTag
                  v-for="tech in currentWorkflow.interactiveSolution.technologies"
                  :key="tech"
                  type="success"
                  size="small"
                  effect="plain"
                >
                  {{ tech }}
                </ElTag>
              </div>
            </div>
            <div class="info-section">
              <h4 class="section-title">互动装置</h4>
              <div class="interactive-list">
                <div
                  v-for="interactive in currentWorkflow.interactiveSolution.interactives"
                  :key="interactive.name"
                  class="interactive-item"
                >
                  <div class="interactive-info">
                    <div class="interactive-name">{{ interactive.name }}</div>
                    <div class="interactive-desc">{{ interactive.description }}</div>
                    <ElTag type="info" size="small" effect="plain" class="mt-2">{{ interactive.type }}</ElTag>
                  </div>
                  <div v-if="interactive.cost" class="interactive-cost">
                    <div class="cost-label">成本</div>
                    <div class="cost-value">¥{{ interactive.cost.toLocaleString() }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 预算估算 -->
      <div class="budget-section">
        <div class="section-header">
          <div class="section-title-wrapper">
            <div class="section-icon">
              <ElIcon><Wallet /></ElIcon>
            </div>
            <h3 class="section-title">预算估算</h3>
          </div>
          <div v-if="currentWorkflow?.budgetEstimate" class="budget-total">
            总计: ¥{{ currentWorkflow.budgetEstimate.totalCost.toLocaleString() }}
          </div>
        </div>

        <div v-if="currentWorkflow?.budgetEstimate" class="budget-content">
          <div class="budget-breakdown">
            <div
              v-for="item in currentWorkflow.budgetEstimate.breakdown"
              :key="item.category"
              class="budget-item"
            >
              <div class="budget-item-info">
                <div class="budget-category">{{ item.category }}</div>
                <div class="budget-desc">{{ item.description }}</div>
              </div>
              <div class="budget-amount">¥{{ item.amount.toLocaleString() }}</div>
            </div>
          </div>

          <!-- 预算分布图表 -->
          <div class="budget-chart">
            <h4 class="chart-title">预算分布</h4>
            <div class="chart-container">
              <v-chart :option="budgetChartOption" class="w-full h-full" />
            </div>
          </div>

          <!-- 优化建议 -->
          <div v-if="currentWorkflow.budgetEstimate.recommendations?.length" class="recommendations">
            <h4 class="recommendations-title">优化建议</h4>
            <div class="recommendation-list">
              <div
                v-for="recommendation in currentWorkflow.budgetEstimate.recommendations"
                :key="recommendation"
                class="recommendation-item"
              >
                <ElIcon class="recommendation-icon"><Warning /></ElIcon>
                <span>{{ recommendation }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div v-if="!loading && !currentWorkflow" class="empty-state">
      <ElIcon class="empty-icon"><Warning /></ElIcon>
      <h3>未找到项目数据</h3>
      <p>该项目可能不存在或已被删除</p>
      <ElButton type="primary" @click="router.push('/projects')" :icon="FolderOpened">
        返回项目列表
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExhibitionStore } from '@/stores/exhibition'
import { ElMessage } from 'element-plus'
import { exhibitionAPI } from '@/api/exhibition'
import {
  SuccessFilled,
  Download,
  Document,
  Plus,
  DataAnalysis,
  Warning,
  Loading,
  ArrowLeft,
  ArrowRight,
  Refresh,
  Wallet,
  OfficeBuilding,
  Calendar,
  CircleCheck,
  FolderOpened,
  Star,
  Menu,
  EditPen,
  Link,
  Clock
} from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

const router = useRouter()
const route = useRoute()
const exhibitionStore = useExhibitionStore()

const loading = ref(true)

// 导出进度状态
const exportProgress = ref({
  visible: false,
  title: '',
  message: '',
  percentage: 0,
  status: '' as '' | 'success' | 'exception' | 'warning',
  showProgress: false,
  indeterminate: true,
  estimatedTime: ''
})

// 导出进度定时器
let exportProgressTimer: ReturnType<typeof setInterval> | null = null

// 从 JSON 字符串中提取字段值
const extractFromJsonString = (jsonString: string, fieldName: string): string => {
  if (!jsonString) return ''

  try {
    // 尝试解析 JSON
    const parsed = JSON.parse(jsonString)
    // 如果有指定字段，返回该字段；否则返回整个对象转为字符串
    return parsed[fieldName] || jsonString
  } catch {
    // JSON 解析失败，使用正则表达式提取字段值
    const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 's')
    const match = jsonString.match(regex)
    if (match && match[1]) {
      return match[1]
    }

    // 如果正则也失败，返回原字符串
    return jsonString
  }
}

// 清理 Markdown 代码块标记（用于 JSON 解析前）
const removeCodeBlockMarkers = (text: string): string => {
  if (!text) return ''
  let cleaned = text

  // 移除 ```json, ```javascript 等代码块开始标记
  cleaned = cleaned.replace(/^```(?:json|javascript|js)?\s*\n?/i, '')
  // 移除代码块结束标记 ```
  cleaned = cleaned.replace(/\n?```$/m, '')

  return cleaned.trim()
}

// 清理优化建议数组
const cleanRecommendations = (recommendations: string[]): string[] => {
  if (!Array.isArray(recommendations)) return []

  const MAX_RECOMMENDATION_LENGTH = 300 // 最大建议长度（字符数）

  return recommendations
    .filter(rec => {
      if (!rec || typeof rec !== 'string') return false

      const cleanedRec = rec.trim()

      // 过滤掉明显异常的建议
      // 1. 过滤包含整个报告内容的建议（包含"预算明细"、"总成本估算"等关键词）
      const invalidKeywords = ['预算明细', '总成本估算', 'breakdown', 'totalCost', '项目细分', '估算金额']
      if (invalidKeywords.some(keyword => cleanedRec.includes(keyword))) {
        console.warn('⚠️ [Results] 过滤掉异常建议（包含报告关键词）:', cleanedRec.substring(0, 50))
        return false
      }

      // 2. 过滤过长的建议（超过最大长度）
      if (cleanedRec.length > MAX_RECOMMENDATION_LENGTH) {
        console.warn('⚠️ [Results] 过滤掉过长的建议:', cleanedRec.length, '字符')
        return false
      }

      // 3. 过滤纯数字或编号的建议
      if (/^\d+$/.test(cleanedRec)) {
        console.warn('⚠️ [Results] 过滤掉纯数字建议:', cleanedRec)
        return false
      }

      return true
    })
    .map(rec => {
      // 清理每条建议的格式
      let cleaned = rec.trim()

      // 移除 Markdown 代码块标记
      cleaned = removeCodeBlockMarkers(cleaned)

      // 移除开头的数字编号（如 "1. "、"1、"）
      cleaned = cleaned.replace(/^\d+\.?\s*/, '')

      // 移除 Markdown 格式
      cleaned = cleanMarkdownText(cleaned)

      return cleaned
    })
    .filter(rec => rec.length > 10) // 过滤掉清理后过短的建议（小于10字符）
}

// 清理 Markdown 格式文本，提取纯文本内容
const cleanMarkdownText = (text: string): string => {
  if (!text) return ''

  let cleaned = text

  // 先移除代码块标记
  cleaned = removeCodeBlockMarkers(cleaned)

  // 移除 Markdown 标题符号
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')

  // 移除加粗标记
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1')
  cleaned = cleaned.replace(/__(.*?)__/g, '$1')

  // 移除斜体标记
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1')
  cleaned = cleaned.replace(/_(.*?)_/g, '$1')

  // 移除行内代码标记
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')

  // 清理多余的换行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  // 移除开头和结尾的空白
  cleaned = cleaned.trim()

  return cleaned
}

// 直接使用 store 的响应式引用，而不是解构
const currentWorkflow = computed(() => exhibitionStore.currentWorkflow)

// 从 API 加载项目数据
const loadProjectData = async () => {
  const projectId = route.params.id as string

  if (!projectId) {
    ElMessage.error('项目ID不存在')
    router.push('/')
    return
  }

  try {
    loading.value = true
    console.log('📂 [Results] 正在加载项目数据:', projectId)

    const data = await exhibitionAPI.getProjectById(projectId)

    if (data && data.workflow) {
      // 构建工作流数据
      const workflowData = {
        requirements: {
          title: data.project.title,
          theme: data.project.theme,
          targetAudience: data.project.target_audience,
          venueSpace: {
            area: data.project.venue_area,
            height: data.project.venue_height,
            layout: data.project.venue_layout
          },
          budget: {
            total: data.project.budget_total,
            currency: data.project.budget_currency
          },
          duration: {
            startDate: data.project.start_date,
            endDate: data.project.end_date
          },
          specialRequirements: JSON.parse(data.project.special_requirements || '[]')
        },
        conceptPlan: data.designResults.find((r: any) => r.result_type === 'concept')?.result_data,
        detailedOutline: data.designResults.find((r: any) => r.result_type === 'outline')?.result_data,
        spatialLayout: data.designResults.find((r: any) => r.result_type === 'spatial')?.result_data,
        visualDesign: data.designResults.find((r: any) => r.result_type === 'visual')?.result_data,
        interactiveSolution: data.designResults.find((r: any) => r.result_type === 'interactive')?.result_data,
        budgetEstimate: data.designResults.find((r: any) => r.result_type === 'budget')?.result_data,
        currentStep: '项目完成',
        messages: ['展陈设计已完成']
      }

      // 解析 JSON 字符串（添加错误处理）
      try {
        if (workflowData.conceptPlan) {
          workflowData.conceptPlan = JSON.parse(workflowData.conceptPlan)

          // 处理 concept 字段
          if (workflowData.conceptPlan.concept) {
            let conceptText = workflowData.conceptPlan.concept

            // 如果是字符串，需要处理可能的嵌套 JSON
            if (typeof conceptText === 'string') {
              // 先移除 Markdown 代码块标记
              conceptText = removeCodeBlockMarkers(conceptText)

              // 如果看起来像 JSON 对象，提取 concept 字段的值
              if (conceptText.trim().startsWith('{')) {
                conceptText = extractFromJsonString(conceptText, 'concept')
              }

              // 最后清理剩余的 Markdown 格式
              conceptText = cleanMarkdownText(conceptText)
            }

            workflowData.conceptPlan.concept = conceptText
          }

          // 处理 narrative 字段
          if (workflowData.conceptPlan.narrative) {
            let narrativeText = workflowData.conceptPlan.narrative

            // 如果是字符串，需要处理可能的嵌套 JSON
            if (typeof narrativeText === 'string') {
              // 先移除 Markdown 代码块标记
              narrativeText = removeCodeBlockMarkers(narrativeText)

              // 如果看起来像 JSON 对象，提取 narrative 字段的值
              if (narrativeText.trim().startsWith('{')) {
                narrativeText = extractFromJsonString(narrativeText, 'narrative')
              }

              // 最后清理剩余的 Markdown 格式
              narrativeText = cleanMarkdownText(narrativeText)
            }

            workflowData.conceptPlan.narrative = narrativeText
          }
        }

        // 处理详细大纲
        if (workflowData.detailedOutline) {
          workflowData.detailedOutline = JSON.parse(workflowData.detailedOutline)

          // 处理 zones 数组中的 function 字段（可能包含 Markdown）
          if (workflowData.detailedOutline.zones && Array.isArray(workflowData.detailedOutline.zones)) {
            workflowData.detailedOutline.zones = workflowData.detailedOutline.zones.map((zone: any) => {
              if (zone.function && typeof zone.function === 'string') {
                zone.function = removeCodeBlockMarkers(zone.function)
                zone.function = cleanMarkdownText(zone.function)
              }
              return zone
            })
          }

          // 处理 interactivePlan 数组中的 description 字段
          if (workflowData.detailedOutline.interactivePlan && Array.isArray(workflowData.detailedOutline.interactivePlan)) {
            workflowData.detailedOutline.interactivePlan = workflowData.detailedOutline.interactivePlan.map((item: any) => {
              if (item.description && typeof item.description === 'string') {
                item.description = removeCodeBlockMarkers(item.description)
                item.description = cleanMarkdownText(item.description)
              }
              return item
            })
          }
        }

        // 处理空间设计
        if (workflowData.spatialLayout) {
          workflowData.spatialLayout = JSON.parse(workflowData.spatialLayout)

          // 处理 layout 字段
          if (workflowData.spatialLayout.layout) {
            let layoutText = workflowData.spatialLayout.layout
            if (typeof layoutText === 'string') {
              layoutText = removeCodeBlockMarkers(layoutText)
              if (layoutText.trim().startsWith('{')) {
                layoutText = extractFromJsonString(layoutText, 'layout')
              }
              layoutText = cleanMarkdownText(layoutText)
            }
            workflowData.spatialLayout.layout = layoutText
          }

          // 处理 visitorRoute 字段
          if (workflowData.spatialLayout.visitorRoute && Array.isArray(workflowData.spatialLayout.visitorRoute)) {
            workflowData.spatialLayout.visitorRoute = workflowData.spatialLayout.visitorRoute.map((route: string) => {
              if (typeof route === 'string') {
                route = removeCodeBlockMarkers(route)
                route = cleanMarkdownText(route)
              }
              return route
            })
          }
        }

        // 处理视觉设计
        if (workflowData.visualDesign) {
          workflowData.visualDesign = JSON.parse(workflowData.visualDesign)

          // 处理 typography 字段
          if (workflowData.visualDesign.typography) {
            let typographyText = workflowData.visualDesign.typography
            if (typeof typographyText === 'string') {
              typographyText = removeCodeBlockMarkers(typographyText)
              if (typographyText.trim().startsWith('{')) {
                typographyText = extractFromJsonString(typographyText, 'typography')
              }
              typographyText = cleanMarkdownText(typographyText)
            }
            workflowData.visualDesign.typography = typographyText
          }

          // 处理 visualStyle 字段
          if (workflowData.visualDesign.visualStyle) {
            let styleText = workflowData.visualDesign.visualStyle
            if (typeof styleText === 'string') {
              styleText = removeCodeBlockMarkers(styleText)
              if (styleText.trim().startsWith('{')) {
                styleText = extractFromJsonString(styleText, 'visualStyle')
              }
              styleText = cleanMarkdownText(styleText)
            }
            workflowData.visualDesign.visualStyle = styleText
          }
        }

        // 处理互动技术
        if (workflowData.interactiveSolution) {
          workflowData.interactiveSolution = JSON.parse(workflowData.interactiveSolution)

          // 处理 interactives 数组中的 description 字段
          if (workflowData.interactiveSolution.interactives && Array.isArray(workflowData.interactiveSolution.interactives)) {
            workflowData.interactiveSolution.interactives = workflowData.interactiveSolution.interactives.map((interactive: any) => {
              if (interactive.description && typeof interactive.description === 'string') {
                interactive.description = removeCodeBlockMarkers(interactive.description)
                interactive.description = cleanMarkdownText(interactive.description)
              }
              return interactive
            })
          }
        }

        // 处理预算估算
        if (workflowData.budgetEstimate) {
          workflowData.budgetEstimate = JSON.parse(workflowData.budgetEstimate)

          // 处理 breakdown 数组中的 description 字段
          if (workflowData.budgetEstimate.breakdown && Array.isArray(workflowData.budgetEstimate.breakdown)) {
            workflowData.budgetEstimate.breakdown = workflowData.budgetEstimate.breakdown.map((item: any) => {
              if (item.description && typeof item.description === 'string') {
                item.description = removeCodeBlockMarkers(item.description)
                item.description = cleanMarkdownText(item.description)
              }
              return item
            })
          }

          // 处理 recommendations 数组 - 使用专门的清理函数
          if (workflowData.budgetEstimate.recommendations && Array.isArray(workflowData.budgetEstimate.recommendations)) {
            const originalCount = workflowData.budgetEstimate.recommendations.length
            workflowData.budgetEstimate.recommendations = cleanRecommendations(workflowData.budgetEstimate.recommendations)
            const cleanedCount = workflowData.budgetEstimate.recommendations.length

            if (originalCount !== cleanedCount) {
              console.log(`✅ [Results] 优化建议清理完成: ${originalCount} → ${cleanedCount} 条`)
            }
          }
        }
      } catch (parseError) {
        console.error('❌ [Results] JSON 解析失败:', parseError)
        ElMessage.warning('部分数据解析失败，将显示原始数据')
      }

      exhibitionStore.completeProcessing(workflowData)
      console.log('✅ [Results] 项目数据加载成功')
    } else {
      ElMessage.warning('项目数据不完整')
    }
  } catch (error) {
    console.error('❌ [Results] 加载项目数据失败:', error)
    ElMessage.error('加载项目数据失败')
  } finally {
    loading.value = false
  }
}

// 计算属性
const projectDuration = computed(() => {
  if (!currentWorkflow.value?.requirements?.duration?.startDate) return 0

  const start = new Date(currentWorkflow.value.requirements.duration.startDate)
  const end = new Date(currentWorkflow.value.requirements.duration.endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const budgetChartOption = computed(() => {
  const workflow = currentWorkflow.value
  if (!workflow?.budgetEstimate) return {}

  const data = workflow.budgetEstimate.breakdown.map(item => ({
    name: item.category,
    value: item.amount
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '预算分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data
      }
    ]
  }
})

// 方法
const goBack = () => {
  router.push('/projects')
}

const createNewProject = () => {
  router.push('/create')
}

// 处理导出命令
const handleExportCommand = async (command: string) => {
  const projectId = route.params.id as string

  if (!projectId) {
    ElMessage.error('项目ID不存在')
    return
  }

  let format: 'pdf' | 'markdown' = 'markdown'
  let forceRegenerate = false

  // 根据命令设置参数和进度信息
  if (command === 'pdf-force') {
    format = 'pdf'
    forceRegenerate = true

    // 显示强制重新生成 PDF 的进度
    exportProgress.value = {
      visible: true,
      title: '正在重新生成 PDF 报告',
      message: '正在从设计数据生成 PDF 文档，请稍候...',
      percentage: 0,
      status: '',
      showProgress: true,
      indeterminate: true,
      estimatedTime: '30-60 秒'
    }
  } else if (command === 'pdf') {
    format = 'pdf'

    // 显示导出 PDF 的进度
    exportProgress.value = {
      visible: true,
      title: '正在导出 PDF 报告',
      message: '正在准备 PDF 文档，请稍候...',
      percentage: 0,
      status: '',
      showProgress: true,
      indeterminate: true,
      estimatedTime: '10-30 秒'
    }
  } else {
    // 显示导出 Markdown 的进度
    exportProgress.value = {
      visible: true,
      title: '正在导出 Markdown 报告',
      message: '正在准备 Markdown 文档，请稍候...',
      percentage: 0,
      status: '',
      showProgress: true,
      indeterminate: true,
      estimatedTime: '5-10 秒'
    }
  }

  // 模拟进度更新（PDF 生成通常需要较长时间）
  let currentProgress = 0
  const progressInterval = 500 // 每 500ms 更新一次

  exportProgressTimer = setInterval(() => {
    if (format === 'pdf') {
      // PDF 进度模拟
      if (currentProgress < 30) {
        currentProgress += Math.random() * 5
        exportProgress.value.message = '正在收集设计数据...'
      } else if (currentProgress < 60) {
        currentProgress += Math.random() * 3
        exportProgress.value.message = '正在生成 PDF 文档...'
      } else if (currentProgress < 90) {
        currentProgress += Math.random() * 2
        exportProgress.value.message = '正在优化 PDF 格式...'
      } else {
        // 到达 90% 后停止，等待实际完成
        exportProgress.value.indeterminate = true
        exportProgress.value.message = '即将完成...'
        clearInterval(exportProgressTimer!)
      }
    } else {
      // Markdown 很快完成
      if (currentProgress < 80) {
        currentProgress += 20
      }
    }

    exportProgress.value.percentage = Math.min(Math.floor(currentProgress), 95)
  }, progressInterval)

  try {
    // 调用 API 导出报告
    const blob = await exhibitionAPI.exportReport(projectId, format, forceRegenerate)

    // 清除进度定时器
    if (exportProgressTimer) {
      clearInterval(exportProgressTimer)
      exportProgressTimer = null
    }

    // 更新为成功状态
    exportProgress.value.percentage = 100
    exportProgress.value.status = 'success'
    exportProgress.value.indeterminate = false
    exportProgress.value.message = '导出成功！正在下载文件...'

    // 延迟关闭对话框
    setTimeout(() => {
      exportProgress.value.visible = false
    }, 1500)

    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `exhibition-report-${projectId}.${format === 'markdown' ? 'md' : 'pdf'}`

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success(`${format === 'pdf' ? 'PDF' : 'Markdown'} 报告导出成功`)
  } catch (error: any) {
    console.error('导出报告失败:', error)

    // 清除进度定时器
    if (exportProgressTimer) {
      clearInterval(exportProgressTimer)
      exportProgressTimer = null
    }

    // 更新为错误状态
    exportProgress.value.percentage = 0
    exportProgress.value.status = 'exception'
    exportProgress.value.indeterminate = false

    // 根据错误类型显示不同消息
    if (error.message?.includes('超时')) {
      exportProgress.value.message = '导出超时，PDF 生成时间过长。请稍后重试或尝试使用 Markdown 格式。'
    } else {
      exportProgress.value.message = `导出失败: ${error.message || '未知错误'}`
    }

    // 延迟关闭对话框
    setTimeout(() => {
      exportProgress.value.visible = false
    }, 3000)

    ElMessage.error('导出失败，请重试')
  }
}

onMounted(async () => {
  try {
    // 如果有当前工作流数据，直接使用
    if (currentWorkflow.value) {
      console.log('✅ [Results] 使用 store 中的工作流数据')
      loading.value = false
    } else {
      // 否则从 API 加载
      console.log('📂 [Results] Store 中没有数据，从 API 加载')
      await loadProjectData()
    }

    // 如果仍然没有数据，重定向到首页
    if (!currentWorkflow.value) {
      console.log('⚠️ [Results] 没有找到工作流数据，重定向到首页')
      ElMessage.warning('未找到项目数据')
      setTimeout(() => {
        router.push('/projects')
      }, 1500)
    } else {
      console.log('✅ [Results] 工作流数据已加载')
    }
  } catch (error) {
    console.error('❌ [Results] onMounted 错误:', error)
    ElMessage.error('加载页面失败')
  }
})
</script>

<style scoped>
.results-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  padding: 2rem;
}

/* 加载状态 */
.loading-state {
  background: white;
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.loading-state .el-icon {
  font-size: 3rem;
  color: #3b82f6;
  margin-bottom: 1rem;
}

.loading-state p {
  color: #6b7280;
  margin: 0;
}

/* 页面头部 */
.page-header {
  margin-bottom: 2rem;
}

.header-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.back-button {
  flex-shrink: 0;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-title .el-icon {
  color: #10b981;
  font-size: 2.25rem;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* 项目概览 */
.overview-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: white;
}

.stat-budget .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-area .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-duration .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-completed .stat-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

/* 设计方案网格 */
.design-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.design-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.design-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.card-concept .header-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-outline .header-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-spatial .header-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-visual .header-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-interactive .header-icon {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

.info-section {
  margin-bottom: 1.25rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.section-content {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.color-palette {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-swatch {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-swatch:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.zone-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.zone-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 0.875rem;
}

.zone-name {
  font-weight: 500;
  color: #1f2937;
}

.zone-info {
  color: #6b7280;
  font-size: 0.8125rem;
}

/* 详细大纲样式 */
.outline-structure {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.outline-section {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #f093fb;
}

.section-header-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.zone-tags {
  display: flex;
  gap: 0.5rem;
}

.section-title-text {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9375rem;
}

.section-desc {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  line-height: 1.6;
}

.zone-details {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.detail-item-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.detail-label {
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  color: #1f2937;
  font-weight: 600;
}

/* 展品网格 */
.exhibits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.exhibit-item {
  padding: 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.exhibit-item:hover {
  border-color: #f093fb;
  box-shadow: 0 2px 8px rgba(240, 147, 251, 0.1);
}

.exhibit-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 0.5rem;
}

.exhibit-name {
  flex: 1;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}

.exhibit-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
}

.info-row .label {
  color: #6b7280;
}

.info-row .value {
  color: #1f2937;
  font-weight: 500;
}

/* 互动装置网格 */
.interactive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.interactive-item-compact {
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.interactive-item-compact:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.interactive-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.interactive-name-compact {
  flex: 1;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}

.interactive-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
}

.interactive-desc-compact {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.interactive-cost-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.5rem;
  border-top: 1px solid #dbeafe;
  font-size: 0.8125rem;
}

.interactive-cost-compact .cost-label {
  color: #6b7280;
  font-weight: 500;
}

.interactive-cost-compact .cost-value {
  color: #10b981;
  font-weight: 600;
}

.interactive-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.interactive-item {
  padding: 1rem;
  background: #eff6ff;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.interactive-info {
  flex: 1;
}

.interactive-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.interactive-desc {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
}

.interactive-cost {
  text-align: right;
  flex-shrink: 0;
}

.cost-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.cost-value {
  font-weight: 600;
  color: #10b981;
}

/* 预算部分 */
.budget-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.budget-total {
  font-size: 1.5rem;
  font-weight: 700;
  color: #10b981;
}

.budget-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.budget-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.budget-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.budget-item:hover {
  background: #f3f4f6;
}

.budget-item-info {
  flex: 1;
}

.budget-category {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.budget-desc {
  font-size: 0.8125rem;
  color: #6b7280;
}

.budget-amount {
  font-weight: 600;
  color: #1f2937;
  font-size: 1rem;
}

.budget-chart {
  grid-column: 1 / -1;
}

.chart-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
}

.chart-container {
  height: 300px;
}

.recommendations {
  grid-column: 1 / -1;
}

.recommendations-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #92400e;
}

.recommendation-icon {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

/* 空状态 */
.empty-state {
  background: white;
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 5rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .design-grid {
    grid-template-columns: 1fr;
  }

  .budget-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .results-page {
    padding: 1rem;
  }

  .header-content {
    padding: 1.5rem;
  }

  .title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .el-button {
    width: 100%;
  }

  .overview-section {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .overview-section {
    grid-template-columns: 1fr;
  }
}

/* 导出进度对话框样式 */
.export-progress-content {
  padding: 1rem 0;
  text-align: center;
}

/* 进度动画 */
.progress-animation {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid transparent;
  animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: #3b82f6;
  width: 100%;
  height: 100%;
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  border-right-color: #8b5cf6;
  width: 75%;
  height: 75%;
  animation-delay: 0.15s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  border-bottom-color: #ec4899;
  width: 50%;
  height: 50%;
  animation-delay: 0.3s;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 进度文本 */
.progress-text {
  margin-bottom: 2rem;
}

.progress-text h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.progress-text p {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* 进度条包装器 */
.progress-bar-wrapper {
  margin-bottom: 1.5rem;
  padding: 0 1rem;
}

.progress-percentage {
  font-size: 0.875rem;
  font-weight: 600;
  color: #3b82f6;
}

/* 预计时间 */
.estimated-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 auto;
  max-width: fit-content;
}

.estimated-time .el-icon {
  color: #9ca3af;
  font-size: 1rem;
}

/* 对话框样式优化 */
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.25rem 1.5rem;
  margin: 0;
}

:deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 1.125rem;
}

:deep(.el-dialog__body) {
  padding: 1.5rem;
}

/* 进度条颜色定制 */
:deep(.el-progress-bar__inner) {
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
  transition: all 0.3s ease;
}

:deep(.el-progress.is-success .el-progress-bar__inner) {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

:deep(.el-progress.is-exception .el-progress-bar__inner) {
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
}
</style>
