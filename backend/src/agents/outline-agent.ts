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
      this.modelConfig = ModelConfigFactory.createModelConfig(undefined, modelName, temperature);
      this.logger.info('模型配置创建成功', {
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

  /**
   * 生成展览详细大纲
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
    console.log('📋 [大纲细化智能体] 开始生成展览大纲...');

    this.logger.info('═══════════════════════════════════════════════════════════');
    this.logger.info('📋 [大纲细化智能体] 开始生成展览大纲');
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

      // 使用 PromptManager 渲染 prompt
      const rendered = promptManager.render(
        'outline',
        'generateOutline',
        {
          // 展览基本信息
          title: requirements.title,
          theme: requirements.theme,
          targetAudience: requirements.targetAudience,
          totalBudget: requirements.budget.total,
          currency: requirements.budget.currency,
          totalArea: requirements.venueSpace.area,
          height: requirements.venueSpace.height,
          layout: requirements.venueSpace.layout,
          startDate: requirements.duration.startDate,
          endDate: requirements.duration.endDate,

          // 策划方案信息
          concept: conceptPlan.concept,
          narrative: conceptPlan.narrative,
          keyExhibits: conceptPlan.keyExhibits.join("；"),
          visitorFlow: conceptPlan.visitorFlow
        }
      );

      const systemPrompt = rendered.system;
      const humanPrompt = rendered.human;

      this.logger.info('📝 [提示词] Prompt 版本', {
        version: `${rendered.version.major}.${rendered.version.minor}.${rendered.version.patch}`,
        systemPromptLength: systemPrompt.length,
        humanPromptLength: humanPrompt.length
      });

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(humanPrompt)
      ];

      this.logger.info('🤖 [LLM调用] 准备调用大模型', {
        model: this.modelConfig.modelName,
        temperature: this.modelConfig.temperature
      });

      const llmStart = Date.now();
      const response = await this.llm.invoke(messages);
      const llmDuration = Date.now() - llmStart;

      this.logger.info('🤖 [LLM调用] 大模型响应完成', {
        llmDuration: `${llmDuration}ms`,
        responseLength: response.content.toString().length
      });

      const rawContent = response.content.toString();

      // 解析LLM响应
      const outline = this.parseOutline(rawContent, conceptPlan);

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
        llmDuration: `${llmDuration}ms`
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
    this.logger.info('🔧 [解析开始] 开始解析LLM响应');

    try {
      // 清理markdown代码块标记
      let cleanedContent = rawContent.trim();

      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }

      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }

      cleanedContent = cleanedContent.trim();

      // 解析JSON
      const parsed = JSON.parse(cleanedContent);

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
      this.logger.error('❌ [解析失败] 解析失败，使用默认大纲', parseError as Error);

      // 返回默认大纲
      return this.getDefaultOutline(conceptPlan);
    }
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
