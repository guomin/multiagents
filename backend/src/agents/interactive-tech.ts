import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionRequirement, ExhibitionOutline, InteractiveSolution, SpatialLayout } from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";
import { getTavilySearchService } from "../services/tavily-search";
import { promptManager } from "../prompts";
import { createLogger } from "../utils/logger";

export class InteractiveTechAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;
  private tavilySearchService = getTavilySearchService(); // Tavily搜索服务
  private logger = createLogger('INTERACTIVE-TECH-AGENT');

  constructor(modelName?: string, temperature: number = 0.5) {
    this.logger.info('🤖 初始化互动技术智能体', { modelName, temperature });

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
      this.logger.error('❌ LLM客户端初始化失败', error as Error, { modelName, temperature });
      throw error;
    }

    // 初始化Tavily搜索服务（异步）
    this.tavilySearchService.initialize().catch(err => {
      this.logger.warn('⚠️ [外部服务] Tavily搜索服务初始化失败', err as Error);
    });
  }

  async generateInteractiveSolution(
    requirements: ExhibitionRequirement,
    exhibitionOutline: ExhibitionOutline, // 修改：接收ExhibitionOutline
    spatialLayout?: SpatialLayout,
    revisionReason?: string
  ): Promise<InteractiveSolution> {
    const startTime = Date.now();
    console.log('🤖 [互动技术智能体] 开始生成互动技术方案...');

    this.logger.info('═══════════════════════════════════════════════════════════');
    this.logger.info('🤖 [互动技术智能体] 开始生成互动技术方案');
    this.logger.info('═══════════════════════════════════════════════════════════');

    try {
      // ✅ 输入参数验证
      this.validateInputs(requirements, exhibitionOutline);

      // 📥 完整记录输入参数
      this.logger.info('📥 [输入参数] 原始需求', {
        exhibitionTitle: requirements.title,
        theme: requirements.theme,
        targetAudience: requirements.targetAudience,
        budget: requirements.budget.total,
        currency: requirements.budget.currency,
        hasRevisionReason: !!revisionReason,
        revisionReason: revisionReason || "无"
      });

      this.logger.info('📥 [输入参数] 展览大纲（来自大纲细化智能体）', {
        concept: exhibitionOutline.conceptPlan.concept,
        narrative: exhibitionOutline.conceptPlan.narrative,
        zonesCount: exhibitionOutline.zones.length,
        exhibitsCount: exhibitionOutline.exhibits.length,
        interactivePlanCount: exhibitionOutline.interactivePlan.length
      });

      this.logger.info('📥 [输入详情] 完整需求对象', {
        fullRequirements: JSON.stringify(requirements, null, 2)
      });

      this.logger.info('📥 [输入详情] 完整大纲对象', {
        fullOutline: JSON.stringify(exhibitionOutline, null, 2)
      });

      this.logger.info('📥 [输入参数] 空间布局（来自空间智能体）', {
        layout: spatialLayout?.layout || "无",
        visitorRoute: spatialLayout?.visitorRoute || [],
        zones: spatialLayout?.zones || [],
        hasAccessibility: !!spatialLayout?.accessibility
      });

      // 🔍 智能调研（使用Tavily搜索）
      this.logger.info('🔍 [智能调研] 准备外部知识调研');
      const researchContext = await this.performResearch(exhibitionOutline.conceptPlan);

      // 使用 PromptManager 渲染 prompt
      const rendered = promptManager.render(
        'interactive_tech',
        'generateInteractiveSolution',
        {
          revisionReason,
          // 展览基本信息
          title: requirements.title,
          theme: requirements.theme,
          targetAudience: requirements.targetAudience,
          area: requirements.venueSpace.area,
          height: requirements.venueSpace.height,
          budget: requirements.budget.total,
          currency: requirements.budget.currency,
          // 策展方案
          concept: exhibitionOutline.conceptPlan.concept,
          narrative: exhibitionOutline.conceptPlan.narrative,
          // 外部调研
          researchContext,
          // ⭐ 大纲信息（完整传递）
          zones: exhibitionOutline.zones.map(z =>
            `${z.name}（${z.area}㎡，功能：${z.function}）`
          ).join("；"),
          interactivePlan: exhibitionOutline.interactivePlan.map(ip =>
            `${ip.name}（类型：${ip.type}，优先级：${ip.priority}，预估成本：${ip.estimatedCost}元，位置：${ip.zoneId}，描述：${ip.description}）`
          ).join("；"),
          // 空间布局信息
          layout: spatialLayout?.layout || "",
          visitorRoute: spatialLayout?.visitorRoute.join(" → ") || "",
          accessibility: spatialLayout?.accessibility || ""
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
      const interactiveSolution = this.parseResponse(rawContent, requirements);

      // 📤 最终输出日志
      this.logger.info('📤 [最终输出] 互动技术方案', {
        technologies: interactiveSolution.technologies,
        technologyCount: interactiveSolution.technologies.length,
        interactives: interactiveSolution.interactives,
        interactiveCount: interactiveSolution.interactives.length,
        totalCost: interactiveSolution.interactives.reduce((sum, item) => sum + (item.cost || 0), 0),
        technicalRequirements: interactiveSolution.technicalRequirements,
        technicalRequirementsLength: interactiveSolution.technicalRequirements.length
      });

      this.logger.info('📤 [输出详情] 完整互动技术对象', {
        fullInteractiveSolution: JSON.stringify(interactiveSolution, null, 2)
      });

      const finalDuration = Date.now() - startTime;

      this.logger.info('═══════════════════════════════════════════════════════════');
      this.logger.info('✅ [互动技术智能体] 互动技术方案生成完成', {
        success: true,
        totalDuration: `${finalDuration}ms`,
        llmDuration: `${llmDuration}ms`,
        parsingDuration: `${finalDuration - llmDuration}ms`,
        researchDuration: researchContext ? `${totalDuration - llmDuration}ms (包含调研)` : `${totalDuration}ms`
      });
      this.logger.info('═══════════════════════════════════════════════════════════');

      return interactiveSolution;

    } catch (error) {
      // ✅ 外层错误捕获
      this.logger.error('❌ [互动技术智能体] 互动技术方案生成失败', error as Error, {
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
  private validateInputs(requirements: ExhibitionRequirement, exhibitionOutline: ExhibitionOutline): void {
    if (!requirements) {
      throw new Error("requirements 参数不能为空");
    }

    if (!exhibitionOutline) {
      throw new Error("exhibitionOutline 参数不能为空");
    }

    if (!exhibitionOutline.conceptPlan) {
      throw new Error("exhibitionOutline.conceptPlan 不能为空");
    }

    if (!exhibitionOutline.conceptPlan.concept || exhibitionOutline.conceptPlan.concept.trim().length === 0) {
      throw new Error("exhibitionOutline.conceptPlan.concept 不能为空");
    }

    if (!exhibitionOutline.conceptPlan.narrative || exhibitionOutline.conceptPlan.narrative.trim().length === 0) {
      this.logger.warn('⚠️ [输入警告] exhibitionOutline.conceptPlan.narrative 为空，可能影响生成质量');
    }
  }

  /**
   * ✅ 执行智能调研
   */
  private async performResearch(conceptPlan: ConceptPlan): Promise<string> {
    const researchStart = Date.now();

    try {
      const searchQuery = this.buildSearchQuery(conceptPlan);

      if (!searchQuery) {
        this.logger.info('🔍 [智能调研] 跳过调研（无需调研）');
        return "";
      }

      this.logger.info('🔍 [智能调研] 开始外部知识调研', {
        searchQuery,
        conceptKeywords: conceptPlan.concept
      });

      console.log(`🔍 调研中: ${searchQuery}`);

      // 使用Tavily搜索
      const searchResults = await this.tavilySearchService.search(searchQuery, 3);

      const researchDuration = Date.now() - researchStart;

      this.logger.info('🔍 [智能调研] 调研完成', {
        resultsCount: searchResults.length,
        researchDuration: `${researchDuration}ms`
      });

      if (searchResults.length > 0) {
        this.logger.info('🔍 [智能调研] 调研结果', {
          results: searchResults.map(r => ({
            title: r.title,
            url: r.url,
            preview: r.content.substring(0, 100) + "..."
          }))
        });
      }

      return this.formatSearchResults(searchResults);

    } catch (error) {
      this.logger.warn('⚠️ [智能调研] 调研失败，继续生成方案', error as Error);
      return "";
    }
  }

  /**
   * ✅ 解析 LLM 响应
   */
  private parseResponse(rawContent: string, requirements: ExhibitionRequirement): InteractiveSolution {
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
        return this.buildInteractiveSolutionFromParsed(parsed, rawContent, requirements);
      } else {
        this.logger.info('🔧 [解析方式] 非JSON格式，使用默认结构');
        return this.getDefaultInteractiveSolution(rawContent, requirements);
      }
    } catch (parseError) {
      this.logger.error('❌ [解析失败] 解析失败，使用默认结果', parseError as Error);
      return this.getDefaultInteractiveSolution(rawContent, requirements);
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
   * ✅ 从解析的数据构建互动技术方案
   */
  private buildInteractiveSolutionFromParsed(
    parsed: any,
    rawContent: string,
    requirements: ExhibitionRequirement
  ): InteractiveSolution {
    // 数据验证
    if (parsed.technologies && !Array.isArray(parsed.technologies)) {
      this.logger.warn('⚠️ [数据验证] technologies 不是数组，使用默认值');
      parsed.technologies = undefined;
    }

    if (parsed.interactives && !Array.isArray(parsed.interactives)) {
      this.logger.warn('⚠️ [数据验证] interactives 不是数组，使用默认值');
      parsed.interactives = undefined;
    }

    const solution = {
      technologies: parsed.technologies || this.getDefaultTechnologies(),
      interactives: parsed.interactives || this.getDefaultInteractives(requirements),
      technicalRequirements: parsed.technicalRequirements || rawContent
    };

    this.logger.info('🔧 [解析成功] JSON解析完成', {
      parsed: JSON.stringify(parsed, null, 2)
    });

    return solution;
  }

  /**
   * ✅ 默认互动技术方案
   */
  private getDefaultInteractiveSolution(
    fallbackContent?: string,
    requirements?: ExhibitionRequirement
  ): InteractiveSolution {
    this.logger.info('🔧 [默认方案] 生成默认互动技术方案');

    return {
      technologies: this.getDefaultTechnologies(),
      interactives: requirements ? this.getDefaultInteractives(requirements) : [],
      technicalRequirements: fallbackContent || "基于策划概念的互动技术方案"
    };
  }

  /**
   * ✅ 默认技术列表
   */
  private getDefaultTechnologies(): string[] {
    return [
      "触摸屏显示系统",
      "体感互动装置",
      "AR增强现实技术",
      "LED沉浸式投影",
      "音频导览系统"
    ];
  }

  /**
   * ✅ 默认互动装置
   */
  private getDefaultInteractives(requirements: ExhibitionRequirement): Array<{name: string, description: string, type: string, cost?: number}> {
    const budget = requirements.budget.total;

    return [
      {
        name: "数字导览屏",
        description: "多语言交互式展览导览，支持AR扫描识别",
        type: "触摸屏 + AR",
        cost: Math.floor(budget * 0.1) // 预算的10%
      },
      {
        name: "沉浸式投影空间",
        description: "360度环绕投影，营造身临其境的展览氛围",
        type: "投影系统",
        cost: Math.floor(budget * 0.3) // 预算的30%
      },
      {
        name: "体感互动墙",
        description: "通过手势操控的虚拟展品展示和游戏",
        type: "体感设备",
        cost: Math.floor(budget * 0.15) // 预算的15%
      }
    ];
  }

  /**
   * 根据概念策划构建搜索查询
   */
  private buildSearchQuery(conceptPlan: ConceptPlan): string {
    const concept = conceptPlan.concept.toLowerCase();
    const keywords = ["水利", "历史", "文化", "科技", "互动", "多媒体"];

    // 检查是否包含相关关键词
    const hasKeyword = keywords.some(kw => concept.includes(kw));

    if (!hasKeyword) {
      return ""; // 不需要调研
    }

    this.logger.info('🔍 [智能调研] 构建搜索查询', {
      concept: conceptPlan.concept,
      matchedKeywords: keywords.filter(kw => concept.includes(kw))
    });

    // 提取主题关键词
    let topic = "博物馆";
    if (concept.includes("水利")) topic = "博物馆水利工程";
    else if (concept.includes("历史")) topic = "博物馆历史文化";
    else if (concept.includes("科技")) topic = "科技馆";

    return `${topic}互动技术案例`;
  }

  /**
   * 格式化搜索结果
   */
  private formatSearchResults(results: any[]): string {
    if (!results || results.length === 0) {
      return "（暂无参考资料）";
    }

    this.logger.info('🔍 [智能调研] 格式化搜索结果', {
      resultsCount: results.length,
      results: results.map(r => ({ title: r.title, url: r.url }))
    });

    return results.map((r, i) => `
${i + 1}. **${r.title}**
   链接：${r.url}
   简介：${r.content.substring(0, 150)}...
`).join("\n");
  }
}