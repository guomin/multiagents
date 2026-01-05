import { StateGraph, END } from "@langchain/langgraph";
import { ExhibitionStateSchema, ExhibitionState } from "../types/exhibition";
import { CuratorAgent } from "../agents/curator";
import { SpatialDesignerAgent } from "../agents/spatial-designer";
import { VisualDesignerAgent } from "../agents/visual-designer";
import { InteractiveTechAgent } from "../agents/interactive-tech";
import { BudgetControllerAgent } from "../agents/budget-controller";
import { SupervisorAgent } from "../agents/supervisor";
import { broadcastAgentStatus, broadcastProgress, broadcastLog } from "../index";
import { createLogger } from "../utils/logger";
import {
  checkBudgetOverrun,
  determineNextStep,
  updateIterationState,
  prepareRevisionState
} from "./revision-controller";

const logger = createLogger('EXHIBITION-GRAPH');

export class ExhibitionDesignGraph {
  private curator: CuratorAgent;
  private spatialDesigner: SpatialDesignerAgent;
  private visualDesigner: VisualDesignerAgent;
  private interactiveTech: InteractiveTechAgent;
  private budgetController: BudgetControllerAgent;
  private supervisor: SupervisorAgent;

  constructor() {
    this.curator = new CuratorAgent();
    this.spatialDesigner = new SpatialDesignerAgent();
    this.visualDesigner = new VisualDesignerAgent();
    this.interactiveTech = new InteractiveTechAgent();
    this.budgetController = new BudgetControllerAgent();
    this.supervisor = new SupervisorAgent();
  }

  createGraph(): StateGraph<ExhibitionState> {
    const workflow = new StateGraph(ExhibitionStateSchema);

    // 定义节点函数
    const curatorNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      logger.info("🎨 策划智能体开始工作...", {
        step: "curator",
        iteration: state.iterationCount + 1,
        maxIterations: state.maxIterations
      });

      broadcastAgentStatus('curator', {
        status: 'running',
        startTime: new Date()
      });

      const progressBase = (state.iterationCount / (state.maxIterations + 1)) * 100;
      broadcastProgress(progressBase, `策划智能体工作中... (迭代 ${state.iterationCount + 1}/${state.maxIterations})`);

      try {
        const conceptPlan = await this.curator.generateConceptPlan(state.requirements);

        broadcastAgentStatus('curator', {
          status: 'completed',
          endTime: new Date()
        });

        logger.info("✅ 策划智能体完成工作", {
          iteration: state.iterationCount + 1,
          hasRevisionReason: !!state.revisionReason
        });

        return {
          ...state,
          conceptPlan,
          currentStep: "概念策划完成",
          messages: [...state.messages, `概念策划已完成 (迭代 ${state.iterationCount + 1})`],
          revisionReason: undefined
        };
      } catch (error) {
        broadcastAgentStatus('curator', {
          status: 'error',
          endTime: new Date(),
          error: error instanceof Error ? error.message : '未知错误'
        });

        logger.error("❌ 策划智能体执行失败", error as Error);
        throw error;
      }
    };

    const spatialDesignerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan) {
        throw new Error("概念策划尚未完成，无法进行空间设计");
      }

      logger.info("🏗️ 空间设计智能体开始工作...", {
        step: "spatial",
        iteration: state.iterationCount + 1
      });

      broadcastAgentStatus('spatial', {
        status: 'running',
        startTime: new Date()
      });

      const progressBase = (state.iterationCount / (state.maxIterations + 1)) * 100;
      broadcastProgress(progressBase + 16, `空间设计智能体工作中... (迭代 ${state.iterationCount + 1}/${state.maxIterations})`);

      try {
        const spatialLayout = await this.spatialDesigner.generateSpatialLayout(
          state.requirements,
          state.conceptPlan
        );

        broadcastAgentStatus('spatial', {
          status: 'completed',
          endTime: new Date()
        });

        logger.info("✅ 空间设计智能体完成工作");

        return {
          ...state,
          spatialLayout,
          currentStep: "空间设计完成",
          messages: [...state.messages, `空间设计已完成 (迭代 ${state.iterationCount + 1})`],
          revisionReason: undefined
        };
      } catch (error) {
        broadcastAgentStatus('spatial', {
          status: 'error',
          endTime: new Date(),
          error: error instanceof Error ? error.message : '未知错误'
        });

        logger.error("❌ 空间设计智能体执行失败", error as Error);
        throw error;
      }
    };

    const visualDesignerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan) {
        throw new Error("概念策划尚未完成，无法进行视觉设计");
      }

      logger.info("🎭 视觉设计智能体开始工作...");

      broadcastAgentStatus('visual', {
        status: 'running',
        startTime: new Date()
      });

      broadcastProgress(33, '视觉设计智能体工作中...');

      try {
        const visualDesign = await this.visualDesigner.generateVisualDesign(
          state.requirements,
          state.conceptPlan,
          state.revisionReason
        );

        broadcastAgentStatus('visual', {
          status: 'completed',
          endTime: new Date()
        });

        logger.info("✅ 视觉设计智能体完成工作");

        return {
          ...state,
          visualDesign,
          currentStep: "视觉设计完成",
          messages: [...state.messages, "视觉设计已完成"],
          revisionReason: undefined
        };
      } catch (error) {
        broadcastAgentStatus('visual', {
          status: 'error',
          endTime: new Date(),
          error: error instanceof Error ? error.message : '未知错误'
        });

        logger.error("❌ 视觉设计智能体执行失败", error as Error);
        throw error;
      }
    };

    const interactiveTechNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan) {
        throw new Error("概念策划尚未完成，无法进行互动技术设计");
      }

      logger.info("💻 互动技术智能体开始工作...");

      broadcastAgentStatus('interactive', {
        status: 'running',
        startTime: new Date()
      });

      broadcastProgress(50, '互动技术智能体工作中...');

      try {
        const interactiveSolution = await this.interactiveTech.generateInteractiveSolution(
          state.requirements,
          state.conceptPlan,
          state.revisionReason
        );

        broadcastAgentStatus('interactive', {
          status: 'completed',
          endTime: new Date()
        });

        logger.info("✅ 互动技术智能体完成工作");

        return {
          ...state,
          interactiveSolution,
          currentStep: "互动技术方案完成",
          messages: [...state.messages, "互动技术方案已完成"],
          revisionReason: undefined
        };
      } catch (error) {
        broadcastAgentStatus('interactive', {
          status: 'error',
          endTime: new Date(),
          error: error instanceof Error ? error.message : '未知错误'
        });

        logger.error("❌ 互动技术智能体执行失败", error as Error);
        throw error;
      }
    };

    // 并行节点：同时执行视觉设计和互动技术
    const parallelDesignsNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan) {
        throw new Error("概念策划尚未完成，无法进行设计");
      }

      logger.info("🔄 启动并行设计流程（视觉设计 + 互动技术）...");

      broadcastProgress(33, '并行设计中：视觉 + 互动技术...');

      try {
        // 确保 conceptPlan 存在（类型检查）
        const conceptPlan = state.conceptPlan;

        // 并行执行两个设计任务
        const [visualDesign, interactiveSolution] = await Promise.all([
          (async () => {
            logger.info("🎭 视觉设计智能体工作中...");
            broadcastAgentStatus('visual', { status: 'running', startTime: new Date() });
            const result = await this.visualDesigner.generateVisualDesign(
              state.requirements,
              conceptPlan,
              state.revisionReason
            );
            broadcastAgentStatus('visual', { status: 'completed', endTime: new Date() });
            logger.info("✅ 视觉设计智能体完成");
            return result;
          })(),
          (async () => {
            logger.info("💻 互动技术智能体工作中...");
            broadcastAgentStatus('interactive', { status: 'running', startTime: new Date() });
            const result = await this.interactiveTech.generateInteractiveSolution(
              state.requirements,
              conceptPlan,
              state.revisionReason
            );
            broadcastAgentStatus('interactive', { status: 'completed', endTime: new Date() });
            logger.info("✅ 互动技术智能体完成");
            return result;
          })()
        ]);

        logger.info("🎉 并行设计流程完成！");

        return {
          ...state,
          visualDesign,
          interactiveSolution,
          currentStep: "并行设计完成",
          messages: [
            ...state.messages,
            "视觉设计已完成",
            "互动技术方案已完成"
          ],
          revisionReason: undefined
        };
      } catch (error) {
        logger.error("❌ 并行设计流程失败", error as Error);

        // 标记失败的节点
        broadcastAgentStatus('visual', {
          status: 'error',
          endTime: new Date(),
          error: error instanceof Error ? error.message : '未知错误'
        });
        broadcastAgentStatus('interactive', {
          status: 'error',
          endTime: new Date(),
          error: error instanceof Error ? error.message : '未知错误'
        });

        throw error;
      }
    };

    const budgetControllerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan || !state.spatialLayout || !state.visualDesign || !state.interactiveSolution) {
        throw new Error("所有设计方案尚未完成，无法进行预算估算");
      }

      logger.info("💰 预算控制智能体开始工作...");

      broadcastAgentStatus('budget', {
        status: 'running',
        startTime: new Date()
      });

      broadcastProgress(67, '预算控制智能体工作中...');

      try {
        const budgetEstimate = await this.budgetController.generateBudgetEstimate(
          state.requirements,
          state.conceptPlan!,
          state.spatialLayout!,
          state.visualDesign!,
          state.interactiveSolution!
        );

        broadcastAgentStatus('budget', {
          status: 'completed',
          endTime: new Date()
        });

        logger.info("✅ 预算控制智能体完成工作");

        return {
          ...state,
          budgetEstimate,
          currentStep: "预算估算完成",
          messages: [...state.messages, "预算估算已完成"]
        };
      } catch (error) {
        broadcastAgentStatus('budget', {
          status: 'error',
          endTime: new Date(),
          error: error instanceof Error ? error.message : '未知错误'
        });

        logger.error("❌ 预算控制智能体执行失败", error as Error);
        throw error;
      }
    };

    const supervisorNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      logger.info("👔 协调主管进行质量评估...", {
        iteration: state.iterationCount + 1,
        maxIterations: state.maxIterations
      });

      broadcastAgentStatus('supervisor', {
        status: 'running',
        startTime: new Date()
      });

      broadcastProgress(83, `协调主管分析进度... (迭代 ${state.iterationCount + 1}/${state.maxIterations})`);

      try {
        const qualityEvaluation = await this.supervisor.evaluateQuality(state);
        const revisionDecision = this.supervisor.shouldRevise(
          qualityEvaluation,
          state.iterationCount,
          state.maxIterations
        );

        logger.info("📊 质量评估结果:", {
          overallScore: qualityEvaluation.overallScore,
          conceptScore: qualityEvaluation.conceptScore,
          spatialScore: qualityEvaluation.spatialScore,
          visualScore: qualityEvaluation.visualScore,
          interactiveScore: qualityEvaluation.interactiveScore,
          budgetScore: qualityEvaluation.budgetScore,
          revisionTarget: qualityEvaluation.revisionTarget,
          feedback: qualityEvaluation.feedback,
          needsRevision: revisionDecision.needsRevision,
          reason: revisionDecision.reason
        });

        return {
          ...state,
          qualityEvaluation,
          needsRevision: revisionDecision.needsRevision,
          currentStep: "质量评估完成",
          messages: [
            ...state.messages,
            `质量评估: ${(qualityEvaluation.overallScore * 100).toFixed(1)}分 - ${revisionDecision.reason}`
          ]
        };
      } catch (error) {
        logger.error("❌ 协调主管分析失败", error as Error);
        throw error;
      }
    };

    const finalizeNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      logger.info("📋 生成最终报告...", {
        totalIterations: state.iterationCount + 1,
        qualityScore: state.qualityEvaluation?.overallScore
      });

      broadcastAgentStatus('supervisor', {
        status: 'running',
        startTime: new Date()
      });

      broadcastProgress(95, '生成最终报告...');
      broadcastLog('info', '📋 生成最终报告...');

      try {
        const finalReport = await this.supervisor.generateFinalReport(state);

        broadcastAgentStatus('supervisor', {
          status: 'completed',
          endTime: new Date()
        });

        broadcastProgress(100, '项目完成');
        broadcastLog('success', '🎉 展陈设计项目完成！');

        logger.info("🎉 展陈设计项目完成！", {
          hasConceptPlan: !!state.conceptPlan,
          hasSpatialLayout: !!state.spatialLayout,
          hasVisualDesign: !!state.visualDesign,
          hasInteractiveSolution: !!state.interactiveSolution,
          hasBudgetEstimate: !!state.budgetEstimate,
          iterationCount: state.iterationCount + 1,
          qualityScore: state.qualityEvaluation?.overallScore
        });

        return {
          ...state,
          currentStep: "项目完成",
          finalReport,
          messages: [...state.messages, "最终报告已生成"]
        };
      } catch (error) {
        broadcastAgentStatus('supervisor', {
          status: 'error',
          endTime: new Date(),
          error: error instanceof Error ? error.message : '未知错误'
        });

        logger.error("❌ 协调主管执行失败", error as Error);
        throw error;
      }
    };

    // 迭代控制器节点 - 处理状态更新和修订逻辑
    const iterationControllerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      logger.info("🔄 迭代控制器评估...", {
        iteration: state.iterationCount + 1,
        maxIterations: state.maxIterations
      });

      const nextStep = determineNextStep(state);

      logger.info("➡️  迭代控制器决策", {
        nextStep: nextStep.target,
        reason: nextStep.reason
      });

      // 如果需要修订，更新状态
      if (nextStep.target !== "finalize" && nextStep.target !== "supervisor") {
        logger.info("🔧 触发修订流程", {
          revisionTarget: nextStep.target,
          reason: nextStep.reason
        });

        // 更新迭代状态
        const iterationUpdate = updateIterationState(state, nextStep.reason);
        const revisionUpdate = prepareRevisionState(state);

        // 设置修订原因（用于智能体）
        const updatedState = {
          ...state,
          ...iterationUpdate,
          ...revisionUpdate,
          revisionReason: nextStep.reason,
          currentStep: `返回${nextStep.target}重新设计`
        };

        logger.info("📝 状态已更新", {
          iterationCount: updatedState.iterationCount,
          revisionTarget: updatedState.lastRevisionStep,
          hasRevisionReason: !!updatedState.revisionReason
        });

        return updatedState;
      }

      // 不需要修订，返回原状态
      return state;
    };

    // 添加节点到工作流
    workflow.addNode("curator", curatorNode);
    workflow.addNode("spatial_designer", spatialDesignerNode);
    workflow.addNode("parallel_designs", parallelDesignsNode); // 新增并行节点
    workflow.addNode("visual_designer", visualDesignerNode);  // 保留用于单独修订
    workflow.addNode("interactive_tech", interactiveTechNode); // 保留用于单独修订
    workflow.addNode("budget_controller", budgetControllerNode);
    workflow.addNode("supervisor", supervisorNode);
    workflow.addNode("iteration_controller", iterationControllerNode);
    workflow.addNode("finalize", finalizeNode);

    // 设置入口点
    workflow.setEntryPoint("curator" as any);

    // 添加条件边 - 策展人节点
    workflow.addConditionalEdges(
      "curator" as any,
      (state: ExhibitionState) => {
        return state.conceptPlan ? "spatial_designer" : END;
      }
    );

    // 添加条件边 - 空间设计节点 → 并行设计节点
    workflow.addConditionalEdges(
      "spatial_designer" as any,
      (state: ExhibitionState) => {
        return state.spatialLayout ? "parallel_designs" : END;
      }
    );

    // 添加条件边 - 并行设计节点 → 预算控制器
    workflow.addConditionalEdges(
      "parallel_designs" as any,
      (state: ExhibitionState) => {
        // 只有当两个设计都完成时才继续
        return (state.visualDesign && state.interactiveSolution) ? "budget_controller" : END;
      }
    );

    // 保留单独的视觉设计和互动技术节点用于修订时的单独执行
    // 添加条件边 - 视觉设计节点（用于单独修订）
    workflow.addConditionalEdges(
      "visual_designer" as any,
      (state: ExhibitionState) => {
        return state.visualDesign ? "budget_controller" : END;
      }
    );

    // 添加条件边 - 互动技术节点（用于单独修订）
    workflow.addConditionalEdges(
      "interactive_tech" as any,
      (state: ExhibitionState) => {
        return state.interactiveSolution ? "budget_controller" : END;
      }
    );

    // 添加条件边 - 预算控制器节点 → supervisor 或 iteration_controller
    workflow.addConditionalEdges(
      "budget_controller" as any,
      (state: ExhibitionState) => {
        // 总是去主管评估
        return "supervisor";
      }
    );

    // 添加条件边 - 主管评估节点 → iteration_controller
    workflow.addEdge("supervisor" as any, "iteration_controller" as any);

    // 添加条件边 - 迭代控制器节点（多分支决策）
    workflow.addConditionalEdges(
      "iteration_controller" as any,
      (state: ExhibitionState): string => {
        // 根据状态中的修订目标决定路由
        const revisionTarget = state.lastRevisionStep;

        logger.info("🔀 迭代控制器路由", {
          revisionTarget,
          iterationCount: state.iterationCount,
          needsRevision: state.needsRevision
        });

        // 如果有明确的修订目标，返回对应节点
        if (revisionTarget && state.needsRevision) {
          // 映射修订目标到节点名称
          const targetMap: Record<string, string> = {
            'curator': 'curator',
            'spatial_designer': 'spatial_designer',
            'parallel_designs': 'parallel_designs', // 同时修订视觉和互动技术
            'visual_designer': 'visual_designer',  // 单独修订视觉设计
            'interactive_tech': 'interactive_tech', // 单独修订互动技术
            'budget_controller': 'budget_controller'
          };

          const targetNode = targetMap[revisionTarget];
          if (targetNode) {
            logger.info(`→ 路由到修订节点: ${targetNode}`);
            return targetNode;
          }
        }

        // 否则完成
        logger.info("→ 路由到完成节点");
        return "finalize";
      },
      {
        curator: "curator" as any,
        spatial_designer: "spatial_designer" as any,
        parallel_designs: "parallel_designs" as any, // 新增并行路由
        visual_designer: "visual_designer" as any,
        interactive_tech: "interactive_tech" as any,
        budget_controller: "budget_controller" as any,
        finalize: "finalize" as any
      }
    );

    workflow.addEdge("finalize" as any, END);

    return workflow as any;
  }

  async runExhibition(
    requirements: ExhibitionState["requirements"],
    maxIterations: number = 3
  ): Promise<ExhibitionState> {
    // 加载环境变量
    if (process.env.NODE_ENV !== "production") {
      require("dotenv").config();
    }

    const graph = this.createGraph();
    const chain = graph.compile();

    const initialState: ExhibitionState = {
      requirements,
      currentStep: "开始项目",
      messages: ["展陈设计多智能体系统启动（支持迭代优化）"],
      iterationCount: 0,
      maxIterations,
      feedbackHistory: [],
      needsRevision: false,
      waitingForHuman: false,
      autoApprove: true  // 默认自动批准模式
    };

    logger.info("🚀 启动展陈设计多智能体系统（支持迭代优化）", {
      title: requirements.title,
      theme: requirements.theme,
      budget: requirements.budget.total,
      currency: requirements.budget.currency,
      maxIterations
    });

    console.log("🚀 启动展陈设计多智能体系统（支持迭代优化）...");
    console.log(`📋 项目: ${requirements.title}`);
    console.log(`🎯 主题: ${requirements.theme}`);
    console.log(`💰 预算: ${requirements.budget.total} ${requirements.budget.currency}`);
    console.log(`🔄 最大迭代次数: ${maxIterations}`);

    const result = await chain.invoke(initialState);

    // 广播工作流完成状态到前端
    logger.info('🎉 广播工作流完成状态', {
      hasCompleteResult: !!(result.conceptPlan && result.spatialLayout && result.visualDesign && result.interactiveSolution && result.budgetEstimate),
      iterationCount: result.iterationCount + 1,
      qualityScore: result.qualityEvaluation?.overallScore
    });

    // 广播最终结果给所有连接的WebSocket客户端
    const { wss } = require('../index');
    if (wss && wss.clients) {
      const message = JSON.stringify({
        type: 'workflowCompleted',
        result: result,
        timestamp: new Date().toISOString()
      });

      wss.clients.forEach((client: any) => {
        if (client.readyState === client.OPEN) {
          try {
            client.send(message);
          } catch (error) {
            logger.error('发送完成状态失败', error as Error);
          }
        }
      });

      logger.info('✅ 工作流完成状态已广播到所有客户端', {
        clientCount: wss.clients.size
      });
    }

    console.log(`\n🎉 项目完成！总迭代次数: ${(result as any).iterationCount + 1}`);
    if ((result as any).qualityEvaluation) {
      console.log(`⭐ 最终质量分数: ${((result as any).qualityEvaluation.overallScore * 100).toFixed(1)}分`);
    }

    return result as ExhibitionState;
  }
}
