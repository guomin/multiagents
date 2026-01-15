import axios from 'axios'
import type {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  AuthResponse,
  AuthUser,
  AuthTokens
} from '@/types/auth'

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000
})

// 请求拦截器：自动添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：处理 token 过期
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Token 过期，尝试刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken }
          )

          const { accessToken, refreshToken: newRefreshToken } = response.data.tokens

          localStorage.setItem('access_token', accessToken)
          localStorage.setItem('refresh_token', newRefreshToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // 刷新失败，清除 token 并跳转登录
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const authAPI = {
  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  /**
   * 用户登出
   */
  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken })
  },

  /**
   * 刷新 token
   */
  async refreshToken(refreshToken: string): Promise<{ success: boolean; tokens: AuthTokens }> {
    const response = await api.post<{ success: boolean; tokens: AuthTokens }>('/auth/refresh', {
      refreshToken
    })
    return response.data
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<{ success: boolean; user: AuthUser }> {
    const response = await api.get<{ success: boolean; user: AuthUser }>('/auth/me')
    return response.data
  },

  /**
   * 修改密码
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.put<{ success: boolean; message: string }>('/auth/change-password', data)
    return response.data
  },

  // ========== 管理员 API ==========

  /**
   * 获取用户列表（管理员）
   */
  async getUsers(limit = 50, offset = 0): Promise<{ users: AuthUser[] }> {
    const response = await api.get<{ data: AuthUser[]; count: number }>('/auth/users', {
      params: { limit, offset }
    })
    return { users: response.data.data }
  },

  /**
   * 获取用户统计（管理员）
   */
  async getUserStats(): Promise<{ total: number; active: number; admins: number }> {
    const response = await api.get<{ data: { total: number; active: number; admins: number } }>(
      '/auth/users/stats'
    )
    return response.data.data
  },

  /**
   * 修改用户角色（管理员）
   */
  async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    await api.put(`/auth/users/${userId}/role`, { role })
  },

  /**
   * 修改用户状态（管理员）
   */
  async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    await api.put(`/auth/users/${userId}/status`, { status })
  },

  /**
   * 删除用户（管理员）
   */
  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/auth/users/${userId}`)
  }
}

export default api
