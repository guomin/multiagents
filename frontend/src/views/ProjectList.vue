<template>
  <div class="project-list-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <ElIcon><FolderOpened /></ElIcon>
            项目列表
          </h1>
          <p class="page-subtitle">查看和管理所有展览设计项目</p>
        </div>
        <ElButton type="primary" @click="goToCreate" :icon="Plus" size="large">
          创建新项目
        </ElButton>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card stat-total">
        <div class="stat-icon">
          <ElIcon><DataAnalysis /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总项目数</div>
        </div>
      </div>
      <div class="stat-card stat-running">
        <div class="stat-icon">
          <ElIcon><Loading /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.running }}</div>
          <div class="stat-label">进行中</div>
        </div>
      </div>
      <div class="stat-card stat-completed">
        <div class="stat-icon">
          <ElIcon><SuccessFilled /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card stat-error">
        <div class="stat-icon">
          <ElIcon><Warning /></ElIcon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.error }}</div>
          <div class="stat-label">错误</div>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索栏 -->
    <div class="filter-bar">
      <div class="search-box">
        <ElInput
          v-model="searchKeyword"
          placeholder="搜索项目名称或主题..."
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
        />
      </div>
      <div class="filter-controls">
        <ElSelect v-model="statusFilter" placeholder="全部状态" @change="loadProjects" clearable>
          <ElOption label="全部状态" value="" />
          <ElOption label="进行中" value="running" />
          <ElOption label="已完成" value="completed" />
          <ElOption label="等待中" value="pending" />
          <ElOption label="错误" value="error" />
        </ElSelect>
      </div>
    </div>

    <!-- 项目卡片网格 -->
    <div v-if="loading" class="loading-state">
      <ElIcon class="is-loading"><Loading /></ElIcon>
      <p>加载中...</p>
    </div>

    <div v-else-if="projects.length === 0" class="empty-state">
      <ElIcon class="empty-icon"><FolderOpened /></ElIcon>
      <h3>{{ searchKeyword || statusFilter ? '未找到匹配的项目' : '暂无项目' }}</h3>
      <p>{{ searchKeyword || statusFilter ? '尝试调整搜索或筛选条件' : '点击"创建新项目"开始您的第一个展览设计' }}</p>
      <ElButton v-if="!searchKeyword && !statusFilter" type="primary" @click="goToCreate" :icon="Plus">
        创建新项目
      </ElButton>
    </div>

    <div v-else class="projects-grid">
      <div
        v-for="project in projects"
        :key="project.id"
        class="project-card"
        @click="viewProject(project.id)"
      >
        <!-- 状态指示条 -->
        <div class="status-indicator" :class="`status-${project.status}`"></div>

        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="project-info">
            <h3 class="project-title">{{ project.title }}</h3>
            <p class="project-theme">{{ project.theme }}</p>
          </div>
          <div class="project-actions" @click.stop>
            <ElDropdown trigger="click">
              <ElButton circle size="small" :icon="MoreFilled" />
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem @click="viewProject(project.id)" :icon="View">
                    查看详情
                  </ElDropdownItem>
                  <ElDropdownItem divided @click="confirmDelete(project)" :icon="Delete">
                    删除项目
                  </ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </div>
        </div>

        <!-- 状态标签 -->
        <div class="card-tags">
          <ElTag :type="getStatusTagType(project.status)" size="small" effect="plain">
            {{ getStatusLabel(project.status) }}
          </ElTag>
        </div>

        <!-- 卡片内容 -->
        <div class="card-content">
          <div class="info-row">
            <ElIcon class="info-icon"><Wallet /></ElIcon>
            <span class="info-label">预算</span>
            <span class="info-value">{{ project.budget_total.toLocaleString() }} {{ project.budget_currency }}</span>
          </div>
          <div class="info-row">
            <ElIcon class="info-icon"><OfficeBuilding /></ElIcon>
            <span class="info-label">面积</span>
            <span class="info-value">{{ project.venue_area }}㎡</span>
          </div>
          <div class="info-row">
            <ElIcon class="info-icon"><Calendar /></ElIcon>
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ formatDateRelative(project.created_at) }}</span>
          </div>
        </div>

        <!-- 卡片底部 -->
        <div class="card-footer">
          <ElButton type="primary" size="small" @click.stop="viewProject(project.id)">
            查看详情
          </ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  MoreFilled,
  Search,
  Wallet,
  OfficeBuilding,
  Calendar
} from '@element-plus/icons-vue'
import { exhibitionAPI, type Project, type ProjectStats } from '@/api/exhibition'

const router = useRouter()

const projects = ref<Project[]>([])
const allProjects = ref<Project[]>([])  // 保存所有项目用于搜索
const stats = ref<ProjectStats>({
  total: 0,
  pending: 0,
  running: 0,
  completed: 0,
  error: 0
})
const loading = ref(false)
const statusFilter = ref('')
const searchKeyword = ref('')

// 加载项目列表
const loadProjects = async () => {
  loading.value = true
  try {
    const [projectsData, statsData] = await Promise.all([
      exhibitionAPI.getProjects(100, 0),
      exhibitionAPI.getProjectStats()
    ])

    allProjects.value = projectsData
    stats.value = statsData

    // 应用筛选和搜索
    applyFilters()
  } catch (error) {
    console.error('加载项目列表失败:', error)
    ElMessage.error('加载项目列表失败')
  } finally {
    loading.value = false
  }
}

// 应用筛选和搜索
const applyFilters = () => {
  let filtered = allProjects.value

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(p => p.status === statusFilter.value)
  }

  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(keyword) ||
      p.theme.toLowerCase().includes(keyword)
    )
  }

  projects.value = filtered
}

// 处理搜索（带防抖）
let searchTimer: NodeJS.Timeout | null = null
const handleSearch = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    applyFilters()
  }, 300)
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

// 格式化相对时间
const formatDateRelative = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays} 天前`
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} 周前`
  } else if (diffDays < 365) {
    return `${Math.floor(diffDays / 30)} 个月前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }
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

<style scoped>
.project-list-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  padding: 2rem;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  flex: 1;
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
  color: #3b82f6;
  font-size: 2.25rem;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}

/* 统计卡片网格 */
.stats-grid {
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
}

.stat-total .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-running .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-completed .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-error .stat-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
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

/* 筛选栏 */
.filter-bar {
  background: white;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  flex: 1;
  max-width: 400px;
}

.filter-controls {
  display: flex;
  gap: 0.75rem;
}

/* 加载和空状态 */
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

/* 项目卡片网格 */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.project-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}

.project-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

/* 状态指示条 */
.status-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.status-indicator.status-pending {
  background: linear-gradient(90deg, #6b7280 0%, #9ca3af 100%);
}

.status-indicator.status-running {
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
  animation: pulse-running 2s ease-in-out infinite;
}

.status-indicator.status-completed {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

.status-indicator.status-error {
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
}

@keyframes pulse-running {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 卡片头部 */
.card-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.project-info {
  flex: 1;
  min-width: 0;
}

.project-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-theme {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-actions {
  flex-shrink: 0;
}

/* 卡片标签 */
.card-tags {
  padding: 0 1.5rem;
  margin-bottom: 0.75rem;
}

/* 卡片内容 */
.card-content {
  padding: 0 1.5rem 1rem;
  flex: 1;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.info-icon {
  color: #9ca3af;
  font-size: 1rem;
  flex-shrink: 0;
}

.info-label {
  color: #9ca3af;
  flex-shrink: 0;
}

.info-value {
  color: #4b5563;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 卡片底部 */
.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  gap: 0.75rem;
}

.card-footer .el-button {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-list-page {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .page-title {
    font-size: 1.5rem;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .filter-bar {
    flex-direction: column;
  }

  .search-box {
    max-width: 100%;
  }

  .filter-controls {
    width: 100%;
  }

  .filter-controls .el-select {
    width: 100%;
  }

  .projects-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
