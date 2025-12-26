import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionState } from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";

export class SupervisorAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;

  constructor(modelName?: string, temperature: number = 0.5) {
    this.modelConfig = ModelConfigFactory.createModelConfig(undefined, modelName, temperature);

    this.llm = new ChatOpenAI({
      modelName: this.modelConfig.modelName,
      temperature: this.modelConfig.temperature,
      openAIApiKey: this.modelConfig.apiKey,
      ...(this.modelConfig.baseURL && { configuration: { baseURL: this.modelConfig.baseURL } }),
      ...(this.modelConfig.organization && { openAIOrganization: this.modelConfig.organization })
    });
  }

  async analyzeProgress(state: ExhibitionState): Promise<{
    nextAction: string;
    recommendations: string[];
    issues: string[];
  }> {
    const systemPrompt = `你是展陈设计多智能体系统的协调主管。你需要分析当前项目的进展状态，确定下一步行动，并提供专业建议。

你的职责包括：
1. 分析各智能体的工作进展
2. 识别潜在的问题和冲突
3. 协调各专业领域的工作
4. 确保项目质量和进度

请输出：
- nextAction: 下一步应该执行的操作
- recommendations: 改进建议
- issues: 发现的问题或风险`;

    const humanPrompt = `请分析当前展陈设计项目的状态：

当前步骤：${state.currentStep}
已有成果：
${state.conceptPlan ? "✅ 概念策划已完成" : "❌ 概念策划待完成"}
${state.spatialLayout ? "✅ 空间设计已完成" : "❌ 空间设计待完成"}
${state.visualDesign ? "✅ 视觉设计已完成" : "❌ 视觉设计待完成"}
${state.interactiveSolution ? "✅ 互动技术方案已完成" : "❌ 互动技术方案待完成"}
${state.budgetEstimate ? "✅ 预算估算已完成" : "❌ 预算估算待完成"}

展览信息：${state.requirements.title}
主题：${state.requirements.theme}
预算：${state.requirements.budget.total} ${state.requirements.budget.currency}

请提供分析和建议。`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(humanPrompt)
    ];

    const response = await this.llm.invoke(messages);

    return {
      nextAction: this.determineNextAction(state),
      recommendations: [
        "确保各设计方案之间的协调统一",
        "重点关注用户体验的连贯性",
        "控制预算在合理范围内",
        "考虑展览的可实施性"
      ],
      issues: response.content.toString().includes("问题")
        ? [response.content.toString()]
        : []
    };
  }

  private determineNextAction(state: ExhibitionState): string {
    if (!state.conceptPlan) {
      return "执行概念策划";
    }
    if (!state.spatialLayout) {
      return "执行空间设计";
    }
    if (!state.visualDesign) {
      return "执行视觉设计";
    }
    if (!state.interactiveSolution) {
      return "执行互动技术设计";
    }
    if (!state.budgetEstimate) {
      return "执行预算估算";
    }
    return "项目完成，生成最终报告";
  }

  async generateFinalReport(state: ExhibitionState): Promise<string> {
    const reportContent = `
# 展陈设计项目报告

## 项目概述
- **展览名称**: ${state.requirements.title}
- **展览主题**: ${state.requirements.theme}
- **目标受众**: ${state.requirements.targetAudience}
- **展期**: ${state.requirements.duration.startDate} 至 ${state.requirements.duration.endDate}
- **场地面积**: ${state.requirements.venueSpace.area}平方米

## 设计方案

### 1. 概念策划
${state.conceptPlan ? `
- **核心概念**: ${state.conceptPlan.concept}
- **叙事结构**: ${state.conceptPlan.narrative}
- **重点展品**: ${state.conceptPlan.keyExhibits.join(", ")}
` : "概念策划尚未完成"}

### 2. 空间设计
${state.spatialLayout ? `
- **布局方案**: ${state.spatialLayout.layout}
- **参观路线**: ${state.spatialLayout.visitorRoute.join(" → ")}
- **功能区域**: ${state.spatialLayout.zones.map(z => `${z.name}(${z.area}㎡)`).join(", ")}
` : "空间设计尚未完成"}

### 3. 视觉设计
${state.visualDesign ? `
- **色彩方案**: ${state.visualDesign.colorScheme.join(", ")}
- **字体设计**: ${state.visualDesign.typography}
- **品牌元素**: ${state.visualDesign.brandElements.join(", ")}
` : "视觉设计尚未完成"}

### 4. 互动技术
${state.interactiveSolution ? `
- **使用技术**: ${state.interactiveSolution.technologies.join(", ")}
- **互动装置**: ${state.interactiveSolution.interactives.map(i => i.name).join(", ")}
` : "互动技术方案尚未完成"}

### 5. 预算估算
${state.budgetEstimate ? `
- **总成本**: ${state.budgetEstimate.totalCost} ${state.requirements.budget.currency}
- **预算明细**: ${state.budgetEstimate.breakdown.map(b => `${b.category}: ${b.amount}`).join(", ")}
` : "预算估算尚未完成"}

## 项目状态
${this.getProjectCompletionStatus(state)}
    `;

    return reportContent;
  }

  private getProjectCompletionStatus(state: ExhibitionState): string {
    const completedSteps = [
      state.conceptPlan,
      state.spatialLayout,
      state.visualDesign,
      state.interactiveSolution,
      state.budgetEstimate
    ].filter(Boolean).length;

    const totalSteps = 5;
    const completionRate = Math.round((completedSteps / totalSteps) * 100);

    return `项目完成度: ${completionRate}% (${completedSteps}/${totalSteps}个阶段已完成)`;
  }
}