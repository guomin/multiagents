// 认证相关类型定义

export interface User {
  id: string
  username: string
  email: string
  password_hash: string
  full_name?: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'suspended'
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface UserWithoutPassword {
  id: string
  username: string
  email: string
  full_name?: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'suspended'
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface RefreshToken {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
  revoked_at?: string
}

export interface JWTPayload {
  userId: string
  username: string
  email: string
  role: string
  iat?: number
  exp?: number
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

export interface AuthResponse {
  success: boolean
  user: UserWithoutPassword
  tokens: AuthTokens
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}
