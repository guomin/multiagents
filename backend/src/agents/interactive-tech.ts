import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionRequirement, ConceptPlan, InteractiveSolution } from "../types/exhibition";
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

    this.modelConfig = ModelConfigFactory.createModelConfig(undefined, modelName, temperature);

    this.llm = new ChatOpenAI({
      modelName: this.modelConfig.modelName,
      temperature: this.modelConfig.temperature,
      openAIApiKey: this.modelConfig.apiKey,
      ...(this.modelConfig.baseURL && { configuration: { baseURL: this.modelConfig.baseURL } }),
      ...(this.modelConfig.organization && { openAIOrganization: this.modelConfig.organization })
    });

    // 初始化Tavily搜索服务（异步）
    this.tavilySearchService.initialize().catch(err => {
      console.error('Tavily搜索服务初始化失败:', err);
      this.logger.error('Tavily搜索服务初始化失败', err as Error);
    });
    this.logger.info('✅ LLM客户端初始化完成');
  }

  async generateInteractiveSolution(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan,
    revisionReason?: string
  ): Promise<InteractiveSolution> {
    // ✨ 新增：智能调研（使用Tavily搜索）
    let researchContext = "";
    try {
      const searchQuery = this.buildSearchQuery(conceptPlan);
      if (searchQuery) {
        console.log(`🔍 调研中: ${searchQuery}`);

        // 使用Tavily搜索
        const searchResults = await this.tavilySearchService.search(searchQuery, 3);

        researchContext = this.formatSearchResults(searchResults);
      }
    } catch (error) {
      console.error('调研失败，继续生成方案:', error);
    }

    // 使用 PromptManager 渲染 prompt
    const rendered = promptManager.render(
      'interactive_tech',
      'generateInteractiveSolution',
      {
        revisionReason,
        budget: requirements.budget.total,
        currency: requirements.budget.currency,
        theme: requirements.theme,
        targetAudience: requirements.targetAudience,
        concept: conceptPlan.concept,
        narrative: conceptPlan.narrative,
        researchContext
      }
    );

    const messages = [
      new SystemMessage(rendered.system),
      new HumanMessage(rendered.human)
    ];

    const response = await this.llm.invoke(messages);

    return {
      technologies: [
        "触摸屏显示系统",
        "体感互动装置",
        "AR增强现实技术",
        "LED沉浸式投影",
        "音频导览系统"
      ],
      interactives: [
        {
          name: "数字导览屏",
          description: "多语言交互式展览导览，支持AR扫描识别",
          type: "触摸屏 + AR",
          cost: 50000
        },
        {
          name: "沉浸式投影空间",
          description: "360度环绕投影，营造身临其境的展览氛围",
          type: "投影系统",
          cost: 150000
        },
        {
          name: "体感互动墙",
          description: "通过手势操控的虚拟展品展示和游戏",
          type: "体感设备",
          cost: 80000
        }
      ],
      technicalRequirements: response.content.toString()
    };
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

    return results.map((r, i) => `
${i + 1}. **${r.title}**
   链接：${r.url}
   简介：${r.content.substring(0, 150)}...
`).join("\n");
  }
}