<template>
  <div class="user-management-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <ElIcon><User /></ElIcon>
          用户管理
        </h1>
        <p class="page-subtitle">管理系统用户和权限</p>
      </div>
      <ElButton type="primary" @click="fetchUsers">
        <ElIcon style="margin-right: 6px"><Refresh /></ElIcon>
        刷新
      </ElButton>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <ElIcon :size="32"><User /></ElIcon>
        </div>
        <div class="stat-content">
          <p class="stat-label">总用户数</p>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <ElIcon :size="32"><CircleCheck /></ElIcon>
        </div>
        <div class="stat-content">
          <p class="stat-label">活跃用户</p>
          <p class="stat-value">{{ stats.active }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <ElIcon :size="32"><Medal /></ElIcon>
        </div>
        <div class="stat-content">
          <p class="stat-label">管理员</p>
          <p class="stat-value">{{ stats.admins }}</p>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <ElCard class="user-table-card">
      <ElTable :data="users" v-loading="loading" stripe>
        <ElTableColumn prop="username" label="用户名" width="150" />
        <ElTableColumn prop="email" label="邮箱" width="200" />
        <ElTableColumn prop="full_name" label="姓名" width="150">
          <template #default="{ row }">
            {{ row.full_name || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="role" label="角色" width="120">
          <template #default="{ row }">
            <ElTag :type="row.role === 'admin' ? 'danger' : 'primary'" size="small">
              {{ row.role === 'admin' ? '管理员' : '普通用户' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="120">
          <template #default="{ row }">
            <ElTag
              :type="row.status === 'active' ? 'success' : row.status === 'inactive' ? 'info' : 'warning'"
              size="small"
            >
              {{ row.status === 'active' ? '正常' : row.status === 'inactive' ? '未激活' : '已禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="last_login_at" label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.last_login_at ? formatDate(row.last_login_at) : '从未登录' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ElButton
              v-if="row.id !== authStore.user?.id"
              type="primary"
              size="small"
              @click="handleEditRole(row)"
            >
              修改角色
            </ElButton>
            <ElButton
              v-if="row.id !== authStore.user?.id"
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </ElButton>
            <ElButton
              v-if="row.id !== authStore.user?.id"
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </ElButton>
            <ElTag v-else type="info" size="small">当前用户</ElTag>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 修改角色对话框 -->
    <ElDialog
      v-model="roleDialogVisible"
      title="修改用户角色"
      width="400px"
    >
      <ElForm :model="roleForm" label-width="80px">
        <ElFormItem label="当前用户">
          <ElInput :value="currentUser?.username" disabled />
        </ElFormItem>
        <ElFormItem label="当前角色">
          <ElTag :type="currentUser?.role === 'admin' ? 'danger' : 'primary'">
            {{ currentUser?.role === 'admin' ? '管理员' : '普通用户' }}
          </ElTag>
        </ElFormItem>
        <ElFormItem label="新角色">
          <ElSelect v-model="roleForm.role" placeholder="请选择角色">
            <ElOption label="普通用户" value="user" />
            <ElOption label="管理员" value="admin" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="roleDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmRoleChange">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  User,
  Refresh,
  CircleCheck,
  Medal
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'

const authStore = useAuthStore()

const loading = ref(false)
const users = ref<any[]>([])
const stats = ref({
  total: 0,
  active: 0,
  admins: 0
})

const roleDialogVisible = ref(false)
const currentUser = ref<any>(null)
const roleForm = reactive({
  role: 'user'
})

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await authAPI.getUsers()
    users.value = response.users
    await fetchStats()
    ElMessage.success('用户列表获取成功')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 获取用户统计
const fetchStats = async () => {
  try {
    const response = await authAPI.getUserStats()
    stats.value = response
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 修改角色
const handleEditRole = (user: any) => {
  currentUser.value = user
  roleForm.role = user.role
  roleDialogVisible.value = true
}

const confirmRoleChange = async () => {
  try {
    await authAPI.updateUserRole(currentUser.value.id, roleForm.role)
    ElMessage.success('角色修改成功')
    roleDialogVisible.value = false
    await fetchUsers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '角色修改失败')
  }
}

// 切换用户状态
const handleToggleStatus = async (user: any) => {
  const newStatus = user.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(
      `确定要${action}用户 ${user.username} 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await authAPI.updateUserStatus(user.id, newStatus)
    ElMessage.success(`${action}成功`)
    await fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

// 删除用户
const handleDelete = async (user: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 ${user.username} 吗？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await authAPI.deleteUser(user.id)
    ElMessage.success('删除成功')
    await fetchUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-label {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.stat-value {
  margin: 4px 0 0 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.user-table-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
