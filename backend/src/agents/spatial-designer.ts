import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionRequirement, ConceptPlan, SpatialLayout } from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";
import { promptManager } from "../prompts";
import { createLogger } from "../utils/logger";

export class SpatialDesignerAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;
  private logger = createLogger('SPATIAL-DESIGNER-AGENT');

  constructor(modelName?: string, temperature: number = 0.5) {
    this.logger.info('🏗️ 初始化空间设计智能体', { modelName, temperature });

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

  async generateSpatialLayout(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan,
    revisionReason?: string
  ): Promise<SpatialLayout> {
    const startTime = Date.now();
    console.log('🏗️ [空间设计智能体] 开始生成空间布局方案...');

    this.logger.info('═══════════════════════════════════════════════════════════');
    this.logger.info('🏗️ [空间设计智能体] 开始生成空间布局方案');
    this.logger.info('═══════════════════════════════════════════════════════════');

    try {
      // ✅ 输入参数验证
      this.validateInputs(requirements, conceptPlan);

      // 📥 完整记录输入参数
      this.logger.info('📥 [输入参数] 原始需求', {
        exhibitionTitle: requirements.title,
        theme: requirements.theme,
        targetAudience: requirements.targetAudience,
        venueSpace: {
          area: requirements.venueSpace.area,
          height: requirements.venueSpace.height,
          layout: requirements.venueSpace.layout
        },
        budget: {
          total: requirements.budget.total,
          currency: requirements.budget.currency
        },
        hasRevisionReason: !!revisionReason,
        revisionReason: revisionReason || "无"
      });

      this.logger.info('📥 [输入参数] 策划方案（来自策划智能体）', {
        concept: conceptPlan.concept,
        narrative: conceptPlan.narrative,
        keyExhibits: conceptPlan.keyExhibits,
        exhibitsCount: conceptPlan.keyExhibits.length,
        visitorFlow: conceptPlan.visitorFlow
      });

      this.logger.info('📥 [输入详情] 完整需求对象', {
        fullRequirements: JSON.stringify(requirements, null, 2)
      });

      this.logger.info('📥 [输入详情] 完整策划对象', {
        fullConceptPlan: JSON.stringify(conceptPlan, null, 2)
      });

      // 使用 PromptManager 渲染 prompt
      const rendered = promptManager.render(
        'spatial_designer',
        'generateSpatialLayout',
        {
          revisionReason,
          // 展览基本信息
          title: requirements.title,
          theme: requirements.theme,
          area: requirements.venueSpace.area,
          height: requirements.venueSpace.height,
          layout: requirements.venueSpace.layout,
          budget: requirements.budget.total,
          currency: requirements.budget.currency,
          // 策展方案（来自策划智能体）
          concept: conceptPlan.concept,
          narrative: conceptPlan.narrative,
          keyExhibits: conceptPlan.keyExhibits.join(", "),
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
      const spatialLayout = this.parseResponse(rawContent, requirements);

      // ✅ 数据验证
      this.validateSpatialLayout(spatialLayout, requirements);

      // 📤 最终输出日志
      this.logger.info('📤 [最终输出] 空间布局方案', {
        layout: spatialLayout.layout,
        layoutLength: spatialLayout.layout.length,
        visitorRoute: spatialLayout.visitorRoute,
        routeCount: spatialLayout.visitorRoute.length,
        zones: spatialLayout.zones,
        zoneCount: spatialLayout.zones.length,
        totalArea: spatialLayout.zones.reduce((sum, zone) => sum + zone.area, 0),
        accessibility: spatialLayout.accessibility
      });

      this.logger.info('📤 [输出详情] 完整空间布局对象', {
        fullSpatialLayout: JSON.stringify(spatialLayout, null, 2)
      });

      const finalDuration = Date.now() - startTime;

      this.logger.info('═══════════════════════════════════════════════════════════');
      this.logger.info('✅ [空间设计智能体] 空间布局生成完成', {
        success: true,
        totalDuration: `${finalDuration}ms`,
        llmDuration: `${llmDuration}ms`,
        parsingDuration: `${finalDuration - llmDuration}ms`
      });
      this.logger.info('═══════════════════════════════════════════════════════════');

      return spatialLayout;

    } catch (error) {
      // ✅ 外层错误捕获
      this.logger.error('❌ [空间设计智能体] 空间布局生成失败', error as Error, {
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

    if (!conceptPlan.keyExhibits || conceptPlan.keyExhibits.length === 0) {
      this.logger.warn('⚠️ [输入警告] conceptPlan.keyExhibits 为空，可能影响生成质量');
    }

    if (!conceptPlan.visitorFlow || conceptPlan.visitorFlow.trim().length === 0) {
      this.logger.warn('⚠️ [输入警告] conceptPlan.visitorFlow 为空，可能影响生成质量');
    }
  }

  /**
   * ✅ 解析 LLM 响应
   */
  private parseResponse(rawContent: string, requirements: ExhibitionRequirement): SpatialLayout {
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
        return this.buildSpatialLayoutFromParsed(parsed, rawContent, requirements);
      } else {
        this.logger.info('🔧 [解析方式] 非JSON格式，使用默认结构');
        return this.getDefaultSpatialLayout(requirements, rawContent);
      }
    } catch (parseError) {
      this.logger.error('❌ [解析失败] 解析失败，使用默认结果', parseError as Error);
      return this.getDefaultSpatialLayout(requirements, rawContent);
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
   * ✅ 从解析的数据构建空间布局
   */
  private buildSpatialLayoutFromParsed(
    parsed: any,
    rawContent: string,
    requirements: ExhibitionRequirement
  ): SpatialLayout {
    // 数据验证
    if (parsed.zones && !Array.isArray(parsed.zones)) {
      this.logger.warn('⚠️ [数据验证] zones 不是数组，使用默认值');
      parsed.zones = undefined;
    }

    if (parsed.visitorRoute && !Array.isArray(parsed.visitorRoute)) {
      this.logger.warn('⚠️ [数据验证] visitorRoute 不是数组，使用默认值');
      parsed.visitorRoute = undefined;
    }

    const layout = {
      layout: parsed.layout || rawContent,
      visitorRoute: parsed.visitorRoute || this.getDefaultVisitorRoute(),
      zones: parsed.zones || this.getDefaultZones(requirements),
      accessibility: parsed.accessibility || "设有无障碍通道、轮椅租借、盲文导览等无障碍设施"
    };

    this.logger.info('🔧 [解析成功] JSON解析完成', {
      parsed: JSON.stringify(parsed, null, 2)
    });

    return layout;
  }

  /**
   * ✅ 数据验证
   */
  private validateSpatialLayout(layout: SpatialLayout, requirements: ExhibitionRequirement): void {
    const totalZoneArea = layout.zones.reduce((sum, zone) => sum + zone.area, 0);
    const expectedArea = requirements.venueSpace.area;

    // 允许 5% 的误差
    if (Math.abs(totalZoneArea - expectedArea) / expectedArea > 0.05) {
      this.logger.warn('⚠️ [数据验证] zones 总面积与场地面积差异较大', {
        totalZoneArea,
        expectedArea,
        difference: Math.abs(totalZoneArea - expectedArea),
        differencePercent: ((Math.abs(totalZoneArea - expectedArea) / expectedArea) * 100).toFixed(2) + '%'
      });
    }

    // 验证每个 zone 的必要字段
    const invalidZones = layout.zones.filter(zone =>
      !zone.name || typeof zone.area !== 'number' || !zone.function
    );

    if (invalidZones.length > 0) {
      this.logger.warn('⚠️ [数据验证] 发现无效的 zone', {
        invalidCount: invalidZones.length,
        invalidZones: invalidZones.map(z => ({ name: z.name, hasArea: typeof z.area === 'number', hasFunction: !!z.function }))
      });
    }
  }

  /**
   * ✅ 默认空间布局
   */
  private getDefaultSpatialLayout(
    requirements: ExhibitionRequirement,
    fallbackContent?: string
  ): SpatialLayout {
    this.logger.info('🔧 [默认方案] 生成默认空间布局');

    return {
      layout: fallbackContent || "基于策划概念的空间布局方案",
      visitorRoute: this.getDefaultVisitorRoute(),
      zones: this.getDefaultZones(requirements),
      accessibility: "设有无障碍通道、轮椅租借、盲文导览等无障碍设施"
    };
  }

  /**
   * ✅ 默认参观路线
   */
  private getDefaultVisitorRoute(): string[] {
    return [
      "入口大厅 - 主题介绍区",
      "主展区 - 按时间/主题顺序参观",
      "互动体验区 - 深度参与",
      "尾厅 - 总结与展望"
    ];
  }

  /**
   * ✅ 默认功能区域（优化面积计算）
   */
  private getDefaultZones(requirements: ExhibitionRequirement): Array<{name: string, area: number, function: string}> {
    const totalArea = requirements.venueSpace.area;
    const area10Percent = Math.floor(totalArea * 0.1);
    const area60Percent = Math.floor(totalArea * 0.6);
    const area20Percent = Math.floor(totalArea * 0.2);
    const remainder = totalArea - area10Percent - area60Percent - area20Percent - area10Percent;

    this.logger.info('🔧 [默认方案] 面积分配', {
      totalArea,
      前厅接待区: area10Percent,
      主展区: area60Percent,
      互动体验区: area20Percent,
      服务区: area10Percent + remainder,
      余数调整: remainder
    });

    return [
      {
        name: "前厅接待区",
        area: area10Percent,
        function: "票务、咨询、安检"
      },
      {
        name: "主展区",
        area: area60Percent,
        function: "核心展品展示"
      },
      {
        name: "互动体验区",
        area: area20Percent,
        function: "多媒体互动和深度体验"
      },
      {
        name: "服务区",
        area: area10Percent + remainder, // 将余数加到最后一个区域
        function: "休息、文创商店"
      }
    ];
  }
}