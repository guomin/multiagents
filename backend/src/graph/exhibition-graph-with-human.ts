import { StateGraph, END, START } from "@langchain/langgraph";
import { ExhibitionStateSchema, ExhibitionState } from "../types/exhibition";
import { CuratorAgent } from "../agents/curator";
import { SpatialDesignerAgent } from "../agents/spatial-designer";
import { VisualDesignerAgent } from "../agents/visual-designer";
import { InteractiveTechAgent } from "../agents/interactive-tech";
import { BudgetControllerAgent } from "../agents/budget-controller";
import { SupervisorAgent } from "../agents/supervisor";
import { broadcastAgentStatus, broadcastProgress, broadcastLog, broadcastWaitingForHuman, broadcastIterationUpdate } from "../index";
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
      broadcastLog('info', '🎨 策划智能体开始工作...');

      try {
        const conceptPlan = await this.curator.generateConceptPlan(
          state.requirements,
          state.revisionReason || state.humanFeedback // 传递修订原因或人工反馈
        );

        broadcastAgentStatus('curator', { status: 'completed', endTime: new Date() });
        broadcastLog('success', '✅ 策划智能体完成工作');
        logger.info("✅ 策划智能体完成工作");

        return {
          ...state,
          conceptPlan,
          currentStep: "概念策划完成",
          messages: [...state.messages, "概念策划已完成"],
          revisionReason: undefined
        };
      } catch (error) {
        broadcastLog('error', `❌ 策划智能体执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
      broadcastLog('info', '🏗️ 空间设计智能体开始工作...');

      try {
        const spatialLayout = await this.spatialDesigner.generateSpatialLayout(
          state.requirements,
          state.conceptPlan,
          state.revisionReason || state.humanFeedback // 传递修订原因或人工反馈
        );

        broadcastAgentStatus('spatial', { status: 'completed', endTime: new Date() });
        broadcastLog('success', '✅ 空间设计智能体完成工作');
        logger.info("✅ 空间设计智能体完成工作");

        return {
          ...state,
          spatialLayout,
          currentStep: "空间设计完成",
          messages: [...state.messages, "空间设计已完成"],
          revisionReason: undefined
        };
      } catch (error) {
        broadcastLog('error', `❌ 空间设计智能体执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
      broadcastLog('info', '🎭 视觉设计智能体开始工作...');

      try {
        const visualDesign = await this.visualDesigner.generateVisualDesign(
          state.requirements,
          state.conceptPlan,
          state.revisionReason || state.humanFeedback // 传递修订原因或人工反馈
        );

        broadcastAgentStatus('visual', { status: 'completed', endTime: new Date() });
        broadcastLog('success', '✅ 视觉设计智能体完成工作');
        logger.info("✅ 视觉设计智能体完成工作");

        return {
          ...state,
          visualDesign,
          currentStep: "视觉设计完成",
          messages: [...state.messages, "视觉设计已完成"],
          revisionReason: undefined
        };
      } catch (error) {
        broadcastLog('error', `❌ 视觉设计智能体执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
      broadcastLog('info', '💻 互动技术智能体开始工作...');

      try {
        const interactiveSolution = await this.interactiveTech.generateInteractiveSolution(
          state.requirements,
          state.conceptPlan,
          state.revisionReason || state.humanFeedback // 传递修订原因或人工反馈
        );

        broadcastAgentStatus('interactive', { status: 'completed', endTime: new Date() });
        broadcastLog('success', '✅ 互动技术智能体完成工作');
        logger.info("✅ 互动技术智能体完成工作");

        return {
          ...state,
          interactiveSolution,
          currentStep: "互动技术方案完成",
          messages: [...state.messages, "互动技术方案已完成"],
          revisionReason: undefined
        };
      } catch (error) {
        broadcastLog('error', `❌ 互动技术智能体执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
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

      broadcastProgress(40, '并行设计中：视觉 + 互动技术...');
      broadcastLog('info', '🔄 启动并行设计流程（视觉设计 + 互动技术）...');

      try {
        // 确保 conceptPlan 存在（类型检查）
        const conceptPlan = state.conceptPlan;
        const feedback = state.revisionReason || state.humanFeedback;

        // 并行执行两个设计任务
        const [visualDesign, interactiveSolution] = await Promise.all([
          (async () => {
            logger.info("🎭 视觉设计智能体工作中...");
            broadcastAgentStatus('visual', { status: 'running', startTime: new Date() });
            broadcastLog('info', '🎭 视觉设计智能体工作中...');
            const result = await this.visualDesigner.generateVisualDesign(
              state.requirements,
              conceptPlan,
              feedback
            );
            broadcastAgentStatus('visual', { status: 'completed', endTime: new Date() });
            broadcastLog('success', '✅ 视觉设计智能体完成');
            logger.info("✅ 视觉设计智能体完成");
            return result;
          })(),
          (async () => {
            logger.info("💻 互动技术智能体工作中...");
            broadcastAgentStatus('interactive', { status: 'running', startTime: new Date() });
            broadcastLog('info', '💻 互动技术智能体工作中...');
            const result = await this.interactiveTech.generateInteractiveSolution(
              state.requirements,
              conceptPlan,
              feedback
            );
            broadcastAgentStatus('interactive', { status: 'completed', endTime: new Date() });
            broadcastLog('success', '✅ 互动技术智能体完成');
            logger.info("✅ 互动技术智能体完成");
            return result;
          })()
        ]);

        broadcastLog('success', '🎉 并行设计流程完成！');
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
        broadcastLog('error', `❌ 并行设计流程失败: ${error instanceof Error ? error.message : '未知错误'}`);
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

    // 5. 预算控制节点
    const budgetControllerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan || !state.spatialLayout || !state.visualDesign || !state.interactiveSolution) {
        throw new Error("所有设计方案尚未完成，无法进行预算估算");
      }

      logger.info("💰 预算控制智能体开始工作...");

      broadcastAgentStatus('budget', { status: 'running', startTime: new Date() });
      broadcastProgress(70, '预算控制智能体工作中...');
      broadcastLog('info', '💰 预算控制智能体开始工作...');

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
        broadcastLog('success', '✅ 预算控制智能体完成工作');
        logger.info("✅ 预算控制智能体完成工作");

        return {
          ...state,
          budgetEstimate,
          currentStep: "预算估算完成",
          messages: [...state.messages, "预算估算已完成"]
        };
      } catch (error) {
        broadcastLog('error', `❌ 预算控制智能体执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
        logger.error("❌ 预算控制智能体执行失败", error as Error);
        throw error;
      }
    };

    // 6. 主管审核节点 - 这里会触发中断
    const supervisorReviewNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      logger.info("👔 主管进行质量评估和人工审核...");

      broadcastAgentStatus('supervisor', { status: 'running', startTime: new Date() });
      broadcastProgress(85, '主管分析进度...');
      broadcastLog('info', '👔 主管进行质量评估和人工审核...');

      try {
        const qualityEvaluation = await this.supervisor.evaluateQuality(state);

        broadcastLog('info', `📊 质量评估完成: ${(qualityEvaluation.overallScore * 100).toFixed(1)}分 - ${qualityEvaluation.feedback}`);
        logger.info("📊 质量评估完成:", {
          overallScore: qualityEvaluation.overallScore,
          feedback: qualityEvaluation.feedback,
          autoApprove: state.autoApprove  // 记录自动批准模式
        });

        // 🔑 关键修改：只有在非自动批准模式下才触发人工审核
        if (state.autoApprove) {
          // 自动批准模式：不发送 waitingForHuman 事件，不中断流程
          logger.info("🤖 自动批准模式：跳过人工审核，直接通过");
          broadcastLog('info', '✅ 自动批准模式：质量评估通过，继续执行');

          const result = {
            ...state,
            qualityEvaluation,
            currentStep: "自动批准通过",
            waitingForHuman: false,  // 不等待人工
            messages: [
              ...state.messages,
              `质量评估: ${(qualityEvaluation.overallScore * 100).toFixed(1)}分 (自动批准)`
            ]
          };

          broadcastAgentStatus('supervisor', { status: 'completed', endTime: new Date() });
          return result;
        } else {
          // 人工审核模式：触发中断，等待人工决策
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

          // 广播人工审核请求
          broadcastWaitingForHuman(
            qualityEvaluation,
            state.iterationCount,
            qualityEvaluation.revisionTarget
          );

          // 这里触发中断，等待人工输入
          // 注意：需要在图编译后通过 updateState 来恢复
          logger.warn("⏸️  触发中断，等待人工审核决策...");

          broadcastAgentStatus('supervisor', { status: 'completed', endTime: new Date() });
          return result;
        }
      } catch (error) {
        broadcastLog('error', `❌ 主管评估失败: ${error instanceof Error ? error.message : '未知错误'}`);
        logger.error("❌ 主管评估失败", error as Error);
        throw error;
      }
    };

    // 7. 人工决策处理节点
    const humanDecisionNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      logger.info("👤 处理人工决策...", {
        humanDecision: state.humanDecision,
        iterationCount: state.iterationCount,
        hasQualityEvaluation: !!state.qualityEvaluation,
        needsRevision: state.needsRevision,
        lastRevisionStep: state.lastRevisionStep
      });

      broadcastLog('info', `👤 收到人工决策: ${state.humanDecision}`);

      const decision = state.humanDecision;

      if (!decision) {
        logger.error("❌ 缺少人工决策");
        broadcastLog('error', '❌ 缺少人工决策');
        throw new Error("缺少人工决策");
      }

      logger.info("✅ 人工决策验证通过，开始处理...");
      broadcastProgress(90, '处理人工决策...');

      if (decision === "approve") {
        // 人工审核通过，继续完成
        broadcastLog('success', '✅ 人工审核通过，准备生成最终报告');
        return {
          ...state,
          needsRevision: false,
          currentStep: "人工审核通过",
          messages: [...state.messages, "✅ 人工审核通过，准备生成最终报告"]
        };
      } else if (decision === "revise") {
        // 人工要求修改
        const revisionTarget = state.qualityEvaluation?.revisionTarget || "curator";
        const newIterationCount = state.iterationCount + 1;

        logger.info("🔧 人工要求修改", {
          revisionTarget,
          feedback: state.humanFeedback || "需要进一步优化"
        });

        broadcastLog('warning', `🔧 启动第 ${newIterationCount} 次迭代，修订目标: ${revisionTarget}`);
        broadcastIterationUpdate(newIterationCount, revisionTarget);

        // 准备修订
        const revisionUpdate = {
          lastRevisionStep: revisionTarget,
          needsRevision: true,
          revisionReason: state.humanFeedback || state.qualityEvaluation?.feedback || "需要进一步优化",
          iterationCount: newIterationCount,
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
        } else if (revisionTarget === "parallel_designs") {
          // 并行修订：同时清理视觉设计和互动技术
          return {
            ...state,
            ...revisionUpdate,
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
      broadcastLog('info', '📋 生成最终报告...');

      try {
        const finalReport = await this.supervisor.generateFinalReport(state);

        broadcastAgentStatus('supervisor', { status: 'completed', endTime: new Date() });
        broadcastProgress(100, '项目完成');
        broadcastLog('success', '🎉 展陈设计项目完成！');

        logger.info("🎉 展陈设计项目完成！");

        return {
          ...state,
          currentStep: "项目完成",
          finalReport,
          messages: [...state.messages, "最终报告已生成"]
        };
      } catch (error) {
        broadcastLog('error', `❌ 生成最终报告失败: ${error instanceof Error ? error.message : '未知错误'}`);
        logger.error("❌ 协调主管执行失败", error as Error);
        throw error;
      }
    };

    // 添加节点
    workflow.addNode("curator", curatorNode);
    workflow.addNode("spatial_designer", spatialDesignerNode);
    workflow.addNode("parallel_designs", parallelDesignsNode); // 新增并行节点
    workflow.addNode("visual_designer", visualDesignerNode);  // 保留用于单独修订
    workflow.addNode("interactive_tech", interactiveTechNode); // 保留用于单独修订
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

    // 空间设计 → 并行设计
    workflow.addConditionalEdges("spatial_designer" as any, () => "parallel_designs");

    // 并行设计 → 预算控制器
    workflow.addConditionalEdges(
      "parallel_designs" as any,
      (state: ExhibitionState) => {
        // 只有当两个设计都完成时才继续
        return (state.visualDesign && state.interactiveSolution) ? "budget_controller" : END;
      }
    );

    // 保留单独的节点用于修订
    workflow.addConditionalEdges("visual_designer" as any, () => "budget_controller");
    workflow.addConditionalEdges("interactive_tech" as any, () => "budget_controller");

    workflow.addConditionalEdges("budget_controller" as any, () => "supervisor_review");

    // 审核后的条件路由
    workflow.addConditionalEdges(
      "supervisor_review" as any,
      (state: ExhibitionState) => {
        // 🔑 修改后的逻辑：
        // 1. 如果已经有人工决策（批准/修订/拒绝），进入人工决策处理节点
        if (state.humanDecision && state.waitingForHuman === false) {
          return "human_decision";
        }
        // 2. 如果是自动批准模式（waitingForHuman=false 且无人工决策），直接完成
        if (state.waitingForHuman === false && !state.humanDecision) {
          return "finalize";
        }
        // 3. 人工审核模式：结束流程并返回状态（等待人工输入）
        return END;
      },
      {
        human_decision: "human_decision" as any,
        finalize: "finalize" as any,
        [END]: END
      }
    );

    // 人工决策后的条件路由
    workflow.addConditionalEdges(
      "human_decision" as any,
      (state: ExhibitionState) => {
        const revisionTarget = state.lastRevisionStep;

        logger.info("🔍 人工决策后路由判断", {
          needsRevision: state.needsRevision,
          revisionTarget,
          decision: state.humanDecision
        });

        // 如果需要修订，返回对应节点
        if (state.needsRevision && revisionTarget) {
          const targetMap: Record<string, string> = {
            'curator': 'curator',
            'spatial_designer': 'spatial_designer',
            'parallel_designs': 'parallel_designs', // 同时修订视觉和互动技术
            'visual_designer': 'visual_designer',  // 单独修订视觉设计
            'interactive_tech': 'interactive_tech', // 单独修订互动技术
            'budget_controller': 'budget_controller'
          };

          const targetNode = targetMap[revisionTarget];

          // 🔑 关键：如果找不到目标节点，默认到 curator
          if (!targetNode) {
            logger.warn(`⚠️  未知的修订目标: ${revisionTarget}，默认使用 curator`);
            return "curator";
          }

          logger.info(`🔧 路由到修订节点: ${targetNode}`);
          return targetNode;
        }

        // 否则完成
        logger.info("✅ 路由到完成节点");
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

    return workflow;
  }

  async runExhibition(
    requirements: ExhibitionState["requirements"],
    autoApprove: boolean = true
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
      waitingForHuman: false,
      autoApprove  // 传递自动批准标志到状态中
    };

    return { graph, initialState };
  }
}
