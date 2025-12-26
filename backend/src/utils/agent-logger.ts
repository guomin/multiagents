import { createLogger } from './logger'
import type { ExhibitionRequirement, ExhibitionState } from '../types/exhibition'

// 智能体日志接口
export interface AgentLogEntry {
  agentId: string
  agentName: string
  action: string
  startTime: Date
  endTime?: Date
  duration?: number
  input?: any
  output?: any
  status: 'pending' | 'running' | 'completed' | 'error'
  error?: string
  metadata?: Record<string, any>
}

// 智能体日志管理器
export class AgentLogger {
  private agentLogs: Map<string, AgentLogEntry[]> = new Map()
  private loggers: Map<string, ReturnType<typeof createLogger>> = new Map()

  constructor() {
    this.initializeAgentTypes()
  }

  private initializeAgentTypes() {
    const agentTypes = [
      'curator',
      'spatial',
      'visual',
      'interactive',
      'budget',
      'supervisor'
    ]

    agentTypes.forEach(agentId => {
      this.loggers.set(agentId, createLogger(`AGENT-${agentId.toUpperCase()}`))
      this.agentLogs.set(agentId, [])
    })
  }

  // 开始记录智能体操作
  startExecution(agentId: string, agentName: string, action: string, input?: any): string {
    const executionId = `${agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const logEntry: AgentLogEntry = {
      agentId,
      agentName,
      action,
      startTime: new Date(),
      input,
      status: 'running'
    }

    // 添加到内存日志
    const logs = this.agentLogs.get(agentId) || []
    logs.push(logEntry)
    this.agentLogs.set(agentId, logs)

    // 记录到文件日志
    const logger = this.loggers.get(agentId)
    if (logger) {
      logger.info(`开始执行: ${action}`, {
        executionId,
        agentName,
        input: this.sanitizeInput(input)
      })
    }

    return executionId
  }

  // 完成智能体操作
  completeExecution(agentId: string, executionId: string, output?: any, metadata?: Record<string, any>) {
    const logs = this.agentLogs.get(agentId)
    if (!logs) return

    const logEntry = logs.find(log =>
      log.agentId === agentId &&
      log.status === 'running' &&
      `${log.agentId}_${log.startTime.getTime()}`.includes(executionId.split('_')[1])
    )

    if (!logEntry) return

    logEntry.endTime = new Date()
    logEntry.duration = logEntry.endTime.getTime() - logEntry.startTime.getTime()
    logEntry.output = output
    logEntry.status = 'completed'
    logEntry.metadata = metadata

    // 记录到文件日志
    const logger = this.loggers.get(agentId)
    if (logger) {
      logger.info(`执行完成: ${logEntry.action}`, {
        executionId,
        duration: logEntry.duration,
        output: this.sanitizeOutput(output),
        metadata
      })
    }
  }

  // 记录智能体错误
  logError(agentId: string, executionId: string, error: Error, metadata?: Record<string, any>) {
    const logs = this.agentLogs.get(agentId)
    if (!logs) return

    const logEntry = logs.find(log =>
      log.agentId === agentId &&
      log.status === 'running' &&
      `${log.agentId}_${log.startTime.getTime()}`.includes(executionId.split('_')[1])
    )

    if (logEntry) {
      logEntry.endTime = new Date()
      logEntry.duration = logEntry.endTime.getTime() - logEntry.startTime.getTime()
      logEntry.status = 'error'
      logEntry.error = error.message
      logEntry.metadata = metadata
    }

    // 记录到文件日志
    const logger = this.loggers.get(agentId)
    if (logger) {
      logger.error(`执行失败: ${logEntry?.action || 'Unknown Action'}`, error, {
        executionId,
        metadata
      })
    }
  }

  // 记录智能体状态变化
  logStateChange(agentId: string, agentName: string, oldStatus: string, newStatus: string, metadata?: Record<string, any>) {
    const logger = this.loggers.get(agentId)
    if (logger) {
      logger.info(`状态变化: ${oldStatus} -> ${newStatus}`, {
        agentName,
        oldStatus,
        newStatus,
        metadata
      })
    }
  }

  // 记录智能体间的数据传递
  logDataTransfer(fromAgent: string, toAgent: string, dataType: string, data: any) {
    const logger = this.loggers.get(toAgent) || createLogger('AGENT-DATA-TRANSFER')
    logger.info(`接收数据: ${dataType}`, {
      fromAgent,
      toAgent,
      dataType,
      dataSize: JSON.stringify(data).length,
      dataPreview: this.getDataPreview(data)
    })
  }

  // 记录工作流开始
  logWorkflowStart(projectId: string, requirements: ExhibitionRequirement) {
    const logger = createLogger('WORKFLOW')
    logger.info('工作流开始', {
      projectId,
      requirements: {
        title: requirements.title,
        theme: requirements.theme,
        budget: requirements.budget,
        venueSpace: requirements.venueSpace,
        targetAudience: requirements.targetAudience
      }
    })
  }

  // 记录工作流完成
  logWorkflowComplete(projectId: string, result: ExhibitionState, totalDuration: number) {
    const logger = createLogger('WORKFLOW')
    logger.info('工作流完成', {
      projectId,
      totalDuration,
      result: {
        conceptPlan: !!result.conceptPlan,
        spatialLayout: !!result.spatialLayout,
        visualDesign: !!result.visualDesign,
        interactiveSolution: !!result.interactiveSolution,
        budgetEstimate: !!result.budgetEstimate,
        messagesCount: result.messages.length
      }
    })
  }

  // 记录工作流错误
  logWorkflowError(projectId: string, error: Error, context?: Record<string, any>) {
    const logger = createLogger('WORKFLOW')
    logger.error('工作流失败', error, {
      projectId,
      context
    })
  }

  // 获取智能体执行历史
  getAgentHistory(agentId: string): AgentLogEntry[] {
    return this.agentLogs.get(agentId) || []
  }

  // 获取所有智能体的当前状态
  getAllAgentStatus(): Record<string, { status: string, currentAction?: string, duration?: number }> {
    const status: Record<string, any> = {}

    this.agentLogs.forEach((logs, agentId) => {
      const latestLog = logs[logs.length - 1]
      if (latestLog) {
        const currentDuration = latestLog.endTime
          ? latestLog.duration
          : Date.now() - latestLog.startTime.getTime()

        status[agentId] = {
          status: latestLog.status,
          currentAction: latestLog.action,
          duration: currentDuration,
          startTime: latestLog.startTime
        }
      } else {
        status[agentId] = {
          status: 'idle'
        }
      }
    })

    return status
  }

  // 清理旧的日志条目（防止内存泄漏）
  cleanupOldLogs(maxAge: number = 24 * 60 * 60 * 1000) { // 默认24小时
    const cutoffTime = Date.now() - maxAge

    this.agentLogs.forEach((logs, agentId) => {
      const filteredLogs = logs.filter(log =>
        log.startTime.getTime() > cutoffTime
      )
      this.agentLogs.set(agentId, filteredLogs)
    })
  }

  // 清理输入数据（避免记录敏感信息）
  private sanitizeInput(input: any): any {
    if (!input) return input

    // 如果是包含敏感信息的对象，进行脱敏处理
    if (typeof input === 'object') {
      const sanitized = { ...input }

      // 脱敏常见敏感字段
      const sensitiveFields = ['password', 'token', 'key', 'secret', 'apiKey']
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '***REDACTED***'
        }
      })

      return sanitized
    }

    return input
  }

  // 清理输出数据
  private sanitizeOutput(output: any): any {
    if (!output) return output

    // 对于过大的输出，只记录摘要
    const outputStr = JSON.stringify(output)
    if (outputStr.length > 10000) { // 10KB限制
      return {
        type: 'large_output',
        size: outputStr.length,
        preview: outputStr.substring(0, 500) + '...'
      }
    }

    return output
  }

  // 获取数据预览
  private getDataPreview(data: any): string {
    if (!data) return 'null'

    if (typeof data === 'string') {
      return data.length > 100 ? data.substring(0, 100) + '...' : data
    }

    if (Array.isArray(data)) {
      return `Array[${data.length}]`
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data)
      return `Object{${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}}`
    }

    return String(data)
  }

  // 导出日志
  exportLogs(agentId?: string): Record<string, AgentLogEntry[]> {
    if (agentId) {
      const logs = this.agentLogs.get(agentId)
      return { [agentId]: logs || [] }
    }

    const result: Record<string, AgentLogEntry[]> = {}
    this.agentLogs.forEach((logs, id) => {
      result[id] = logs
    })
    return result
  }
}

// 创建全局智能体日志管理器
export const agentLogger = new AgentLogger()

// 智能体执行装饰器
export function logAgentExecution(agentId: string, agentName: string, action?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor | undefined) {
    // 如果 descriptor 未定义，直接返回
    if (!descriptor) {
      console.warn(`⚠️ [装饰器] descriptor 未定义: ${agentId}.${propertyName}`)
      return
    }

    const method = descriptor.value
    if (!method) {
      console.warn(`⚠️ [装饰器] method 未定义: ${agentId}.${propertyName}`)
      return
    }

    const actionName = action || propertyName

    descriptor.value = async function (...args: any[]) {
      const executionId = agentLogger.startExecution(agentId, agentName, actionName, args[0])

      try {
        const result = await method.apply(this, args)
        agentLogger.completeExecution(agentId, executionId, result)
        return result
      } catch (error) {
        agentLogger.logError(agentId, executionId, error as Error, { args })
        throw error
      }
    }

    return descriptor
  }
}

export default agentLogger