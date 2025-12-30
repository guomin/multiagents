import { StateGraph, END, START } from "@langchain/langgraph";
import { ExhibitionStateSchema, ExhibitionState } from "../types/exhibition";
import { CuratorAgent } from "../agents/curator";
import { SpatialDesignerAgent } from "../agents/spatial-designer";
import { VisualDesignerAgent } from "../agents/visual-designer";
import { InteractiveTechAgent } from "../agents/interactive-tech";
import { BudgetControllerAgent } from "../agents/budget-controller";
import { SupervisorAgent } from "../agents/supervisor";
import { broadcastAgentStatus, broadcastProgress } from "../index";
import { createLogger } from "../utils/logger";

const logger = createLogger('EXHIBITION-GRAPH-HUMAN');

export class ExhibitionDesignGraphWithHuman {
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

    // 1. 策展人节点
    const curatorNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      logger.info("🎨 策划智能体开始工作...", {
        step: "curator",
        isRevision: !!state.revisionReason
      });

      broadcastAgentStatus('curator', { status: 'running', startTime: new Date() });
      broadcastProgress(10, '策划智能体工作中...');

      try {
        const conceptPlan = await this.curator.generateConceptPlan(
          state.requirements,
          state.revisionReason || state.humanFeedback // 传递修订原因或人工反馈
        );

        broadcastAgentStatus('curator', { status: 'completed', endTime: new Date() });
        logger.info("✅ 策划智能体完成工作");

        return {
          ...state,
          conceptPlan,
          currentStep: "概念策划完成",
          messages: [...state.messages, "概念策划已完成"],
          revisionReason: undefined
        };
      } catch (error) {
        logger.error("❌ 策划智能体执行失败", error as Error);
        throw error;
      }
    };

    // 2. 空间设计节点
    const spatialDesignerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan) {
        throw new Error("概念策划尚未完成，无法进行空间设计");
      }

      logger.info("🏗️ 空间设计智能体开始工作...");

      broadcastAgentStatus('spatial', { status: 'running', startTime: new Date() });
      broadcastProgress(25, '空间设计智能体工作中...');

      try {
        const spatialLayout = await this.spatialDesigner.generateSpatialLayout(
          state.requirements,
          state.conceptPlan,
          state.revisionReason || state.humanFeedback // 传递修订原因或人工反馈
        );

        broadcastAgentStatus('spatial', { status: 'completed', endTime: new Date() });
        logger.info("✅ 空间设计智能体完成工作");

        return {
          ...state,
          spatialLayout,
          currentStep: "空间设计完成",
          messages: [...state.messages, "空间设计已完成"],
          revisionReason: undefined
        };
      } catch (error) {
        logger.error("❌ 空间设计智能体执行失败", error as Error);
        throw error;
      }
    };

    // 3. 视觉设计节点
    const visualDesignerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan) {
        throw new Error("概念策划尚未完成，无法进行视觉设计");
      }

      logger.info("🎭 视觉设计智能体开始工作...");

      broadcastAgentStatus('visual', { status: 'running', startTime: new Date() });
      broadcastProgress(40, '视觉设计智能体工作中...');

      try {
        const visualDesign = await this.visualDesigner.generateVisualDesign(
          state.requirements,
          state.conceptPlan,
          state.revisionReason || state.humanFeedback // 传递修订原因或人工反馈
        );

        broadcastAgentStatus('visual', { status: 'completed', endTime: new Date() });
        logger.info("✅ 视觉设计智能体完成工作");

        return {
          ...state,
          visualDesign,
          currentStep: "视觉设计完成",
          messages: [...state.messages, "视觉设计已完成"]
        };
      } catch (error) {
        logger.error("❌ 视觉设计智能体执行失败", error as Error);
        throw error;
      }
    };

    // 4. 互动技术节点
    const interactiveTechNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan) {
        throw new Error("概念策划尚未完成，无法进行互动技术设计");
      }

      logger.info("💻 互动技术智能体开始工作...");

      broadcastAgentStatus('interactive', { status: 'running', startTime: new Date() });
      broadcastProgress(55, '互动技术智能体工作中...');

      try {
        const interactiveSolution = await this.interactiveTech.generateInteractiveSolution(
          state.requirements,
          state.conceptPlan,
          state.revisionReason || state.humanFeedback // 传递修订原因或人工反馈
        );

        broadcastAgentStatus('interactive', { status: 'completed', endTime: new Date() });
        logger.info("✅ 互动技术智能体完成工作");

        return {
          ...state,
          interactiveSolution,
          currentStep: "互动技术方案完成",
          messages: [...state.messages, "互动技术方案已完成"]
        };
      } catch (error) {
        logger.error("❌ 互动技术智能体执行失败", error as Error);
        throw error;
      }
    };

    // 5. 预算控制节点
    const budgetControllerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan || !state.spatialLayout || !state.visualDesign || !state.interactiveSolution) {
        throw new Error("所有设计方案尚未完成，无法进行预算估算");
      }

      logger.info("💰 预算控制智能体开始工作...");

      broadcastAgentStatus('budget', { status: 'running', startTime: new Date() });
      broadcastProgress(70, '预算控制智能体工作中...');

      try {
        const budgetEstimate = await this.budgetController.generateBudgetEstimate(
          state.requirements,
          state.conceptPlan!,
          state.spatialLayout!,
          state.visualDesign!,
          state.interactiveSolution!,
          state.revisionReason || state.humanFeedback // 传递修订原因或人工反馈
        );

        broadcastAgentStatus('budget', { status: 'completed', endTime: new Date() });
        logger.info("✅ 预算控制智能体完成工作");

        return {
          ...state,
          budgetEstimate,
          currentStep: "预算估算完成",
          messages: [...state.messages, "预算估算已完成"]
        };
      } catch (error) {
        logger.error("❌ 预算控制智能体执行失败", error as Error);
        throw error;
      }
    };

    // 6. 主管审核节点 - 这里会触发中断
    const supervisorReviewNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      logger.info("👔 主管进行质量评估和人工审核...");

      broadcastAgentStatus('supervisor', { status: 'running', startTime: new Date() });
      broadcastProgress(85, '主管分析进度...');

      try {
        const qualityEvaluation = await this.supervisor.evaluateQuality(state);

        logger.info("📊 质量评估完成:", {
          overallScore: qualityEvaluation.overallScore,
          feedback: qualityEvaluation.feedback
        });

        const result = {
          ...state,
          qualityEvaluation,
          currentStep: "等待人工审核",
          waitingForHuman: true, // 关键：标记等待人工审核
          messages: [
            ...state.messages,
            `质量评估: ${(qualityEvaluation.overallScore * 100).toFixed(1)}分 - ${qualityEvaluation.feedback}`
          ]
        };

        // 这里触发中断，等待人工输入
        // 注意：需要在图编译后通过 updateState 来恢复
        logger.warn("⏸️  触发中断，等待人工审核决策...");

        return result;
      } catch (error) {
        logger.error("❌ 主管评估失败", error as Error);
        throw error;
      }
    };

    // 7. 人工决策处理节点
    const humanDecisionNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      logger.info("👤 处理人工决策...", {
        humanDecision: state.humanDecision,
        iterationCount: state.iterationCount
      });

      const decision = state.humanDecision;

      if (!decision) {
        throw new Error("缺少人工决策");
      }

      broadcastProgress(90, '处理人工决策...');

      if (decision === "approve") {
        // 人工审核通过，继续完成
        return {
          ...state,
          needsRevision: false,
          currentStep: "人工审核通过",
          messages: [...state.messages, "✅ 人工审核通过，准备生成最终报告"]
        };
      } else if (decision === "revise") {
        // 人工要求修改
        const revisionTarget = state.qualityEvaluation?.revisionTarget || "curator";

        logger.info("🔧 人工要求修改", {
          revisionTarget,
          feedback: state.humanFeedback || "需要进一步优化"
        });

        // 准备修订
        const revisionUpdate = {
          lastRevisionStep: revisionTarget,
          needsRevision: true,
          revisionReason: state.humanFeedback || state.qualityEvaluation?.feedback || "需要进一步优化",
          iterationCount: state.iterationCount + 1,
          feedbackHistory: [
            ...(state.feedbackHistory || []),
            `第${state.iterationCount + 1}次迭代: ${state.humanFeedback || state.qualityEvaluation?.feedback}`
          ]
        };

        // 清理下游数据
        if (revisionTarget === "curator") {
          return {
            ...state,
            ...revisionUpdate,
            conceptPlan: undefined,
            spatialLayout: undefined,
            visualDesign: undefined,
            interactiveSolution: undefined,
            budgetEstimate: undefined
          };
        } else if (revisionTarget === "spatial_designer") {
          return {
            ...state,
            ...revisionUpdate,
            spatialLayout: undefined,
            visualDesign: undefined,
            interactiveSolution: undefined,
            budgetEstimate: undefined
          };
        } else if (revisionTarget === "visual_designer") {
          return {
            ...state,
            ...revisionUpdate,
            visualDesign: undefined,
            interactiveSolution: undefined,
            budgetEstimate: undefined
          };
        } else if (revisionTarget === "interactive_tech") {
          return {
            ...state,
            ...revisionUpdate,
            interactiveSolution: undefined,
            budgetEstimate: undefined
          };
        } else if (revisionTarget === "budget_controller") {
          return {
            ...state,
            ...revisionUpdate,
            budgetEstimate: undefined
          };
        }

        return { ...state, ...revisionUpdate };
      }

      return state;
    };

    // 8. 最终完成节点
    const finalizeNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      logger.info("📋 生成最终报告...");

      broadcastAgentStatus('supervisor', { status: 'running', startTime: new Date() });
      broadcastProgress(95, '生成最终报告...');

      try {
        const finalReport = await this.supervisor.generateFinalReport(state);

        broadcastAgentStatus('supervisor', { status: 'completed', endTime: new Date() });
        broadcastProgress(100, '项目完成');

        logger.info("🎉 展陈设计项目完成！");

        return {
          ...state,
          currentStep: "项目完成",
          messages: [...state.messages, "最终报告已生成"]
        };
      } catch (error) {
        logger.error("❌ 协调主管执行失败", error as Error);
        throw error;
      }
    };

    // 添加节点
    workflow.addNode("curator", curatorNode);
    workflow.addNode("spatial_designer", spatialDesignerNode);
    workflow.addNode("visual_designer", visualDesignerNode);
    workflow.addNode("interactive_tech", interactiveTechNode);
    workflow.addNode("budget_controller", budgetControllerNode);
    workflow.addNode("supervisor_review", supervisorReviewNode);
    workflow.addNode("human_decision", humanDecisionNode);
    workflow.addNode("finalize", finalizeNode);

    // 设置条件入口点：如果有人工决策，从 human_decision 开始
    workflow.addConditionalEdges(
      START as any,
      (state: ExhibitionState) => {
        // 如果已经有人工决策，直接进入人工决策处理节点
        if (state.humanDecision && state.waitingForHuman === false) {
          return "human_decision";
        }
        // 否则从策展人开始
        return "curator";
      },
      {
        curator: "curator" as any,
        human_decision: "human_decision" as any
      }
    );

    // 线性流程到审核点
    workflow.addConditionalEdges("curator" as any, () => "spatial_designer");
    workflow.addConditionalEdges("spatial_designer" as any, () => "visual_designer");
    workflow.addConditionalEdges("visual_designer" as any, () => "interactive_tech");
    workflow.addConditionalEdges("interactive_tech" as any, () => "budget_controller");
    workflow.addConditionalEdges("budget_controller" as any, () => "supervisor_review");

    // 审核后的条件路由
    workflow.addConditionalEdges(
      "supervisor_review" as any,
      (state: ExhibitionState) => {
        // 如果已经有人工决策，进入人工决策处理节点
        // 否则，结束流程并返回状态（等待人工输入）
        if (state.humanDecision && state.waitingForHuman === false) {
          return "human_decision";
        }
        // 第一次运行到审核点时，直接结束
        return END;
      },
      {
        human_decision: "human_decision" as any,
        [END]: END
      }
    );

    // 人工决策后的条件路由
    workflow.addConditionalEdges(
      "human_decision" as any,
      (state: ExhibitionState) => {
        const revisionTarget = state.lastRevisionStep;

        // 如果需要修订，返回对应节点
        if (state.needsRevision && revisionTarget) {
          const targetMap: Record<string, string> = {
            'curator': 'curator',
            'spatial_designer': 'spatial_designer',
            'visual_designer': 'visual_designer',
            'interactive_tech': 'interactive_tech',
            'budget_controller': 'budget_controller'
          };

          return targetMap[revisionTarget];
        }

        // 否则完成
        return "finalize";
      },
      {
        curator: "curator" as any,
        spatial_designer: "spatial_designer" as any,
        visual_designer: "visual_designer" as any,
        interactive_tech: "interactive_tech" as any,
        budget_controller: "budget_controller" as any,
        finalize: "finalize" as any
      }
    );

    workflow.addEdge("finalize" as any, END);

    return workflow;
  }

  async runExhibition(
    requirements: ExhibitionState["requirements"]
  ): Promise<{ graph: any; initialState: ExhibitionState }> {
    const graph = this.createGraph();

    const initialState: ExhibitionState = {
      requirements,
      currentStep: "开始项目",
      messages: ["展陈设计多智能体系统启动（人在回路模式）"],
      iterationCount: 0,
      maxIterations: 5,
      feedbackHistory: [],
      needsRevision: false,
      waitingForHuman: false
    };

    return { graph, initialState };
  }
}
