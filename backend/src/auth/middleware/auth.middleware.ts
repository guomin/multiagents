import { Request, Response, NextFunction } from 'express'
import { jwtService } from '../services/jwt.service'
import { createLogger } from '../../utils/logger'

const logger = createLogger('AUTH')

// 扩展 Express Request 接口
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        username: string
        email: string
        role: string
      }
    }
  }
}

/**
 * 强制认证中间件 - 必须提供有效 token
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. 从 Authorization header 获取 token
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      })
    }

    const token = authHeader.substring(7) // 去掉 'Bearer '

    // 2. 验证 token
    const payload = jwtService.verifyAccessToken(token)

    // 3. 将用户信息附加到请求对象
    req.user = {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      role: payload.role
    }

    logger.info('用户认证成功', { userId: payload.userId, username: payload.username })
    next()
  } catch (error: any) {
    logger.warn('Token 验证失败', { error: error.message })
    res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Invalid or expired token'
    })
  }
}

/**
 * 可选认证中间件 - 不强制要求 token
 * 如果提供了 token 则验证，没有则继续执行
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const payload = jwtService.verifyAccessToken(token)
      req.user = {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role
      }
      logger.info('用户认证成功（可选）', { userId: payload.userId, username: payload.username })
    }
  } catch (error) {
    // 静默失败，继续执行
    logger.debug('可选认证失败，继续执行', { error: (error as Error).message })
  }

  next()
}
