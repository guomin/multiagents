import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionRequirement, ConceptPlan, VisualDesign } from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";

export class VisualDesignerAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;

  constructor(modelName?: string, temperature: number = 0.6) {
    this.modelConfig = ModelConfigFactory.createModelConfig(undefined, modelName, temperature);

    this.llm = new ChatOpenAI({
      modelName: this.modelConfig.modelName,
      temperature: this.modelConfig.temperature,
      openAIApiKey: this.modelConfig.apiKey,
      ...(this.modelConfig.baseURL && { configuration: { baseURL: this.modelConfig.baseURL } }),
      ...(this.modelConfig.organization && { openAIOrganization: this.modelConfig.organization })
    });
  }

  async generateVisualDesign(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan
  ): Promise<VisualDesign> {
    const systemPrompt = `你是一位资深的展陈视觉设计师，具有丰富的品牌设计和空间视觉设计经验。你需要根据展览需求和概念，生成视觉设计方案。

请考虑以下方面：
1. 色彩搭配的协调性和主题相关性
2. 字体选择的可读性和艺术性
3. 品牌元素的统一性
4. 视觉风格的独特性

输出格式：
- colorScheme: 色彩方案（主色、辅助色）
- typography: 字体设计说明
- brandElements: 品牌视觉元素
- visualStyle: 整体视觉风格描述`;

    const humanPrompt = `请为以下展览生成视觉设计方案：

展览信息：
- 标题：${requirements.title}
- 主题：${requirements.theme}
- 目标受众：${requirements.targetAudience}

概念方案：
- 核心概念：${conceptPlan.concept}
- 叙事结构：${conceptPlan.narrative}

请生成符合展览主题和受众的视觉设计方案。`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(humanPrompt)
    ];

    const response = await this.llm.invoke(messages);

    return {
      colorScheme: [
        "#1A365D", // 深蓝 - 主色
        "#2C5282", // 中蓝 - 辅助色
        "#ED8936", // 橙色 - 强调色
        "#F7FAFC"  // 浅灰 - 背景色
      ],
      typography: "标题使用思源黑体 Bold，正文使用思源宋体 Regular，确保中英文混排时的视觉统一",
      brandElements: [
        "展览专属Logo设计",
        "统一的图形标识系统",
        "主题色彩的地贴和墙面标识",
        "定制的信息图表样式"
      ],
      visualStyle: response.content.toString()
    };
  }
}