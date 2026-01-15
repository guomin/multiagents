import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import {
  ExhibitionRequirement,
  ConceptPlan,
  ExhibitionOutline
} from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";
import { createLogger } from "../utils/logger";
import { promptManager } from "../prompts";

/**
 * 大纲细化智能体（Outline Agent）
 *
 * 职责：将概念策划细化为详细的执行大纲
 * - 展区划分（明确面积、功能、预算）
 * - 展品清单（详细、关联展区）
 * - 互动装置规划（初步）
 * - 预算框架
 * - 空间约束
 */
export class OutlineAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;
  private logger = createLogger('OUTLINE-AGENT');

  constructor(modelName?: string, temperature: number = 0.6) {
    this.logger.info('📋 初始化大纲细化智能体', { modelName, temperature });

    try {
      // 使用智能体专属配置（支持OUTLINE_AGENT_MAX_TOKENS）
      this.modelConfig = ModelConfigFactory.createModelConfigForAgent("outline", modelName, temperature);
      this.logger.info('模型配置创建成功', {
        provider: this.modelConfig.provider,
        modelName: this.modelConfig.modelName,
        temperature: this.modelConfig.temperature,
        maxTokens: this.modelConfig.maxTokens || 'default'
      });

      this.llm = new ChatOpenAI({
        modelName: this.modelConfig.modelName,
        temperature: this.modelConfig.temperature,
        openAIApiKey: this.modelConfig.apiKey,
        ...(this.modelConfig.baseURL && { configuration: { baseURL: this.modelConfig.baseURL } }),
        ...(this.modelConfig.organization && { openAIOrganization: this.modelConfig.organization }),
        ...(this.modelConfig.maxTokens && { maxTokens: this.modelConfig.maxTokens })
      });

      this.logger.info('✅ LLM客户端初始化完成');
    } catch (error) {
      this.logger.error('❌ 初始化失败', error as Error, { modelName, temperature });
      throw error;
    }
  }

  /**
   * 生成展览详细大纲（分段生成，避免输出截断）
   *
   * @param requirements - 用户原始需求
   * @param conceptPlan - 概念策划方案（来自策展智能体）
   * @returns 展览详细大纲
   */
  async generateOutline(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan
  ): Promise<ExhibitionOutline> {
    const startTime = Date.now();
    console.log('📋 [大纲细化智能体] 开始生成展览大纲（分段模式）...');

    this.logger.info('═══════════════════════════════════════════════════════════');
    this.logger.info('📋 [大纲细化智能体] 开始生成展览大纲（分段生成模式）');
    this.logger.info('═══════════════════════════════════════════════════════════');

    try {
      // ✅ 输入参数验证
      this.validateInputs(requirements, conceptPlan);

      // 📥 记录输入参数
      this.logger.info('📥 [输入参数] 用户需求', {
        title: requirements.title,
        theme: requirements.theme,
        totalBudget: requirements.budget.total,
        totalArea: requirements.venueSpace.area,
        targetAudience: requirements.targetAudience
      });

      this.logger.info('📥 [输入参数] 概念策划', {
        concept: conceptPlan.concept,
        narrativeLength: conceptPlan.narrative.length,
        keyExhibitsCount: conceptPlan.keyExhibits.length,
        visitorFlow: conceptPlan.visitorFlow
      });

      // 🔷 分段1: 生成展区划分 (zones)
      this.logger.info('🔷 [分段1/3] 开始生成展区划分...');
      const zones = await this.generateZones(requirements, conceptPlan);
      this.logger.info('✅ [分段1/3] 展区划分生成完成', { zonesCount: zones.length });

      // 🔷 分段2: 生成展品和互动装置 (exhibits + interactivePlan)
      this.logger.info('🔷 [分段2/3] 开始生成展品和互动装置...');
      const { exhibits, interactivePlan } = await this.generateExhibitsAndInteractive(
        requirements,
        conceptPlan,
        zones
      );
      this.logger.info('✅ [分段2/3] 展品和互动装置生成完成', {
        exhibitsCount: exhibits.length,
        interactivePlanCount: interactivePlan.length
      });

      // 🔷 分段3: 生成预算和空间约束 (budgetAllocation + spaceConstraints)
      this.logger.info('🔷 [分段3/3] 开始生成预算和空间约束...');
      const { budgetAllocation, spaceConstraints } = await this.generateBudgetAndSpace(
        requirements,
        conceptPlan,
        zones
      );
      this.logger.info('✅ [分段3/3] 预算和空间约束生成完成', {
        budgetTotal: budgetAllocation.total,
        spaceTotalArea: spaceConstraints.totalArea
      });

      // 📦 组装最终大纲
      const outline: ExhibitionOutline = {
        conceptPlan,
        zones,
        exhibits,
        interactivePlan,
        budgetAllocation,
        spaceConstraints
      };

      // 📤 输出日志
      this.logger.info('📤 [最终输出] 展览大纲', {
        zonesCount: outline.zones.length,
        exhibitsCount: outline.exhibits.length,
        interactivePlanCount: outline.interactivePlan.length,
        budgetAllocation: outline.budgetAllocation.total,
        spaceConstraints: outline.spaceConstraints
      });

      const finalDuration = Date.now() - startTime;

      this.logger.info('═══════════════════════════════════════════════════════════');
      this.logger.info('✅ [大纲细化智能体] 展览大纲生成完成', {
        success: true,
        totalDuration: `${finalDuration}ms`,
        mode: '分段生成'
      });
      this.logger.info('═══════════════════════════════════════════════════════════');

      return outline;

    } catch (error) {
      this.logger.error('❌ [大纲细化智能体] 展览大纲生成失败', error as Error, {
        title: requirements?.title,
        theme: requirements?.theme
      });
      throw error;
    }
  }

  /**
   * 分段1: 生成展区划分
   */
  private async generateZones(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan
  ): Promise<any[]> {
    const rendered = promptManager.render('outline', 'generateZones', {
      title: requirements.title,
      theme: requirements.theme,
      totalArea: requirements.venueSpace.area,
      concept: conceptPlan.concept,
      narrative: conceptPlan.narrative,
      visitorFlow: conceptPlan.visitorFlow,
      outlineDraft: requirements.outlineDraft || ''
    });

    const response = await this.llm.invoke([
      new SystemMessage(rendered.system),
      new HumanMessage(rendered.human)
    ]);

    this.checkFinishReason(response);

    const rawContent = response.content.toString();
    const cleaned = this.extractJSON(rawContent);
    const parsed = JSON.parse(cleaned);

    return parsed.zones || [];
  }

  /**
   * 分段2: 生成展品和互动装置
   */
  private async generateExhibitsAndInteractive(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan,
    zones: any[]
  ): Promise<{ exhibits: any[]; interactivePlan: any[] }> {
    const rendered = promptManager.render('outline', 'generateExhibitsAndInteractive', {
      title: requirements.title,
      theme: requirements.theme,
      totalBudget: requirements.budget.total,
      keyExhibits: conceptPlan.keyExhibits.join("；"),
      zones: zones.map(z => `${z.id}:${z.name}(${z.area}㎡)`).join("；")
    });

    const response = await this.llm.invoke([
      new SystemMessage(rendered.system),
      new HumanMessage(rendered.human)
    ]);

    this.checkFinishReason(response);

    const rawContent = response.content.toString();
    const cleaned = this.extractJSON(rawContent);
    const parsed = JSON.parse(cleaned);

    return {
      exhibits: parsed.exhibits || [],
      interactivePlan: parsed.interactivePlan || []
    };
  }

  /**
   * 分段3: 生成预算和空间约束
   */
  private async generateBudgetAndSpace(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan,
    zones: any[]
  ): Promise<{ budgetAllocation: any; spaceConstraints: any }> {
    const rendered = promptManager.render('outline', 'generateBudgetAndSpace', {
      totalBudget: requirements.budget.total,
      totalArea: requirements.venueSpace.area,
      zones: zones.map(z => `${z.id}:${z.name}(${z.area}㎡,${z.percentage}%)`).join("；")
    });

    const response = await this.llm.invoke([
      new SystemMessage(rendered.system),
      new HumanMessage(rendered.human)
    ]);

    this.checkFinishReason(response);

    const rawContent = response.content.toString();
    const cleaned = this.extractJSON(rawContent);
    const parsed = JSON.parse(cleaned);

    return {
      budgetAllocation: parsed.budgetAllocation || { total: requirements.budget.total, breakdown: [] },
      spaceConstraints: parsed.spaceConstraints || {
        totalArea: requirements.venueSpace.area,
        minZoneCount: 3,
        maxZoneCount: 6,
        minAisleWidth: 1.8,
        mainZoneRatio: 0.4
      }
    };
  }

  /**
   * 检查finish_reason并记录日志
   */
  private checkFinishReason(response: any): void {
    const finishReason = response.response_metadata?.finish_reason;
    if (finishReason) {
      if (finishReason === 'length') {
        this.logger.error('⚠️ [输出截断] LLM输出因达到maxTokens限制而被截断', {
          finishReason,
          maxTokens: this.modelConfig.maxTokens || 'default'
        });
      } else {
        this.logger.info('✅ [输出状态]', { finishReason });
      }
    }
  }

  /**
   * 输入参数验证
   */
  private validateInputs(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan
  ): void {
    if (!requirements) {
      throw new Error("requirements 参数不能为空");
    }

    if (!conceptPlan) {
      throw new Error("conceptPlan 参数不能为空");
    }

    // 验证关键字段
    if (!requirements.budget || typeof requirements.budget.total !== 'number') {
      throw new Error("requirements.budget.total 必须是数字");
    }

    if (!conceptPlan.concept || conceptPlan.concept.trim().length === 0) {
      throw new Error("conceptPlan.concept 不能为空");
    }

    if (!conceptPlan.keyExhibits || conceptPlan.keyExhibits.length === 0) {
      this.logger.warn('⚠️ [输入警告] conceptPlan.keyExhibits 为空，将使用默认展品');
    }

    if (!conceptPlan.visitorFlow || conceptPlan.visitorFlow.trim().length === 0) {
      this.logger.warn('⚠️ [输入警告] conceptPlan.visitorFlow 为空');
    }
  }

  /**
   * 解析LLM输出的展览大纲
   */
  private parseOutline(rawContent: string, conceptPlan: ConceptPlan): ExhibitionOutline {
    this.logger.info('🔧 [解析开始] 开始解析LLM响应', {
      contentLength: rawContent.length,
      preview: rawContent.substring(0, 200)
    });

    try {
      // 步骤1：提取JSON内容
      let cleanedContent = this.extractJSON(rawContent);

      this.logger.info('🔧 [JSON提取] 提取完成', {
        cleanedLength: cleanedContent.length,
        originalLength: rawContent.length
      });

      // 步骤2：尝试解析JSON
      const parsed = JSON.parse(cleanedContent);

      // 步骤3：验证必需字段
      this.validateParsedData(parsed);

      // 构建ExhibitionOutline对象
      const outline: ExhibitionOutline = {
        // 保留原始策划方案
        conceptPlan: conceptPlan,

        // 展区划分
        zones: parsed.zones || [],
        // 展品清单
        exhibits: parsed.exhibits || [],
        // 互动装置规划
        interactivePlan: parsed.interactivePlan || [],
        // 预算框架
        budgetAllocation: parsed.budgetAllocation || {
          total: 0,
          breakdown: []
        },
        // 空间约束
        spaceConstraints: parsed.spaceConstraints || {
          totalArea: 0,
          minZoneCount: 3,
          maxZoneCount: 6,
          minAisleWidth: 1.8,
          mainZoneRatio: 0.4
        }
      };

      this.logger.info('🔧 [解析成功] 展览大纲解析完成', {
        zonesCount: outline.zones.length,
        exhibitsCount: outline.exhibits.length,
        interactivePlanCount: outline.interactivePlan.length
      });

      return outline;

    } catch (parseError) {
      this.logger.error('❌ [解析失败] JSON解析失败', parseError as Error, {
        errorType: parseError.constructor.name,
        errorMessage: (parseError as Error).message,
        contentPreview: rawContent.substring(0, 500)
      });

      // 返回默认大纲
      return this.getDefaultOutline(conceptPlan);
    }
  }

  /**
   * 从LLM响应中提取JSON内容
   */
  private extractJSON(content: string): string {
    let cleaned = content.trim();

    // 方法1：查找markdown代码块
    const jsonCodeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const codeBlockMatch = cleaned.match(jsonCodeBlockRegex);
    if (codeBlockMatch) {
      this.logger.info('📝 [提取方法] 使用Markdown代码块提取');
      return codeBlockMatch[1].trim();
    }

    // 方法2：查找第一个{和最后一个}之间的内容
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      this.logger.info('📝 [提取方法] 使用大括号范围提取', {
        firstBrace,
        lastBrace,
        extractedLength: lastBrace - firstBrace + 1
      });
      return cleaned.substring(firstBrace, lastBrace + 1);
    }

    // 方法3：直接使用清理后的内容
    this.logger.warn('⚠️ [提取方法] 未找到JSON标记，使用原始内容');
    return cleaned;
  }

  /**
   * 验证解析后的数据
   */
  private validateParsedData(parsed: any): void {
    const errors: string[] = [];

    // 检查是否有至少一个有效字段
    if (!parsed.zones && !parsed.exhibits && !parsed.interactivePlan) {
      errors.push('缺少必需字段：zones, exhibits, 或 interactivePlan');
    }

    // 验证zones（如果存在）
    if (parsed.zones && Array.isArray(parsed.zones)) {
      if (parsed.zones.length === 0) {
        errors.push('zones数组为空');
      }
      parsed.zones.forEach((zone: any, index: number) => {
        if (!zone.id) errors.push(`zones[${index}].id 缺失`);
        if (!zone.name) errors.push(`zones[${index}].name 缺失`);
        if (typeof zone.area !== 'number') errors.push(`zones[${index}].area 不是数字`);
      });
    }

    // 验证exhibits（如果存在）
    if (parsed.exhibits && Array.isArray(parsed.exhibits)) {
      parsed.exhibits.forEach((exhibit: any, index: number) => {
        if (!exhibit.id) errors.push(`exhibits[${index}].id 缺失`);
        if (!exhibit.name) errors.push(`exhibits[${index}].name 缺失`);
        if (!exhibit.zoneId) errors.push(`exhibits[${index}].zoneId 缺失`);
      });
    }

    if (errors.length > 0) {
      throw new Error(`数据验证失败：\n${errors.join('\n')}`);
    }

    this.logger.info('✅ [数据验证] 验证通过');
  }

  /**
   * 生成默认大纲（解析失败时使用）
   */
  private getDefaultOutline(conceptPlan: ConceptPlan): ExhibitionOutline {
    this.logger.warn('⚠️ [降级方案] 使用默认展览大纲');

    return {
      conceptPlan: conceptPlan,

      zones: [
        {
          id: "zone-1",
          name: "序厅",
          area: 50,
          percentage: 10,
          function: "展览介绍、氛围营造",
          exhibitIds: ["ex-1", "ex-2"],
          interactiveIds: [],
          budgetAllocation: 50000
        },
        {
          id: "zone-2",
          name: "主展区",
          area: 300,
          percentage: 60,
          function: "核心内容展示",
          exhibitIds: conceptPlan.keyExhibits.slice(0, 5).map((_, i) => `ex-${i + 3}`),
          interactiveIds: ["int-1"],
          budgetAllocation: 300000
        },
        {
          id: "zone-3",
          name: "互动区",
          area: 150,
          percentage: 30,
          function: "互动体验、休息交流",
          exhibitIds: [],
          interactiveIds: ["int-2", "int-3"],
          budgetAllocation: 150000
        }
      ],

      exhibits: conceptPlan.keyExhibits.map((name, i) => ({
        id: `ex-${i + 1}`,
        name: name,
        zoneId: i < 2 ? "zone-1" : "zone-2",
        type: "文物",
        protectionLevel: "二级",
        showcaseRequirement: "独立恒温展柜",
        insurance: 10000,
        transportCost: 5000
      })),

      interactivePlan: [
        {
          id: "int-1",
          name: "AR导览",
          zoneId: "zone-2",
          type: "AR",
          estimatedCost: 45000,
          priority: "high",
          description: "增强现实导览系统"
        },
        {
          id: "int-2",
          name: "触摸屏查询",
          zoneId: "zone-3",
          type: "触摸屏",
          estimatedCost: 25000,
          priority: "medium",
          description: "展品信息查询系统"
        }
      ],

      budgetAllocation: {
        total: 500000,
        breakdown: [
          {
            category: "序厅",
            amount: 50000,
            subCategories: [
              { name: "硬装", amount: 20000 },
              { name: "照明", amount: 10000 },
              { name: "展柜", amount: 10000 },
              { name: "其他", amount: 10000 }
            ]
          },
          {
            category: "主展区",
            amount: 300000,
            subCategories: [
              { name: "硬装", amount: 150000 },
              { name: "展柜", amount: 100000 },
              { name: "照明", amount: 50000 }
            ]
          },
          {
            category: "互动区",
            amount: 150000,
            subCategories: [
              { name: "互动装置", amount: 70000 },
              { name: "硬装", amount: 50000 },
              { name: "照明", amount: 30000 }
            ]
          }
        ]
      },

      spaceConstraints: {
        totalArea: 500,
        minZoneCount: 3,
        maxZoneCount: 5,
        minAisleWidth: 1.8,
        mainZoneRatio: 0.4
      }
    };
  }
}
