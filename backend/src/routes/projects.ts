import { Router } from 'express'
import { projectQueries, workflowQueries, designResultQueries, agentExecutionQueries } from '../database/queries'
import { createLogger } from '../utils/logger'
import { optionalAuthenticate } from '../auth/middleware/auth.middleware'

const router = Router()
const logger = createLogger('PROJECTS-API')

// 获取所有项目列表
router.get('/', optionalAuthenticate, (req, res) => {
  const startTime = Date.now()

  try {
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0
    const status = req.query.status as string

    logger.info('获取项目列表', { limit, offset, status, userId: req.user?.userId })

    let projects
    if (status) {
      // 如果有状态过滤，暂时使用原有方法（可以考虑添加用户过滤）
      projects = projectQueries.getByStatus(status)
    } else {
      // 根据是否登录返回不同的数据
      if (req.user) {
        // 已登录：返回用户自己的项目 + 公开项目（user_id IS NULL）
        projects = projectQueries.getAllForUser(req.user.userId, limit, offset)
      } else {
        // 未登录：返回所有项目（向后兼容）
        projects = projectQueries.getAll(limit, offset)
      }
    }

    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

    logger.info('项目列表获取成功', { count: projects.length })

    res.json({
      success: true,
      data: projects,
      count: projects.length
    })
  } catch (error) {
    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)
    logger.error('获取项目列表失败', error as Error)
    res.status(500).json({
      success: false,
      error: 'Failed to get projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 获取项目统计
router.get('/stats', (req, res) => {
  try {
    logger.info('获取项目统计')

    const stats = projectQueries.getStats()

    logger.info('项目统计获取成功', stats)

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('获取项目统计失败', error as Error)
    res.status(500).json({
      success: false,
      error: 'Failed to get project stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 获取单个项目详情（包含工作流和结果）
router.get('/:id', optionalAuthenticate, (req, res) => {
  const startTime = Date.now()

  try {
    const { id } = req.params

    logger.info('获取项目详情', { projectId: id, userId: req.user?.userId })

    let project
    if (req.user) {
      // 已登录：只能访问用户自己的项目或公开项目
      project = projectQueries.getByIdForUser(id, req.user.userId)
    } else {
      // 未登录：可以访问所有项目（向后兼容）
      project = projectQueries.getById(id)
    }

    if (!project) {
      logger.warn('项目不存在或无权访问', { projectId: id, userId: req.user?.userId })
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      })
    }

    // 获取工作流
    const workflows = workflowQueries.getByProjectId(id)

    // 获取最新的工作流（如果有）
    let latestWorkflow = null
    let agentExecutions: any[] = []
    let designResults: any[] = []

    if (workflows.length > 0) {
      latestWorkflow = workflows[0]
      agentExecutions = agentExecutionQueries.getByWorkflowId(latestWorkflow.id)
      designResults = designResultQueries.getByWorkflowId(latestWorkflow.id)
    }

    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

    logger.info('项目详情获取成功', { projectId: id })

    res.json({
      success: true,
      data: {
        project,
        workflow: latestWorkflow,
        agentExecutions,
        designResults
      }
    })
  } catch (error) {
    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)
    logger.error('获取项目详情失败', error as Error, { projectId: req.params.id })
    res.status(500).json({
      success: false,
      error: 'Failed to get project details',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 删除项目
router.delete('/:id', optionalAuthenticate, (req, res) => {
  const startTime = Date.now()

  try {
    const { id } = req.params

    logger.info('删除项目', { projectId: id, userId: req.user?.userId })

    if (req.user) {
      // 已登录：只能删除用户自己的项目
      const deleted = projectQueries.deleteForUser(id, req.user.userId)
      if (!deleted) {
        logger.warn('项目不存在或无权删除', { projectId: id, userId: req.user.userId })
        return res.status(404).json({
          success: false,
          error: 'Project not found or unauthorized'
        })
      }
    } else {
      // 未登录：可以删除任何项目（向后兼容，但生产环境应该禁止）
      const project = projectQueries.getById(id)
      if (!project) {
        logger.warn('项目不存在', { projectId: id })
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        })
      }
      projectQueries.delete(id)
    }

    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

    logger.info('项目删除成功', { projectId: id })

    res.json({
      success: true,
      message: 'Project deleted successfully'
    })
  } catch (error) {
    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)
    logger.error('删除项目失败', error as Error, { projectId: req.params.id })
    res.status(500).json({
      success: false,
      error: 'Failed to delete project',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 获取项目的工作流列表
router.get('/:id/workflows', (req, res) => {
  try {
    const { id } = req.params

    logger.info('获取项目工作流', { projectId: id })

    const workflows = workflowQueries.getByProjectId(id)

    logger.info('项目工作流获取成功', { projectId: id, count: workflows.length })

    res.json({
      success: true,
      data: workflows
    })
  } catch (error) {
    logger.error('获取项目工作流失败', error as Error, { projectId: req.params.id })
    res.status(500).json({
      success: false,
      error: 'Failed to get project workflows',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export { router as projectsAPI }

// 导入响应时间监控器
import { responseTimeMonitor } from '../utils/performance-monitor'
