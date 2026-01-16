<template>
  <div class="login-container">
    <el-card class="login-card" shadow="always">
      <div class="card-header">
        <div class="logo-icon">
          <el-icon :size="28"><User /></el-icon>
        </div>
        <h2>欢迎回来</h2>
        <p class="subtitle">登录到展陈设计多智能体系统</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            size="large"
            placeholder="用户名或邮箱"
            :prefix-icon="User"
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            size="large"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item class="login-button-item">
          <el-button
            type="primary"
            size="large"
            :loading="authStore.isLoading"
            @click="handleLogin"
            class="login-button"
          >
            <span v-if="!authStore.isLoading">登录</span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form-item>

        <div class="form-footer">
          <span class="form-footer-text">还没有账号？</span>
          <router-link to="/register" class="register-link">立即注册</router-link>
        </div>
      </el-form>

      <transition name="el-zoom-in-top">
        <el-alert
          v-if="authStore.error"
          :title="authStore.error"
          type="error"
          :closable="false"
          class="error-alert"
        />
      </transition>
    </el-card>

    <div class="footer-text">© 2025 展陈设计多智能体系统</div>
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
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 登录卡片 */
.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 0.98);
  position: relative;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 卡片头部 */
.card-header {
  text-align: center;
  margin-bottom: 36px;
  padding: 24px 32px 16px;
}

.logo-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.card-header h2 {
  margin: 0 0 10px 0;
  font-size: 32px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: #8a8a8a;
  font-size: 14px;
  font-weight: 400;
}

/* 表单样式 */
.login-form {
  padding: 0 32px 32px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 6px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.25s ease;
  background: #f9f9f9;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  background: #f5f5f5;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  background: #ffffff;
}

.login-form :deep(.el-input__inner) {
  font-size: 15px;
  color: #1a1a1a;
}

/* 登录按钮 */
.login-button-item {
  margin-bottom: 20px;
  margin-top: 10px;
}

.login-button {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.login-button:active {
  transform: translateY(0);
}

/* 表单底部 */
.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding-top: 10px;
  font-size: 14px;
  width: 100%;
}

.form-footer-text {
  color: #606266;
}

.register-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.register-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* 错误提示 */
.error-alert {
  margin-top: 20px;
  border-radius: 8px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

/* 底部版权 */
.footer-text {
  margin-top: 30px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  text-align: center;
  position: relative;
  z-index: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 15px;
  }

  .login-card {
    max-width: 100%;
  }

  .card-header {
    padding: 20px 24px 12px;
  }

  .card-header h2 {
    font-size: 28px;
  }

  .subtitle {
    font-size: 13px;
  }

  .login-form {
    padding: 0 24px 24px;
  }
}

@media (max-width: 480px) {
  .login-card {
    border-radius: 12px;
  }

  .card-header {
    padding: 16px 20px 12px;
    margin-bottom: 28px;
  }

  .logo-icon {
    width: 48px;
    height: 48px;
  }

  .logo-icon :deep(.el-icon) {
    font-size: 24px;
  }

  .card-header h2 {
    font-size: 26px;
  }

  .login-form {
    padding: 0 20px 24px;
  }

  .login-form :deep(.el-input__inner) {
    font-size: 14px;
  }

  .login-button {
    height: 46px;
    font-size: 15px;
  }
}
</style>
