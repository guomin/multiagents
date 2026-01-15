// 前端认证相关类型定义

export interface AuthUser {
  id: string
  username: string
  email: string
  full_name?: string
  role: 'admin' | 'user'
  status: string
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  full_name?: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface AuthResponse {
  success: boolean
  user: AuthUser
  tokens: AuthTokens
}
