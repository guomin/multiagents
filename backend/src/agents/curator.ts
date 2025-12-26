import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionRequirement, ConceptPlan } from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";
import { createLogger } from "../utils/logger";
// 暂时注释掉装饰器导入
// import { agentLogger, logAgentExecution } from "../utils/agent-logger";

export class CuratorAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;
  private logger = createLogger('CURATOR-AGENT');

  constructor(modelName?: string, temperature: number = 0.7) {
    this.logger.info('🎨 初始化策划智能体', { modelName, temperature });

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

  // 暂时移除装饰器，改为手动日志
  async generateConceptPlan(requirements: ExhibitionRequirement): Promise<ConceptPlan> {
    console.log('🎨 [策划智能体] 开始生成概念策划方案...')
    const endTimer = this.logger.time('概念策划生成');

    this.logger.info('开始生成概念策划', {
      exhibitionTitle: requirements.title,
      theme: requirements.theme,
      targetAudience: requirements.targetAudience,
      venueArea: requirements.venueSpace.area,
      specialRequirements: requirements.specialRequirements
    });

    try {
      const systemPrompt = `你是一位资深的展陈策划专家，具有丰富的博物馆和展览策划经验。你需要根据客户需求，生成展览的概念策划方案。

请考虑以下方面：
1. 核心概念的创意性和吸引力
2. 叙事结构的逻辑性和连贯性
3. 重点展品的代表性
4. 观众体验的沉浸感

输出格式：
- concept: 150字以内的核心概念描述
- narrative: 完整的叙事结构说明
- keyExhibits: 5-8个重点展品建议
- visitorFlow: 观众参观动线设计理念`;

      const humanPrompt = `请为以下展览需求生成概念策划方案：

展览标题：${requirements.title}
展览主题：${requirements.theme}
目标受众：${requirements.targetAudience}
场地信息：${requirements.venueSpace.area}平方米，层高${requirements.venueSpace.height}米
特殊要求：${requirements.specialRequirements?.join(", ") || "无"}

请生成详细的展览概念策划。`;

      this.logger.debug('构建提示词', {
        systemPromptLength: systemPrompt.length,
        humanPromptLength: humanPrompt.length
      });

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(humanPrompt)
      ];

      this.logger.info('调用LLM生成概念策划', {
        model: this.modelConfig.modelName,
        temperature: this.modelConfig.temperature,
        messageCount: messages.length
      });

      const llmStart = Date.now();
      const response = await this.llm.invoke(messages);
      const llmDuration = Date.now() - llmStart;

      this.logger.info('LLM调用完成', {
        responseLength: response.content.toString().length,
        llmDuration,
        tokenUsage: response.usage_metadata
      });

      const rawContent = response.content.toString();
      this.logger.debug('LLM原始响应', {
        contentPreview: rawContent.substring(0, 500),
        fullContentLength: rawContent.length
      });

      // 解析LLM响应 - 这里应该有更好的解析逻辑
      let conceptPlan: ConceptPlan;

      try {
        // 尝试解析为JSON格式
        if (rawContent.trim().startsWith('{')) {
          const parsed = JSON.parse(rawContent);
          conceptPlan = {
            concept: parsed.concept || "基于展览主题的创新概念",
            narrative: parsed.narrative || "精心设计的叙事结构",
            keyExhibits: parsed.keyExhibits || ["主题展品", "互动展品", "艺术展品"],
            visitorFlow: parsed.visitorFlow || "优化的观众参观路线"
          };
        } else {
          // 简单的文本解析逻辑
          conceptPlan = {
            concept: this.extractConcept(rawContent),
            narrative: this.extractNarrative(rawContent),
            keyExhibits: this.extractKeyExhibits(rawContent),
            visitorFlow: this.extractVisitorFlow(rawContent)
          };
        }

        this.logger.info('概念策划解析完成', {
          conceptLength: conceptPlan.concept.length,
          narrativeLength: conceptPlan.narrative.length,
          exhibitsCount: conceptPlan.keyExhibits.length
        });

      } catch (parseError) {
        this.logger.warn('概念策划解析失败，使用默认结果', parseError as Error);
        conceptPlan = {
          concept: rawContent.substring(0, 150) || "创新展览概念",
          narrative: "基于展览主题的深度叙事结构",
          keyExhibits: ["主题展品", "互动展品", "艺术展品"],
          visitorFlow: "线性参观动线，确保最佳观展体验"
        };
      }

      endTimer();
      this.logger.info('概念策划生成完成', {
        success: true,
        totalDuration: Date.now() - (Date.now() - llmDuration)
      });

      return conceptPlan;

    } catch (error) {
      this.logger.error('概念策划生成失败', error as Error, {
        exhibitionTitle: requirements.title,
        theme: requirements.theme
      });

      agentLogger.logError('curator', 'generateConceptPlan', error as Error, {
        requirements: {
          title: requirements.title,
          theme: requirements.theme
        }
      });

      throw error;
    }
  }

  // 辅助方法：提取核心概念
  private extractConcept(content: string): string {
    const conceptMatch = content.match(/(?:核心概念|concept|概念)[:：]\s*([^\n]+)/i);
    if (conceptMatch) {
      return conceptMatch[1].trim();
    }
    return content.substring(0, 150);
  }

  // 辅助方法：提取叙事结构
  private extractNarrative(content: string): string {
    const narrativeMatch = content.match(/(?:叙事结构|narrative|叙事)[:：]\s*([^\n]+)/i);
    if (narrativeMatch) {
      return narrativeMatch[1].trim();
    }
    return "精心设计的叙事结构，确保观众体验的连贯性";
  }

  // 辅助方法：提取重点展品
  private extractKeyExhibits(content: string): string[] {
    const exhibitsMatch = content.match(/(?:重点展品|keyExhibits|展品)[:：]\s*([^\n]+)/i);
    if (exhibitsMatch) {
      return exhibitsMatch[1].split(/[,，、]/).map(item => item.trim()).filter(item => item);
    }
    return ["主题展品", "互动展品", "艺术展品"];
  }

  // 辅助方法：提取参观动线
  private extractVisitorFlow(content: string): string {
    const flowMatch = content.match(/(?:观众动线|visitorFlow|参观路线)[:：]\s*([^\n]+)/i);
    if (flowMatch) {
      return flowMatch[1].trim();
    }
    return "线性参观动线，确保最佳观展体验";
  }
}