import { Router } from 'express'
import { broadcastAgentStatus, broadcastProgress } from '../index'
import type { ExhibitionRequirement, ExhibitionState } from '../types/exhibition'
// 暂时注释掉 agentLogger，使用 console 代替
// import { agentLogger } from '../utils/agent-logger'
import { createLogger } from '../utils/logger'
import { responseTimeMonitor } from '../utils/performance-monitor'
import { projectQueries, workflowQueries, agentExecutionQueries, designResultQueries } from '../database/queries'

const router = Router()
const logger = createLogger('EXHIBITION-API')

// 延迟创建智能体，避免在启动时就加载
let exhibitionGraph: any = null

const getExhibitionGraph = () => {
  if (!exhibitionGraph) {
    const { ExhibitionDesignGraph } = require('../graph/exhibition-graph')
    exhibitionGraph = new ExhibitionDesignGraph()
  }
  return exhibitionGraph
}

// 获取模型配置
router.get('/model-config', (req, res) => {
  const startTime = Date.now()

  try {
    logger.info('获取模型配置请求')

    const { ModelConfigFactory } = require('../config/model')
    const config = ModelConfigFactory.createModelConfig()

    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

    logger.info('模型配置获取成功', {
      provider: config.provider,
      modelName: config.modelName
    })

    res.json(config)
  } catch (error) {
    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

    logger.error('获取模型配置失败', error as Error)
    res.status(500).json({
      error: 'Failed to get model config',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 运行展览设计
router.post('/exhibition/run', async (req, res) => {
  const startTime = Date.now()
  const projectId = `project_${Date.now()}`

  try {
    const requirements: ExhibitionRequirement = req.body
    const maxIterations: number = req.body.maxIterations || 3

    logger.info('📨 收到展览设计请求', {
      requestId: req.id,
      projectId,
      title: requirements.title,
      theme: requirements.theme.substring(0, 50) + '...',
      budget: `${requirements.budget?.total} ${requirements.budget?.currency}`,
      maxIterations
    })

    // 记录工作流开始
    console.log('✅ [API] 工作流已记录开始')
    // agentLogger.logWorkflowStart(projectId, requirements)

    // 验证请求数据
    if (!requirements.title || !requirements.theme) {
      logger.warn('请求数据验证失败', {
        requestId: req.id,
        projectId,
        missingFields: {
          title: !requirements.title,
          theme: !requirements.theme
        }
      })

      responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

      return res.status(400).json({
        error: 'Missing required fields: title, theme',
        requestId: req.id
      })
    }

    // 验证模型配置
    const { ModelConfigFactory } = require('../config/model')
    const validation = ModelConfigFactory.validateConfig()
    if (!validation.isValid) {
      logger.error('模型配置验证失败', undefined, {
        requestId: req.id,
        projectId,
        validationError: validation.error
      })

      responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

      return res.status(500).json({
        error: 'Model configuration is invalid',
        details: validation.error,
        requestId: req.id
      })
    }

    logger.info('展览设计验证成功，开始异步执行', {
      requestId: req.id,
      projectId,
      exhibitionTitle: requirements.title,
      theme: requirements.theme
    })

    console.log('📞 [API] 准备调用 runExhibitionAsync...')

    // 异步运行多智能体系统
    runExhibitionAsync(requirements, maxIterations, projectId, req.id || 'unknown')

    console.log('✅ [API] runExhibitionAsync 已调用（异步）')

    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

    // 立即返回响应，表示任务已启动
    res.json({
      success: true,
      message: 'Exhibition design started',
      projectId,
      requestId: req.id,
      estimatedDuration: '3-5 minutes'
    })

  } catch (error) {
    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

    logger.error('启动展览设计失败', error as Error, {
      requestId: req.id,
      projectId
    })

    res.status(500).json({
      error: 'Failed to start exhibition design',
      details: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.id
    })
  }
})

// 异步运行多智能体系统的函数
async function runExhibitionAsync(
  requirements: ExhibitionRequirement,
  maxIterations: number,
  projectId: string,
  requestId: string
) {
  const workflowStartTime = Date.now()
  let dbProject = null
  let dbWorkflow = null

  console.log('🚀 [ASYNC] runExhibitionAsync 函数已调用')
  console.log('📋 [ASYNC] 项目ID:', projectId)
  console.log('📋 [ASYNC] 请求ID:', requestId)
  console.log('🔄 [ASYNC] 最大迭代次数:', maxIterations)

  try {
    logger.info('🚀 开始运行多智能体图系统', { projectId, requestId })
    console.log('✅ [ASYNC] 已进入 try 块')

    // 1. 保存项目到数据库
    dbProject = projectQueries.create({
      title: requirements.title,
      theme: requirements.theme,
      target_audience: requirements.targetAudience || '',
      venue_area: requirements.venueSpace?.area || 0,
      venue_height: requirements.venueSpace?.height || 0,
      venue_layout: requirements.venueSpace?.layout || '',
      budget_total: requirements.budget?.total || 0,
      budget_currency: requirements.budget?.currency || 'CNY',
      start_date: requirements.duration?.startDate || '',
      end_date: requirements.duration?.endDate || '',
      special_requirements: JSON.stringify(requirements.specialRequirements || []),
      status: 'running'
    })

    logger.info('项目已保存到数据库', { projectId: dbProject.id })
    console.log('✅ [ASYNC] 项目已保存到数据库, ID:', dbProject.id)

    // 2. 创建工作流记录
    dbWorkflow = workflowQueries.create({
      project_id: dbProject.id,
      current_step: '开始项目',
      progress: 0,
      status: 'running',
      completed_at: null,
      error_message: null
    })

    logger.info('工作流已创建', { workflowId: dbWorkflow.id })
    console.log('✅ [ASYNC] 工作流已创建, ID:', dbWorkflow.id)

    // 广播开始状态
    broadcastProgress(0, '开始项目')
    workflowQueries.updateProgress(dbWorkflow.id, '开始项目', 0)

    console.log('🤖 [ASYNC] 开始创建智能体执行记录...')

    // 3. 创建智能体执行记录
    const agentNames = {
      curator: '策划智能体',
      spatial: '空间设计智能体',
      visual: '视觉设计智能体',
      interactive: '互动技术智能体',
      budget: '预算控制智能体',
      supervisor: '协调主管智能体'
    }

    const agentExecutions: Record<string, any> = {}
    for (const [agentId, agentName] of Object.entries(agentNames)) {
      const execution = agentExecutionQueries.create({
        workflow_id: dbWorkflow.id,
        agent_id: agentId,
        agent_name: agentName,
        status: 'pending',
        started_at: null,
        completed_at: null,
        error_message: null,
        result_data: null
      })
      agentExecutions[agentId] = execution
    }

    console.log('✅ [ASYNC] 智能体执行记录已创建，准备运行图系统...')

    // 4. 运行真实的多智能体图系统
    console.log('🤖 [ASYNC] 正在获取 ExhibitionGraph 实例...')
    const graph = getExhibitionGraph()
    console.log('✅ [ASYNC] ExhibitionGraph 实例已获取，开始运行...')
    const result = await graph.runExhibition(requirements, maxIterations)
    console.log('🎉 [ASYNC] 多智能体图系统运行完成！')

    const totalDuration = Date.now() - workflowStartTime

    // 5. 保存设计结果到数据库
    if (result.conceptPlan) {
      designResultQueries.save(dbWorkflow.id, 'concept', JSON.stringify(result.conceptPlan))
    }
    if (result.spatialLayout) {
      designResultQueries.save(dbWorkflow.id, 'spatial', JSON.stringify(result.spatialLayout))
    }
    if (result.visualDesign) {
      designResultQueries.save(dbWorkflow.id, 'visual', JSON.stringify(result.visualDesign))
    }
    if (result.interactiveSolution) {
      designResultQueries.save(dbWorkflow.id, 'interactive', JSON.stringify(result.interactiveSolution))
    }
    if (result.budgetEstimate) {
      designResultQueries.save(dbWorkflow.id, 'budget', JSON.stringify(result.budgetEstimate))
    }

    // 6. 更新项目和工作流状态为完成
    projectQueries.updateStatus(dbProject.id, 'completed')
    workflowQueries.complete(dbWorkflow.id)

    logger.info('多智能体图系统执行完成', {
      projectId: dbProject.id,
      workflowId: dbWorkflow.id,
      requestId,
      totalDuration,
      hasResult: !!result,
      resultSummary: {
        hasConceptPlan: !!result.conceptPlan,
        hasSpatialLayout: !!result.spatialLayout,
        hasVisualDesign: !!result.visualDesign,
        hasInteractiveSolution: !!result.interactiveSolution,
        hasBudgetEstimate: !!result.budgetEstimate
      }
    })

    // 7. 广播完成状态
    broadcastProgress(100, '项目完成')

  } catch (error) {
    const totalDuration = Date.now() - workflowStartTime

    console.error('❌ [ASYNC] 发生错误:', error)
    console.error('❌ [ASYNC] 错误堆栈:', (error as Error).stack)
    console.error('❌ [ASYNC] 错误消息:', (error as Error).message)

    // agentLogger.logWorkflowError(projectId, error as Error, {
    //   requestId,
    //   totalDuration
    // })
    console.error('❌ [ASYNC] 工作流错误已记录')

    logger.error('多智能体图系统运行失败', error as Error, {
      projectId,
      requestId,
      errorMessage: (error as Error).message,
      errorStack: (error as Error).stack
    })

    // 更新数据库状态为错误
    if (dbProject) {
      projectQueries.updateStatus(dbProject.id, 'error')
    }
    if (dbWorkflow) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      workflowQueries.error(dbWorkflow.id, errorMessage)
    }

    broadcastProgress(0, '系统错误')
  }
}

// 获取工作流状态
router.get('/exhibition/workflow/:id', (req, res) => {
  try {
    const { id } = req.params

    // 这里应该从数据库或缓存中获取状态
    // 目前返回模拟状态
    res.json({
      id,
      status: 'completed',
      progress: 100,
      message: 'Workflow completed successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get workflow status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 取消工作流
router.delete('/exhibition/workflow/:id', (req, res) => {
  try {
    const { id } = req.params
    // 实现取消逻辑
    res.json({ success: true, message: 'Workflow cancelled' })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to cancel workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 导出报告
router.get('/exhibition/export/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { format = 'markdown' } = req.query

    // 生成报告内容
    const reportContent = generateReport(id, format as string)

    // 设置响应头
    const filename = `exhibition-report-${id}.${format}`
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', getContentType(format as string))

    res.send(reportContent)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to export report',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 生成报告内容
function generateReport(id: string, format: string): string {
  const reportData = {
    title: '展陈设计报告',
    project: {
      id,
      name: '数字艺术的未来',
      theme: '探索人工智能与数字艺术的融合创新',
      budget: '500,000 CNY',
      duration: '3个月'
    },
    results: {
      concept: '通过AI技术重新定义艺术创作边界...',
      spatial: '环形空间布局，中央为互动体验区...',
      visual: '现代简约风格，以蓝色和紫色为主色调...',
      interactive: '包含AR体验、互动投影、AI创作等...',
      budget: {
        total: 500000,
        breakdown: [
          { category: '空间设计', amount: 175000 },
          { category: '视觉设计', amount: 125000 },
          { category: '互动技术', amount: 100000 },
          { category: '其他费用', amount: 100000 }
        ]
      }
    }
  }

  if (format === 'markdown') {
    return `
# ${reportData.title}

## 项目信息
- **项目ID**: ${reportData.project.id}
- **项目名称**: ${reportData.project.name}
- **主题**: ${reportData.project.theme}
- **预算**: ${reportData.project.budget}
- **展期**: ${reportData.project.duration}

## 设计方案

### 概念策划
${reportData.results.concept}

### 空间设计
${reportData.results.spatial}

### 视觉设计
${reportData.results.visual}

### 互动技术
${reportData.results.interactive}

### 预算分析
**总预算**: ¥${reportData.results.budget.total.toLocaleString()}

**明细**:
${reportData.results.budget.breakdown.map(item =>
  `- ${item.category}: ¥${item.amount.toLocaleString()}`
).join('\n')}
    `
  }

  // 其他格式可以在这里实现
  return JSON.stringify(reportData, null, 2)
}

// 获取内容类型
function getContentType(format: string): string {
  const types = {
    'markdown': 'text/markdown',
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'json': 'application/json'
  }
  return types[format as keyof typeof types] || 'text/plain'
}

export { router as exhibitionAPI }