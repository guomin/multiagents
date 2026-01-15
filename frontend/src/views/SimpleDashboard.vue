<template>
  <div class="dashboard-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-logo">
            <svg viewBox="0 0 48 48" class="logo-svg">
              <!-- 背景圆形 -->
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
                </linearGradient>
              </defs>

              <!-- 展览馆建筑轮廓 -->
              <path d="M8 40 L8 20 L24 8 L40 20 L40 40"
                    fill="none"
                    stroke="url(#logoGradient)"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"/>

              <!-- 内部柱子 -->
              <line x1="14" y1="24" x2="14" y2="36" stroke="url(#logoGradient)" stroke-width="2" stroke-linecap="round"/>
              <line x1="24" y1="24" x2="24" y2="36" stroke="url(#logoGradient)" stroke-width="2" stroke-linecap="round"/>
              <line x1="34" y1="24" x2="34" y2="36" stroke="url(#logoGradient)" stroke-width="2" stroke-linecap="round"/>

              <!-- AI 元素 - 电路节点 -->
              <circle cx="24" cy="16" r="3" fill="url(#accentGradient)"/>
              <circle cx="14" cy="24" r="2" fill="url(#accentGradient)"/>
              <circle cx="34" cy="24" r="2" fill="url(#accentGradient)"/>

              <!-- AI 连接线 -->
              <path d="M14 24 L24 16 L34 24"
                    fill="none"
                    stroke="url(#accentGradient)"
                    stroke-width="1.5"
                    stroke-linecap="round"/>

              <!-- AI 核心 - 中央节点 -->
              <circle cx="24" cy="30" r="4" fill="url(#accentGradient)"/>
              <circle cx="24" cy="30" r="2" fill="#fff"/>

              <!-- 底部基座 -->
              <rect x="6" y="40" width="36" height="3" rx="1" fill="url(#logoGradient)"/>
            </svg>
          </div>
          <div class="header-text">
            <h1 class="page-title">ExhibitionAI</h1>
            <p class="page-subtitle">展陈设计多智能体系统</p>
          </div>
        </div>
        <div class="header-actions">
          <div v-if="authStore.isAuthenticated" class="user-info">
            <ElDropdown trigger="click">
              <div class="user-dropdown-trigger">
                <ElAvatar :size="32" class="user-avatar">
                  {{ authStore.user?.username?.charAt(0).toUpperCase() || 'U' }}
                </ElAvatar>
                <span class="user-name">{{ authStore.user?.username || '用户' }}</span>
                <ElIcon class="el-icon--right"><ArrowDown /></ElIcon>
              </div>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem disabled>
                    <ElIcon><User /></ElIcon>
                    {{ authStore.user?.username || '用户' }}
                    <ElTag v-if="authStore.isAdmin" type="danger" size="small" style="margin-left: 8px">管理员</ElTag>
                  </ElDropdownItem>
                  <ElDropdownItem v-if="authStore.isAdmin" @click="router.push('/admin/users')">
                    <ElIcon><User /></ElIcon>
                    用户管理
                  </ElDropdownItem>
                  <ElDropdownItem divided @click="handleLogout">
                    <ElIcon><SwitchButton /></ElIcon>
                    退出登录
                  </ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </div>
          <ElButton type="primary" size="large" @click="createNewExhibition">
            <ElIcon style="margin-right: 6px"><Plus /></ElIcon>
            创建新展览
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 快速统计 -->
    <div class="stats-section">
      <div class="stat-card stat-blue">
        <div class="stat-icon">
          <ElIcon :size="28"><Folder /></ElIcon>
        </div>
        <div class="stat-content">
          <p class="stat-label">总项目数</p>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
        <div class="stat-trend positive">
          <ElIcon><TrendCharts /></ElIcon>
          <span>+12%</span>
        </div>
      </div>

      <div class="stat-card stat-green">
        <div class="stat-icon">
          <ElIcon :size="28"><CircleCheck /></ElIcon>
        </div>
        <div class="stat-content">
          <p class="stat-label">已完成</p>
          <p class="stat-value">{{ stats.completed }}</p>
        </div>
        <div class="stat-trend positive">
          <ElIcon><TrendCharts /></ElIcon>
          <span>+8%</span>
        </div>
      </div>

      <div class="stat-card stat-orange">
        <div class="stat-icon">
          <ElIcon :size="28"><Loading /></ElIcon>
        </div>
        <div class="stat-content">
          <p class="stat-label">进行中</p>
          <p class="stat-value">{{ stats.running }}</p>
        </div>
        <div class="stat-trend neutral">
          <ElIcon><Minus /></ElIcon>
          <span>0%</span>
        </div>
      </div>

      <div class="stat-card stat-gray">
        <div class="stat-icon">
          <ElIcon :size="28"><Clock /></ElIcon>
        </div>
        <div class="stat-content">
          <p class="stat-label">待处理</p>
          <p class="stat-value">{{ stats.pending }}</p>
        </div>
        <div class="stat-trend neutral">
          <ElIcon><Minus /></ElIcon>
          <span>-</span>
        </div>
      </div>

      <div class="stat-card stat-red">
        <div class="stat-icon">
          <ElIcon :size="28"><Warning /></ElIcon>
        </div>
        <div class="stat-content">
          <p class="stat-label">错误</p>
          <p class="stat-value">{{ stats.error }}</p>
        </div>
        <div class="stat-badge" v-if="stats.error > 0">需处理</div>
      </div>
    </div>

    <!-- 3D 展览展示 -->
    <div class="section-3d">
      <Exhibition3D />
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions-section">
      <div class="quick-action-card" @click="createNewExhibition">
        <div class="action-icon action-blue">
          <ElIcon :size="24"><Plus /></ElIcon>
        </div>
        <div class="action-content">
          <h3 class="action-title">新建项目</h3>
          <p class="action-desc">创建新的展陈设计</p>
        </div>
        <ElIcon class="action-arrow"><ArrowRight /></ElIcon>
      </div>

      <div class="quick-action-card" @click="viewTemplates">
        <div class="action-icon action-purple">
          <ElIcon :size="24"><DocumentCopy /></ElIcon>
        </div>
        <div class="action-content">
          <h3 class="action-title">使用模板</h3>
          <p class="action-desc">快速启动项目</p>
        </div>
        <ElIcon class="action-arrow"><ArrowRight /></ElIcon>
      </div>

      <div class="quick-action-card" @click="viewAllProjects">
        <div class="action-icon action-green">
          <ElIcon :size="24"><Files /></ElIcon>
        </div>
        <div class="action-content">
          <h3 class="action-title">浏览项目</h3>
          <p class="action-desc">查看所有项目</p>
        </div>
        <ElIcon class="action-arrow"><ArrowRight /></ElIcon>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 最近项目 -->
      <div class="panel projects-panel">
        <div class="panel-header">
          <h3 class="panel-title">
            <ElIcon class="icon"><FolderOpened /></ElIcon>
            最近项目
          </h3>
          <ElButton text type="primary" @click="viewAllProjects">
            查看全部
            <ElIcon style="margin-left: 4px"><ArrowRight /></ElIcon>
          </ElButton>
        </div>
        <div class="projects-list">
          <div v-if="projectsLoading" class="loading-state">
            <ElIcon class="is-loading" :size="32"><Loading /></ElIcon>
            <p>加载中...</p>
          </div>
          <div v-else-if="recentProjects.length === 0" class="empty-state">
            <ElIcon :size="48"><FolderOpened /></ElIcon>
            <p>暂无项目</p>
            <ElButton type="primary" @click="createNewExhibition">
              创建第一个项目
            </ElButton>
          </div>
          <div
            v-else
            v-for="project in recentProjects"
            :key="project.id"
            class="project-card"
            @click="viewProject(project.id)"
          >
            <div class="project-header">
              <h4 class="project-title">{{ project.title }}</h4>
              <ElTag
                :type="project.status === 'completed' ? 'success' : 'warning'"
                size="small"
              >
                {{ project.status === 'completed' ? '已完成' : '进行中' }}
              </ElTag>
            </div>
            <p class="project-theme">{{ project.theme }}</p>
            <div class="project-meta">
              <span class="meta-item">
                <ElIcon><Calendar /></ElIcon>
                {{ formatDate(project.createdAt) }}
              </span>
              <span class="meta-item">
                <ElIcon><Coin /></ElIcon>
                {{ project.budget }} {{ project.currency }}
              </span>
            </div>
            <div class="project-progress">
              <ElProgress
                :percentage="project.progress"
                :color="project.status === 'completed' ? '#10b981' : '#3b82f6'"
                :stroke-width="6"
                :show-text="false"
              />
              <span class="progress-text">{{ project.progress }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExhibitionStore } from '@/stores/exhibition'
import { useAuthStore } from '@/stores/auth'
import { exhibitionAPI } from '@/api/exhibition'
import { ElMessage, ElMessageBox } from 'element-plus'
import Exhibition3D from '@/components/Exhibition3D.vue'
import {
  Plus,
  Folder,
  CircleCheck,
  User,
  ArrowDown,
  SwitchButton,
  Loading,
  TrendCharts,
  Minus,
  ArrowRight,
  DocumentCopy,
  Files,
  FolderOpened,
  Calendar,
  Coin,
  Clock,
  Warning
} from '@element-plus/icons-vue'

const router = useRouter()
const exhibitionStore = useExhibitionStore()
const authStore = useAuthStore()

const stats = ref({
  total: 0,
  completed: 0,
  running: 0,
  pending: 0,
  error: 0,
  agents: 6
})

// 登出方法
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    // 用户取消操作
  }
}

const statsLoading = ref(false)

const recentProjects = ref<any[]>([])
const projectsLoading = ref(false)

const createNewExhibition = () => {
  router.push('/create')
}

const viewTemplates = () => {
  router.push('/templates')
}

const viewAllProjects = () => {
  router.push('/projects')
}

const viewProject = (id: string) => {
  router.push(`/results/${id}`)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 格式化预算显示
const formatBudget = (budget: number, currency: string) => {
  return budget.toLocaleString()
}

// 加载最近项目
const loadRecentProjects = async () => {
  projectsLoading.value = true
  try {
    const data = await exhibitionAPI.getProjects(3, 0)
    recentProjects.value = data.map(project => ({
      id: project.id,
      title: project.title,
      theme: project.theme,
      status: project.status,
      progress: project.status === 'completed' ? 100 : project.status === 'running' ? 60 : 0,
      createdAt: project.created_at,
      budget: formatBudget(project.budget_total, project.budget_currency),
      currency: project.budget_currency
    }))
  } catch (error) {
    console.error('加载最近项目失败:', error)
    ElMessage.error('加载最近项目失败')
  } finally {
    projectsLoading.value = false
  }
}

// 加载统计数据
const loadStats = async () => {
  statsLoading.value = true
  try {
    const data = await exhibitionAPI.getProjectStats()
    stats.value = {
      total: data.total,
      completed: data.completed,
      running: data.running,
      pending: data.pending,
      error: data.error,
      agents: 6
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    statsLoading.value = false
  }
}

onMounted(async () => {
  exhibitionStore.initializeApp()
  await Promise.all([
    loadStats(),
    loadRecentProjects()
  ])
})
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  padding: 24px;
}

/* 顶部导航 */
.page-header {
  background: #fff;
  border-radius: 16px;
  padding: 24px 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  animation: slideInDown 0.5s ease-out;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-logo {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.header-logo::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.header-logo:hover::before {
  opacity: 1;
}

.header-logo:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
}

.logo-svg {
  width: 42px;
  height: 42px;
  position: relative;
  z-index: 1;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* 统计卡片 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease-out;
  animation-fill-mode: both;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }
.stat-card:nth-child(5) { animation-delay: 0.5s; }

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-blue .stat-icon {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #2563eb;
}

.stat-green .stat-icon {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #16a34a;
}

.stat-orange .stat-icon {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  color: #ea580c;
}

.stat-purple .stat-icon {
  background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%);
  color: #9333ea;
}

.stat-gray .stat-icon {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
}

.stat-red .stat-icon {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #dc2626;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 4px 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.stat-trend {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;
  font-weight: 600;
  gap: 2px;
}

.stat-trend.positive {
  color: #10b981;
}

.stat-trend.neutral {
  color: #9ca3af;
}

.stat-badge {
  padding: 4px 10px;
  background: linear-gradient(135deg, #d8b4fe 0%, #c084fc 100%);
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.stat-red .stat-badge {
  background: linear-gradient(135deg, #fca5a5 0%, #f87171 100%);
}

/* 3D 展览展示 */
.section-3d {
  margin-bottom: 24px;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

/* 快速操作 */
.quick-actions-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.quick-action-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 0.5s ease-out 0.5s both;
}

.quick-action-card:hover {
  transform: translateY(-2px) translateX(4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.action-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.action-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 2px 0;
}

.action-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.action-arrow {
  color: #9ca3af;
  transition: all 0.3s ease;
}

.quick-action-card:hover .action-arrow {
  color: #3b82f6;
  transform: translateX(4px);
}

/* 主内容区 */
.main-content {
  animation: fadeIn 0.5s ease-out 0.6s both;
}

.panel {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.panel-title .icon {
  color: #3b82f6;
}

/* 项目列表 */
.projects-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px;
}

.project-card {
  padding: 16px;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
}

.project-card:hover {
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.project-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
  padding-right: 8px;
}

.project-theme {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #9ca3af;
}

.project-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
  min-width: 40px;
  text-align: right;
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: #9ca3af;
}

.loading-state p,
.empty-state p {
  margin: 0;
  font-size: 14px;
}

.empty-state {
  color: #6b7280;
}

.empty-state .el-icon {
  color: #d1d5db;
}

/* 动画 */
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 用户信息样式 */
.user-info {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.user-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-dropdown-trigger:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}
</style>
