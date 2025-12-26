import { createLogger } from './logger'

const logger = createLogger('PERFORMANCE')

// 性能指标接口
export interface PerformanceMetrics {
  cpuUsage: {
    user: number
    system: number
    idle: number
    total: number
  }
  memoryUsage: {
    total: number
    free: number
    used: number
    cached: number
    buffers: number
    percentage: number
  }
  heapUsage: {
    total: number
    used: number
    limit: number
    percentage: number
  }
  loadAverage: number[]
  uptime: number
  timestamp: Date
}

// 性能警报阈值
export interface PerformanceThresholds {
  cpuUsage: number      // CPU使用率阈值 (百分比)
  memoryUsage: number   // 内存使用率阈值 (百分比)
  heapUsage: number     // 堆内存使用率阈值 (百分比)
  responseTime: number  // 响应时间阈值 (毫秒)
  errorRate: number     // 错误率阈值 (百分比)
}

// 默认阈值
const defaultThresholds: PerformanceThresholds = {
  cpuUsage: 80,
  memoryUsage: 85,
  heapUsage: 90,
  responseTime: 5000,
  errorRate: 5
}

// 性能监控器
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private thresholds: PerformanceThresholds
  private alertCallbacks: ((metric: PerformanceMetrics, alerts: string[]) => void)[] = []
  private monitoringInterval: NodeJS.Timeout | null = null

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...defaultThresholds, ...thresholds }
  }

  // 启动性能监控
  startMonitoring(intervalMs: number = 30000) {
    if (this.monitoringInterval) {
      logger.warn('性能监控已在运行中')
      return
    }

    logger.info('启动性能监控', { interval: intervalMs })

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
    }, intervalMs)

    // 立即收集一次指标
    this.collectMetrics()
  }

  // 停止性能监控
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      logger.info('性能监控已停止')
    }
  }

  // 收集性能指标
  private collectMetrics() {
    try {
      const metrics = this.getCurrentMetrics()
      this.metrics.push(metrics)

      // 保留最近1000条记录
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000)
      }

      // 检查性能警报
      const alerts = this.checkAlerts(metrics)
      if (alerts.length > 0) {
        logger.warn('性能警报', { metrics, alerts })
        this.notifyAlerts(metrics, alerts)
      }

      // 记录性能指标（调试级别）
      logger.debug('性能指标收集', {
        cpu: metrics.cpuUsage.total,
        memory: metrics.memoryUsage.percentage,
        heap: metrics.heapUsage.percentage,
        uptime: metrics.uptime
      })

    } catch (error) {
      logger.error('收集性能指标失败', error as Error)
    }
  }

  // 获取当前性能指标
  getCurrentMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage()
    const uptime = process.uptime()

    // Node.js进程的CPU使用率
    const cpuUsage = process.cpuUsage()

    // 内存使用情况
    const totalMem = require('os').totalmem()
    const freeMem = require('os').freemem()
    const usedMem = totalMem - freeMem

    return {
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        idle: 0, // Node.js不提供idle时间
        total: (cpuUsage.user + cpuUsage.system) / 1000000 // 转换为毫秒
      },
      memoryUsage: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        cached: 0, // 在生产环境中可以获取更详细的信息
        buffers: 0,
        percentage: (usedMem / totalMem) * 100
      },
      heapUsage: {
        total: memUsage.heapTotal,
        used: memUsage.heapUsed,
        limit: memUsage.heapUsed * 2, // 估算限制
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      loadAverage: require('os').loadavg(),
      uptime,
      timestamp: new Date()
    }
  }

  // 检查性能警报
  private checkAlerts(metrics: PerformanceMetrics): string[] {
    const alerts: string[] = []

    // CPU使用率检查
    if (metrics.cpuUsage.total > this.thresholds.cpuUsage) {
      alerts.push(`CPU使用率过高: ${metrics.cpuUsage.total.toFixed(2)}%`)
    }

    // 内存使用率检查
    if (metrics.memoryUsage.percentage > this.thresholds.memoryUsage) {
      alerts.push(`内存使用率过高: ${metrics.memoryUsage.percentage.toFixed(2)}%`)
    }

    // 堆内存使用率检查
    if (metrics.heapUsage.percentage > this.thresholds.heapUsage) {
      alerts.push(`堆内存使用率过高: ${metrics.heapUsage.percentage.toFixed(2)}%`)
    }

    // 负载平均值检查
    const loadAvg = metrics.loadAverage[0] // 1分钟负载平均值
    if (loadAvg > require('os').cpus().length * 2) {
      alerts.push(`系统负载过高: ${loadAvg.toFixed(2)}`)
    }

    return alerts
  }

  // 通知警报回调
  private notifyAlerts(metrics: PerformanceMetrics, alerts: string[]) {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(metrics, alerts)
      } catch (error) {
        logger.error('性能警报回调执行失败', error as Error)
      }
    })
  }

  // 添加警报回调
  addAlertCallback(callback: (metric: PerformanceMetrics, alerts: string[]) => void) {
    this.alertCallbacks.push(callback)
  }

  // 移除警报回调
  removeAlertCallback(callback: (metric: PerformanceMetrics, alerts: string[]) => void) {
    const index = this.alertCallbacks.indexOf(callback)
    if (index > -1) {
      this.alertCallbacks.splice(index, 1)
    }
  }

  // 获取性能指标历史
  getMetricsHistory(limit: number = 100): PerformanceMetrics[] {
    return this.metrics.slice(-limit)
  }

  // 获取性能统计
  getPerformanceStats(): {
    current: PerformanceMetrics
    average: Partial<PerformanceMetrics>
    peak: Partial<PerformanceMetrics>
  } {
    if (this.metrics.length === 0) {
      throw new Error('没有可用的性能指标数据')
    }

    const current = this.metrics[this.metrics.length - 1]

    // 计算平均值
    const avg = {
      cpuUsage: {
        total: this.metrics.reduce((sum, m) => sum + m.cpuUsage.total, 0) / this.metrics.length,
        user: this.metrics.reduce((sum, m) => sum + m.cpuUsage.user, 0) / this.metrics.length,
        system: this.metrics.reduce((sum, m) => sum + m.cpuUsage.system, 0) / this.metrics.length
      },
      memoryUsage: {
        percentage: this.metrics.reduce((sum, m) => sum + m.memoryUsage.percentage, 0) / this.metrics.length
      },
      heapUsage: {
        percentage: this.metrics.reduce((sum, m) => sum + m.heapUsage.percentage, 0) / this.metrics.length
      }
    }

    // 计算峰值
    const peak = {
      cpuUsage: {
        total: Math.max(...this.metrics.map(m => m.cpuUsage.total)),
        user: Math.max(...this.metrics.map(m => m.cpuUsage.user)),
        system: Math.max(...this.metrics.map(m => m.cpuUsage.system))
      },
      memoryUsage: {
        percentage: Math.max(...this.metrics.map(m => m.memoryUsage.percentage))
      },
      heapUsage: {
        percentage: Math.max(...this.metrics.map(m => m.heapUsage.percentage))
      }
    }

    return { current, average: avg, peak }
  }

  // 更新阈值
  updateThresholds(newThresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...newThresholds }
    logger.info('性能监控阈值已更新', this.thresholds)
  }

  // 获取当前阈值
  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds }
  }

  // 清理指标历史
  clearMetricsHistory() {
    this.metrics = []
    logger.info('性能指标历史已清理')
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

// 响应时间监控
export class ResponseTimeMonitor {
  private responseTimes: Array<{ url: string; method: string; duration: number; timestamp: Date }> = []

  // 记录响应时间
  recordResponse(url: string, method: string, duration: number) {
    this.responseTimes.push({
      url: this.sanitizeUrl(url),
      method,
      duration,
      timestamp: new Date()
    })

    // 保留最近1000条记录
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000)
    }

    // 检查响应时间是否超过阈值
    if (duration > defaultThresholds.responseTime) {
      logger.warn(`响应时间过长: ${method} ${url} - ${duration}ms`, {
        method,
        url: this.sanitizeUrl(url),
        duration,
        threshold: defaultThresholds.responseTime
      })
    }
  }

  // 获取响应时间统计
  getResponseTimeStats(): {
    average: number
    median: number
    p95: number
    p99: number
    max: number
    min: number
    count: number
  } {
    if (this.responseTimes.length === 0) {
      return {
        average: 0,
        median: 0,
        p95: 0,
        p99: 0,
        max: 0,
        min: 0,
        count: 0
      }
    }

    const durations = this.responseTimes.map(rt => rt.duration).sort((a, b) => a - b)
    const count = durations.length

    return {
      average: durations.reduce((sum, d) => sum + d, 0) / count,
      median: durations[Math.floor(count / 2)],
      p95: durations[Math.floor(count * 0.95)],
      p99: durations[Math.floor(count * 0.99)],
      max: durations[count - 1],
      min: durations[0],
      count
    }
  }

  // 获取慢请求
  getSlowRequests(limit: number = 10, thresholdMs: number = 1000): Array<{
    url: string
    method: string
    duration: number
    timestamp: Date
  }> {
    return this.responseTimes
      .filter(rt => rt.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  // 清理URL中的敏感信息
  private sanitizeUrl(url: string): string {
    // 移除查询参数中的敏感信息
    return url.split('?')[0]
  }

  // 清理响应时间历史
  clearResponseTimes() {
    this.responseTimes = []
    logger.info('响应时间历史已清理')
  }
}

// 全局响应时间监控实例
export const responseTimeMonitor = new ResponseTimeMonitor()

// 自动启动性能监控（在生产环境中）
if (process.env.NODE_ENV === 'production') {
  performanceMonitor.startMonitoring(60000) // 每分钟收集一次
}

export default performanceMonitor