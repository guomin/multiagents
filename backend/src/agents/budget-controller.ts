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

export class BudgetControllerAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;

  constructor(modelName?: string, temperature: number = 0.3) {
    this.modelConfig = ModelConfigFactory.createModelConfig(undefined, modelName, temperature);

    this.llm = new ChatOpenAI({
      modelName: this.modelConfig.modelName,
      temperature: this.modelConfig.temperature,
      openAIApiKey: this.modelConfig.apiKey,
      ...(this.modelConfig.baseURL && { configuration: { baseURL: this.modelConfig.baseURL } }),
      ...(this.modelConfig.organization && { openAIOrganization: this.modelConfig.organization })
    });
  }

  async generateBudgetEstimate(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan,
    spatialLayout: SpatialLayout,
    visualDesign: VisualDesign,
    interactiveSolution: InteractiveSolution
  ): Promise<BudgetEstimate> {
    const systemPrompt = `你是一位专业的展陈预算控制专家，具有丰富的项目成本估算和财务管理经验。你需要根据展览设计方案，生成详细的预算估算和优化建议。

请考虑以下方面：
1. 各项费用的准确性和完整性
2. 预算分配的合理性
3. 成本优化的可行性
4. 风险控制的前瞻性

输出格式：
- breakdown: 详细的预算明细
- totalCost: 总成本估算
- recommendations: 成本优化建议`;

    const humanPrompt = `请为以下展览项目生成预算估算：

基础信息：
- 总预算：${requirements.budget.total} ${requirements.budget.currency}
- 展览面积：${requirements.venueSpace.area}平方米
- 展期：${requirements.duration.startDate} 至 ${requirements.duration.endDate}

设计方案已包含：
1. 概念策划方案
2. 空间布局设计
3. 视觉设计方案
4. 互动技术方案

请生成详细的预算估算和优化建议。`;

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