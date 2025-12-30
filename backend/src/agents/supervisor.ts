import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionState, QualityEvaluation } from "../types/exhibition";
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

  /**
   * 评估当前设计方案的质量
   */
  async evaluateQuality(state: ExhibitionState): Promise<QualityEvaluation> {
    const systemPrompt = `你是展陈设计系统的质量评估专家。你需要全面评估当前设计方案的质量，并提供客观的分数和建设性的反馈。

评估维度（每个维度0-1分）：
1. 概念策划（conceptScore）：创意性、主题契合度、叙事逻辑
2. 空间设计（spatialScore）：布局合理性、动线流畅度、功能完整性
3. 视觉设计（visualScore）：美学价值、品牌一致性、可实施性
4. 互动技术（interactiveScore）：技术可行性、用户体验、创新性
5. 预算合理性（budgetScore）：成本控制、性价比、风险控制

输出格式（JSON）：
{
  "overallScore": 0.85,
  "conceptScore": 0.9,
  "spatialScore": 0.8,
  "visualScore": 0.85,
  "interactiveScore": 0.8,
  "budgetScore": 0.85,
  "feedback": "总体评价...",
  "revisionTarget": "none" | "curator" | "spatial_designer" | "visual_designer" | "interactive_tech" | "budget_controller"
}

评估标准：
- 0.9-1.0：优秀，可直接通过
- 0.75-0.9：良好，有小问题可忽略
- 0.6-0.75：合格，需要轻微修订
- 0.6以下：不合格，需要大幅修订

如果需要修订，revisionTarget 应该指向需要改进的节点。如果总体分数低于0.6，建议返回 curator 重新规划。
如果有多个问题，优先选择分数最低的对应节点。`;

    const humanPrompt = `请评估以下展陈设计方案：

【项目信息】
- 标题：${state.requirements.title}
- 主题：${state.requirements.theme}
- 预算：${state.requirements.budget.total} ${state.requirements.budget.currency}

【当前迭代】第 ${state.iterationCount + 1} 次（最多 ${state.maxIterations} 次）

【设计方案】
${state.conceptPlan ? `
1. 概念策划：
   - 核心概念：${state.conceptPlan.concept}
   - 叙事结构：${state.conceptPlan.narrative}
   - 重点展品：${state.conceptPlan.keyExhibits.join(", ")}
   - 观众动线：${state.conceptPlan.visitorFlow}
` : "❌ 概念策划未完成"}

${state.spatialLayout ? `
2. 空间设计：
   - 布局：${state.spatialLayout.layout}
   - 参观路线：${state.spatialLayout.visitorRoute.join(" → ")}
   - 功能区域：${state.spatialLayout.zones.map(z => `${z.name}(${z.area}㎡)`).join(", ")}
` : "❌ 空间设计未完成"}

${state.visualDesign ? `
3. 视觉设计：
   - 色彩方案：${state.visualDesign.colorScheme.join(", ")}
   - 字体设计：${state.visualDesign.typography}
   - 品牌元素：${state.visualDesign.brandElements.join(", ")}
   - 视觉风格：${state.visualDesign.visualStyle}
` : "❌ 视觉设计未完成"}

${state.interactiveSolution ? `
4. 互动技术：
   - 使用技术：${state.interactiveSolution.technologies.join(", ")}
   - 互动装置：${state.interactiveSolution.interactives.map(i => `${i.name}: ${i.description}`).join("; ")}
` : "❌ 互动技术方案未完成"}

${state.budgetEstimate ? `
5. 预算估算：
   - 总成本：${state.budgetEstimate.totalCost} ${state.requirements.budget.currency}
   - 预算明细：${state.budgetEstimate.breakdown.map(b => `${b.category}: ${b.amount}`).join(", ")}
   - 优化建议：${state.budgetEstimate.recommendations.join("; ")}
` : "❌ 预算估算未完成"}

${state.feedbackHistory.length > 0 ? `
【历史反馈】
${state.feedbackHistory.map((fb, idx) => `第${idx + 1}次: ${fb}`).join("\n")}
` : ""}

请进行全面的质量评估，输出 JSON 格式的评估结果。`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(humanPrompt)
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