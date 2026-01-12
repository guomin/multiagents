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

    try {
      this.modelConfig = ModelConfigFactory.createModelConfig(undefined, modelName, temperature);

      this.logger.info('✅ 模型配置创建成功', {
        provider: this.modelConfig.provider,
        modelName: this.modelConfig.modelName,
        temperature: this.modelConfig.temperature
      });

      this.llm = new ChatOpenAI({
        modelName: this.modelConfig.modelName,
        temperature: this.modelConfig.temperature,
        openAIApiKey: this.modelConfig.apiKey,
        ...(this.modelConfig.baseURL && { configuration: { baseURL: this.modelConfig.baseURL } }),
        ...(this.modelConfig.organization && { openAIOrganization: this.modelConfig.organization })
      });

      this.logger.info('✅ LLM客户端初始化完成');
    } catch (error) {
      this.logger.error('❌ 初始化失败', error as Error, { modelName, temperature });
      throw error;
    }
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
    this.logger.info('🎯 开始生成最终报告');

    // 使用 PromptManager 渲染 prompt
    const rendered = promptManager.render(
      'supervisor',
      'generateFinalReport',
      {
        // 项目基本信息
        title: state.requirements.title,
        theme: state.requirements.theme,
        targetAudience: state.requirements.targetAudience || '未指定',
        startDate: state.requirements.duration.startDate,
        endDate: state.requirements.duration.endDate,
        area: state.requirements.venueSpace.area,
        height: state.requirements.venueSpace.height,
        layout: state.requirements.venueSpace.layout,
        budget: state.requirements.budget.total,
        currency: state.requirements.budget.currency,

        // 概念策划字段
        conceptPlan: !!state.conceptPlan,
        concept: state.conceptPlan?.concept || '尚未提供',
        narrative: state.conceptPlan?.narrative || '尚未提供',
        keyExhibits: state.conceptPlan?.keyExhibits?.join(", ") || '尚未提供',
        visitorFlow: state.conceptPlan?.visitorFlow || '尚未提供',

        // 大纲细化字段（新增）
        exhibitionOutline: !!state.exhibitionOutline,
        outlineZones: state.exhibitionOutline?.zones?.map((z: any) =>
          `- **${z.name}** (占比${z.percentage}%)
  - 面积: ${z.area}㎡
  - 功能: ${z.function}
  - 预算分配: ¥${z.budgetAllocation?.toLocaleString() || '未提供'}
  - 展品数量: ${z.exhibitIds?.length || 0}件
  - 互动装置: ${z.interactiveIds?.length || 0}个`
        ).join('\n\n') || '尚未提供',
        outlineExhibitsCount: state.exhibitionOutline?.exhibits?.length || 0,
        outlineExhibits: state.exhibitionOutline?.exhibits?.slice(0, 15).map((e: any, idx: number) =>
          `- **${e.name}**
  - 类型: ${e.type}
  - 保护等级: ${e.protectionLevel}
  - 展柜要求: ${e.showcaseRequirement || '未提供'}
  - 保险费用: ¥${e.insurance?.toLocaleString() || '未提供'}
  - 运输费用: ¥${e.transportCost?.toLocaleString() || '未提供'}${e.dimensions ? `\n  - 尺寸: ${e.dimensions.length}×${e.dimensions.width}×${e.dimensions.height}米` : ''}`
        ).join('\n\n') + (state.exhibitionOutline?.exhibits && state.exhibitionOutline.exhibits.length > 15 ? `\n\n*注：共 ${state.exhibitionOutline.exhibits.length} 件展品，以上仅展示前 15 件*` : '') || '尚未提供',
        outlineInteractiveCount: state.exhibitionOutline?.interactivePlan?.length || 0,
        outlineInteractive: state.exhibitionOutline?.interactivePlan?.map((ip: any, idx: number) =>
          `- **${ip.name}** (${ip.type})
  - 优先级: ${ip.priority === 'high' ? '高' : ip.priority === 'medium' ? '中' : '低'}
  - 预估成本: ¥${ip.estimatedCost?.toLocaleString() || '未提供'}
  - 放置展区: ${ip.zoneId || '未指定'}
  - 功能描述: ${ip.description || '未提供'}`
        ).join('\n\n') || '尚未提供',
        outlineBudgetTotal: state.exhibitionOutline?.budgetAllocation?.total?.toLocaleString() || '未提供',
        outlineBudgetBreakdown: state.exhibitionOutline?.budgetAllocation?.breakdown?.map((b: any) =>
          `- **${b.category}**: ¥${b.amount?.toLocaleString() || '未提供'}${b.subCategories ? `\n  ${b.subCategories.map((s: any) => `    - ${s.name}: ¥${s.amount?.toLocaleString() || '未提供'}`).join('\n  ')}` : ''}`
        ).join('\n') || '尚未提供',
        outlineSpaceTotal: state.exhibitionOutline?.spaceConstraints?.totalArea || '未提供',
        outlineSpaceZones: `${state.exhibitionOutline?.spaceConstraints?.minZoneCount || '-'} - ${state.exhibitionOutline?.spaceConstraints?.maxZoneCount || '-'} 个`,
        outlineSpaceAisleWidth: `≥${state.exhibitionOutline?.spaceConstraints?.minAisleWidth || '-'} 米`,
        outlineSpaceMainZoneRatio: state.exhibitionOutline?.spaceConstraints?.mainZoneRatio ? `≥${(state.exhibitionOutline.spaceConstraints.mainZoneRatio * 100).toFixed(0)}%` : '-',

        // 空间设计字段
        spatialLayout: !!state.spatialLayout,
        spatialLayoutDesc: state.spatialLayout?.layout || '尚未提供',
        visitorRoute: state.spatialLayout?.visitorRoute?.join(" → ") || '尚未提供',
        zones: state.spatialLayout?.zones?.map(z =>
          `${z.name}: ${z.area}㎡ - ${z.function}`
        ).join("\n") || '尚未提供',

        // 视觉设计字段
        visualDesign: !!state.visualDesign,
        colorScheme: state.visualDesign?.colorScheme?.join(", ") || '尚未提供',
        typography: state.visualDesign?.typography || '尚未提供',
        brandElements: state.visualDesign?.brandElements?.join(", ") || '尚未提供',
        visualStyle: state.visualDesign?.visualStyle || '尚未提供',

        // 互动技术字段
        interactiveSolution: !!state.interactiveSolution,
        technologies: state.interactiveSolution?.technologies?.join(", ") || '尚未提供',
        interactives: state.interactiveSolution?.interactives?.map(i =>
          `- **${i.name}** (${i.type}): ${i.description}${i.cost ? ` - 成本: ${i.cost}` : ''}`
        ).join("\n") || '尚未提供',

        // 预算估算字段
        budgetEstimate: !!state.budgetEstimate,
        totalCost: state.budgetEstimate?.totalCost?.toString() || '0',
        breakdown: state.budgetEstimate?.breakdown?.map(b =>
          `- **${b.category}**: ${b.description} - ${b.amount} ${state.requirements.budget.currency}`
        ).join("\n") || '尚未提供',
        recommendations: state.budgetEstimate?.recommendations?.join("\n") || '无',

        // 项目完成状态
        completedSteps: [
          state.conceptPlan,
          state.exhibitionOutline,
          state.spatialLayout,
          state.visualDesign,
          state.interactiveSolution,
          state.budgetEstimate
        ].filter(Boolean).length,
        totalSteps: 6,
        iterationCount: state.iterationCount
      }
    );

    const messages = [
      new SystemMessage(rendered.system),
      new HumanMessage(rendered.human)
    ];

    try {
      const response = await this.llm.invoke(messages);
      const reportContent = response.content.toString();

      this.logger.info('✅ 最终报告生成成功', {
        reportLength: reportContent.length,
        preview: reportContent.substring(0, 100)
      });

      return reportContent;
    } catch (error) {
      this.logger.error('❌ 生成最终报告失败', error as Error);

      // 如果 AI 生成失败，回退到简单的字符串拼接
      this.logger.warn('回退到简单报告生成');
      return this.generateSimpleReport(state);
    }
  }

  /**
   * 生成简单的报告（备用方案）
   */
  private generateSimpleReport(state: ExhibitionState): string {
    const completedSteps = [
      state.conceptPlan,
      state.exhibitionOutline,
      state.spatialLayout,
      state.visualDesign,
      state.interactiveSolution,
      state.budgetEstimate
    ].filter(Boolean).length;

    const completionRate = Math.round((completedSteps / 6) * 100);

    return `
# 展陈设计项目报告

## 项目概述
- **展览名称**: ${state.requirements.title}
- **展览主题**: ${state.requirements.theme}
- **目标受众**: ${state.requirements.targetAudience || '未指定'}
- **展期**: ${state.requirements.duration.startDate} 至 ${state.requirements.duration.endDate}
- **场地面积**: ${state.requirements.venueSpace.area}平方米
- **场地高度**: ${state.requirements.venueSpace.height}米
- **场地布局**: ${state.requirements.venueSpace.layout}
- **预算**: ${state.requirements.budget.total.toLocaleString()} ${state.requirements.budget.currency}

## 设计方案

### 1. 概念策划
${state.conceptPlan ? `
- **核心概念**: ${state.conceptPlan.concept}
- **叙事结构**: ${state.conceptPlan.narrative}
- **重点展品**: ${state.conceptPlan.keyExhibits.join(", ")}
- **参观流程**: ${state.conceptPlan.visitorFlow || '未提供'}
` : "⚠️ 概念策划尚未完成"}

### 2. 大纲细化
${state.exhibitionOutline ? `
**展区划分** (${state.exhibitionOutline.zones?.length || 0}个展区):
${state.exhibitionOutline.zones?.map((z: any, idx: number) =>
  `- **${z.name}** (占比${z.percentage}%)
  - 面积: ${z.area}㎡
  - 功能: ${z.function}
  - 预算分配: ¥${z.budgetAllocation?.toLocaleString() || '未提供'}
  - 展品数量: ${z.exhibitIds?.length || 0}件
  - 互动装置: ${z.interactiveIds?.length || 0}个`
).join('\n\n') || '未提供'}

**展品清单** (${state.exhibitionOutline.exhibits?.length || 0}件展品):
${state.exhibitionOutline.exhibits?.slice(0, 15).map((e: any, idx: number) =>
  `- **${e.name}**
  - 类型: ${e.type}
  - 保护等级: ${e.protectionLevel}
  - 展柜要求: ${e.showcaseRequirement || '未提供'}
  - 保险费用: ¥${e.insurance?.toLocaleString() || '未提供'}
  - 运输费用: ¥${e.transportCost?.toLocaleString() || '未提供'}${e.dimensions ? `\n  - 尺寸: ${e.dimensions.length}×${e.dimensions.width}×${e.dimensions.height}米` : ''}`
).join('\n\n') || '未提供'}
${state.exhibitionOutline.exhibits?.length > 15 ? `\n*注：共 ${state.exhibitionOutline.exhibits.length} 件展品，以上仅展示前 15 件*` : ''}

**互动装置规划** (${state.exhibitionOutline.interactivePlan?.length || 0}个装置):
${state.exhibitionOutline.interactivePlan?.map((ip: any, idx: number) =>
  `- **${ip.name}** (${ip.type})
  - 优先级: ${ip.priority === 'high' ? '高' : ip.priority === 'medium' ? '中' : '低'}
  - 预估成本: ¥${ip.estimatedCost?.toLocaleString() || '未提供'}
  - 放置展区: ${ip.zoneId || '未指定'}
  - 功能描述: ${ip.description || '未提供'}`
).join('\n\n') || '未提供'}

**预算框架**:
- 总预算: ¥${state.exhibitionOutline.budgetAllocation?.total?.toLocaleString() || '未提供'}
${state.exhibitionOutline.budgetAllocation?.breakdown?.map((b: any) =>
  `- **${b.category}**: ¥${b.amount?.toLocaleString() || '未提供'}${b.subCategories ? `\n  ${b.subCategories.map((s: any) => `    - ${s.name}: ¥${s.amount?.toLocaleString() || '未提供'}`).join('\n  ')}` : ''}`
).join('\n') || '未提供'}

**空间约束**:
- 总面积: ${state.exhibitionOutline.spaceConstraints?.totalArea || '未提供'}㎡
- 展区数量: ${state.exhibitionOutline.spaceConstraints?.minZoneCount || '-'} - ${state.exhibitionOutline.spaceConstraints?.maxZoneCount || '-'} 个
- 通道宽度: ≥${state.exhibitionOutline.spaceConstraints?.minAisleWidth || '-'} 米
- 主展区占比: ≥${state.exhibitionOutline.spaceConstraints?.mainZoneRatio ? (state.exhibitionOutline.spaceConstraints.mainZoneRatio * 100).toFixed(0) : '-'}%
` : "⚠️ 大纲细化尚未完成"}

### 3. 空间设计
${state.spatialLayout ? `
- **布局方案**: ${state.spatialLayout.layout}
- **参观路线**: ${state.spatialLayout.visitorRoute.join(" → ")}
- **功能区域**:
${state.spatialLayout.zones.map(z => `  - ${z.name}: ${z.area}㎡ (${z.function})`).join("\n")}
` : "⚠️ 空间设计尚未完成"}

### 4. 视觉设计
${state.visualDesign ? `
- **色彩方案**: ${state.visualDesign.colorScheme.join(", ")}
- **字体设计**: ${state.visualDesign.typography}
- **品牌元素**: ${state.visualDesign.brandElements.join(", ")}
- **视觉风格**: ${state.visualDesign.visualStyle || '未指定'}
` : "⚠️ 视觉设计尚未完成"}

### 5. 互动技术
${state.interactiveSolution ? `
- **使用技术**: ${state.interactiveSolution.technologies.join(", ")}
- **互动装置**:
${state.interactiveSolution.interactives.map(i =>
  `  - **${i.name}** (${i.type}): ${i.description}${i.cost ? ` - 成本: ¥${i.cost.toLocaleString()}` : ''}`
).join("\n")}
` : "⚠️ 互动技术方案尚未完成"}

### 6. 预算估算
${state.budgetEstimate ? `
- **总成本**: ${state.budgetEstimate.totalCost.toLocaleString()} ${state.requirements.budget.currency}
- **预算明细**:
${state.budgetEstimate.breakdown.map(b =>
  `  - **${b.category}**: ${b.description} - ${b.amount.toLocaleString()} ${state.requirements.budget.currency}`
).join("\n")}
- **优化建议**:
${state.budgetEstimate.recommendations.map(r => `  - ${r}`).join("\n")}
` : "⚠️ 预算估算尚未完成"}

## 项目状态
- **完成度**: ${completionRate}% (${completedSteps}/6个阶段已完成)
- **迭代次数**: ${state.iterationCount + 1}

---

*本报告由展陈设计多智能体系统自动生成*
    `.trim();
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
        // 概念策划字段
        conceptPlan: !!state.conceptPlan,
        concept: state.conceptPlan?.concept || '',
        narrative: state.conceptPlan?.narrative || '',
        keyExhibits: state.conceptPlan?.keyExhibits?.join(", ") || '',
        visitorFlow: state.conceptPlan?.visitorFlow || '',
        // 大纲细化字段（新增）
        exhibitionOutline: !!state.exhibitionOutline,
        zones: state.exhibitionOutline?.zones?.map(z => `${z.name}(${z.percentage}%)`).join(", ") || '',
        exhibitsCount: state.exhibitionOutline?.exhibits?.length || 0,
        interactivesCount: state.exhibitionOutline?.interactivePlan?.length || 0,
        // 空间设计字段
        spatialLayout: !!state.spatialLayout,
        layout: state.spatialLayout?.layout || '',
        visitorRoute: state.spatialLayout?.visitorRoute?.join(" → ") || '',
        spatialZones: state.spatialLayout?.zones?.map(z => `${z.name}(${z.area}㎡)`).join(", ") || '',
        // 视觉设计字段
        visualDesign: !!state.visualDesign,
        colorScheme: state.visualDesign?.colorScheme?.join(", ") || '',
        typography: state.visualDesign?.typography || '',
        brandElements: state.visualDesign?.brandElements?.join(", ") || '',
        visualStyle: state.visualDesign?.visualStyle || '',
        // 互动技术字段
        interactiveSolution: !!state.interactiveSolution,
        technologies: state.interactiveSolution?.technologies?.join(", ") || '',
        interactives: state.interactiveSolution?.interactives?.map(i => `${i.name}: ${i.description}`).join("; ") || '',
        // 预算估算字段
        budgetEstimate: !!state.budgetEstimate,
        totalCost: state.budgetEstimate?.totalCost?.toString() || '',
        breakdown: state.budgetEstimate?.breakdown?.map(b => `${b.category}: ${b.amount}`).join(", ") || '',
        recommendations: state.budgetEstimate?.recommendations?.join("; ") || '',
        // 历史反馈
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
      outlineScore: state.exhibitionOutline ? 0.7 : 0,
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