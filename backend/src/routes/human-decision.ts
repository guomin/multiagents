import { Router } from 'express'
import { createLogger } from '../utils/logger'

const router = Router()
const logger = createLogger('HUMAN-DECISION-API')

// 存储运行中的图实例
const activeGraphs = new Map<string, any>()

// 启动带人工审核的流程
router.post('/exhibition/start-with-human', async (req, res) => {
  try {
    const { requirements, maxIterations = 3 } = req.body
    const projectId = `project_${Date.now()}`

    logger.info('🚀 启动人在回路模式', {
      projectId,
      title: requirements.title,
      maxIterations
    })

    // 动态导入以避免启动时加载
    const { ExhibitionDesignGraphWithHuman } = await import('../graph/exhibition-graph-with-human')
    const system = new ExhibitionDesignGraphWithHuman()

    const { graph, initialState } = await system.runExhibition(requirements)

    // 编译图
    const chain = graph.compile()

    // 启动执行（会在审核点暂停）
    const result = await chain.invoke(initialState)

    // 保存图实例和状态
    activeGraphs.set(projectId, {
      chain,
      state: result
    })

    // 检查是否在等待人工审核
    if (result.waitingForHuman) {
      res.json({
        success: true,
        projectId,
        status: 'waiting_for_human',
        message: '等待人工审核',
        data: {
          qualityEvaluation: result.qualityEvaluation,
          currentStep: result.currentStep,
          iterationCount: result.iterationCount
        }
      })
    } else {
      res.json({
        success: true,
        projectId,
        status: 'completed',
        result
      })
    }

  } catch (error) {
    logger.error('❌ 启动人在回路流程失败', error as Error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 提交人工审核决策
router.post('/exhibition/human-decision/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const { decision, feedback, revisionTarget } = req.body

    logger.info('👤 收到人工决策', {
      projectId,
      decision,
      feedback,
      revisionTarget
    })

    // 验证决策
    if (!['approve', 'revise', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid decision. Must be approve, revise, or reject'
      })
    }

    // 获取图实例
    const graphData = activeGraphs.get(projectId)
    if (!graphData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      })
    }

    // 更新状态，添加人工决策
    const updatedState = {
      ...graphData.state,
      humanDecision: decision,
      humanFeedback: feedback,
      lastRevisionStep: revisionTarget || graphData.state.qualityEvaluation?.revisionTarget,
      waitingForHuman: false
    }

    // 继续执行
    const result = await graphData.chain.invoke(updatedState)

    // 更新状态
    graphData.state = result

    // 如果还在等待人工审核
    if (result.waitingForHuman) {
      res.json({
        success: true,
        status: 'waiting_for_human',
        message: '继续等待人工审核',
        data: {
          qualityEvaluation: result.qualityEvaluation,
          currentStep: result.currentStep,
          iterationCount: result.iterationCount
        }
      })
    } else {
      // 完成
      activeGraphs.delete(projectId)

      res.json({
        success: true,
        status: 'completed',
        message: '流程已完成',
        result
      })
    }

  } catch (error) {
    logger.error('❌ 处理人工决策失败', error as Error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// 获取项目当前状态
router.get('/exhibition/status/:projectId', (req, res) => {
  try {
    const { projectId } = req.params
    const graphData = activeGraphs.get(projectId)

    if (!graphData) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      })
    }

    res.json({
      success: true,
      status: graphData.state.waitingForHuman ? 'waiting_for_human' : 'processing',
      data: {
        currentStep: graphData.state.currentStep,
        iterationCount: graphData.state.iterationCount,
        qualityEvaluation: graphData.state.qualityEvaluation,
        messages: graphData.state.messages
      }
    })

  } catch (error) {
    logger.error('❌ 获取项目状态失败', error as Error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export { router as humanDecisionAPI }
