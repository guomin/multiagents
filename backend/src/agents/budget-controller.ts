import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import {
  ExhibitionRequirement,
  ConceptPlan,
  SpatialLayout,
  VisualDesign,
  InteractiveSolution,
  BudgetEstimate
} from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";
import { promptManager } from "../prompts";
import { createLogger } from "../utils/logger";

export class BudgetControllerAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;
  private logger = createLogger('BUDGET-CONTROLLER-AGENT');

  constructor(modelName?: string, temperature: number = 0.3) {
    this.modelConfig = ModelConfigFactory.createModelConfig(undefined, modelName, temperature);

    this.llm = new ChatOpenAI({
      modelName: this.modelConfig.modelName,
      temperature: this.modelConfig.temperature,
      openAIApiKey: this.modelConfig.apiKey,
      ...(this.modelConfig.baseURL && { configuration: { baseURL: this.modelConfig.baseURL } }),
      ...(this.modelConfig.organization && { openAIOrganization: this.modelConfig.organization })
    });
    this.logger.info('✅ 预算控制智能体初始化完成', { modelName, temperature });
  }

  async generateBudgetEstimate(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan,
    spatialLayout: SpatialLayout,
    visualDesign: VisualDesign,
    interactiveSolution: InteractiveSolution,
    revisionReason?: string
  ): Promise<BudgetEstimate> {
    // 使用 PromptManager 渲染 prompt
    const rendered = promptManager.render(
      'budget_controller',
      'generateBudgetEstimate',
      {
        revisionReason,
        totalBudget: requirements.budget.total,
        currency: requirements.budget.currency,
        area: requirements.venueSpace.area,
        startDate: requirements.duration.startDate,
        endDate: requirements.duration.endDate
      }
    );

    const systemPrompt = rendered.system;
    const humanPrompt = rendered.human;

    this.logger.debug('系统 Prompt 内容预览', { contentPreview: systemPrompt.substring(0, 500) });
    this.logger.debug('用户 Prompt 内容预览', { contentPreview: humanPrompt.substring(0, 500) });


    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(humanPrompt)
    ];

    const response = await this.llm.invoke(messages);

    // 计算各项费用
    const area = requirements.venueSpace.area;
    const totalBudget = requirements.budget.total;

    const breakdown = [
      {
        category: "空间设计与施工",
        amount: Math.floor(totalBudget * 0.35),
        description: "展墙搭建、地面处理、照明系统、空间改造"
      },
      {
        category: "视觉设计与制作",
        amount: Math.floor(totalBudget * 0.25),
        description: "展板制作、标识系统、印刷品、品牌元素"
      },
      {
        category: "互动技术设备",
        amount: Math.floor(totalBudget * 0.20),
        description: "多媒体设备、互动装置、AR/VR设备、音响系统"
      },
      {
        category: "展品运输与保险",
        amount: Math.floor(totalBudget * 0.10),
        description: "展品运输、仓储、保险费用"
      },
      {
        category: "人员费用",
        amount: Math.floor(totalBudget * 0.05),
        description: "策展人员、技术支持、讲解员"
      },
      {
        category: "营销与推广",
        amount: Math.floor(totalBudget * 0.05),
        description: "宣传材料、广告投放、公关活动"
      }
    ];

    const totalCost = breakdown.reduce((sum, item) => sum + item.amount, 0);

    return {
      breakdown,
      totalCost,
      recommendations: [
        "可考虑模块化设计，降低施工成本",
        "优先保证核心展区的质量，辅助区域可采用简化方案",
        "互动设备可考虑租赁而非购买，降低初期投入",
        "合理安排施工时间，避免加班费产生",
        response.content.toString()
      ]
    };
  }
}