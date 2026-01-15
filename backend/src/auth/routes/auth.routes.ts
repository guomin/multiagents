import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { userController } from '../controllers/user.controller'
import { authenticate } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'
import { rateLimiter } from '../middleware/rate-limit.middleware'

const router = Router()

/**
 * 认证路由
 * 基础路径: /api/auth
 */

// ========== 公开端点（无需认证） ==========

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 * @rateLimit 3 requests/minute
 */
router.post('/register', rateLimiter(3, 60), authController.register)

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 * @rateLimit 5 requests/minute
 */
router.post('/login', rateLimiter(5, 60), authController.login)

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新 access token
 * @access  Public（需要有效的 refresh token）
 */
router.post('/refresh', authController.refreshToken)

// ========== 认证端点（需要认证） ==========

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout)

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser)

/**
 * @route   PUT /api/auth/change-password
 * @desc    修改密码
 * @access  Private
 */
router.put('/change-password', authenticate, authController.changePassword)

// ========== 管理员端点（需要 admin 角色） ==========

/**
 * @route   GET /api/auth/users
 * @desc    获取用户列表
 * @access  Private (Admin)
 */
router.get('/users', authenticate, authorize('admin'), userController.getUsers)

/**
 * @route   GET /api/auth/users/stats
 * @desc    获取用户统计
 * @access  Private (Admin)
 */
router.get('/users/stats', authenticate, authorize('admin'), userController.getUserStats)

/**
 * @route   GET /api/auth/users/:id
 * @desc    获取用户详情
 * @access  Private (Admin)
 */
router.get('/users/:id', authenticate, authorize('admin'), userController.getUserById)

/**
 * @route   PUT /api/auth/users/:id
 * @desc    更新用户信息
 * @access  Private (Admin)
 */
router.put('/users/:id', authenticate, authorize('admin'), userController.updateUser)

/**
 * @route   PUT /api/auth/users/:id/role
 * @desc    修改用户角色
 * @access  Private (Admin)
 */
router.put('/users/:id/role', authenticate, authorize('admin'), userController.updateUserRole)

/**
 * @route   PUT /api/auth/users/:id/status
 * @desc    修改用户状态
 * @access  Private (Admin)
 */
router.put('/users/:id/status', authenticate, authorize('admin'), userController.updateUserStatus)

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    删除用户
 * @access  Private (Admin)
 */
router.delete('/users/:id', authenticate, authorize('admin'), userController.deleteUser)

export { router as authRoutes }
