<template>
  <div class="results-page">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <ElIcon class="is-loading"><Loading /></ElIcon>
      <p>正在加载项目数据...</p>
    </div>

    <!-- 页面内容 -->
    <div v-else-if="currentWorkflow">
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
            <ElButton @click="exportReport('markdown')" :icon="Document">
              导出 Markdown
            </ElButton>
            <ElButton @click="exportReport('pdf')" :icon="Download">
              导出 PDF
            </ElButton>
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

      <!-- 智能体工作回顾 -->
      <div class="agents-section">
        <div class="section-header">
          <div class="section-title-wrapper">
            <div class="section-icon">
              <ElIcon><Timer /></ElIcon>
            </div>
            <h3 class="section-title">智能体工作回顾</h3>
          </div>
        </div>
        <div class="agents-grid">
          <div
            v-for="agent in agentStatuses"
            :key="agent.id"
            class="agent-card"
            :class="`agent-${agent.status}`"
          >
            <div class="agent-status-dot" :class="`dot-${agent.status}`"></div>
            <div class="agent-name">{{ agent.name }}</div>
            <div v-if="agent.startTime" class="agent-duration">
              耗时: {{ calculateDuration(agent.startTime, agent.endTime) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div v-else class="empty-state">
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
  Timer,
  Loading,
  ArrowLeft,
  Wallet,
  OfficeBuilding,
  Calendar,
  CircleCheck,
  FolderOpened,
  Star,
  Menu,
  EditPen,
  Link
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

// 直接使用 store 的响应式引用，而不是解构
const currentWorkflow = computed(() => exhibitionStore.currentWorkflow)
const agentStatuses = computed(() => exhibitionStore.agentStatuses)
const completedAgents = computed(() => exhibitionStore.completedAgents)

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
        spatialLayout: data.designResults.find((r: any) => r.result_type === 'spatial')?.result_data,
        visualDesign: data.designResults.find((r: any) => r.result_type === 'visual')?.result_data,
        interactiveSolution: data.designResults.find((r: any) => r.result_type === 'interactive')?.result_data,
        budgetEstimate: data.designResults.find((r: any) => r.result_type === 'budget')?.result_data,
        currentStep: '项目完成',
        messages: ['展陈设计已完成']
      }

      // 解析 JSON 字符串
      if (workflowData.conceptPlan) workflowData.conceptPlan = JSON.parse(workflowData.conceptPlan)
      if (workflowData.spatialLayout) workflowData.spatialLayout = JSON.parse(workflowData.spatialLayout)
      if (workflowData.visualDesign) workflowData.visualDesign = JSON.parse(workflowData.visualDesign)
      if (workflowData.interactiveSolution) workflowData.interactiveSolution = JSON.parse(workflowData.interactiveSolution)
      if (workflowData.budgetEstimate) workflowData.budgetEstimate = JSON.parse(workflowData.budgetEstimate)

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

const exportReport = async (format: 'pdf' | 'markdown') => {
  try {
    const projectId = route.params.id as string

    if (!projectId) {
      ElMessage.error('项目ID不存在')
      return
    }

    ElMessage.info(`正在导出 ${format.toUpperCase()} 格式报告...`)

    // 调用 API 导出报告
    const blob = await exhibitionAPI.exportReport(projectId, format)

    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `exhibition-report-${projectId}.${format}`

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success(`${format.toUpperCase()} 报告导出成功`)
  } catch (error) {
    console.error('导出报告失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

const calculateDuration = (startTime?: Date, endTime?: Date) => {
  if (!startTime) return '0s'

  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()
  const duration = end.getTime() - start.getTime()

  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
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

/* 智能体部分 */
.agents-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.agent-card {
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.agent-pending {
  border-color: #d1d5db;
  background: #f9fafb;
}

.agent-running {
  border-color: #93c5fd;
  background: #eff6ff;
}

.agent-completed {
  border-color: #6ee7b7;
  background: #ecfdf5;
}

.agent-error {
  border-color: #fca5a5;
  background: #fef2f2;
}

.agent-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-pending {
  background: #9ca3af;
}

.dot-running {
  background: #3b82f6;
  animation: pulse 2s ease-in-out infinite;
}

.dot-completed {
  background: #10b981;
}

.dot-error {
  background: #ef4444;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.agent-name {
  font-weight: 500;
  color: #1f2937;
}

.agent-duration {
  font-size: 0.75rem;
  color: #6b7280;
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

  .agents-grid {
    grid-template-columns: 1fr;
  }
}
</style>
