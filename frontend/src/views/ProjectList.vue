<template>
  <div class="container mx-auto px-4 py-8">
    <!-- 页面标题 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-800 flex items-center">
            <ElIcon class="mr-3 text-blue-600"><FolderOpened /></ElIcon>
            项目列表
          </h1>
          <p class="text-gray-600 mt-2">查看和管理所有展览设计项目</p>
        </div>
        <div class="flex items-center space-x-4">
          <ElSelect v-model="statusFilter" placeholder="筛选状态" @change="loadProjects" clearable>
            <ElOption label="全部" value="" />
            <ElOption label="进行中" value="running" />
            <ElOption label="已完成" value="completed" />
            <ElOption label="等待中" value="pending" />
            <ElOption label="错误" value="error" />
          </ElSelect>
          <ElButton type="primary" @click="goToCreate" :icon="Plus">
            创建新项目
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">总项目数</p>
            <p class="text-3xl font-bold text-gray-800">{{ stats.total }}</p>
          </div>
          <ElIcon class="text-4xl text-blue-500"><DataAnalysis /></ElIcon>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">进行中</p>
            <p class="text-3xl font-bold text-yellow-600">{{ stats.running }}</p>
          </div>
          <ElIcon class="text-4xl text-yellow-500"><Loading /></ElIcon>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">已完成</p>
            <p class="text-3xl font-bold text-green-600">{{ stats.completed }}</p>
          </div>
          <ElIcon class="text-4xl text-green-500"><SuccessFilled /></ElIcon>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm">错误</p>
            <p class="text-3xl font-bold text-red-600">{{ stats.error }}</p>
          </div>
          <ElIcon class="text-4xl text-red-500"><Warning /></ElIcon>
        </div>
      </div>
    </div>

    <!-- 项目列表 -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <div v-if="loading" class="text-center py-12">
        <ElIcon class="text-4xl text-blue-500 animate-spin mb-4"><Loading /></ElIcon>
        <p class="text-gray-600">加载中...</p>
      </div>

      <div v-else-if="projects.length === 0" class="text-center py-12">
        <ElIcon class="text-6xl text-gray-300 mb-4"><FolderOpened /></ElIcon>
        <p class="text-gray-600 text-lg">暂无项目</p>
        <p class="text-gray-500 mt-2">点击"创建新项目"开始您的第一个展览设计</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="project in projects"
          :key="project.id"
          class="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
          @click="viewProject(project.id)"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="text-xl font-semibold text-gray-800">{{ project.title }}</h3>
                <ElTag
                  :type="getStatusTagType(project.status)"
                  size="small"
                >
                  {{ getStatusLabel(project.status) }}
                </ElTag>
              </div>
              <p class="text-gray-600 mb-4">{{ project.theme }}</p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                <div>
                  <span class="block text-gray-400">预算</span>
                  <span class="font-medium text-gray-700">
                    {{ project.budget_total.toLocaleString() }} {{ project.budget_currency }}
                  </span>
                </div>
                <div>
                  <span class="block text-gray-400">场地面积</span>
                  <span class="font-medium text-gray-700">{{ project.venue_area }}㎡</span>
                </div>
                <div>
                  <span class="block text-gray-400">创建时间</span>
                  <span class="font-medium text-gray-700">{{ formatDate(project.created_at) }}</span>
                </div>
                <div>
                  <span class="block text-gray-400">项目ID</span>
                  <span class="font-medium text-gray-700 text-xs">{{ project.id.slice(0, 8) }}...</span>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2 ml-4">
              <ElButton
                type="primary"
                size="small"
                @click.stop="viewProject(project.id)"
                :icon="View"
              >
                查看
              </ElButton>
              <ElButton
                type="danger"
                size="small"
                @click.stop="confirmDelete(project)"
                :icon="Delete"
              >
                删除
              </ElButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  FolderOpened,
  DataAnalysis,
  Loading,
  SuccessFilled,
  Warning,
  Plus,
  View,
  Delete,
  Setting
} from '@element-plus/icons-vue'
import { exhibitionAPI, type Project, type ProjectStats } from '@/api/exhibition'

const router = useRouter()

const projects = ref<Project[]>([])
const stats = ref<ProjectStats>({
  total: 0,
  pending: 0,
  running: 0,
  completed: 0,
  error: 0
})
const loading = ref(false)
const statusFilter = ref('')

// 加载项目列表
const loadProjects = async () => {
  loading.value = true
  try {
    const [projectsData, statsData] = await Promise.all([
      exhibitionAPI.getProjects(100, 0),
      exhibitionAPI.getProjectStats()
    ])

    // 过滤项目
    if (statusFilter.value) {
      projects.value = projectsData.filter(p => p.status === statusFilter.value)
    } else {
      projects.value = projectsData
    }

    stats.value = statsData
  } catch (error) {
    console.error('加载项目列表失败:', error)
    ElMessage.error('加载项目列表失败')
  } finally {
    loading.value = false
  }
}

// 查看项目
const viewProject = (id: string) => {
  router.push(`/results/${id}`)
}

// 创建新项目
const goToCreate = () => {
  router.push('/create')
}

// 确认删除
const confirmDelete = async (project: Project) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目"${project.title}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await exhibitionAPI.deleteProject(project.id)
    ElMessage.success('项目删除成功')
    await loadProjects()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除项目失败:', error)
      ElMessage.error('删除项目失败')
    }
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const types: Record<string, any> = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    error: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态标签文字
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '等待中',
    running: '进行中',
    completed: '已完成',
    error: '错误'
  }
  return labels[status] || status
}

onMounted(() => {
  loadProjects()
})
</script>
