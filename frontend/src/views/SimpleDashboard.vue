<template>
  <div class="dashboard-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <ElIcon :size="32"><OfficeBuilding /></ElIcon>
          </div>
          <div class="header-text">
            <h1 class="page-title">展陈设计多智能体系统</h1>
            <p class="page-subtitle">基于 LangGraph 和 DeepSeek 的智能协作平台</p>
          </div>
        </div>
        <div class="header-actions">
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

      <div class="stat-card stat-purple">
        <div class="stat-icon">
          <ElIcon :size="28"><Monitor /></ElIcon>
        </div>
        <div class="stat-content">
          <p class="stat-label">智能体</p>
          <p class="stat-value">{{ stats.agents }}</p>
        </div>
        <div class="stat-badge">全部在线</div>
      </div>
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
      <!-- 智能体状态 -->
      <div class="panel agents-panel">
        <div class="panel-header">
          <h3 class="panel-title">
            <ElIcon class="icon"><Monitor /></ElIcon>
            智能体状态
          </h3>
          <ElTag type="success" size="small">运行正常</ElTag>
        </div>
        <div class="agents-grid">
          <div
            v-for="agent in agents"
            :key="agent.id"
            class="agent-card"
            :class="`agent-${agent.status}`"
          >
            <div class="agent-status-dot" :class="`dot-${agent.status}`"></div>
            <div class="agent-info">
              <h4 class="agent-name">{{ agent.name }}</h4>
              <p class="agent-role">{{ getAgentTypeLabel(agent.type) }}</p>
            </div>
            <div class="agent-icon">
              {{ getAgentStatusIcon(agent.status) }}
            </div>
          </div>
        </div>
      </div>

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
          <div
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
import {
  OfficeBuilding,
  Plus,
  Folder,
  CircleCheck,
  Loading,
  Monitor,
  TrendCharts,
  Minus,
  ArrowRight,
  DocumentCopy,
  Files,
  FolderOpened,
  Calendar,
  Coin
} from '@element-plus/icons-vue'

const router = useRouter()
const exhibitionStore = useExhibitionStore()

const stats = ref({
  total: 12,
  completed: 8,
  running: 3,
  agents: 6
})

const agents = [
  { id: 'curator', name: '策划智能体', type: 'curator', status: 'completed' },
  { id: 'spatial', name: '空间设计智能体', type: 'spatial', status: 'completed' },
  { id: 'visual', name: '视觉设计智能体', type: 'visual', status: 'running' },
  { id: 'interactive', name: '互动技术智能体', type: 'interactive', status: 'pending' },
  { id: 'budget', name: '预算控制智能体', type: 'budget', status: 'pending' },
  { id: 'supervisor', name: '协调主管智能体', type: 'supervisor', status: 'pending' }
]

const recentProjects = [
  {
    id: '1',
    title: '数字艺术的未来',
    theme: '探索人工智能与数字艺术的融合创新',
    status: 'completed',
    progress: 100,
    createdAt: '2024-12-15',
    budget: '500,000',
    currency: 'CNY'
  },
  {
    id: '2',
    title: '科技与生活',
    theme: '展示现代科技如何改变日常生活',
    status: 'completed',
    progress: 100,
    createdAt: '2024-12-10',
    budget: '200,000',
    currency: 'CNY'
  },
  {
    id: '3',
    title: 'AI艺术创作展',
    theme: '人工智能赋能艺术创作的新时代',
    status: 'running',
    progress: 60,
    createdAt: '2024-12-18',
    budget: '300,000',
    currency: 'CNY'
  }
]

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

const getAgentTypeLabel = (type: string) => {
  const labels = {
    curator: '概念策划',
    spatial: '空间设计',
    visual: '视觉设计',
    interactive: '互动技术',
    budget: '预算控制',
    supervisor: '协调主管'
  }
  return labels[type as keyof typeof labels] || type
}

const getAgentStatusIcon = (status: string) => {
  const icons = {
    pending: '⏸️',
    running: '🔄',
    completed: '✅',
    error: '❌'
  }
  return icons[status as keyof typeof icons] || '⏸️'
}

onMounted(() => {
  exhibitionStore.initializeApp()
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

.header-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
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
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  animation: fadeIn 0.5s ease-out 0.6s both;
}

@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
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

/* 智能体网格 */
.agents-grid {
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.agent-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.agent-card:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.agent-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-pending {
  background: #d1d5db;
}

.dot-running {
  background: #3b82f6;
  animation: pulse-dot 2s ease-in-out infinite;
}

.dot-completed {
  background: #10b981;
}

.dot-error {
  background: #ef4444;
}

.agent-info {
  flex: 1;
  min-width: 0;
}

.agent-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 2px 0;
}

.agent-role {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.agent-icon {
  font-size: 20px;
  flex-shrink: 0;
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

@keyframes pulse-dot {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}
</style>
