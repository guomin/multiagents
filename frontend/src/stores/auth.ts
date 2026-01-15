import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI, type AuthUser } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // ========== 状态 ==========
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ========== 计算属性 ==========
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // ========== 初始化 ==========
  function initialize() {
    const storedAccessToken = localStorage.getItem('access_token')
    const storedRefreshToken = localStorage.getItem('refresh_token')
    const storedUser = localStorage.getItem('user')

    if (storedAccessToken && storedRefreshToken && storedUser) {
      try {
        accessToken.value = storedAccessToken
        refreshToken.value = storedRefreshToken
        user.value = JSON.parse(storedUser)
      } catch (err) {
        console.error('Failed to parse stored user:', err)
        clearLocalStorage()
      }
    }
  }

  // ========== LocalStorage 操作 ==========
  function saveToLocalStorage() {
    if (accessToken.value) {
      localStorage.setItem('access_token', accessToken.value)
    }
    if (refreshToken.value) {
      localStorage.setItem('refresh_token', refreshToken.value)
    }
    if (user.value) {
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  function clearLocalStorage() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  // ========== 注册 ==========
  async function register(data: {
    username: string
    email: string
    password: string
    full_name?: string
  }) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.register(data)

      user.value = response.user
      accessToken.value = response.tokens.accessToken
      refreshToken.value = response.tokens.refreshToken

      saveToLocalStorage()

      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || '注册失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ========== 登录 ==========
  async function login(data: { username: string; password: string }) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.login(data)

      user.value = response.user
      accessToken.value = response.tokens.accessToken
      refreshToken.value = response.tokens.refreshToken

      saveToLocalStorage()

      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || '登录失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ========== 登出 ==========
  async function logout() {
    try {
      if (refreshToken.value) {
        await authAPI.logout(refreshToken.value)
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      accessToken.value = null
      refreshToken.value = null
      clearLocalStorage()
    }
  }

  // ========== 刷新 token ==========
  async function refreshTokens() {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await authAPI.refreshToken(refreshToken.value)

      accessToken.value = response.tokens.accessToken
      refreshToken.value = response.tokens.refreshToken

      saveToLocalStorage()

      return response
    } catch (err) {
      // 刷新失败，自动登出
      await logout()
      throw err
    }
  }

  // ========== 获取当前用户信息 ==========
  async function fetchCurrentUser() {
    if (!isAuthenticated.value) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.getCurrentUser()
      user.value = response.user
      saveToLocalStorage()
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取用户信息失败'
      // 如果 401，可能是 token 过期
      if (err.response?.status === 401) {
        await logout()
      }
    } finally {
      isLoading.value = false
    }
  }

  // ========== 修改密码 ==========
  async function changePassword(data: { oldPassword: string; newPassword: string }) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.changePassword(data)

      // 修改密码成功后，需要重新登录
      await logout()

      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || '修改密码失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 状态
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,

    // 计算属性
    isAuthenticated,
    isAdmin,

    // 方法
    initialize,
    register,
    login,
    logout,
    refreshTokens,
    fetchCurrentUser,
    changePassword
  }
})
