import { Router } from 'express'
import { logger, LogLevel } from '../utils/logger'
import { agentLogger } from '../utils/agent-logger'
import {
  getRequestLogs,
  getRequestStats,
  exportRequestLogs,
  clearRequestLogs
} from '../middleware/request-logger'
import { performanceMonitor, responseTimeMonitor } from '../utils/performance-monitor'
import { createLogger } from '../utils/logger'

const router = Router()
const logsLogger = createLogger('LOGS-API')

// 获取系统日志
router.get('/system', async (req, res) => {
  try {
    const {
      level = 'INFO',
      count = 100,
      agent,
      category
    } = req.query as {
      level?: string
      count?: string
      agent?: string
      category?: string
    }

    logsLogger.info('获取系统日志请求', { level, count, agent, category })

    let logs: any[] = []

    if (agent) {
      // 获取特定智能体的日志
      const agentHistory = agentLogger.getAgentHistory(agent as string)
      logs = agentHistory.map(entry => ({
        timestamp: entry.startTime,
        level: entry.status === 'error' ? 'ERROR' : 'INFO',
        category: `AGENT-${agent.toUpperCase()}`,
        message: entry.action,
        metadata: {
          duration: entry.duration,
          status: entry.status,
          input: entry.input,
          output: entry.output,
          error: entry.error
        }
      }))
    } else {
      // 获取系统日志
      logs = await logger.getRecentLogs(level as LogLevel, Number(count) || 100)
    }

    // 按类别过滤
    if (category) {
      logs = logs.filter(log => log.category === category)
    }

    res.json({
      success: true,
      data: logs,
      total: logs.length,
      filters: { level, count, agent, category }
    })

  } catch (error) {
    logsLogger.error('获取系统日志失败', error as Error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 获取智能体执行日志
router.get('/agents', (req, res) => {
  try {
    const { agentId } = req.query

    logsLogger.info('获取智能体日志请求', { agentId })

    if (agentId) {
      const history = agentLogger.getAgentHistory(agentId as string)
      res.json({
        success: true,
        data: history,
        agentId
      })
    } else {
      const allStatus = agentLogger.getAllAgentStatus()
      const allLogs = agentLogger.exportLogs()

      res.json({
        success: true,
        data: {
          currentStatus: allStatus,
          logs: allLogs
        }
      })
    }

  } catch (error) {
    logsLogger.error('获取智能体日志失败', error as Error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 获取请求日志
router.get('/requests', (req, res) => {
  try {
    const {
      limit = 100,
      requestId,
      stats
    } = req.query as {
      limit?: string
      requestId?: string
      stats?: string
    }

    logsLogger.info('获取请求日志请求', { limit, requestId, stats })

    if (requestId) {
      const allLogs = getRequestLogs(1000)
      const requestLog = Array.isArray(allLogs) ? allLogs.find((log: any) => log.requestId === requestId) : null
      if (!requestLog) {
        return res.status(404).json({
          success: false,
          error: 'Request not found'
        })
      }
      res.json({
        success: true,
        data: requestLog
      })
    } else if (stats === 'true') {
      const requestStats = getRequestStats()
      const responseTimeStats = responseTimeMonitor.getResponseTimeStats()
      const slowRequests = responseTimeMonitor.getSlowRequests(20)

      res.json({
        success: true,
        data: {
          requestStats,
          responseTimeStats,
          slowRequests
        }
      })
    } else {
      const logs = getRequestLogs(Number(limit) || 100)
      res.json({
        success: true,
        data: logs,
        total: logs.length
      })
    }

  } catch (error) {
    logsLogger.error('获取请求日志失败', error as Error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve request logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 获取性能监控数据
router.get('/performance', (req, res) => {
  try {
    const { history = 'false' } = req.query

    logsLogger.info('获取性能监控数据请求', { history })

    if (history === 'true') {
      const metrics = performanceMonitor.getMetricsHistory()
      res.json({
        success: true,
        data: metrics
      })
    } else {
      const stats = performanceMonitor.getPerformanceStats()
      const thresholds = performanceMonitor.getThresholds()

      res.json({
        success: true,
        data: {
          current: stats.current,
          average: stats.average,
          peak: stats.peak,
          thresholds
        }
      })
    }

  } catch (error) {
    logsLogger.error('获取性能监控数据失败', error as Error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance data',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 导出日志
router.get('/export', async (req, res) => {
  try {
    const {
      type = 'system',
      format = 'json',
      level = 'INFO',
      agent
    } = req.query as {
      type?: string
      format?: string
      level?: string
      agent?: string
    }

    logsLogger.info('导出日志请求', { type, format, level, agent })

    let content: string
    let filename: string
    let contentType: string

    switch (type) {
      case 'requests':
        content = exportRequestLogs(format as 'json' | 'csv')
        filename = `request-logs-${new Date().toISOString().split('T')[0]}.${format}`
        contentType = format === 'csv' ? 'text/csv' : 'application/json'
        break

      case 'agents':
        const agentLogs = agentLogger.exportLogs(agent)
        content = JSON.stringify(agentLogs, null, 2)
        filename = `agent-logs-${new Date().toISOString().split('T')[0]}.json`
        contentType = 'application/json'
        break

      case 'performance':
        const perfStats = performanceMonitor.getPerformanceStats()
        content = JSON.stringify(perfStats, null, 2)
        filename = `performance-stats-${new Date().toISOString().split('T')[0]}.json`
        contentType = 'application/json'
        break

      case 'system':
      default:
        const systemLogs = await logger.getRecentLogs(level as LogLevel, 1000)
        content = JSON.stringify(systemLogs, null, 2)
        filename = `system-logs-${new Date().toISOString().split('T')[0]}.json`
        contentType = 'application/json'
        break
    }

    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', contentType)

    logsLogger.info('日志导出成功', {
      type,
      format,
      filename,
      contentLength: content.length
    })

    res.send(content)

  } catch (error) {
    logsLogger.error('导出日志失败', error as Error)
    res.status(500).json({
      success: false,
      error: 'Failed to export logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 清理日志
router.delete('/clear', (req, res) => {
  try {
    const { type } = req.query as { type?: string }

    logsLogger.info('清理日志请求', { type })

    switch (type) {
      case 'requests':
        clearRequestLogs()
        break

      case 'agents':
        agentLogger.cleanupOldLogs(0) // 清理所有智能体日志
        break

      case 'performance':
        performanceMonitor.clearMetricsHistory()
        responseTimeMonitor.clearResponseTimes()
        break

      default:
        clearRequestLogs()
        agentLogger.cleanupOldLogs(0)
        performanceMonitor.clearMetricsHistory()
        responseTimeMonitor.clearResponseTimes()
    }

    res.json({
      success: true,
      message: `${type || 'all'} logs cleared successfully`
    })

  } catch (error) {
    logsLogger.error('清理日志失败', error as Error)
    res.status(500).json({
      success: false,
      error: 'Failed to clear logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 更新性能监控阈值
router.put('/performance/thresholds', (req, res) => {
  try {
    const thresholds = req.body

    logsLogger.info('更新性能监控阈值', thresholds)

    performanceMonitor.updateThresholds(thresholds)

    res.json({
      success: true,
      message: 'Performance thresholds updated',
      thresholds: performanceMonitor.getThresholds()
    })

  } catch (error) {
    logsLogger.error('更新性能监控阈值失败', error as Error)
    res.status(500).json({
      success: false,
      error: 'Failed to update thresholds',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 获取日志统计信息
router.get('/stats', (req, res) => {
  try {
    const stats = {
      system: {
        logFiles: logger.getLogFiles()
      },
      agents: {
        currentStatus: agentLogger.getAllAgentStatus()
      },
      requests: getRequestStats(),
      performance: {
        current: performanceMonitor.getPerformanceStats().current,
        responseTime: responseTimeMonitor.getResponseTimeStats()
      }
    }

    res.json({
      success: true,
      data: stats
    })

  } catch (error) {
    logsLogger.error('获取日志统计信息失败', error as Error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve log statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export { router as logsAPI }