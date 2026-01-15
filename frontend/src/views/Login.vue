<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>登录</h2>
          <p>展陈设计多智能体系统</p>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名或邮箱"
            :prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="authStore.isLoading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>

        <el-form-item>
          <div class="form-footer">
            <router-link to="/register">还没有账号？立即注册</router-link>
          </div>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="authStore.error"
        :title="authStore.error"
        type="error"
        :closable="false"
        style="margin-top: 20px"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const form = reactive({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

async function handleLogin() {
  try {
    await formRef.value?.validate()

    await authStore.login({
      username: form.username,
      password: form.password
    })

    ElMessage.success('登录成功')

    // 跳转到原路径或首页
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (error: any) {
    console.error('Login error:', error)
    // 错误信息已在 store 中处理
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.card-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.form-footer {
  width: 100%;
  text-align: center;
}

.form-footer a {
  color: #409eff;
  text-decoration: none;
}

.form-footer a:hover {
  text-decoration: underline;
}
</style>
