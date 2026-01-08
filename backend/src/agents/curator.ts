import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionRequirement, ConceptPlan } from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";
import { createLogger } from "../utils/logger";
import { promptManager } from "../prompts";
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
  async generateConceptPlan(requirements: ExhibitionRequirement, revisionReason?: string): Promise<ConceptPlan> {
    const startTime = Date.now();
    console.log('🎨 [策划智能体] 开始生成概念策划方案...');

    this.logger.info('═══════════════════════════════════════════════════════════');
    this.logger.info('🎨 [策划智能体] 开始生成概念策划方案');
    this.logger.info('═══════════════════════════════════════════════════════════');

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
      duration: {
        startDate: requirements.duration.startDate,
        endDate: requirements.duration.endDate
      },
      specialRequirements: requirements.specialRequirements || [],
      hasRevisionReason: !!revisionReason,
      revisionReason: revisionReason || "无"
    });

    this.logger.info('📥 [输入详情] 完整需求对象', {
      fullRequirements: JSON.stringify(requirements, null, 2)
    });

    try {
      // 使用 PromptManager 渲染 prompt
      const rendered = promptManager.render(
        'curator',
        'generateConceptPlan',
        {
          revisionReason,
          title: requirements.title,
          theme: requirements.theme,
          targetAudience: requirements.targetAudience,
          area: requirements.venueSpace.area,
          height: requirements.venueSpace.height,
          specialRequirements: requirements.specialRequirements?.join(", ")
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

      // 解析LLM响应 - 这里应该有更好的解析逻辑
      let conceptPlan: ConceptPlan;

      this.logger.info('🔧 [解析开始] 开始解析LLM响应');

      try {
        // 清理markdown代码块标记
        let cleanedContent = rawContent.trim();

        // 移除 ```json 和 ``` 标记
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.slice(7); // 移除 ```json
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.slice(3); // 移除 ```
        }

        // 移除结尾的 ```
        if (cleanedContent.endsWith('```')) {
          cleanedContent = cleanedContent.slice(0, -3);
        }

        cleanedContent = cleanedContent.trim();

        // 尝试解析为JSON格式
        if (cleanedContent.startsWith('{')) {
          this.logger.info('🔧 [解析方式] 检测到JSON格式（已清理markdown标记），尝试JSON解析', {
            originalLength: rawContent.length,
            cleanedLength: cleanedContent.length,
            hadMarkdownBlock: rawContent !== cleanedContent
          });

          const parsed = JSON.parse(cleanedContent);
          conceptPlan = {
            concept: parsed.concept || "基于展览主题的创新概念",
            narrative: parsed.narrative || "精心设计的叙事结构",
            keyExhibits: parsed.keyExhibits || ["主题展品", "互动展品", "艺术展品"],
            visitorFlow: parsed.visitorFlow || "优化的观众参观路线"
          };

          this.logger.info('🔧 [解析成功] JSON解析完成', {
            parsed: JSON.stringify(parsed, null, 2)
          });
        } else {
          this.logger.info('🔧 [解析方式] 非JSON格式，使用文本提取');

          // 简单的文本解析逻辑
          conceptPlan = {
            concept: this.extractConcept(rawContent),
            narrative: this.extractNarrative(rawContent),
            keyExhibits: this.extractKeyExhibits(rawContent),
            visitorFlow: this.extractVisitorFlow(rawContent)
          };
        }

        this.logger.info('📤 [最终输出] 概念策划方案', {
          concept: conceptPlan.concept,
          conceptLength: conceptPlan.concept.length,
          narrative: conceptPlan.narrative,
          narrativeLength: conceptPlan.narrative.length,
          keyExhibits: conceptPlan.keyExhibits,
          exhibitsCount: conceptPlan.keyExhibits.length,
          visitorFlow: conceptPlan.visitorFlow,
          visitorFlowLength: conceptPlan.visitorFlow.length
        });

        this.logger.info('📤 [输出详情] 完整概念策划对象', {
          fullConceptPlan: JSON.stringify(conceptPlan, null, 2)
        });

      } catch (parseError) {
        this.logger.error('❌ [解析失败] 解析失败，使用默认结果', parseError as Error);
        conceptPlan = {
          concept: rawContent.substring(0, 150) || "创新展览概念",
          narrative: "基于展览主题的深度叙事结构",
          keyExhibits: ["主题展品", "互动展品", "艺术展品"],
          visitorFlow: "线性参观动线，确保最佳观展体验"
        };

        this.logger.warn('⚠️ [降级方案] 使用默认概念策划', {
          fallbackResult: JSON.stringify(conceptPlan, null, 2)
        });
      }

      const finalDuration = Date.now() - startTime;

      this.logger.info('═══════════════════════════════════════════════════════════');
      this.logger.info('✅ [策划智能体] 概念策划生成完成', {
        success: true,
        totalDuration: `${finalDuration}ms`,
        llmDuration: `${llmDuration}ms`,
        parsingDuration: `${finalDuration - llmDuration}ms`
      });
      this.logger.info('═══════════════════════════════════════════════════════════');

      return conceptPlan;

    } catch (error) {
      this.logger.error('概念策划生成失败', error as Error, {
        exhibitionTitle: requirements.title,
        theme: requirements.theme
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