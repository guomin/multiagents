import { Request, Response, NextFunction } from 'express'
import { createLogger } from '../../utils/logger'

const logger = createLogger('AUTH')

/**
 * 角色授权中间件
 * @param allowedRoles 允许访问的角色列表
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. 检查是否已认证
    if (!req.user) {
      logger.warn('未授权访问：缺少认证信息')
      return res.status(401).json({
        error: 'Unauthorized',
        message: '需要先登录'
      })
    }

    // 2. 检查角色权限
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('权限不足', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      })
      return res.status(403).json({
        error: 'Forbidden',
        message: '权限不足，需要以下角色之一：' + allowedRoles.join(', ')
      })
    }

    logger.info('权限验证通过', {
      userId: req.user.userId,
      userRole: req.user.role,
      allowedRoles
    })

    next()
  }
}

/**
 * 检查资源所有权
 * @param getResourceUserId 函数：从请求中获取资源所有者的 userId
 */
export function checkOwnership(getResourceUserId: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. 检查是否已认证
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '需要先登录'
      })
    }

    // 2. 管理员可以访问所有资源
    if (req.user.role === 'admin') {
      return next()
    }

    // 3. 检查资源所有权
    const resourceUserId = getResourceUserId(req)
    if (!resourceUserId) {
      return res.status(404).json({
        error: 'Not Found',
        message: '资源不存在'
      })
    }

    if (resourceUserId !== req.user.userId) {
      logger.warn('访问他人资源被拒绝', {
        requesterUserId: req.user.userId,
        resourceUserId
      })
      return res.status(403).json({
        error: 'Forbidden',
        message: '无权访问此资源'
      })
    }

    next()
  }
}
