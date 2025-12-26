import { StateGraph, END } from "@langchain/langgraph";
import { ExhibitionStateSchema, ExhibitionState } from "../types/exhibition";
import { CuratorAgent } from "../agents/curator";
import { SpatialDesignerAgent } from "../agents/spatial-designer";
import { VisualDesignerAgent } from "../agents/visual-designer";
import { InteractiveTechAgent } from "../agents/interactive-tech";
import { BudgetControllerAgent } from "../agents/budget-controller";
import { SupervisorAgent } from "../agents/supervisor";
import { broadcastAgentStatus, broadcastProgress } from "../index";
import { createLogger } from "../utils/logger";

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

  createGraph(): StateGraph<any> {
    const workflow = new StateGraph(ExhibitionStateSchema);

    // 定义节点函数
    const curatorNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      logger.info("🎨 策划智能体开始工作...", { step: "curator" });

      // 广播智能体开始状态
      broadcastAgentStatus('curator', {
        status: 'running',
        startTime: new Date()
      });

      broadcastProgress(0, '策划智能体工作中...')

      try {
        const conceptPlan = await this.curator.generateConceptPlan(state.requirements);

        // 广播完成状态
        broadcastAgentStatus('curator', {
          status: 'completed',
          endTime: new Date()
        });

        logger.info("✅ 策划智能体完成工作", { conceptPlan: conceptPlan ? true : false });

        return {
          ...state,
          conceptPlan,
          currentStep: "概念策划完成",
          messages: [...state.messages, "概念策划已完成"]
        };
      } catch (error) {
        // 广播错误状态
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

      logger.info("🏗️ 空间设计智能体开始工作...", { step: "spatial" });

      // 广播智能体开始状态
      broadcastAgentStatus('spatial', {
        status: 'running',
        startTime: new Date()
      });

      broadcastProgress(16, '空间设计智能体工作中...')

      try {
        const spatialLayout = await this.spatialDesigner.generateSpatialLayout(
          state.requirements,
          state.conceptPlan
        );

        // 广播完成状态
        broadcastAgentStatus('spatial', {
          status: 'completed',
          endTime: new Date()
        });

        logger.info("✅ 空间设计智能体完成工作");

        return {
          ...state,
          spatialLayout,
          currentStep: "空间设计完成",
          messages: [...state.messages, "空间设计已完成"]
        };
      } catch (error) {
        // 广播错误状态
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

      logger.info("🎭 视觉设计智能体开始工作...", { step: "visual" });

      // 广播智能体开始状态
      broadcastAgentStatus('visual', {
        status: 'running',
        startTime: new Date()
      });

      broadcastProgress(33, '视觉设计智能体工作中...')

      try {
        const visualDesign = await this.visualDesigner.generateVisualDesign(
          state.requirements,
          state.conceptPlan
        );

        // 广播完成状态
        broadcastAgentStatus('visual', {
          status: 'completed',
          endTime: new Date()
        });

        logger.info("✅ 视觉设计智能体完成工作");

        return {
          ...state,
          visualDesign,
          currentStep: "视觉设计完成",
          messages: [...state.messages, "视觉设计已完成"]
        };
      } catch (error) {
        // 广播错误状态
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

      logger.info("💻 互动技术智能体开始工作...", { step: "interactive" });

      // 广播智能体开始状态
      broadcastAgentStatus('interactive', {
        status: 'running',
        startTime: new Date()
      });

      broadcastProgress(50, '互动技术智能体工作中...')

      try {
        const interactiveSolution = await this.interactiveTech.generateInteractiveSolution(
          state.requirements,
          state.conceptPlan
        );

        // 广播完成状态
        broadcastAgentStatus('interactive', {
          status: 'completed',
          endTime: new Date()
        });

        logger.info("✅ 互动技术智能体完成工作");

        return {
          ...state,
          interactiveSolution,
          currentStep: "互动技术方案完成",
          messages: [...state.messages, "互动技术方案已完成"]
        };
      } catch (error) {
        // 广播错误状态
        broadcastAgentStatus('interactive', {
          status: 'error',
          endTime: new Date(),
          error: error instanceof Error ? error.message : '未知错误'
        });

        logger.error("❌ 互动技术智能体执行失败", error as Error);
        throw error;
      }
    };

    const budgetControllerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan || !state.spatialLayout || !state.visualDesign || !state.interactiveSolution) {
        throw new Error("所有设计方案尚未完成，无法进行预算估算");
      }

      logger.info("💰 预算控制智能体开始工作...", { step: "budget" });

      // 广播智能体开始状态
      broadcastAgentStatus('budget', {
        status: 'running',
        startTime: new Date()
      });

      broadcastProgress(67, '预算控制智能体工作中...')

      try {
        const budgetEstimate = await this.budgetController.generateBudgetEstimate(
          state.requirements,
          state.conceptPlan!,
          state.spatialLayout!,
          state.visualDesign!,
          state.interactiveSolution!
        );

        // 广播完成状态
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
        // 广播错误状态
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
      logger.info("👔 协调主管分析进度...");

      try {
        const analysis = await this.supervisor.analyzeProgress(state);

        logger.info("📊 主管分析结果:", {
          nextAction: analysis.nextAction,
          recommendations: analysis.recommendations,
          issues: analysis.issues
        });

        return {
          ...state,
          messages: [...state.messages, `主管建议: ${analysis.nextAction}`]
        };
      } catch (error) {
        logger.error("❌ 协调主管分析失败", error as Error);
        throw error;
      }
    };

    const finalizeNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      logger.info("📋 生成最终报告...");

      // 广播协调主管开始工作
      broadcastAgentStatus('supervisor', {
        status: 'running',
        startTime: new Date()
      });

      broadcastProgress(83, '协调主管分析进度...')

      try {
        const finalReport = await this.supervisor.generateFinalReport(state);

        // 广播协调主管完成
        broadcastAgentStatus('supervisor', {
          status: 'completed',
          endTime: new Date()
        });

        // 广播最终完成状态
        broadcastProgress(100, '项目完成');

        logger.info("🎉 展陈设计项目完成！", {
          hasConceptPlan: !!state.conceptPlan,
          hasSpatialLayout: !!state.spatialLayout,
          hasVisualDesign: !!state.visualDesign,
          hasInteractiveSolution: !!state.interactiveSolution,
          hasBudgetEstimate: !!state.budgetEstimate
        });

        return {
          ...state,
          currentStep: "项目完成",
          messages: [...state.messages, "最终报告已生成"]
        };
      } catch (error) {
        // 广播错误状态
        broadcastAgentStatus('supervisor', {
          status: 'error',
          endTime: new Date(),
          error: error instanceof Error ? error.message : '未知错误'
        });

        logger.error("❌ 协调主管执行失败", error as Error);
        throw error;
      }
    };

    // 添加节点到工作流
    workflow.addNode("curator", curatorNode);
    workflow.addNode("spatial_designer", spatialDesignerNode);
    workflow.addNode("visual_designer", visualDesignerNode);
    workflow.addNode("interactive_tech", interactiveTechNode);
    workflow.addNode("budget_controller", budgetControllerNode);
    workflow.addNode("supervisor", supervisorNode);
    workflow.addNode("finalize", finalizeNode);

    // 设置入口点
    workflow.setEntryPoint("curator");

    // 添加条件边
    workflow.addConditionalEdges(
      "curator",
      (state: ExhibitionState) => {
        return state.conceptPlan ? "spatial_designer" : END;
      }
    );

    workflow.addConditionalEdges(
      "spatial_designer",
      (state: ExhibitionState) => {
        return state.spatialLayout ? "visual_designer" : END;
      }
    );

    workflow.addConditionalEdges(
      "visual_designer",
      (state: ExhibitionState) => {
        return state.visualDesign ? "interactive_tech" : END;
      }
    );

    workflow.addConditionalEdges(
      "interactive_tech",
      (state: ExhibitionState) => {
        return state.interactiveSolution ? "budget_controller" : END;
      }
    );

    workflow.addConditionalEdges(
      "budget_controller",
      (state: ExhibitionState) => {
        return state.budgetEstimate ? "supervisor" : END;
      }
    );

    workflow.addConditionalEdges(
      "supervisor",
      (state: ExhibitionState) => {
        return state.budgetEstimate ? "finalize" : END;
      }
    );

    workflow.addEdge("finalize", END);

    return workflow;
  }

  async runExhibition(requirements: ExhibitionState["requirements"]): Promise<ExhibitionState> {
    // 加载环境变量
    if (process.env.NODE_ENV !== "production") {
      require("dotenv").config();
    }

    const graph = this.createGraph();
    const chain = graph.compile();

    const initialState: ExhibitionState = {
      requirements,
      currentStep: "开始项目",
      messages: ["展陈设计多智能体系统启动"]
    };

    console.log("🚀 启动展陈设计多智能体系统...");
    console.log(`📋 项目: ${requirements.title}`);
    console.log(`🎯 主题: ${requirements.theme}`);
    console.log(`💰 预算: ${requirements.budget.total} ${requirements.budget.currency}`);

    const result = await chain.invoke(initialState);

    // 广播工作流完成状态到前端
    logger.info('🎉 广播工作流完成状态', {
      hasCompleteResult: !!(result.conceptPlan && result.spatialLayout && result.visualDesign && result.interactiveSolution && result.budgetEstimate)
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

    return result;
  }
}