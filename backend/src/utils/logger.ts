import fs from 'fs'
import path from 'path'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'


// // 确保日志目录存在
// const logDir = 'logs';
// if (!fs.existsSync(logDir)) {
//   fs.mkdirSync(logDir);
// }

// 日志级别枚举
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// 日志条目接口
export interface LogEntry {
  timestamp: string
  level: LogLevel
  category: string
  message: string
  metadata?: Record<string, any>
  duration?: number
  error?: {
    name: string
    message: string
    stack?: string
  }
}

// 日志配置
export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  logDir: string
  maxFileSize: number // MB
  maxFiles: number
  enableColors: boolean
}

// 默认日志配置
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  // 生产环境或开发环境下启用文件日志
  // enableFile: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development',
  enableFile: true,
  logDir: path.join(process.cwd(), 'logs'),
  maxFileSize: 50, // 50MB
  maxFiles: 10,
  enableColors: process.env.NODE_ENV !== 'production'
}

class Logger {
  private config: LoggerConfig
  private logFiles: Map<LogLevel, string> = new Map()

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.initializeLogFiles()
  }

  private initializeLogFiles() {
    console.log('Initializing log files...')

    if (!this.config.enableFile) {
      console.log('File logging is disabled.')
      console.log(process.env.NODE_ENV)
      return
    }
    console.log(`Log directory: ${this.config.logDir}`)

    // 确保日志目录存在
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true })
    }

    // 初始化不同级别的日志文件
    Object.values(LogLevel).forEach(level => {
      const fileName = `${level.toLowerCase()}.log`
      const filePath = path.join(this.config.logDir, fileName)
      this.logFiles.set(level, filePath)
    })
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    const currentLevelIndex = levels.indexOf(this.config.level)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS', { locale: zhCN })

    let logMessage = `[${timestamp}] [${entry.level}] [${entry.category}] ${entry.message}`

    // 添加持续时间
    if (entry.duration !== undefined) {
      logMessage += ` (${entry.duration}ms)`
    }

    // 添加元数据
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      logMessage += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`
    }

    // 添加错误信息
    if (entry.error) {
      logMessage += `\n  Error: ${entry.error.name}: ${entry.error.message}`
      if (entry.error.stack) {
        logMessage += `\n  Stack: ${entry.error.stack}`
      }
    }

    return logMessage
  }

  private getColorForLevel(level: LogLevel): string {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // 青色
      [LogLevel.INFO]: '\x1b[32m',  // 绿色
      [LogLevel.WARN]: '\x1b[33m',  // 黄色
      [LogLevel.ERROR]: '\x1b[31m'  // 红色
    }
    return colors[level] || ''
  }

  private resetColor(): string {
    return '\x1b[0m'
  }

  private writeLog(entry: LogEntry) {
    const formattedMessage = this.formatLogEntry(entry)

    // 控制台输出
    if (this.config.enableConsole && this.shouldLog(entry.level)) {
      if (this.config.enableColors) {
        const color = this.getColorForLevel(entry.level)
        console.log(`${color}${formattedMessage}${this.resetColor()}`)
      } else {
        console.log(formattedMessage)
      }
    }

    // 文件输出
    if (this.config.enableFile && this.shouldLog(entry.level)) {
      const logFile = this.logFiles.get(entry.level)
      if (logFile) {
        try {
          this.checkAndRotateFile(logFile)
          fs.appendFileSync(logFile, formattedMessage + '\n')
        } catch (error) {
          console.error('写入日志文件失败:', error)
        }
      }
    }
  }

  private checkAndRotateFile(filePath: string) {
    try {
      const stats = fs.statSync(filePath)
      const fileSizeMB = stats.size / (1024 * 1024)

      if (fileSizeMB > this.config.maxFileSize) {
        // 文件轮转
        const timestamp = format(new Date(), 'yyyyMMdd-HHmmss')
        const backupPath = filePath.replace('.log', `-${timestamp}.log`)
        fs.renameSync(filePath, backupPath)

        // 清理旧文件
        this.cleanOldFiles(filePath)
      }
    } catch (error) {
      // 文件不存在，创建新文件
    }
  }

  private cleanOldFiles(currentFilePath: string) {
    try {
      const dir = path.dirname(currentFilePath)
      const fileName = path.basename(currentFilePath, '.log')
      const files = fs.readdirSync(dir)
        .filter(file => file.startsWith(fileName) && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(dir, file),
          time: fs.statSync(path.join(dir, file)).mtime
        }))
        .sort((a, b) => b.time.getTime() - a.time.getTime())

      // 删除超过最大文件数的旧文件
      if (files.length > this.config.maxFiles) {
        files.slice(this.config.maxFiles).forEach(file => {
          fs.unlinkSync(file.path)
        })
      }
    } catch (error) {
      console.error('清理日志文件失败:', error)
    }
  }

  // 公共日志方法
  debug(category: string, message: string, metadata?: Record<string, any>) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      category,
      message,
      metadata
    })
  }

  info(category: string, message: string, metadata?: Record<string, any>) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category,
      message,
      metadata
    })
  }

  warn(category: string, message: string, metadata?: Record<string, any>) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      category,
      message,
      metadata
    })
  }

  error(category: string, message: string, error?: Error, metadata?: Record<string, any>) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category,
      message,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    })
  }

  // 性能计时方法
  time(category: string, operation: string): () => void {
    const startTime = Date.now()
    const startTimeMs = process.hrtime.bigint()

    this.debug(category, `开始计时: ${operation}`)

    return () => {
      const endTime = Date.now()
      const endTimeMs = process.hrtime.bigint()
      const duration = endTime - startTime
      const durationMs = Number(duration) / 1000000 // 转换为毫秒

      this.info(category, `结束计时: ${operation}`, {
        startTime,
        endTime,
        duration: durationMs,
        durationNanos: duration
      })
    }
  }

  // 记录API请求
  logRequest(req: any, res: any, startTime: number) {
    const duration = Date.now() - startTime
    const metadata = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.id || 'unknown'
    }

    if (res.statusCode >= 400) {
      this.warn('API', `HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, metadata)
    } else {
      this.info('API', `HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, metadata)
    }
  }

  // 记录智能体操作
  logAgentAction(agentId: string, action: string, metadata?: Record<string, any>) {
    this.info('AGENT', `${agentId}: ${action}`, metadata)
  }

  logAgentError(agentId: string, action: string, error: Error, metadata?: Record<string, any>) {
    this.error('AGENT', `${agentId}: ${action} 失败`, error, metadata)
  }

  logAgentStart(agentId: string, metadata?: Record<string, any>) {
    this.info('AGENT', `${agentId}: 开始执行`, metadata)
  }

  logAgentComplete(agentId: string, duration: number, metadata?: Record<string, any>) {
    this.info('AGENT', `${agentId}: 执行完成`, {
      duration,
      ...metadata
    })
  }

  // 获取日志文件路径
  getLogFiles(): Record<string, string> {
    const files: Record<string, string> = {}
    this.logFiles.forEach((path, level) => {
      files[level] = path
    })
    return files
  }

  // 获取最近的日志条目
  async getRecentLogs(level: LogLevel = LogLevel.INFO, count: number = 100): Promise<LogEntry[]> {
    const logFile = this.logFiles.get(level)
    if (!logFile || !fs.existsSync(logFile)) {
      return []
    }

    try {
      const content = fs.readFileSync(logFile, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())

      // 解析日志条目
      const entries: LogEntry[] = []
      for (const line of lines.slice(-count)) {
        try {
          const entry = this.parseLogLine(line)
          if (entry) {
            entries.push(entry)
          }
        } catch (error) {
          // 忽略解析失败的行
        }
      }

      return entries
    } catch (error) {
      this.error('LOGGER', '读取日志文件失败', error as Error)
      return []
    }
  }

  private parseLogLine(line: string): LogEntry | null {
    // 简化的日志解析逻辑
    const match = line.match(/^\[([^\]]+)\] \[([^\]]+)\] \[([^\]]+)\] (.+)$/)
    if (!match) return null

    return {
      timestamp: match[1],
      level: match[2] as LogLevel,
      category: match[3],
      message: match[4]
    }
  }
}

// 创建全局日志实例
export const logger = new Logger()

// 创建分类日志器
export function createLogger(category: string) {
  return {
    debug: (message: string, metadata?: Record<string, any>) => logger.debug(category, message, metadata),
    info: (message: string, metadata?: Record<string, any>) => logger.info(category, message, metadata),
    warn: (message: string, metadata?: Record<string, any>) => logger.warn(category, message, metadata),
    error: (message: string, error?: Error, metadata?: Record<string, any>) => logger.error(category, message, error, metadata),
    time: (operation: string) => logger.time(category, operation)
  }
}

export default logger