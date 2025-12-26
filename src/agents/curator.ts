import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionRequirement, ConceptPlan } from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";

export class CuratorAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;

  constructor(modelName?: string, temperature: number = 0.7) {
    this.modelConfig = ModelConfigFactory.createModelConfig(undefined, modelName, temperature);

    this.llm = new ChatOpenAI({
      modelName: this.modelConfig.modelName,
      temperature: this.modelConfig.temperature,
      openAIApiKey: this.modelConfig.apiKey,
      ...(this.modelConfig.baseURL && { configuration: { baseURL: this.modelConfig.baseURL } }),
      ...(this.modelConfig.organization && { openAIOrganization: this.modelConfig.organization })
    });
  }

  async generateConceptPlan(requirements: ExhibitionRequirement): Promise<ConceptPlan> {
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

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(humanPrompt)
    ];

    const response = await this.llm.invoke(messages);

    // 这里应该解析LLM的响应并返回结构化的ConceptPlan
    // 为了简化，我们先返回一个模拟的结果
    return {
      concept: response.content.toString(),
      narrative: "基于展览主题的深度叙事结构",
      keyExhibits: ["展品1", "展品2", "展品3"],
      visitorFlow: "线性参观动线，确保最佳观展体验"
    };
  }
}