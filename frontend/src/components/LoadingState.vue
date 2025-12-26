<template>
  <div class="loading-container">
    <div class="loading-content">
      <!-- 智能体图标动画 -->
      <div class="agents-animation">
        <div
          v-for="(agent, index) in agents"
          :key="agent.id"
          class="agent-orb"
          :class="agent.status"
          :style="{ animationDelay: `${index * 0.2}s` }"
        >
          <ElIcon class="text-2xl">
            <component :is="agent.icon" />
          </ElIcon>
        </div>
      </div>

      <!-- 加载文字 -->
      <div class="loading-text">
        <h3 class="text-2xl font-bold text-gradient mb-2">{{ title }}</h3>
        <p class="text-gray-600 text-lg">{{ subtitle }}</p>
        <div class="loading-dots mt-4">
          <span>智能体正在</span>
          <span class="inline-block">{{ actionText }}</span>
          <span class="loading-dots-text">...</span>
        </div>
      </div>

      <!-- 进度条 -->
      <div v-if="showProgress" class="progress-container">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="progress-text">{{ progress }}%</div>
      </div>

      <!-- 状态指示器 -->
      <div class="status-indicators">
        <div
          v-for="status in statuses"
          :key="status.name"
          class="status-item"
          :class="{ active: status.active, completed: status.completed }"
        >
          <div class="status-dot">
            <ElIcon v-if="status.completed" class="text-green-500"><Check /></ElIcon>
            <div v-else-if="status.active" class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div v-else class="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
          <span class="status-label">{{ status.name }}</span>
        </div>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="decoration-orb orb-1"></div>
      <div class="decoration-orb orb-2"></div>
      <div class="decoration-orb orb-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Document,
  Location,
  Monitor,
  Cpu,
  Wallet,
  Setting,
  Check,
  Loading,
  Timer
} from '@element-plus/icons-vue'

interface Props {
  title?: string
  subtitle?: string
  action?: string
  showProgress?: boolean
  progress?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '多智能体设计中',
  subtitle: '我们的AI团队正在为您创建完美的展陈方案',
  action: '设计',
  showProgress: true,
  progress: 0
})

const agents = [
  { id: 'curator', name: '策划智能体', status: 'running', icon: Document },
  { id: 'spatial', name: '空间设计', status: 'pending', icon: Location },
  { id: 'visual', name: '视觉设计', status: 'pending', icon: Monitor },
  { id: 'interactive', name: '互动技术', status: 'pending', icon: Cpu },
  { id: 'budget', name: '预算控制', status: 'pending', icon: Wallet },
  { id: 'supervisor', name: '协调主管', status: 'pending', icon: Setting }
]

const actionText = ref(props.action)
const actionTexts = [props.action, '创作', '计算', '优化', '完善']
let actionIndex = 0

// 状态指示器
const statuses = ref([
  { name: '需求分析', active: false, completed: false },
  { name: '概念策划', active: false, completed: false },
  { name: '空间设计', active: false, completed: false },
  { name: '视觉设计', active: false, completed: false },
  { name: '技术方案', active: false, completed: false },
  { name: '预算优化', active: false, completed: false }
])

// 动态切换动作文字
onMounted(() => {
  setInterval(() => {
    actionIndex = (actionIndex + 1) % actionTexts.length
    actionText.value = actionTexts[actionIndex]
  }, 2000)
})
</script>

<style scoped>
.loading-container {
  @apply relative min-h-[400px] flex items-center justify-center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.loading-content {
  @apply relative z-10 text-center;
  max-width: 500px;
  padding: 2rem;
}

.agents-animation {
  @apply flex justify-center items-center space-x-4 mb-8;
}

.agent-orb {
  @apply w-12 h-12 rounded-full flex items-center justify-center text-white;
  transition: all 0.3s ease;
}

.agent-orb.running {
  background: linear-gradient(135deg, #667eea, #764ba2);
  animation: pulse-glow 2s ease-in-out infinite, float 3s ease-in-out infinite;
}

.agent-orb.pending {
  background: linear-gradient(135deg, #e5e7eb, #9ca3af);
  animation: float 3s ease-in-out infinite;
}

.loading-text {
  @apply mb-8;
}

.loading-dots-text {
  @apply inline-block;
  animation: loading-dots 1.5s infinite;
}

.progress-container {
  @apply flex items-center justify-center space-x-4 mb-8;
}

.progress-bar {
  @apply flex-1 max-w-xs h-3 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-gradient-to-r from-blue-400 to-purple-600 rounded-full transition-all duration-1000 ease-out;
}

.progress-text {
  @apply text-sm font-medium text-gray-600 w-12;
}

.status-indicators {
  @apply flex flex-col space-y-2 max-w-xs mx-auto;
}

.status-item {
  @apply flex items-center space-x-3 py-1 px-3 rounded-lg transition-all duration-300;
}

.status-item.active {
  @apply bg-blue-50 text-blue-700;
}

.status-item.completed {
  @apply bg-green-50 text-green-700;
}

.status-dot {
  @apply w-6 h-6 flex items-center justify-center;
}

.status-label {
  @apply text-sm font-medium;
}

.background-decoration {
  @apply absolute inset-0 overflow-hidden;
  pointer-events: none;
}

.decoration-orb {
  @apply absolute rounded-full opacity-20;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.orb-1 {
  @apply w-64 h-64 -top-32 -right-32;
  animation: float 8s ease-in-out infinite;
}

.orb-2 {
  @apply w-48 h-48 -bottom-24 -left-24;
  animation: float 6s ease-in-out infinite reverse;
}

.orb-3 {
  @apply w-32 h-32 top-1/2 -right-16;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(102, 126, 234, 0.5); }
  50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.8), 0 0 50px rgba(102, 126, 234, 0.4); }
}

@keyframes loading-dots {
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
  100% { content: ''; }
}
</style>