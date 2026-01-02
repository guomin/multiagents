<template>
  <div class="project-switcher">
    <ElDropdown trigger="click" @command="handleSelect">
      <div class="switcher-trigger">
        <div class="current-project">
          <ElIcon class="project-icon"><Folder /></ElIcon>
          <span class="project-title">{{ currentProject?.title || '选择项目' }}</span>
        </div>
        <ElIcon class="dropdown-icon"><ArrowDown /></ElIcon>
      </div>
      <template #dropdown>
        <ElDropdownMenu class="project-menu">
          <div class="menu-header">
            <span class="menu-title">最近项目</span>
            <ElButton text size="small" @click="createNew">
              <ElIcon><Plus /></ElIcon>
              新建
            </ElButton>
          </div>
          <ElDivider class="menu-divider" />
          <div class="menu-search">
            <ElInput
              v-model="searchKeyword"
              placeholder="搜索项目..."
              size="small"
              clearable
            >
              <template #prefix>
                <ElIcon><Search /></ElIcon>
              </template>
            </ElInput>
          </div>
          <div class="menu-list">
            <ElDropdownItem
              v-for="project in filteredProjects"
              :key="project.id"
              :command="project.id"
              :class="{ 'is-active': project.id === currentProjectId }"
              class="project-item"
            >
              <div class="project-item-content">
                <div class="project-item-header">
                  <span class="project-item-title">{{ project.title }}</span>
                  <ElTag
                    :type="project.status === 'completed' ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ project.status === 'completed' ? '已完成' : '进行中' }}
                  </ElTag>
                </div>
                <p class="project-item-theme">{{ project.theme }}</p>
                <div class="project-item-meta">
                  <span class="meta-item">
                    <ElIcon><Calendar /></ElIcon>
                    {{ formatDate(project.createdAt) }}
                  </span>
                  <span class="meta-item">
                    <ElIcon><Coin /></ElIcon>
                    {{ project.budget }} {{ project.currency }}
                  </span>
                </div>
              </div>
            </ElDropdownItem>
            <div v-if="filteredProjects.length === 0" class="menu-empty">
              <ElIcon class="empty-icon"><FolderOpened /></ElIcon>
              <p>{{ searchKeyword ? '未找到匹配项目' : '暂无项目' }}</p>
            </div>
          </div>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Folder,
  ArrowDown,
  Plus,
  Search,
  FolderOpened,
  Calendar,
  Coin
} from '@element-plus/icons-vue'

interface Project {
  id: string
  title: string
  theme: string
  status: 'running' | 'completed'
  progress: number
  createdAt: string
  budget: string
  currency: string
}

interface Props {
  projects?: Project[]
  currentProjectId?: string
}

const props = withDefaults(defineProps<Props>(), {
  projects: () => [],
  currentProjectId: ''
})

const emit = defineEmits<{
  select: [projectId: string]
  create: []
}>()

const router = useRouter()
const searchKeyword = ref('')

const currentProject = computed(() => {
  return props.projects.find(p => p.id === props.currentProjectId)
})

const filteredProjects = computed(() => {
  if (!searchKeyword.value) return props.projects

  const keyword = searchKeyword.value.toLowerCase()
  return props.projects.filter(p =>
    p.title.toLowerCase().includes(keyword) ||
    p.theme.toLowerCase().includes(keyword)
  )
})

const handleSelect = (projectId: string) => {
  emit('select', projectId)
}

const createNew = () => {
  emit('create')
  router.push('/create')
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.project-switcher {
  display: inline-block;
}

.switcher-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 280px;
}

.switcher-trigger:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.current-project {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.project-icon {
  font-size: 18px;
  color: #3b82f6;
  flex-shrink: 0;
}

.project-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
}

/* 下拉菜单 */
.project-menu {
  width: 380px;
  max-height: 500px;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.menu-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.menu-divider {
  margin: 0;
}

.menu-search {
  padding: 8px 16px;
}

.menu-list {
  max-height: 350px;
  overflow-y: auto;
  padding: 8px 0;
}

.project-item {
  padding: 0 !important;
}

.project-item.is-active {
  background: #eff6ff;
}

.project-item-content {
  padding: 12px 16px;
  transition: background 0.2s ease;
}

.project-item:hover .project-item-content {
  background: #f9fafb;
}

.project-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
}

.project-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  padding-right: 8px;
}

.project-item-theme {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-item-meta {
  display: flex;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #9ca3af;
}

.menu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.menu-empty p {
  font-size: 13px;
  margin: 0;
}

/* 滚动条 */
.menu-list::-webkit-scrollbar {
  width: 6px;
}

.menu-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.menu-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.menu-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
