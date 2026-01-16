import { Request, Response } from 'express'
import { authService } from '../services/auth.service'
import type { LoginRequest, RegisterRequest, ChangePasswordRequest } from '../../types/auth'
import { createLogger } from '../../utils/logger'

const logger = createLogger('AUTH_CONTROLLER')

/**
 * 用户注册
 */
export async function register(req: Request, res: Response) {
  try {
    const data: RegisterRequest = req.body

    // 验证必填字段
    if (!data.username || !data.email || !data.password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '用户名、邮箱和密码为必填项'
      })
    }

    const result = await authService.register(data)

    logger.info('用户注册成功', { userId: result.user.id, username: result.user.username })

    res.status(201).json(result)
  } catch (error: any) {
    logger.error('用户注册失败', error)
    res.status(400).json({
      error: 'Registration Failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 用户登录
 */
export async function login(req: Request, res: Response) {
  try {
    const data: LoginRequest = req.body

    // 验证必填字段
    if (!data.username || !data.password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '用户名和密码为必填项'
      })
    }

    const result = await authService.login(data)

    logger.info('用户登录成功', { userId: result.user.id, username: result.user.username })

    res.json(result)
  } catch (error: any) {
    logger.warn('用户登录失败', error)
    res.status(401).json({
      error: 'Login Failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 刷新 token
 */
export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'refreshToken 为必填项'
      })
    }

    const result = await authService.refreshToken(refreshToken)

    logger.info('Token 刷新成功')

    res.json(result)
  } catch (error: any) {
    logger.warn('Token 刷新失败', error)
    res.status(401).json({
      error: 'Refresh Failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 用户登出
 */
export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body
    const userId = req.user!.userId

    await authService.logout(userId, refreshToken || '')

    logger.info('用户登出成功', { userId })

    res.json({ success: true })
  } catch (error: any) {
    logger.error('用户登出失败', error)
    res.status(500).json({
      error: 'Logout Failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = req.user!.userId

    const user = await authService.getCurrentUser(userId)

    res.json({ success: true, user })
  } catch (error: any) {
    logger.error('获取用户信息失败', error)
    res.status(404).json({
      error: 'Not Found',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 修改密码
 */
export async function changePassword(req: Request, res: Response) {
  try {
    const userId = req.user!.userId
    const data: ChangePasswordRequest = req.body

    // 验证必填字段
    if (!data.oldPassword || !data.newPassword) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '原密码和新密码为必填项'
      })
    }

    await authService.changePassword(userId, data.oldPassword, data.newPassword)

    logger.info('用户修改密码成功', { userId })

    res.json({ success: true, message: '密码修改成功' })
  } catch (error: any) {
    logger.error('修改密码失败', error)
    res.status(400).json({
      error: 'Change Password Failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const authController = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword
}
