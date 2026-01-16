import { Request, Response } from 'express'
import { authQueries } from '../../database/auth-queries'
import { createLogger } from '../../utils/logger'

const logger = createLogger('USER_CONTROLLER')

/**
 * 获取用户列表（仅管理员）
 */
export async function getUsers(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    logger.info('获取用户列表', { limit, offset, requestedBy: req.user?.userId })

    const users = authQueries.getUsersList(limit, offset)

    res.json({
      success: true,
      data: users,
      count: users.length
    })
  } catch (error: any) {
    logger.error('获取用户列表失败', error)
    res.status(500).json({
      error: 'Failed to get users',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 获取用户详情（仅管理员）
 */
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params

    logger.info('获取用户详情', { userId: id, requestedBy: req.user?.userId })

    const user = authQueries.getUserById(id)

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: '用户不存在'
      })
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error: any) {
    logger.error('获取用户详情失败', error)
    res.status(500).json({
      error: 'Failed to get user',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 更新用户信息（仅管理员）
 */
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params
    const updates = req.body

    logger.info('更新用户信息', { userId: id, updates, requestedBy: req.user?.userId })

    // 验证用户存在
    const user = authQueries.getUserById(id)
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: '用户不存在'
      })
    }

    // 不允许修改密码
    delete updates.password
    delete updates.password_hash

    authQueries.updateUser(id, updates)

    const updatedUser = authQueries.getUserById(id)

    logger.info('用户信息更新成功', { userId: id })

    res.json({
      success: true,
      data: updatedUser
    })
  } catch (error: any) {
    logger.error('更新用户信息失败', error)
    res.status(500).json({
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 修改用户角色（仅管理员）
 */
export async function updateUserRole(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '无效的角色，必须是 admin 或 user'
      })
    }

    logger.info('修改用户角色', { userId: id, role, requestedBy: req.user?.userId })

    // 验证用户存在
    const user = authQueries.getUserById(id)
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: '用户不存在'
      })
    }

    // 不允许修改自己的角色
    if (id === req.user!.userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '不能修改自己的角色'
      })
    }

    authQueries.updateUserRole(id, role)

    const updatedUser = authQueries.getUserById(id)

    logger.info('用户角色修改成功', { userId: id, role })

    res.json({
      success: true,
      data: updatedUser
    })
  } catch (error: any) {
    logger.error('修改用户角色失败', error)
    res.status(500).json({
      error: 'Failed to update user role',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 修改用户状态（仅管理员）
 */
export async function updateUserStatus(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '无效的状态，必须是 active、inactive 或 suspended'
      })
    }

    logger.info('修改用户状态', { userId: id, status, requestedBy: req.user?.userId })

    // 验证用户存在
    const user = authQueries.getUserById(id)
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: '用户不存在'
      })
    }

    // 不允许修改自己的状态
    if (id === req.user!.userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '不能修改自己的状态'
      })
    }

    authQueries.updateUserStatus(id, status)

    const updatedUser = authQueries.getUserById(id)

    logger.info('用户状态修改成功', { userId: id, status })

    res.json({
      success: true,
      data: updatedUser
    })
  } catch (error: any) {
    logger.error('修改用户状态失败', error)
    res.status(500).json({
      error: 'Failed to update user status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 删除用户（仅管理员）
 */
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params

    logger.info('删除用户', { userId: id, requestedBy: req.user?.userId })

    // 不允许删除自己
    if (id === req.user!.userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '不能删除自己的账户'
      })
    }

    const deleted = authQueries.deleteUser(id)

    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: '用户不存在'
      })
    }

    logger.info('用户删除成功', { userId: id })

    res.json({
      success: true,
      message: '用户已删除'
    })
  } catch (error: any) {
    logger.error('删除用户失败', error)
    res.status(500).json({
      error: 'Failed to delete user',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * 获取用户统计（仅管理员）
 */
export async function getUserStats(req: Request, res: Response) {
  try {
    logger.info('获取用户统计', { requestedBy: req.user?.userId })

    const stats = authQueries.getUserStats()

    logger.info('用户统计获取成功', stats)

    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    logger.error('获取用户统计失败', error)
    res.status(500).json({
      error: 'Failed to get user stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const userController = {
  getUsers,
  getUserById,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUserStats
}
