import { v4 as uuidv4 } from 'uuid'
import { db } from '../../database/schema'
import { jwtService } from './jwt.service'
import { passwordService } from './password.service'
import type { LoginRequest, RegisterRequest, AuthResponse, User, UserWithoutPassword } from '../../types/auth'

/**
 * 认证服务 - 处理用户注册、登录、登出等核心业务逻辑
 */
export class AuthService {
  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // 1. 验证用户名唯一性
    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(data.username)
    if (existingUsername) {
      throw new Error('用户名已存在')
    }

    // 2. 验证邮箱唯一性
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email)
    if (existingEmail) {
      throw new Error('邮箱已被注册')
    }

    // 3. 验证密码强度
    const passwordValidation = passwordService.validateStrength(data.password)
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message)
    }

    // 4. 加密密码
    const password_hash = await passwordService.hash(data.password)

    // 5. 创建用户
    const now = new Date().toISOString()
    const user: User = {
      id: uuidv4(),
      username: data.username,
      email: data.email,
      password_hash,
      full_name: data.full_name,
      role: 'user',
      status: 'active',
      created_at: now,
      updated_at: now
    }

    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, full_name, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.username,
      user.email,
      user.password_hash,
      user.full_name || null,
      user.role,
      user.status,
      user.created_at,
      user.updated_at
    )

    // 6. 生成 tokens
    const tokens = jwtService.generateTokens(user)

    // 7. 保存 refresh_token 到数据库
    this.saveRefreshToken(user.id, tokens.refreshToken)

    // 8. 返回用户信息（排除密码）
    const { password_hash: _, ...userWithoutPassword } = user
    return {
      success: true,
      user: userWithoutPassword,
      tokens
    }
  }

  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    // 1. 查找用户（支持用户名或邮箱登录）
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?')
      .get(data.username, data.username) as User | undefined

    if (!user) {
      throw new Error('用户不存在')
    }

    // 2. 验证密码
    const isValid = await passwordService.verify(data.password, user.password_hash)
    if (!isValid) {
      throw new Error('密码错误')
    }

    // 3. 检查用户状态
    if (user.status !== 'active') {
      throw new Error('账户已被禁用')
    }

    // 4. 更新最后登录时间
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
      .run(new Date().toISOString(), user.id)

    // 5. 生成 tokens
    const tokens = jwtService.generateTokens(user)

    // 6. 保存 refresh_token
    this.saveRefreshToken(user.id, tokens.refreshToken)

    // 7. 返回用户信息（排除密码）
    const { password_hash: _, ...userWithoutPassword } = user
    return {
      success: true,
      user: userWithoutPassword,
      tokens
    }
  }

  /**
   * 刷新 token
   */
  async refreshToken(refreshToken: string) {
    // 1. 验证 refresh_token
    const tokenRecord = db.prepare(`
      SELECT * FROM refresh_tokens
      WHERE token = ? AND revoked_at IS NULL AND expires_at > datetime('now')
    `).get(refreshToken) as any

    if (!tokenRecord) {
      throw new Error('Invalid refresh token')
    }

    // 2. 获取用户信息
    const user = db.prepare('SELECT * FROM users WHERE id = ?')
      .get(tokenRecord.user_id) as User | undefined

    if (!user) {
      throw new Error('User not found')
    }

    // 3. 检查用户状态
    if (user.status !== 'active') {
      throw new Error('账户已被禁用')
    }

    // 4. 生成新 tokens
    const tokens = jwtService.generateTokens(user)

    // 5. 撤销旧 token，保存新 token
    this.revokeRefreshToken(refreshToken)
    this.saveRefreshToken(user.id, tokens.refreshToken)

    return {
      success: true,
      tokens
    }
  }

  /**
   * 用户登出
   */
  async logout(userId: string, refreshToken: string) {
    this.revokeRefreshToken(refreshToken)
    return { success: true }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(userId: string): Promise<UserWithoutPassword> {
    const user = db.prepare('SELECT * FROM users WHERE id = ?')
      .get(userId) as User | undefined

    if (!user) {
      throw new Error('User not found')
    }

    const { password_hash: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // 1. 获取用户
    const user = db.prepare('SELECT * FROM users WHERE id = ?')
      .get(userId) as User | undefined

    if (!user) {
      throw new Error('User not found')
    }

    // 2. 验证旧密码
    const isValid = await passwordService.verify(oldPassword, user.password_hash)
    if (!isValid) {
      throw new Error('原密码错误')
    }

    // 3. 验证新密码强度
    const passwordValidation = passwordService.validateStrength(newPassword)
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message)
    }

    // 4. 加密新密码
    const newPasswordHash = await passwordService.hash(newPassword)

    // 5. 更新密码
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?')
      .run(newPasswordHash, userId)

    // 6. 撤销所有 refresh tokens（强制重新登录）
    this.revokeAllUserTokens(userId)

    return { success: true }
  }

  /**
   * 保存 refresh_token 到数据库
   */
  private saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7天有效期

    db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      userId,
      token,
      expiresAt.toISOString(),
      new Date().toISOString()
    )
  }

  /**
   * 撤销 refresh_token
   */
  private revokeRefreshToken(token: string) {
    db.prepare('UPDATE refresh_tokens SET revoked_at = datetime("now") WHERE token = ?')
      .run(token)
  }

  /**
   * 撤销用户的所有 refresh tokens
   */
  private revokeAllUserTokens(userId: string) {
    db.prepare('UPDATE refresh_tokens SET revoked_at = datetime("now") WHERE user_id = ?')
      .run(userId)
  }
}

export const authService = new AuthService()
