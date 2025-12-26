<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-12">
      <ElIcon class="text-6xl text-blue-500 animate-spin mb-4"><Loading /></ElIcon>
      <p class="text-gray-600 text-lg">正在加载项目数据...</p>
    </div>

    <!-- 页面内容 -->
    <div v-else-if="currentWorkflow">
    <!-- 页面标题 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 flex items-center">
            <ElIcon class="mr-3 text-green-600"><SuccessFilled /></ElIcon>
            展陈设计方案
          </h1>
          <p class="text-gray-600 mt-2">{{ currentWorkflow?.requirements.title }}</p>
        </div>
        <div class="flex items-center space-x-4">
          <ElButton @click="exportReport('pdf')" :icon="Download">
            导出 PDF
          </ElButton>
          <ElButton @click="exportReport('markdown')" :icon="Document">
            导出 Markdown
          </ElButton>
          <ElButton type="primary" @click="createNewProject" :icon="Plus">
            新建项目
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 项目概览 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <ElIcon class="mr-2 text-blue-600"><DataAnalysis /></ElIcon>
        项目概览
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600">{{ currentWorkflow?.requirements.budget.total.toLocaleString() }}</div>
          <div class="text-sm text-gray-600 mt-1">总预算 ({{ currentWorkflow?.requirements.budget.currency }})</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">{{ currentWorkflow?.requirements.venueSpace.area }}</div>
          <div class="text-sm text-gray-600 mt-1">场地面积 (㎡)</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-600">{{ projectDuration }}</div>
          <div class="text-sm text-gray-600 mt-1">展期天数</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-orange-600">{{ completedAgents }}</div>
          <div class="text-sm text-gray-600 mt-1">完成步骤</div>
        </div>
      </div>
    </div>

    <!-- 设计方案展示 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- 概念策划 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <div class="w-4 h-4 bg-agent-curator rounded-full mr-2"></div>
          概念策划
        </h3>
        <div v-if="currentWorkflow?.conceptPlan" class="space-y-4">
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">核心概念</h4>
            <p class="text-gray-600">{{ currentWorkflow.conceptPlan.concept }}</p>
          </div>
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">叙事结构</h4>
            <p class="text-gray-600">{{ currentWorkflow.conceptPlan.narrative }}</p>
          </div>
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">重点展品</h4>
            <div class="flex flex-wrap gap-2">
              <ElTag
                v-for="exhibit in currentWorkflow.conceptPlan.keyExhibits"
                :key="exhibit"
                type="info"
                size="small"
              >
                {{ exhibit }}
              </ElTag>
            </div>
          </div>
        </div>
      </div>

      <!-- 空间设计 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <div class="w-4 h-4 bg-agent-spatial rounded-full mr-2"></div>
          空间设计
        </h3>
        <div v-if="currentWorkflow?.spatialLayout" class="space-y-4">
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">布局方案</h4>
            <p class="text-gray-600">{{ currentWorkflow.spatialLayout.layout }}</p>
          </div>
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">功能区域</h4>
            <div class="space-y-2">
              <div
                v-for="zone in currentWorkflow.spatialLayout.zones"
                :key="zone.name"
                class="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <span class="font-medium">{{ zone.name }}</span>
                <span class="text-sm text-gray-600">{{ zone.area }}㎡ - {{ zone.function }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 视觉设计 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <div class="w-4 h-4 bg-agent-visual rounded-full mr-2"></div>
          视觉设计
        </h3>
        <div v-if="currentWorkflow?.visualDesign" class="space-y-4">
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">色彩方案</h4>
            <div class="flex space-x-2">
              <div
                v-for="color in currentWorkflow.visualDesign.colorScheme"
                :key="color"
                class="w-12 h-12 rounded-lg border-2 border-gray-200"
                :style="{ backgroundColor: color }"
                :title="color"
              ></div>
            </div>
          </div>
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">字体设计</h4>
            <p class="text-gray-600">{{ currentWorkflow.visualDesign.typography }}</p>
          </div>
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">品牌元素</h4>
            <div class="flex flex-wrap gap-2">
              <ElTag
                v-for="element in currentWorkflow.visualDesign.brandElements"
                :key="element"
                type="primary"
                size="small"
              >
                {{ element }}
              </ElTag>
            </div>
          </div>
        </div>
      </div>

      <!-- 互动技术 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <div class="w-4 h-4 bg-agent-interactive rounded-full mr-2"></div>
          互动技术
        </h3>
        <div v-if="currentWorkflow?.interactiveSolution" class="space-y-4">
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">使用技术</h4>
            <div class="flex flex-wrap gap-2">
              <ElTag
                v-for="tech in currentWorkflow.interactiveSolution.technologies"
                :key="tech"
                type="success"
                size="small"
              >
                {{ tech }}
              </ElTag>
            </div>
          </div>
          <div>
            <h4 class="font-semibold text-gray-700 mb-2">互动装置</h4>
            <div class="space-y-2">
              <div
                v-for="interactive in currentWorkflow.interactiveSolution.interactives"
                :key="interactive.name"
                class="p-3 bg-blue-50 rounded-lg"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="font-medium text-gray-800">{{ interactive.name }}</div>
                    <div class="text-sm text-gray-600 mt-1">{{ interactive.description }}</div>
                    <ElTag type="info" size="small" class="mt-2">{{ interactive.type }}</ElTag>
                  </div>
                  <div v-if="interactive.cost" class="text-right ml-4">
                    <div class="text-sm text-gray-500">成本</div>
                    <div class="font-medium text-green-600">¥{{ interactive.cost.toLocaleString() }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预算估算 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <div class="w-4 h-4 bg-agent-budget rounded-full mr-2"></div>
        预算估算
      </h3>
      <div v-if="currentWorkflow?.budgetEstimate" class="space-y-4">
        <div>
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-semibold text-gray-700">预算明细</h4>
            <span class="text-lg font-bold text-green-600">
              总计: ¥{{ currentWorkflow.budgetEstimate.totalCost.toLocaleString() }}
            </span>
          </div>
          <div class="space-y-2">
            <div
              v-for="item in currentWorkflow.budgetEstimate.breakdown"
              :key="item.category"
              class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <div class="font-medium text-gray-800">{{ item.category }}</div>
                <div class="text-sm text-gray-600">{{ item.description }}</div>
              </div>
              <span class="font-semibold text-gray-900">¥{{ item.amount.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- 预算分布图表 -->
        <div>
          <h4 class="font-semibold text-gray-700 mb-3">预算分布</h4>
          <div class="h-64">
            <v-chart
              :option="budgetChartOption"
              class="w-full h-full"
            />
          </div>
        </div>

        <div>
          <h4 class="font-semibold text-gray-700 mb-2">优化建议</h4>
          <div class="space-y-2">
            <div
              v-for="recommendation in currentWorkflow.budgetEstimate.recommendations"
              :key="recommendation"
              class="flex items-start p-3 bg-yellow-50 rounded-lg"
            >
              <ElIcon class="text-yellow-600 mr-2 mt-0.5"><Warning /></ElIcon>
              <span class="text-gray-700">{{ recommendation }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 智能体工作回顾 -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <ElIcon class="mr-2 text-purple-600"><Timer /></ElIcon>
        智能体工作回顾
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="agent in agentStatuses"
          :key="agent.id"
          class="border rounded-lg p-4"
          :class="getAgentReviewClass(agent.status)"
        >
          <div class="flex items-center mb-2">
            <div class="w-3 h-3 rounded-full mr-2" :class="getAgentStatusDotClass(agent.status)"></div>
            <span class="font-medium">{{ agent.name }}</span>
          </div>
          <div v-if="agent.startTime" class="text-xs text-gray-500">
            耗时: {{ calculateDuration(agent.startTime, agent.endTime) }}
          </div>
        </div>
      </div>
    </div>
    </div>
    <!-- 无数据提示 -->
    <div v-else class="text-center py-12">
      <ElIcon class="text-6xl text-gray-300 mb-4"><Warning /></ElIcon>
      <p class="text-gray-600 text-lg">未找到项目数据</p>
      <ElButton type="primary" @click="router.push('/')" class="mt-4">返回首页</ElButton>
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
  Setting,
  Loading
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
const createNewProject = () => {
  router.push('/create')
}

const exportReport = async (format: 'pdf' | 'markdown') => {
  try {
    ElMessage.success(`正在导出 ${format.toUpperCase()} 格式报告...`)
    // 调用 API 导出报告
    // const blob = await exhibitionAPI.exportReport(projectId, format)
    // 处理文件下载
  } catch (error) {
    ElMessage.error('导出失败，请重试')
  }
}

const getAgentReviewClass = (status: string) => {
  const classes = {
    pending: 'border-gray-300',
    running: 'border-blue-300 bg-blue-50',
    completed: 'border-green-300 bg-green-50',
    error: 'border-red-300 bg-red-50'
  }
  return classes[status as keyof typeof classes] || 'border-gray-300'
}

const getAgentStatusDotClass = (status: string) => {
  const classes = {
    pending: 'bg-gray-400',
    running: 'bg-blue-500',
    completed: 'bg-green-500',
    error: 'bg-red-500'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-400'
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
    console.log('🔍 [Results] onMounted 开始')
    console.log('🔍 [Results] exhibitionStore:', exhibitionStore)
    console.log('🔍 [Results] currentWorkflow value:', exhibitionStore.currentWorkflow)
    console.log('🔍 [Results] currentWorkflow computed value:', currentWorkflow.value)

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
        router.push('/')
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