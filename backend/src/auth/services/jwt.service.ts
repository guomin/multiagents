import jwt, { SignOptions } from 'jsonwebtoken'
import type { User, JWTPayload, AuthTokens } from '../../types/auth'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-at-least-32-chars'
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m'
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d'

export class JWTService {
  /**
   * 生成访问令牌和刷新令牌
   */
  generateTokens(user: User): AuthTokens {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }

    const accessToken = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY } as SignOptions
    )

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY } as SignOptions
    )

    // 计算过期时间（秒）
    const expiresIn = this.parseExpiration(ACCESS_TOKEN_EXPIRY)

    return {
      accessToken,
      refreshToken,
      expiresIn
    }
  }

  /**
   * 验证访问令牌
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error: any) {
      throw new Error('Invalid or expired access token')
    }
  }

  /**
   * 验证刷新令牌
   */
  verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string }
    } catch (error: any) {
      throw new Error('Invalid or expired refresh token')
    }
  }

  /**
   * 解析过期时间字符串为秒数
   */
  private parseExpiration(expiry: string): number {
    const unit = expiry.slice(-1)
    const value = parseInt(expiry.slice(0, -1))

    switch (unit) {
      case 's': return value
      case 'm': return value * 60
      case 'h': return value * 3600
      case 'd': return value * 86400
      default: return 900 // 默认 15 分钟
    }
  }
}

export const jwtService = new JWTService()
