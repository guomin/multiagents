import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionState, QualityEvaluation } from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";
import { promptManager } from "../prompts";
import { createLogger } from "../utils/logger";

export class SupervisorAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;
  private logger = createLogger('SUPERVISOR-AGENT');

  constructor(modelName?: string, temperature: number = 0.5) {
    this.logger.info('🛡️ 初始化监督智能体', { modelName, temperature });
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
    // 使用 PromptManager 渲染 prompt
    const rendered = promptManager.render(
      'supervisor',
      'analyzeProgress',
      {
        currentStep: state.currentStep,
        hasConceptPlan: !!state.conceptPlan,
        hasSpatialLayout: !!state.spatialLayout,
        hasVisualDesign: !!state.visualDesign,
        hasInteractiveSolution: !!state.interactiveSolution,
        hasBudgetEstimate: !!state.budgetEstimate,
        title: state.requirements.title,
        theme: state.requirements.theme,
        budget: state.requirements.budget.total,
        currency: state.requirements.budget.currency
      }
    );

    const messages = [
      new SystemMessage(rendered.system),
      new HumanMessage(rendered.human)
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

  /**
   * 评估当前设计方案的质量
   */
  async evaluateQuality(state: ExhibitionState): Promise<QualityEvaluation> {
    // 使用 PromptManager 渲染 prompt
    const rendered = promptManager.render(
      'supervisor',
      'evaluateQuality',
      {
        title: state.requirements.title,
        theme: state.requirements.theme,
        budget: state.requirements.budget.total,
        currency: state.requirements.budget.currency,
        iterationCount: state.iterationCount + 1,
        maxIterations: state.maxIterations,
        conceptPlan: state.conceptPlan ? JSON.stringify(state.conceptPlan) : '',
        spatialLayout: state.spatialLayout ? JSON.stringify(state.spatialLayout) : '',
        visualDesign: state.visualDesign ? JSON.stringify(state.visualDesign) : '',
        interactiveSolution: state.interactiveSolution ? JSON.stringify(state.interactiveSolution) : '',
        budgetEstimate: state.budgetEstimate ? JSON.stringify(state.budgetEstimate) : '',
        feedbackHistory: state.feedbackHistory.length > 0
          ? state.feedbackHistory.map((fb, idx) => `第${idx + 1}次: ${fb}`).join("\n")
          : ""
      }
    );

    const messages = [
      new SystemMessage(rendered.system),
      new HumanMessage(rendered.human)
    ];

    const response = await this.llm.invoke(messages);
    const responseText = response.content.toString();

    // 尝试解析 JSON
    try {
      // 提取 JSON 部分
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0]);
        return evaluation as QualityEvaluation;
      }
    } catch (error) {
      console.warn("无法解析质量评估结果，使用默认值");
    }

    // 默认评估结果
    return {
      overallScore: 0.7,
      conceptScore: state.conceptPlan ? 0.7 : 0,
      spatialScore: state.spatialLayout ? 0.7 : 0,
      visualScore: state.visualDesign ? 0.7 : 0,
      interactiveScore: state.interactiveSolution ? 0.7 : 0,
      budgetScore: state.budgetEstimate ? 0.7 : 0,
      feedback: "无法解析详细评估，使用默认分数",
      revisionTarget: "none"
    };
  }

  /**
   * 判断是否需要修订以及修订目标
   */
  shouldRevise(evaluation: QualityEvaluation, iterationCount: number, maxIterations: number): {
    needsRevision: boolean;
    reason: string;
  } {
    // 如果质量足够高，不需要修订
    if (evaluation.overallScore >= 0.85) {
      return {
        needsRevision: false,
        reason: "质量优秀，无需修订"
      };
    }

    // 如果达到最大迭代次数，不再修订
    if (iterationCount >= maxIterations) {
      return {
        needsRevision: false,
        reason: `已达到最大迭代次数(${maxIterations})，接受当前方案`
      };
    }

    // 质量过低，需要修订
    if (evaluation.overallScore < 0.6) {
      return {
        needsRevision: true,
        reason: `总体质量(${evaluation.overallScore.toFixed(2)})低于标准，需要${evaluation.revisionTarget}重新设计`
      };
    }

    // 质量一般，可以修订也可以接受
    if (evaluation.overallScore < 0.75 && evaluation.revisionTarget !== "none") {
      return {
        needsRevision: true,
        reason: `质量有待提升，建议${evaluation.revisionTarget}进行优化`
      };
    }

    return {
      needsRevision: false,
      reason: "质量合格，继续流程"
    };
  }
}