import { Request, Response, NextFunction } from 'express'
import { createLogger } from '../utils/logger'
import { v4 as uuidv4 } from 'uuid'

const logger = createLogger('HTTP')

// 请求日志接口
export interface RequestLogEntry {
  requestId: string
  method: string
  url: string
  originalUrl: string
  query: any
  params: any
  headers: Record<string, string>
  userAgent?: string
  ip: string
  startTime: Date
  endTime?: Date
  duration?: number
  statusCode?: number
  responseSize?: number
  error?: string
}

// 存储请求日志的内存结构（生产环境应使用数据库）
const requestLogs: Map<string, RequestLogEntry> = new Map()

// 清理旧日志的定时任务
setInterval(() => {
  const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24小时前
  for (const [requestId, log] of requestLogs.entries()) {
    if (log.startTime.getTime() < cutoffTime) {
      requestLogs.delete(requestId)
    }
  }
}, 60 * 60 * 1000) // 每小时清理一次

// 获取客户端IP地址
function getClientIP(req: Request): string {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    'unknown'
  )
}

// 获取请求头信息
function getRequestHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {}

  // 只记录重要的请求头，避免记录敏感信息
  const importantHeaders = [
    'content-type',
    'accept',
    'user-agent',
    'referer',
    'origin',
    'x-forwarded-for',
    'x-real-ip'
  ]

  importantHeaders.forEach(header => {
    const value = req.get(header)
    if (value) {
      headers[header] = value
    }
  })

  return headers
}

// 过滤敏感信息
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body
  }

  const sensitiveFields = [
    'password',
    'token',
    'key',
    'secret',
    'apikey',
    'authorization',
    'auth'
  ]

  const sanitized = { ...body }

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***'
    }
  })

  return sanitized
}

// 请求日志中间件
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4()
  const startTime = new Date()

  // 生成请求ID并添加到请求对象
  req.id = requestId

  // 创建请求日志条目
  const logEntry: RequestLogEntry = {
    requestId,
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    query: req.query,
    params: req.params,
    headers: getRequestHeaders(req),
    userAgent: req.get('User-Agent'),
    ip: getClientIP(req),
    startTime
  }

  // 存储请求日志
  requestLogs.set(requestId, logEntry)

  // 记录请求开始
  logger.info(`请求开始: ${req.method} ${req.originalUrl}`, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: logEntry.ip,
    userAgent: logEntry.userAgent,
    query: req.query,
    params: req.params,
    body: sanitizeRequestBody(req.body)
  })

  // 监听响应完成事件
  res.on('finish', () => {
    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()

    // 更新请求日志
    logEntry.endTime = endTime
    logEntry.duration = duration
    logEntry.statusCode = res.statusCode
    logEntry.responseSize = res.get('content-length') ? parseInt(res.get('content-length')!) : undefined

    // 记录请求完成
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info'
    logger[logLevel](`请求完成: ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`, {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      responseSize: logEntry.responseSize,
      ip: logEntry.ip
    })

    // 如果是错误状态码，记录额外的错误信息
    if (res.statusCode >= 400) {
      logger.warn(`HTTP错误响应`, {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        ip: logEntry.ip,
        userAgent: logEntry.userAgent
      })
    }
  })

  // 监听响应关闭事件（客户端断开连接）
  res.on('close', () => {
    if (!res.finished) {
      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      logEntry.endTime = endTime
      logEntry.duration = duration
      logEntry.error = 'Connection closed by client'

      logger.warn(`请求被客户端中断: ${req.method} ${req.originalUrl} (${duration}ms)`, {
        requestId,
        method: req.method,
        url: req.originalUrl,
        duration,
        ip: logEntry.ip
      })
    }
  })

  next()
}

// 错误日志中间件
export function errorLogger(error: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = req.id || 'unknown'

  logger.error(`请求处理错误: ${req.method} ${req.originalUrl}`, error, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: getClientIP(req),
    userAgent: req.get('User-Agent'),
    query: req.query,
    params: req.params,
    body: sanitizeRequestBody(req.body),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  })

  // 如果响应还未发送，发送错误响应
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      requestId,
      timestamp: new Date().toISOString()
    })
  }

  next(error)
}

// 获取请求日志
export function getRequestLogs(limit: number = 100): RequestLogEntry[] {
  const logs = Array.from(requestLogs.values())
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, limit)

  return logs
}

// 获取特定请求日志
export function getRequestLog(requestId: string): RequestLogEntry | undefined {
  return requestLogs.get(requestId)
}

// 获取统计信息
export function getRequestStats(): {
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  statusCodes: Record<string, number>
  topEndpoints: Array<{ path: string; count: number; avgTime: number }>
} {
  const logs = Array.from(requestLogs.values()).filter(log => log.duration !== undefined)

  const totalRequests = logs.length
  const averageResponseTime = totalRequests > 0
    ? logs.reduce((sum, log) => sum + (log.duration || 0), 0) / totalRequests
    : 0

  const errorCount = logs.filter(log => (log.statusCode || 0) >= 400).length
  const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0

  // 统计状态码
  const statusCodes: Record<string, number> = {}
  logs.forEach(log => {
    const code = (log.statusCode || 0).toString()
    statusCodes[code] = (statusCodes[code] || 0) + 1
  })

  // 统计热门接口
  const endpointStats: Record<string, { count: number; totalTime: number }> = {}
  logs.forEach(log => {
    const path = log.originalUrl.split('?')[0]
    if (!endpointStats[path]) {
      endpointStats[path] = { count: 0, totalTime: 0 }
    }
    endpointStats[path].count++
    endpointStats[path].totalTime += log.duration || 0
  })

  const topEndpoints = Object.entries(endpointStats)
    .map(([path, stats]) => ({
      path,
      count: stats.count,
      avgTime: stats.totalTime / stats.count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalRequests,
    averageResponseTime,
    errorRate,
    statusCodes,
    topEndpoints
  }
}

// 清理请求日志
export function clearRequestLogs() {
  requestLogs.clear()
  logger.info('请求日志已清理')
}

// 导出请求日志
export function exportRequestLogs(format: 'json' | 'csv' = 'json'): string {
  const logs = Array.from(requestLogs.values())
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

  if (format === 'csv') {
    const headers = [
      'Request ID', 'Method', 'URL', 'Status Code', 'Duration (ms)',
      'IP Address', 'User Agent', 'Start Time', 'End Time'
    ]

    const rows = logs.map(log => [
      log.requestId,
      log.method,
      log.url,
      log.statusCode || '',
      log.duration || '',
      log.ip,
      log.userAgent || '',
      log.startTime.toISOString(),
      log.endTime?.toISOString() || ''
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  return JSON.stringify(logs, null, 2)
}

// 扩展Request接口以包含requestId
declare global {
  namespace Express {
    interface Request {
      id?: string
    }
  }
}