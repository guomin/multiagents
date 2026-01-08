import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import { createServer } from 'http'
import path from 'path'
import { exhibitionAPI } from './routes/exhibition'
import { logsAPI } from './routes/logs'
import { projectsAPI } from './routes/projects'
import { humanDecisionAPI } from './routes/human-decision'
import { ModelConfigFactory } from './config/model'
import { requestLogger, errorLogger } from './middleware/request-logger'
import { createLogger } from './utils/logger'
// 暂时注释掉 agentLogger
// import { agentLogger } from './utils/agent-logger'
import { performanceMonitor } from './utils/performance-monitor'
import { initializeDatabase } from './database/schema'
import { initializePrompts } from './prompts'

// 加载环境变量 - 优先从 backend 目录加载 .env 文件
// .env 文件中的变量会覆盖系统环境变量
if (process.env.NODE_ENV !== "production") {
  // 尝试从多个可能的路径加载 .env 文件
  const envPath = path.resolve(process.cwd(), '.env')
  const envResult = dotenv.config({
    path: envPath,
    override: true  // 让 .env 文件覆盖系统环境变量
  })

  if (envResult.error) {
    // 如果从 process.cwd() 加载失败，尝试从 __dirname 加载
    const fallbackPath = path.resolve(__dirname, '../.env')
    const fallbackResult = dotenv.config({
      path: fallbackPath,
      override: true
    })

    if (fallbackResult.error) {
      console.warn('⚠️  警告: 无法加载 .env 文件')
      console.warn('   尝试的路径:', envPath, fallbackPath)
    } else {
      console.log('✅ 从备用路径加载 .env 文件:', fallbackPath)
      console.log('ℹ️  .env 文件中的变量将覆盖系统环境变量')
    }
  } else {
    console.log('✅ 从默认路径加载 .env 文件:', envPath)
    console.log('ℹ️  .env 文件中的变量将覆盖系统环境变量')
  }

  // 验证关键环境变量
  if (process.env.ZHIPUAI_API_KEY) {
    console.log('✅ ZHIPUAI_API_KEY 已加载 (前10位):', process.env.ZHIPUAI_API_KEY.substring(0, 10) + '...')
    console.log('ℹ️  来源: .env 文件 (已覆盖系统环境变量)')
  } else {
    console.warn('⚠️  警告: ZHIPUAI_API_KEY 未找到')
  }
}

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3001

// 创建主日志记录器
const mainLogger = createLogger('MAIN')

// 初始化 Prompt 模板
initializePrompts()

mainLogger.info('🚀 启动多智能体展陈设计系统', {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: PORT,
  timestamp: new Date().toISOString()
})

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// 添加请求日志中间件
app.use(requestLogger)

// 请求体解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// API 路由
app.use('/api', exhibitionAPI)
app.use('/api/logs', logsAPI)
app.use('/api/projects', projectsAPI)
app.use('/api', humanDecisionAPI)

// WebSocket 服务器 - 用于实时推送智能体状态
export const wss = new WebSocketServer({ server })

wss.on('connection', (ws, req) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const clientIP = req.socket.remoteAddress

  mainLogger.info('WebSocket 客户端已连接', {
    clientId,
    clientIP,
    userAgent: req.headers['user-agent']
  })

  // 广播连接状态
  broadcastConnectionStatus('connected', {
    clientId,
    clientIP,
    totalClients: wss.clients.size
  })

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())

      // 处理不同类型的消息
      switch (data.type) {
        case 'ping':
          // 心跳消息不记录日志，减少噪音
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }))
          break
        case 'subscribe':
          // 订阅特定事件
          mainLogger.info('📨 客户端订阅事件', { clientId, events: data.events })
          break
        default:
          mainLogger.debug('收到客户端消息', { clientId, data })
      }
    } catch (error) {
      mainLogger.error('解析WebSocket消息失败', error as Error, { clientId })
    }
  })

  ws.on('close', (code, reason) => {
    mainLogger.info('WebSocket 客户端已断开', {
      clientId,
      code,
      reason: reason.toString(),
      remainingClients: wss.clients.size
    })

    broadcastConnectionStatus('disconnected', {
      clientId,
      totalClients: wss.clients.size
    })
  })

  ws.on('error', (error) => {
    mainLogger.error('WebSocket连接错误', error, { clientId })
  })
})

// 广播智能体状态给所有连接的客户端
export function broadcastAgentStatus(agentId: string, status: any) {
  const message = JSON.stringify({
    type: 'agentStatus',
    agentId,
    status,
    timestamp: new Date().toISOString()
  })

  mainLogger.info('📡 广播智能体状态', {
    agentId,
    status: status.status,
    clientCount: wss.clients.size,
    connectedClients: Array.from(wss.clients).map(c => c.readyState)
  })

  let successCount = 0
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(message)
        successCount++
      } catch (error) {
        mainLogger.warn('发送WebSocket消息失败', error as Error)
      }
    }
  })

  mainLogger.info('✅ 智能体状态广播完成', { agentId, successCount, totalClients: wss.clients.size })
}

// 广播工作流进度
export function broadcastProgress(progress: number, currentStep: string) {
  const message = JSON.stringify({
    type: 'progress',
    progress,
    currentStep,
    timestamp: new Date().toISOString()
  })

  mainLogger.debug('广播工作流进度', { progress, currentStep, clientCount: wss.clients.size })

  let successCount = 0
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(message)
        successCount++
      } catch (error) {
        mainLogger.warn('发送WebSocket消息失败', error as Error)
      }
    }
  })

  mainLogger.debug('工作流进度广播完成', { progress, successCount, totalClients: wss.clients.size })
}

// 广播连接状态
export function broadcastConnectionStatus(status: string, data: any) {
  const message = JSON.stringify({
    type: 'connectionStatus',
    status,
    data,
    timestamp: new Date().toISOString()
  })

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(message)
      } catch (error) {
        mainLogger.warn('发送连接状态失败', error as Error)
      }
    }
  })
}

// 广播日志消息
export function broadcastLog(level: 'info' | 'success' | 'warning' | 'error', message: string) {
  const logMessage = JSON.stringify({
    type: 'log',
    level,
    message,
    timestamp: new Date().toISOString()
  })

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(logMessage)
      } catch (error) {
        mainLogger.warn('发送日志消息失败', error as Error)
      }
    }
  })
}

// 广播人工审核等待
export function broadcastWaitingForHuman(
  qualityEvaluation: any,
  iterationCount: number,
  revisionTarget?: string
) {
  const message = JSON.stringify({
    type: 'waitingForHuman',
    qualityEvaluation,
    iterationCount,
    revisionTarget,
    timestamp: new Date().toISOString()
  })

  mainLogger.info('⏸️  广播人工审核请求', {
    iterationCount,
    revisionTarget,
    overallScore: qualityEvaluation?.overallScore
  })

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(message)
      } catch (error) {
        mainLogger.warn('发送人工审核请求失败', error as Error)
      }
    }
  })
}

// 广播迭代更新
export function broadcastIterationUpdate(iterationCount: number, revisionTarget: string) {
  const message = JSON.stringify({
    type: 'iterationUpdate',
    iterationCount,
    revisionTarget,
    timestamp: new Date().toISOString()
  })

  mainLogger.info('🔄 广播迭代更新', {
    iterationCount,
    revisionTarget
  })

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(message)
      } catch (error) {
        mainLogger.warn('发送迭代更新失败', error as Error)
      }
    }
  })
}

// 添加错误处理中间件
app.use(errorLogger)

// 404处理
app.use('*', (req, res) => {
  mainLogger.warn('404 - 请求的路径不存在', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.originalUrl
  })
})

// 启动服务器
server.listen(PORT, () => {
  mainLogger.info('🎉 服务器启动成功', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  })

  // 初始化数据库
  try {
    initializeDatabase()
    mainLogger.info('💾 数据库初始化成功')
  } catch (error) {
    mainLogger.error('数据库初始化失败', error as Error)
  }

  // 验证模型配置
  const validation = ModelConfigFactory.validateConfig()
  if (validation.isValid) {
    const config = ModelConfigFactory.createModelConfig()
    mainLogger.info('✅ 模型配置验证成功', {
      provider: config.provider,
      modelName: config.modelName,
      temperature: config.temperature
    })
  } else {
    mainLogger.error('❌ 模型配置验证失败', undefined, {
      error: validation.error
    })
  }

  // 启动性能监控
  if (process.env.NODE_ENV === 'production') {
    performanceMonitor.startMonitoring(60000) // 每分钟收集一次
    mainLogger.info('📊 性能监控已启动')
  }

  mainLogger.info('📡 WebSocket 服务已启动')
  mainLogger.info('🔗 API 端点:')
  mainLogger.info('   - POST /api/exhibition/run - 运行展览设计')
  mainLogger.info('   - GET  /api/projects - 获取项目列表')
  mainLogger.info('   - GET  /api/projects/:id - 获取项目详情')
  mainLogger.info('   - GET  /api/projects/stats - 获取项目统计')
  mainLogger.info('   - GET  /api/logs - 获取日志')
})

// 优雅关闭
process.on('SIGTERM', () => {
  mainLogger.info('收到SIGTERM信号，开始优雅关闭...')
  gracefulShutdown('SIGTERM')
})

process.on('SIGINT', () => {
  mainLogger.info('收到SIGINT信号，开始优雅关闭...')
  gracefulShutdown('SIGINT')
})

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  mainLogger.error('未捕获的异常', error, {
    stack: error.stack,
    timestamp: new Date().toISOString()
  })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  mainLogger.error('未处理的Promise拒绝', new Error(String(reason)), {
    promise: promise.toString(),
    timestamp: new Date().toISOString()
  })
})

// 优雅关闭函数
function gracefulShutdown(signal: string) {
  mainLogger.info('开始优雅关闭服务器', { signal })

  // 停止性能监控
  performanceMonitor.stopMonitoring()

  // 关闭HTTP服务器
  server.close((err) => {
    if (err) {
      mainLogger.error('关闭HTTP服务器时出错', err)
    } else {
      mainLogger.info('HTTP服务器已关闭')
    }

    // 关闭WebSocket连接
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.close(1001, 'Server shutdown')
      }
    })

    mainLogger.info('所有连接已关闭')
    mainLogger.info('服务器优雅关闭完成')
    process.exit(0)
  })

  // 强制关闭超时
  setTimeout(() => {
    mainLogger.warn('强制关闭服务器（超时）')
    process.exit(1)
  }, 10000)
}