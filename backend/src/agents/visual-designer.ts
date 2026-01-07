import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionRequirement, ConceptPlan, VisualDesign, SpatialLayout } from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";
import { promptManager } from "../prompts";
import { createLogger } from "../utils/logger";

export class VisualDesignerAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;
  private logger = createLogger('VISUAL-DESIGNER-AGENT');

  constructor(modelName?: string, temperature: number = 0.6) {
    this.logger.info('🎨 初始化视觉设计智能体', { modelName, temperature });

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

  async generateVisualDesign(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan,
    spatialLayout?: SpatialLayout,
    revisionReason?: string
  ): Promise<VisualDesign> {
    const startTime = Date.now();
    console.log('🎨 [视觉设计智能体] 开始生成视觉设计方案...');

    this.logger.info('═══════════════════════════════════════════════════════════');
    this.logger.info('🎨 [视觉设计智能体] 开始生成视觉设计方案');
    this.logger.info('═══════════════════════════════════════════════════════════');

    try {
      // ✅ 输入参数验证
      this.validateInputs(requirements, conceptPlan);

      // 📥 完整记录输入参数
      this.logger.info('📥 [输入参数] 原始需求', {
        exhibitionTitle: requirements.title,
        theme: requirements.theme,
        targetAudience: requirements.targetAudience,
        hasRevisionReason: !!revisionReason,
        revisionReason: revisionReason || "无"
      });

      this.logger.info('📥 [输入参数] 策划方案（来自策划智能体）', {
        concept: conceptPlan.concept,
        narrative: conceptPlan.narrative,
        conceptLength: conceptPlan.concept.length,
        narrativeLength: conceptPlan.narrative.length
      });

      this.logger.info('📥 [输入详情] 完整需求对象', {
        fullRequirements: JSON.stringify(requirements, null, 2)
      });

      this.logger.info('📥 [输入详情] 完整策划对象', {
        fullConceptPlan: JSON.stringify(conceptPlan, null, 2)
      });

      this.logger.info('📥 [输入参数] 空间布局（来自空间智能体）', {
        layout: spatialLayout?.layout || "无",
        visitorRoute: spatialLayout?.visitorRoute || [],
        zones: spatialLayout?.zones || [],
        hasAccessibility: !!spatialLayout?.accessibility
      });

      // 使用 PromptManager 渲染 prompt
      const rendered = promptManager.render(
        'visual_designer',
        'generateVisualDesign',
        {
          revisionReason,
          title: requirements.title,
          theme: requirements.theme,
          targetAudience: requirements.targetAudience,
          concept: conceptPlan.concept,
          narrative: conceptPlan.narrative,
          // 空间布局信息
          layout: spatialLayout?.layout || "",
          visitorRoute: spatialLayout?.visitorRoute.join(" → ") || "",
          zones: spatialLayout?.zones.map(z =>
            `${z.name}（${z.area}㎡，功能：${z.function}）`
          ).join("；") || ""
        }
      );

      const systemPrompt = rendered.system;
      const humanPrompt = rendered.human;

      this.logger.info('📝 [提示词] Prompt 版本', {
        version: `${rendered.version.major}.${rendered.version.minor}.${rendered.version.patch}`,
        systemPromptLength: systemPrompt.length,
        humanPromptLength: humanPrompt.length
      });

      this.logger.info('📝 [提示词] 系统提示词', {
        content: systemPrompt
      });

      this.logger.info('📝 [提示词] 用户提示词', {
        content: humanPrompt
      });

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(humanPrompt)
      ];

      this.logger.info('🤖 [LLM调用] 准备调用大模型', {
        model: this.modelConfig.modelName,
        temperature: this.modelConfig.temperature,
        messageCount: messages.length,
        provider: this.modelConfig.provider
      });

      const llmStart = Date.now();
      const response = await this.llm.invoke(messages);
      const llmDuration = Date.now() - llmStart;
      const totalDuration = Date.now() - startTime;

      this.logger.info('🤖 [LLM调用] 大模型响应完成', {
        responseLength: response.content.toString().length,
        llmDuration: `${llmDuration}ms`,
        totalDuration: `${totalDuration}ms`,
        tokenUsage: response.usage_metadata
      });

      const rawContent = response.content.toString();

      this.logger.info('📤 [LLM原始输出] 未解析的原始响应', {
        content: rawContent,
        length: rawContent.length
      });

      // ✅ 解析响应
      const visualDesign = this.parseResponse(rawContent);

      // 📤 最终输出日志
      this.logger.info('📤 [最终输出] 视觉设计方案', {
        colorScheme: visualDesign.colorScheme,
        colorSchemeCount: visualDesign.colorScheme.length,
        typography: visualDesign.typography,
        typographyLength: visualDesign.typography.length,
        brandElements: visualDesign.brandElements,
        brandElementsCount: visualDesign.brandElements.length,
        visualStyle: visualDesign.visualStyle,
        visualStyleLength: visualDesign.visualStyle.length
      });

      this.logger.info('📤 [输出详情] 完整视觉设计对象', {
        fullVisualDesign: JSON.stringify(visualDesign, null, 2)
      });

      const finalDuration = Date.now() - startTime;

      this.logger.info('═══════════════════════════════════════════════════════════');
      this.logger.info('✅ [视觉设计智能体] 视觉设计生成完成', {
        success: true,
        totalDuration: `${finalDuration}ms`,
        llmDuration: `${llmDuration}ms`,
        parsingDuration: `${finalDuration - llmDuration}ms`
      });
      this.logger.info('═══════════════════════════════════════════════════════════');

      return visualDesign;

    } catch (error) {
      // ✅ 外层错误捕获
      this.logger.error('❌ [视觉设计智能体] 视觉设计生成失败', error as Error, {
        exhibitionTitle: requirements?.title || 'unknown',
        theme: requirements?.theme || 'unknown',
        errorType: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * ✅ 输入参数验证
   */
  private validateInputs(requirements: ExhibitionRequirement, conceptPlan: ConceptPlan): void {
    if (!requirements) {
      throw new Error("requirements 参数不能为空");
    }

    if (!conceptPlan) {
      throw new Error("conceptPlan 参数不能为空");
    }

    if (!conceptPlan.concept || conceptPlan.concept.trim().length === 0) {
      throw new Error("conceptPlan.concept 不能为空");
    }

    if (!conceptPlan.narrative || conceptPlan.narrative.trim().length === 0) {
      this.logger.warn('⚠️ [输入警告] conceptPlan.narrative 为空，可能影响生成质量');
    }
  }

  /**
   * ✅ 解析 LLM 响应
   */
  private parseResponse(rawContent: string): VisualDesign {
    this.logger.info('🔧 [解析开始] 开始解析LLM响应');

    try {
      // 清理 markdown 代码块
      const cleanedContent = this.cleanMarkdownBlock(rawContent);

      if (cleanedContent.startsWith('{')) {
        this.logger.info('🔧 [解析方式] 检测到JSON格式（已清理markdown标记），尝试JSON解析', {
          originalLength: rawContent.length,
          cleanedLength: cleanedContent.length,
          hadMarkdownBlock: rawContent !== cleanedContent
        });

        const parsed = JSON.parse(cleanedContent);
        return this.buildVisualDesignFromParsed(parsed, rawContent);
      } else {
        this.logger.info('🔧 [解析方式] 非JSON格式，使用默认结构');
        return this.getDefaultVisualDesign(rawContent);
      }
    } catch (parseError) {
      this.logger.error('❌ [解析失败] 解析失败，使用默认结果', parseError as Error);
      return this.getDefaultVisualDesign(rawContent);
    }
  }

  /**
   * ✅ 清理 markdown 代码块标记
   */
  private cleanMarkdownBlock(content: string): string {
    let cleaned = content.trim();

    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7); // 移除 ```json
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3); // 移除 ```
    }

    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3); // 移除结尾的 ```
    }

    return cleaned.trim();
  }

  /**
   * ✅ 从解析的数据构建视觉设计
   */
  private buildVisualDesignFromParsed(parsed: any, rawContent: string): VisualDesign {
    // 数据验证
    if (parsed.colorScheme && !Array.isArray(parsed.colorScheme)) {
      this.logger.warn('⚠️ [数据验证] colorScheme 不是数组，使用默认值');
      parsed.colorScheme = undefined;
    }

    if (parsed.brandElements && !Array.isArray(parsed.brandElements)) {
      this.logger.warn('⚠️ [数据验证] brandElements 不是数组，使用默认值');
      parsed.brandElements = undefined;
    }

    const design = {
      colorScheme: parsed.colorScheme || this.getDefaultColorScheme(),
      typography: parsed.typography || "标题使用思源黑体 Bold，正文使用思源宋体 Regular",
      brandElements: parsed.brandElements || this.getDefaultBrandElements(),
      visualStyle: parsed.visualStyle || rawContent
    };

    this.logger.info('🔧 [解析成功] JSON解析完成', {
      parsed: JSON.stringify(parsed, null, 2)
    });

    return design;
  }

  /**
   * ✅ 默认视觉设计
   */
  private getDefaultVisualDesign(fallbackContent?: string): VisualDesign {
    this.logger.info('🔧 [默认方案] 生成默认视觉设计');

    return {
      colorScheme: this.getDefaultColorScheme(),
      typography: "标题使用思源黑体 Bold，正文使用思源宋体 Regular，确保中英文混排时的视觉统一",
      brandElements: this.getDefaultBrandElements(),
      visualStyle: fallbackContent || "基于策划概念的视觉设计方案"
    };
  }

  /**
   * ✅ 默认色彩方案
   */
  private getDefaultColorScheme(): string[] {
    return [
      "#1A365D", // 深蓝 - 主色
      "#2C5282", // 中蓝 - 辅助色
      "#ED8936", // 橙色 - 强调色
      "#F7FAFC"  // 浅灰 - 背景色
    ];
  }

  /**
   * ✅ 默认品牌元素
   */
  private getDefaultBrandElements(): string[] {
    return [
      "展览专属Logo设计",
      "统一的图形标识系统",
      "主题色彩的地贴和墙面标识",
      "定制的信息图表样式"
    ];
  }
}