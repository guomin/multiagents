import { Router } from 'express'
import { broadcastAgentStatus, broadcastProgress } from '../index'
import type { ExhibitionRequirement, ExhibitionState } from '../types/exhibition'
// 暂时注释掉 agentLogger，使用 console 代替
// import { agentLogger } from '../utils/agent-logger'
import { createLogger } from '../utils/logger'
import { responseTimeMonitor } from '../utils/performance-monitor'
import { projectQueries, workflowQueries, agentExecutionQueries, designResultQueries } from '../database/queries'
import { getPDFWorkerManager } from '../workers/pdf-manager'
import { optionalAuthenticate } from '../auth/middleware/auth.middleware'

const router = Router()
const logger = createLogger('EXHIBITION-API')

// 延迟创建智能体，避免在启动时就加载
let exhibitionGraph: any = null
let exhibitionGraphWithHuman: any = null

// 存储运行中的工作流实例（用于人工决策）
const activeWorkflows = new Map<string, {
  chain: any
  state: any
  requirements: ExhibitionRequirement
  dbProject: any   // 数据库项目记录
  dbWorkflow: any  // 数据库工作流记录
}>()

const getExhibitionGraph = () => {
  if (!exhibitionGraph) {
    const { ExhibitionDesignGraph } = require('../graph/exhibition-graph')
    exhibitionGraph = new ExhibitionDesignGraph()
  }
  return exhibitionGraph
}

// 使用人在回路版本的图（带完整的事件广播）
const getExhibitionGraphWithHuman = () => {
  if (!exhibitionGraphWithHuman) {
    const { ExhibitionDesignGraphWithHuman } = require('../graph/exhibition-graph-with-human')
    exhibitionGraphWithHuman = new ExhibitionDesignGraphWithHuman()
  }
  return exhibitionGraphWithHuman
}

// 获取模型配置
router.get('/model-config', (req, res) => {
  const startTime = Date.now()

  try {
    logger.info('获取模型配置请求')

    const { ModelConfigFactory } = require('../config/model')
    const config = ModelConfigFactory.createModelConfig()

    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

    // 安全地记录配置信息，不暴露敏感数据
    logger.info('模型配置获取成功', {
      provider: config.provider,
      modelName: config.modelName,
      temperature: config.temperature,
      hasApiKey: !!config.apiKey,
      apiKeyPreview: config.apiKey ? `....${config.apiKey.slice(-4)}` : 'N/A'
    })

    // 返回配置时移除敏感信息
    const { apiKey, ...safeConfig } = config
    res.json(safeConfig)
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
router.post('/exhibition/run', optionalAuthenticate, async (req, res) => {
  const startTime = Date.now()
  let projectId = ''  // 在try块外定义，以便在catch块中访问

  try {
    const requirements: ExhibitionRequirement = req.body
    const maxIterations: number = req.body.maxIterations || 3
    const autoApprove: boolean = req.body.autoApprove !== false  // 默认 true，除非明确指定 false
    const userId = req.user?.userId  // 获取用户ID（如果已登录）

    logger.info('📨 收到展览设计请求', {
      requestId: req.id,
      title: requirements.title,
      theme: requirements.theme.substring(0, 50) + '...',
      budget: `${requirements.budget?.total} ${requirements.budget?.currency}`,
      maxIterations,
      userId
    })

    // 🔑 关键修改：先同步创建项目和数据库记录，获取真实的UUID
    const dbProject = projectQueries.create({
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
      status: 'pending',  // 初始状态为pending，启动后改为running
      user_id: userId,  // 关联用户ID（如果已登录）
      created_by: userId  // 创建者ID
    })

    logger.info('项目已保存到数据库', { projectId: dbProject.id })
    console.log('✅ [API] 项目已创建，ID:', dbProject.id)

    // 创建工作流记录
    const dbWorkflow = workflowQueries.create({
      project_id: dbProject.id,
      current_step: '初始化',
      progress: 0,
      status: 'running',  // 工作流没有pending状态，直接用running
      completed_at: null,
      error_message: null
    })

    logger.info('工作流已创建', { workflowId: dbWorkflow.id })
    console.log('✅ [API] 工作流已创建，ID:', dbWorkflow.id)

    // 使用数据库生成的UUID作为projectId
    projectId = dbProject.id  // 赋值而不是重新声明

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
      theme: requirements.theme,
      autoApprove  // 记录是否自动模式
    })

    console.log('📞 [API] 准备调用 runExhibitionAsync...')
    console.log('🤖 [API] 自动模式:', autoApprove)

    // 🔑 修改：传递项目和工作的ID给异步函数
    runExhibitionAsync(
      requirements,
      maxIterations,
      projectId,
      dbWorkflow.id,  // 传递工作流ID
      req.id || 'unknown',
      autoApprove
    )

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
  workflowId: string,  // 🔑 新增：接受已创建的工作流ID
  requestId: string,
  autoApprove: boolean = true  // 新增参数：是否自动批准
) {
  const workflowStartTime = Date.now()
  let dbProject = null
  let dbWorkflow = null

  console.log('🚀 [ASYNC] runExhibitionAsync 函数已调用')
  console.log('📋 [ASYNC] 项目ID:', projectId)
  console.log('📋 [ASYNC] 工作流ID:', workflowId)
  console.log('📋 [ASYNC] 请求ID:', requestId)
  console.log('🔄 [ASYNC] 最大迭代次数:', maxIterations)
  console.log('🤖 [ASYNC] 自动模式:', autoApprove)

  try {
    logger.info('🚀 开始运行多智能体图系统', { projectId, workflowId, requestId })
    console.log('✅ [ASYNC] 已进入 try 块')

    // 🔑 修改：获取已创建的项目和工作流记录
    dbProject = projectQueries.getById(projectId)
    if (!dbProject) {
      throw new Error(`项目不存在: ${projectId}`)
    }

    dbWorkflow = workflowQueries.getById(workflowId)
    if (!dbWorkflow) {
      throw new Error(`工作流不存在: ${workflowId}`)
    }

    console.log('✅ [ASYNC] 已获取项目和记录')
    console.log('📋 [ASYNC] 项目ID:', dbProject.id)
    console.log('📋 [ASYNC] 工作流ID:', dbWorkflow.id)

    // 更新项目状态为running
    projectQueries.updateStatus(projectId, 'running')
    workflowQueries.updateStatus(workflowId, 'running')

    console.log('✅ [ASYNC] 项目和工作流状态已更新为running')

    // 广播开始状态
    broadcastProgress(0, '开始项目')
    workflowQueries.updateProgress(workflowId, '开始项目', 0)

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

    // 4. 运行真实的多智能体图系统（使用人在回路版本，带完整事件广播）
    console.log('🤖 [ASYNC] 正在获取 ExhibitionGraphWithHuman 实例...')
    const graphWithHuman = getExhibitionGraphWithHuman()
    console.log('✅ [ASYNC] ExhibitionGraphWithHuman 实例已获取，开始运行...')

    // 第一次运行：传递 autoApprove 和 projectId 参数，图会根据此参数决定是否中断
    const { graph, initialState } = await graphWithHuman.runExhibition(requirements, autoApprove, projectId)
    const chain = graph.compile()

    console.log('🔄 [ASYNC] 开始执行工作流...')
    console.log('🤖 [ASYNC] 自动批准模式:', autoApprove)

    let state = await chain.invoke(initialState)
    console.log('⏸️  [ASYNC] 工作流执行完成，waitingForHuman:', state.waitingForHuman)

    // 如果等待人工审核（人工审核模式），保存状态并等待
    if (state.waitingForHuman) {
      console.log('⏸️  [ASYNC] 人工审核模式：等待人工审核决策...')

      // 保存工作流状态（包含 dbProject 和 dbWorkflow）
      activeWorkflows.set(projectId, {
        chain,
        state,
        requirements,
        dbProject,   // 保存数据库项目记录
        dbWorkflow   // 保存数据库工作流记录
      })

      console.log('✅ [ASYNC] 工作流状态已保存，等待人工决策')
      console.log(`📋 [ASYNC] 项目ID: ${projectId} - 请调用 /api/exhibition/decision/${projectId}`)

      // 不继续执行，直接返回
      logger.info('⏸️  工作流已暂停，等待人工审核决策', {
        projectId,
        iterationCount: state.iterationCount,
        qualityScore: state.qualityEvaluation?.overallScore
      })

      return  // ← 关键：直接返回，不继续执行
    }

    // 自动批准模式会直接到这里（state.waitingForHuman === false）
    console.log('🎉 [ASYNC] 工作流已完成（自动批准模式）')

    const result = state
    console.log('🎉 [ASYNC] 多智能体图系统运行完成！')

    const totalDuration = Date.now() - workflowStartTime

    // 5. 保存设计结果到数据库
    if (result.conceptPlan) {
      designResultQueries.save(dbWorkflow.id, 'concept', JSON.stringify(result.conceptPlan))
    }
    if (result.exhibitionOutline) {
      designResultQueries.save(dbWorkflow.id, 'outline', JSON.stringify(result.exhibitionOutline))
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
    // 保存最终报告
    if (result.finalReport) {
      designResultQueries.save(dbWorkflow.id, 'report', result.finalReport)
      logger.info('最终报告已保存到数据库', { workflowId: dbWorkflow.id })
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

// 获取智能体执行结果
router.get('/exhibition/agent-result/:projectId/:agentType', async (req, res) => {
  const startTime = Date.now()

  try {
    const { projectId, agentType } = req.params

    logger.info('获取智能体结果请求', {
      requestId: req.id,
      projectId,
      agentType
    })

    // 智能体类型到结果类型的映射
    const agentTypeToResultType: Record<string, string> = {
      'curator': 'concept',
      'outline': 'outline',
      'spatial_designer': 'spatial',
      'visual_designer': 'visual',
      'interactive_tech': 'interactive',
      'budget_controller': 'budget',
      'supervisor': 'report'
    }

    const resultType = agentTypeToResultType[agentType]

    if (!resultType) {
      logger.warn('未知的智能体类型', { agentType })
      responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)
      return res.status(400).json({
        error: 'Unknown agent type',
        details: `Agent type '${agentType}' is not supported`
      })
    }

    // 从数据库查询项目和工作流
    const project = projectQueries.getById(projectId)

    if (!project) {
      logger.warn('项目不存在', { projectId })
      responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)
      return res.status(404).json({
        error: 'Project not found',
        details: `Project with ID '${projectId}' does not exist`
      })
    }

    // 获取该项目的最新工作流
    const workflows = workflowQueries.getByProjectId(projectId)

    if (!workflows || workflows.length === 0) {
      logger.warn('工作流不存在', { projectId })
      responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)
      return res.status(404).json({
        error: 'Workflow not found',
        details: `No workflow found for project '${projectId}'`
      })
    }

    const latestWorkflow = workflows[0]

    // 从 design_results 表查询结果
    const designResult = designResultQueries.getByType(latestWorkflow.id, resultType)

    if (!designResult) {
      // 检查工作流状态，提供更详细的错误信息
      const isWorkflowRunning = latestWorkflow.status === 'running'
      const isWorkflowPending = latestWorkflow.status === 'pending'
      const workflowProgress = latestWorkflow.progress || 0
      const currentStep = latestWorkflow.current_step || 'unknown'

      logger.warn('设计结果未找到', {
        workflowId: latestWorkflow.id,
        resultType,
        workflowStatus: latestWorkflow.status,
        workflowProgress,
        currentStep
      })

      responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

      // 根据工作流状态返回不同的错误信息
      if (isWorkflowRunning || isWorkflowPending) {
        return res.status(404).json({
          error: 'Workflow not completed',
          details: `工作流正在执行中（进度：${workflowProgress}%，当前步骤：${currentStep}），请等待完成后再查看结果`
        })
      }

      return res.status(404).json({
        error: 'Result not found',
        details: `智能体 '${agentType}' 的执行结果未找到。该智能体可能尚未执行或执行失败`
      })
    }

    // 解析 JSON 数据
    let resultData
    try {
      resultData = JSON.parse(designResult.result_data)
    } catch (error) {
      logger.error('解析结果数据失败', {
        workflowId: latestWorkflow.id,
        resultType,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)
      return res.status(500).json({
        error: 'Failed to parse result data',
        details: 'Invalid JSON format in database'
      })
    }

    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

    logger.info('获取智能体结果成功', {
      projectId,
      agentType,
      resultType
    })

    res.json({
      success: true,
      data: {
        agentType,
        resultType,
        resultData,
        createdAt: designResult.created_at
      }
    })
  } catch (error) {
    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

    logger.error('获取智能体结果失败', error as Error)
    res.status(500).json({
      error: 'Failed to get agent result',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 导出报告
router.get('/exhibition/export/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { format = 'markdown', force = 'false' } = req.query

    const forceRegenerate = force === 'true' || force === '1'

    logger.info('导出报告', { projectId: id, format, forceRegenerate })

    // 生成报告内容
    const reportContent = await generateReport(id, format as string, forceRegenerate)

    // 设置响应头
    const filename = `exhibition-report-${id}.${format}`

    // 根据格式设置响应
    if (format === 'pdf') {
      // PDF 格式：返回 Buffer
      const encodedFilename = encodeURIComponent(filename)
      res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Length', (reportContent as Buffer).length.toString())
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.send(reportContent)
    } else {
      // 其他格式：返回字符串
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.setHeader('Content-Type', getContentType(format as string))
      res.send(reportContent)
    }

    logger.info('报告导出成功', { projectId: id, format, forceRegenerate, contentLength: reportContent?.length || 0 })
  } catch (error) {
    logger.error('导出报告失败', error as Error)
    res.status(500).json({
      error: 'Failed to export report',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 生成报告内容
async function generateReport(id: string, format: string, forceRegenerate: boolean = false): Promise<string | Buffer> {
  // 从数据库查询项目数据
  const project = projectQueries.getById(id)

  if (!project) {
    throw new Error(`项目 ${id} 不存在`)
  }

  // 查询项目的工作流
  const workflows = workflowQueries.getByProjectId(id)
  if (workflows.length === 0) {
    throw new Error(`项目 ${id} 没有工作流记录`)
  }

  const latestWorkflow = workflows[0] // 获取最新工作流
  const designResults = designResultQueries.getByWorkflowId(latestWorkflow.id)

  // 📊 详细日志：记录查询到的所有设计结果类型
  logger.info('📊 [PDF生成] 从数据库查询到的设计结果', {
    projectId: id,
    workflowId: latestWorkflow.id,
    totalResults: designResults.length,
    resultTypes: designResults.map(r => r.result_type),
    resultDetails: designResults.map(r => ({
      type: r.result_type,
      dataSize: r.result_data?.length || 0,
      hasData: !!r.result_data
    })),
    forceRegenerate
  })

  // 查找报告
  const reportResult = designResults.find(r => r.result_type === 'report')

  let markdown: string

  if (reportResult && !forceRegenerate) {
    // 如果数据库中已有报告，且不是强制重新生成，直接返回
    logger.info('✅ [PDF生成] 从数据库读取已保存的报告', {
      projectId: id,
      workflowId: latestWorkflow.id,
      reportSize: reportResult.result_data?.length || 0
    })
    markdown = reportResult.result_data
  } else {
    // 如果数据库中没有报告，从设计结果动态生成
    logger.info('🔄 [PDF生成] 数据库中无报告，从设计结果动态生成', {
      projectId: id,
      workflowId: latestWorkflow.id
    })

    const conceptResult = designResults.find(r => r.result_type === 'concept')
    const outlineResult = designResults.find(r => r.result_type === 'outline')
    const spatialResult = designResults.find(r => r.result_type === 'spatial')
    const visualResult = designResults.find(r => r.result_type === 'visual')
    const interactiveResult = designResults.find(r => r.result_type === 'interactive')
    const budgetResult = designResults.find(r => r.result_type === 'budget')

    // 📊 详细日志：记录各个设计结果是否存在
    logger.info('📊 [PDF生成] 各设计结果查找结果', {
      hasConcept: !!conceptResult,
      hasOutline: !!outlineResult,
      hasSpatial: !!spatialResult,
      hasVisual: !!visualResult,
      hasInteractive: !!interactiveResult,
      hasBudget: !!budgetResult
    })

    // 📊 如果找到outlineResult，记录其内容概要
    if (outlineResult) {
      try {
        const outlineData = JSON.parse(outlineResult.result_data)
        logger.info('✅ [PDF生成] 找到大纲细化数据', {
          outlineId: outlineResult.id,
          dataSize: outlineResult.result_data?.length || 0,
          zones: outlineData.zones?.length || 0,
          exhibits: outlineData.exhibits?.length || 0,
          interactivePlan: outlineData.interactivePlan?.length || 0,
          hasBudgetAllocation: !!outlineData.budgetAllocation,
          hasSpaceConstraints: !!outlineData.spaceConstraints
        })
      } catch (e) {
        logger.error('❌ [PDF生成] 解析大纲细化数据失败', {
          error: e instanceof Error ? e.message : '未知错误'
        })
      }
    } else {
      logger.warn('⚠️  [PDF生成] 未找到大纲细化数据 (result_type="outline")')
    }

    logger.info('📝 [PDF生成] 开始调用 generateMarkdownFromResults')
    const startTime = Date.now()

    // 生成 Markdown 内容
    markdown = generateMarkdownFromResults(project, conceptResult, outlineResult, spatialResult, visualResult, interactiveResult, budgetResult, designResults)

    const duration = Date.now() - startTime
    logger.info('✅ [PDF生成] Markdown生成完成', {
      markdownSize: markdown?.length || 0,
      duration: `${duration}ms`,
      hasOutlineSection: markdown?.includes('### 2. 大纲细化') || false
    })
  }

  // 如果是 Markdown 格式，直接返回
  if (format === 'markdown') {
    return markdown
  }

  // 如果是 PDF 格式，将 Markdown 转换为 PDF
  if (format === 'pdf') {
    logger.info('📄 [PDF导出] 开始生成 PDF', {
      projectId: id,
      markdownSize: markdown.length,
      forceRegenerate
    })

    if (!markdown || markdown.length === 0) {
      throw new Error('Markdown 内容为空，无法生成 PDF')
    }

    const pdfBuffer = await generatePdfFromMarkdown(markdown, id)

    // 验证 PDF Buffer
    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error(`PDF 生成失败：返回的不是 Buffer (类型: ${typeof pdfBuffer})`)
    }

    if (pdfBuffer.length === 0) {
      throw new Error('PDF 生成失败：Buffer 为空')
    }

    // 检查 PDF 文件头
    const headerBytes = pdfBuffer.slice(0, 4)
    const header = String.fromCharCode(headerBytes[0], headerBytes[1], headerBytes[2], headerBytes[3])

    if (header !== '%PDF') {
      logger.error('❌ [PDF导出] 生成的文件不是有效的 PDF 格式', {
        header: header,
        headerBytes: Array.from(headerBytes),
        bufferLength: pdfBuffer.length
      })
      throw new Error('生成的文件不是有效的 PDF 格式')
    }

    logger.info('✅ [PDF导出] PDF 生成成功并已验证', {
      projectId: id,
      size: pdfBuffer.length,
      sizeKB: (pdfBuffer.length / 1024).toFixed(2),
      header: header
    })

    return pdfBuffer
  }

  // 其他格式返回 JSON
  return JSON.stringify({
    project,
    designResults: designResults.map(r => ({
      type: r.result_type,
      data: r.result_data
    }))
  }, null, 2)
}

/**
 * 从设计结果生成 Markdown
 */
function generateMarkdownFromResults(
  project: any,
  conceptResult: any,
  outlineResult: any,
  spatialResult: any,
  visualResult: any,
  interactiveResult: any,
  budgetResult: any,
  designResults: any[]
): string {
  logger.info('📝 [Markdown生成] generateMarkdownFromResults 开始执行', {
    hasConcept: !!conceptResult,
    hasOutline: !!outlineResult,
    hasSpatial: !!spatialResult,
    hasVisual: !!visualResult,
    hasInteractive: !!interactiveResult,
    hasBudget: !!budgetResult
  })

  let markdown = `# 展陈设计项目报告

## 项目概述
- **展览名称**: ${project.title}
- **展览主题**: ${project.theme}
- **目标受众**: ${project.target_audience || '未指定'}
- **展期**: ${project.start_date} 至 ${project.end_date}
- **场地面积**: ${project.venue_area}平方米
- **预算**: ${project.budget_total.toLocaleString()} ${project.budget_currency}

## 设计方案

`

  // 概念策划
  if (conceptResult) {
    try {
      const concept = JSON.parse(conceptResult.result_data)
      markdown += `### 1. 概念策划

**核心概念**: ${concept.concept || '未提供'}

**叙事结构**: ${concept.narrative || '未提供'}

**重点展品**: ${concept.keyExhibits?.join(', ') || '未提供'}

**参观流程**: ${concept.visitorFlow || '未提供'}

`
    } catch (e) {
      markdown += `### 1. 概念策划

数据解析失败

`
    }
  }

  // 大纲细化（新增）
  if (outlineResult) {
    logger.info('✅ [Markdown生成] 开始添加大纲细化章节')
    try {
      const outline = JSON.parse(outlineResult.result_data)
      logger.info('📊 [Markdown生成] 大纲数据解析成功', {
        zonesCount: outline.zones?.length || 0,
        exhibitsCount: outline.exhibits?.length || 0,
        interactivePlanCount: outline.interactivePlan?.length || 0,
        hasBudgetAllocation: !!outline.budgetAllocation,
        hasSpaceConstraints: !!outline.spaceConstraints
      })

      markdown += `### 2. 大纲细化

**展区划分** (${outline.zones?.length || 0}个展区):
${outline.zones?.map((z: any) =>
  `- **${z.name}** (占比${z.percentage}%)
  - 面积: ${z.area}㎡
  - 功能: ${z.function}
  - 预算分配: ¥${z.budgetAllocation?.toLocaleString() || '未提供'}
  - 展品数量: ${z.exhibitIds?.length || 0}件
  - 互动装置: ${z.interactiveIds?.length || 0}个`
).join('\n\n') || '未提供'}

**展品清单** (${outline.exhibits?.length || 0}件展品):
${outline.exhibits?.slice(0, 15).map((e: any) =>
  `- **${e.name}**
  - 类型: ${e.type}
  - 保护等级: ${e.protectionLevel}
  - 展柜要求: ${e.showcaseRequirement}
  - 保险费用: ¥${e.insurance?.toLocaleString() || '未提供'}
  - 运输费用: ¥${e.transportCost?.toLocaleString() || '未提供'}${e.dimensions ? `\n  - 尺寸: ${e.dimensions.length}×${e.dimensions.width}×${e.dimensions.height}米` : ''}`
).join('\n\n') || '未提供'}
${outline.exhibits?.length > 15 ? `\n*注：共 ${outline.exhibits.length} 件展品，以上仅展示前 15 件*` : ''}

**互动装置规划** (${outline.interactivePlan?.length || 0}个装置):
${outline.interactivePlan?.map((ip: any) =>
  `- **${ip.name}** (${ip.type})
  - 优先级: ${ip.priority === 'high' ? '高' : ip.priority === 'medium' ? '中' : '低'}
  - 预估成本: ¥${ip.estimatedCost?.toLocaleString() || '未提供'}
  - 放置展区: ${ip.zoneId}
  - 功能描述: ${ip.description}`
).join('\n\n') || '未提供'}

**预算框架**:
- 总预算: ¥${outline.budgetAllocation?.total?.toLocaleString() || '未提供'}
${outline.budgetAllocation?.breakdown?.map((b: any) =>
  `- **${b.category}**: ¥${b.amount?.toLocaleString() || '未提供'}${b.subCategories ? `\n  ${b.subCategories.map((sub: any) => `    - ${sub.name}: ¥${sub.amount?.toLocaleString() || '未提供'}`).join('\n ')}` : ''}`
).join('\n') || '未提供'}

**空间约束**:
- 总面积: ${outline.spaceConstraints?.totalArea || '未提供'}㎡
- 展区数量: ${outline.spaceConstraints?.minZoneCount || '-'} - ${outline.spaceConstraints?.maxZoneCount || '-'} 个
- 通道宽度: ≥${outline.spaceConstraints?.minAisleWidth || '-'} 米
- 主展区占比: ≥${outline.spaceConstraints?.mainZoneRatio ? (outline.spaceConstraints.mainZoneRatio * 100).toFixed(0) : '-'}%

`
      logger.info('✅ [Markdown生成] 大纲细化章节添加成功')
    } catch (e) {
      logger.error('❌ [Markdown生成] 大纲数据解析失败', {
        error: e instanceof Error ? e.message : '未知错误',
        stack: e instanceof Error ? e.stack : undefined
      })
      markdown += `### 2. 大纲细化

数据解析失败: ${e instanceof Error ? e.message : '未知错误'}

`
    }
  } else {
    logger.warn('⚠️  [Markdown生成] outlineResult 为空，跳过大纲细化章节')
  }

  // 空间设计
  if (spatialResult) {
    try {
      const spatial = JSON.parse(spatialResult.result_data)
      markdown += `### 3. 空间设计

**布局方案**: ${spatial.layout || '未提供'}

**参观路线**: ${spatial.visitorRoute?.join(' → ') || '未提供'}

**功能区域**:
${spatial.zones?.map((z: any) => `- ${z.name}: ${z.area}㎡ (${z.function})`).join('\n') || '未提供'}

`
    } catch (e) {
      markdown += `### 3. 空间设计

数据解析失败

`
    }
  }

  // 视觉设计
  if (visualResult) {
    try {
      const visual = JSON.parse(visualResult.result_data)
      markdown += `### 4. 视觉设计

**色彩方案**: ${visual.colorScheme?.join(', ') || '未提供'}

**字体设计**: ${visual.typography || '未提供'}

**品牌元素**: ${visual.brandElements?.join(', ') || '未提供'}

**视觉风格**: ${visual.visualStyle || '未提供'}

`
    } catch (e) {
      markdown += `### 4. 视觉设计

数据解析失败

`
    }
  }

  // 互动技术
  if (interactiveResult) {
    try {
      const interactive = JSON.parse(interactiveResult.result_data)
      markdown += `### 5. 互动技术

**使用技术**: ${interactive.technologies?.join(', ') || '未提供'}

**互动装置**:
${interactive.interactives?.map((i: any) => `- **${i.name}** (${i.type}): ${i.description}${i.cost ? ` - 成本: ¥${i.cost.toLocaleString()}` : ''}`).join('\n') || '未提供'}

`
    } catch (e) {
      markdown += `### 5. 互动技术

数据解析失败

`
    }
  }

  // 预算估算
  if (budgetResult) {
    try {
      const budget = JSON.parse(budgetResult.result_data)
      markdown += `### 6. 预算估算

**总成本**: ${budget.totalCost?.toLocaleString() || '未提供'} ${project.budget_currency}

**预算明细**:
${budget.breakdown?.map((b: any) => `- **${b.category}**: ${b.description || ''} - ${b.amount?.toLocaleString() || '未提供'} ${project.budget_currency}`).join('\n') || '未提供'}

**优化建议**:
${budget.recommendations?.map((r: string) => `- ${r}`).join('\n') || '无'}

`
    } catch (e) {
      markdown += `### 6. 预算估算

数据解析失败

`
    }
  }

  // 添加项目完成状态
  const completedSteps = [conceptResult, outlineResult, spatialResult, visualResult, interactiveResult, budgetResult].filter(Boolean).length

  markdown += `## 项目状态

**完成度**: ${Math.round((completedSteps / 6) * 100)}% (${completedSteps}/6个阶段已完成)

**项目状态**: ${project.status === 'completed' ? '已完成' : '进行中'}

**创建时间**: ${new Date(project.created_at).toLocaleString('zh-CN')}

---

*本报告由展陈设计多智能体系统自动生成*
`

  // 📊 详细日志：记录最终生成的markdown概要
  logger.info('✅ [Markdown生成] generateMarkdownFromResults 执行完成', {
    totalSize: markdown.length,
    completedSteps,
    completionPercentage: `${Math.round((completedSteps / 6) * 100)}%`,
    sections: {
      hasConcept: markdown.includes('### 1. 概念策划'),
      hasOutline: markdown.includes('### 2. 大纲细化'),
      hasSpatial: markdown.includes('### 3. 空间设计'),
      hasVisual: markdown.includes('### 4. 视觉设计'),
      hasInteractive: markdown.includes('### 5. 互动技术'),
      hasBudget: markdown.includes('### 6. 预算估算')
    }
  })

  return markdown
}

/**
 * 将 Markdown 转换为 PDF（使用 Worker Thread）
 * @param markdown Markdown 内容
 * @param projectId 项目ID（用于跟踪）
 */
async function generatePdfFromMarkdown(markdown: string, projectId: string): Promise<Buffer> {
  logger.info('📄 [PDF Worker] 准备使用 Worker 生成 PDF', {
    projectId,
    markdownLength: markdown.length
  });

  try {
    // 使用 Worker 生成 PDF，避免阻塞主线程
    const pdfManager = getPDFWorkerManager();
    const result = await pdfManager.generatePDF({
      markdown,
      projectId
    });

    logger.info('✅ [PDF Worker] PDF 生成完成', {
      projectId,
      duration: result.duration,
      size: result.buffer.length
    });

    return result.buffer;

  } catch (error) {
    // PDF Worker Manager 内部已处理降级到主线程的逻辑
    // 如果仍然抛出错误，说明主线程生成也失败了
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ [PDF导出] PDF 生成彻底失败（包括降级方案）', error as Error, {
      projectId,
      markdownLength: markdown?.length || 0,
      errorMessage,
      errorStack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    });

    // 向客户端返回更友好的错误信息
    throw new Error(
      `PDF 生成失败：${errorMessage}。请联系管理员并提供项目ID: ${projectId}`
    );
  }
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

// 提交人工审核决策
router.post('/exhibition/decision/:projectId', async (req, res) => {
  const startTime = Date.now()

  try {
    const { projectId } = req.params
    const { decision, feedback, revisionTarget } = req.body

    logger.info('收到人工审核决策', {
      projectId,
      decision,
      feedback: feedback?.substring(0, 100) || '',
      revisionTarget
    })

    // 验证决策参数
    if (!decision || !['approve', 'revise', 'reject'].includes(decision)) {
      responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

      return res.status(400).json({
        success: false,
        error: 'Invalid decision. Must be one of: approve, revise, reject'
      })
    }

    // 从 activeWorkflows 获取工作流数据
    const workflowData = activeWorkflows.get(projectId)
    if (!workflowData) {
      responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

      logger.warn('工作流未找到或不在等待决策状态', { projectId })

      return res.status(404).json({
        success: false,
        error: '工作流已完成或不在等待决策状态，无需提交决策',
        projectId,
        hint: '如果您看到此错误，可能是：1) 工作流已自动完成（自动批准模式） 2) 工作流尚未执行到审核点'
      })
    }

    console.log('📋 [DECISION] 找到工作流，开始处理人工决策...')
    console.log('📋 [DECISION] 决策类型:', decision)
    console.log('📋 [DECISION] 反馈:', feedback)

    // 解构工作流数据
    const { chain, state, requirements, dbProject, dbWorkflow } = workflowData

    console.log('📋 [DECISION] dbProject:', dbProject ? '存在' : '不存在')
    console.log('📋 [DECISION] dbWorkflow:', dbWorkflow ? '存在' : '不存在')

    // 更新状态，添加人工决策
    const updatedState: any = {
      ...state,
      humanDecision: decision,
      humanFeedback: feedback || '',
      lastRevisionStep: revisionTarget || state.qualityEvaluation?.revisionTarget || 'all',
      waitingForHuman: false
    }

    // 🔑 关键：确保所有必需字段都存在
    if (!updatedState.requirements) {
      throw new Error('requirements 字段缺失，无法继续执行工作流')
    }
    if (!updatedState.currentStep) {
      updatedState.currentStep = '处理人工决策'
    }
    if (!updatedState.messages || !Array.isArray(updatedState.messages)) {
      updatedState.messages = []
    }
    if (typeof updatedState.iterationCount !== 'number') {
      updatedState.iterationCount = 0
    }
    if (typeof updatedState.maxIterations !== 'number') {
      updatedState.maxIterations = 3
    }

    console.log('✅ [DECISION] 状态已更新，继续执行工作流...')
    console.log('📋 [DECISION] 更新后的状态:', {
      humanDecision: updatedState.humanDecision,
      waitingForHuman: updatedState.waitingForHuman,
      needsRevision: updatedState.needsRevision,
      hasConceptPlan: !!updatedState.conceptPlan,
      hasSpatialLayout: !!updatedState.spatialLayout,
      hasVisualDesign: !!updatedState.visualDesign,
      hasInteractiveSolution: !!updatedState.interactiveSolution,
      hasBudgetEstimate: !!updatedState.budgetEstimate,
      hasQualityEvaluation: !!updatedState.qualityEvaluation
    })

    // 🔑 关键：使用 StreamConfig 的 configurable.checkpoint_id 来从断点恢复
    // 但 LangGraph 的简单方案是：直接 invoke 一次完整流程
    // 由于条件边已判断有人工决策，会跳过前面节点直接进入 human_decision
    let result
    try {
      result = await chain.invoke(updatedState, {
        configurable: {
          // 如果图支持 checkpoint，可以在这里指定
        }
      })
    } catch (error) {
      console.error('❌ [DECISION] 工作流执行失败:', error)
      logger.error('工作流执行失败', error as Error, {
        projectId,
        decision,
        state: updatedState
      })
      throw error
    }

    console.log('🎉 [DECISION] 工作流执行完成')
    console.log('🎉 [DECISION] 最终状态:', {
      waitingForHuman: result.waitingForHuman,
      iterationCount: result.iterationCount
    })

    // 如果不再等待人工决策，从 activeWorkflows 中移除
    if (!result.waitingForHuman) {
      activeWorkflows.delete(projectId)
      console.log('🗑️  [DECISION] 工作流已完成，从 activeWorkflows 中移除')

      // 保存最终结果到数据库（直接使用 dbWorkflow，不需要重新查询）
      if (dbWorkflow && result) {
        console.log('💾 [DECISION] 保存设计结果到数据库, workflowId:', dbWorkflow.id)

        if (result.conceptPlan) {
          designResultQueries.save(dbWorkflow.id, 'concept', JSON.stringify(result.conceptPlan))
        }
        if (result.exhibitionOutline) {
          designResultQueries.save(dbWorkflow.id, 'outline', JSON.stringify(result.exhibitionOutline))
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
        // 保存最终报告
        if (result.finalReport) {
          designResultQueries.save(dbWorkflow.id, 'report', result.finalReport)
          logger.info('最终报告已保存到数据库（人工审核模式）', { workflowId: dbWorkflow.id })
        }

        // 更新项目和工作流状态
        projectQueries.updateStatus(dbProject.id, 'completed')
        workflowQueries.complete(dbWorkflow.id)

        // 广播完成状态
        broadcastProgress(100, '项目完成')

        logger.info('人工审核决策后工作流完成', {
          projectId,
          decision,
          iterationCount: result.iterationCount
        })
      }
    } else {
      // 仍在等待决策（可能是修订后再次达到审核点）
      console.log('⏸️  [DECISION] 工作流再次等待人工决策')

      // 更新工作流状态
      activeWorkflows.set(projectId, {
        chain,
        state: result,
        requirements,
        dbProject,
        dbWorkflow
      })

      logger.info('人工审核决策后工作流再次暂停', {
        projectId,
        decision,
        iterationCount: result.iterationCount,
        qualityScore: result.qualityEvaluation?.overallScore
      })
    }

    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

    res.json({
      success: true,
      status: result.waitingForHuman ? 'waiting_for_human' : 'completed',
      decision,
      iterationCount: result.iterationCount,
      qualityEvaluation: result.qualityEvaluation,
      message: result.waitingForHuman
        ? '工作流已修订，再次等待审核'
        : '工作流已完成'
    })

  } catch (error) {
    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

    console.error('❌ [DECISION] 处理人工决策失败:', error)
    logger.error('处理人工审核决策失败', error as Error, {
      projectId: req.params.projectId,
      decision: req.body.decision
    })

    res.status(500).json({
      success: false,
      error: 'Failed to process decision',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 继续执行（单步调试模式）
router.post('/exhibition/continue/:projectId', async (req, res) => {
  const startTime = Date.now()

  try {
    const { projectId } = req.params

    logger.info('收到继续执行请求', {
      requestId: req.id,
      projectId
    })

    // 1. 从数据库获取项目
    const project = projectQueries.getById(projectId)
    if (!project) {
      responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

      logger.warn('项目不存在', { projectId })
      return res.status(404).json({
        success: false,
        error: '项目不存在',
        projectId
      })
    }

    // 2. 从 activeWorkflows 获取工作流状态
    const workflowData = activeWorkflows.get(projectId)
    if (!workflowData) {
      responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

      logger.warn('工作流未找到', { projectId })
      return res.status(400).json({
        success: false,
        error: '工作流未找到或不在暂停状态',
        projectId,
        hint: '请确认项目处于单步调试模式暂停状态'
      })
    }

    // 3. 检查是否处于单步暂停状态
    if (!workflowData.state.pausedAfterOutline) {
      responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

      logger.warn('项目未处于单步暂停状态', {
        projectId,
        pausedAfterOutline: workflowData.state.pausedAfterOutline
      })
      return res.status(400).json({
        success: false,
        error: '项目未处于单步暂停状态',
        projectId
      })
    }

    // 4. 清除暂停标志，继续执行
    const updatedState = {
      ...workflowData.state,
      pausedAfterOutline: false,
      waitingForHuman: false,
      currentStep: 'continuing-execution',
      messages: [...workflowData.state.messages, '🟢 继续执行后续流程...']
    }

    logger.info('继续执行工作流', {
      projectId,
      currentStep: updatedState.currentStep
    })

    // 5. 异步执行后续流程
    setImmediate(async () => {
      try {
        logger.info('[继续执行] 开始异步执行', { projectId })

        const result = await workflowData.chain.invoke(updatedState)

        logger.info('[继续执行] 执行完成', {
          projectId,
          finalStep: result.currentStep
        })

        // 如果不再等待人工决策，从 activeWorkflows 中移除
        if (!result.waitingForHuman) {
          activeWorkflows.delete(projectId)
          logger.info('[继续执行] 工作流完成，从activeWorkflows中移除', { projectId })

          // 保存最终结果到数据库
          workflowQueries.complete(workflowData.dbWorkflow.id)
          projectQueries.updateStatus(projectId, 'completed')

          broadcastProgress(100, '项目完成')
          broadcastLog('success', '🎉 展陈设计项目完成！')

        } else {
          // 如果再次进入等待状态（比如supervisor审核），更新保存的状态
          activeWorkflows.set(projectId, {
            ...workflowData,
            state: result
          })
          logger.info('[继续执行] 工作流再次暂停', { projectId })
        }

      } catch (error) {
        console.error('[继续执行] 工作流执行失败:', error)
        logger.error('继续执行工作流失败', error as Error, { projectId })
      }
    })

    res.json({
      success: true,
      message: '继续执行',
      projectId,
      currentStep: 'continuing-execution'
    })

    logger.info('继续执行请求已接受', {
      projectId,
      duration: Date.now() - startTime
    })

    responseTimeMonitor.recordResponse(req.originalUrl, req.method, Date.now() - startTime)

  } catch (error) {
    console.error('❌ [CONTINUE] 处理继续执行请求失败:', error)
    logger.error('处理继续执行请求失败', error as Error, {
      projectId: req.params.projectId
    })

    res.status(500).json({
      success: false,
      error: '继续执行失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export { router as exhibitionAPI }