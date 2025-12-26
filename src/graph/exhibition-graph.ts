import { StateGraph, END } from "@langchain/langgraph";
import { ExhibitionStateSchema, ExhibitionState } from "../types/exhibition";
import { CuratorAgent } from "../agents/curator";
import { SpatialDesignerAgent } from "../agents/spatial-designer";
import { VisualDesignerAgent } from "../agents/visual-designer";
import { InteractiveTechAgent } from "../agents/interactive-tech";
import { BudgetControllerAgent } from "../agents/budget-controller";
import { SupervisorAgent } from "../agents/supervisor";

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
      console.log("🎨 策划智能体开始工作...");
      const conceptPlan = await this.curator.generateConceptPlan(state.requirements);

      return {
        ...state,
        conceptPlan,
        currentStep: "概念策划完成",
        messages: [...state.messages, "概念策划已完成"]
      };
    };

    const spatialDesignerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan) {
        throw new Error("概念策划尚未完成，无法进行空间设计");
      }

      console.log("🏗️ 空间设计智能体开始工作...");
      const spatialLayout = await this.spatialDesigner.generateSpatialLayout(
        state.requirements,
        state.conceptPlan
      );

      return {
        ...state,
        spatialLayout,
        currentStep: "空间设计完成",
        messages: [...state.messages, "空间设计已完成"]
      };
    };

    const visualDesignerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan) {
        throw new Error("概念策划尚未完成，无法进行视觉设计");
      }

      console.log("🎭 视觉设计智能体开始工作...");
      const visualDesign = await this.visualDesigner.generateVisualDesign(
        state.requirements,
        state.conceptPlan
      );

      return {
        ...state,
        visualDesign,
        currentStep: "视觉设计完成",
        messages: [...state.messages, "视觉设计已完成"]
      };
    };

    const interactiveTechNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan) {
        throw new Error("概念策划尚未完成，无法进行互动技术设计");
      }

      console.log("💻 互动技术智能体开始工作...");
      const interactiveSolution = await this.interactiveTech.generateInteractiveSolution(
        state.requirements,
        state.conceptPlan
      );

      return {
        ...state,
        interactiveSolution,
        currentStep: "互动技术方案完成",
        messages: [...state.messages, "互动技术方案已完成"]
      };
    };

    const budgetControllerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      if (!state.conceptPlan || !state.spatialLayout || !state.visualDesign || !state.interactiveSolution) {
        throw new Error("所有设计方案尚未完成，无法进行预算估算");
      }

      console.log("💰 预算控制智能体开始工作...");
      const budgetEstimate = await this.budgetController.generateBudgetEstimate(
        state.requirements,
        state.conceptPlan!,
        state.spatialLayout!,
        state.visualDesign!,
        state.interactiveSolution!
      );

      return {
        ...state,
        budgetEstimate,
        currentStep: "预算估算完成",
        messages: [...state.messages, "预算估算已完成"]
      };
    };

    const supervisorNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      console.log("👔 协调主管分析进度...");
      const analysis = await this.supervisor.analyzeProgress(state);

      console.log("📊 主管分析结果:");
      console.log(`- 下一步: ${analysis.nextAction}`);
      console.log(`- 建议: ${analysis.recommendations.join(", ")}`);

      if (analysis.issues.length > 0) {
        console.log(`- 问题: ${analysis.issues.join(", ")}`);
      }

      return {
        ...state,
        messages: [...state.messages, `主管建议: ${analysis.nextAction}`]
      };
    };

    const finalizeNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
      console.log("📋 生成最终报告...");
      const finalReport = await this.supervisor.generateFinalReport(state);

      console.log("\n" + "=".repeat(60));
      console.log("🎉 展陈设计项目完成！");
      console.log("=".repeat(60));
      console.log(finalReport);
      console.log("=".repeat(60));

      return {
        ...state,
        currentStep: "项目完成",
        messages: [...state.messages, "最终报告已生成"]
      };
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

    return result;
  }
}