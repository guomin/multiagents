import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionRequirement, ConceptPlan, InteractiveSolution } from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";

export class InteractiveTechAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;

  constructor(modelName?: string, temperature: number = 0.5) {
    this.modelConfig = ModelConfigFactory.createModelConfig(undefined, modelName, temperature);

    this.llm = new ChatOpenAI({
      modelName: this.modelConfig.modelName,
      temperature: this.modelConfig.temperature,
      openAIApiKey: this.modelConfig.apiKey,
      ...(this.modelConfig.baseURL && { configuration: { baseURL: this.modelConfig.baseURL } }),
      ...(this.modelConfig.organization && { openAIOrganization: this.modelConfig.organization })
    });
  }

  async generateInteractiveSolution(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan,
    revisionReason?: string
  ): Promise<InteractiveSolution> {
    const systemPrompt = `你是一位专业的展陈互动技术专家，具有丰富的多媒体设计和互动装置开发经验。你需要根据展览需求和预算，生成互动技术方案。

请考虑以下方面：
1. 技术的先进性和可靠性
2. 互动体验的参与性和教育性
3. 预算的合理性和性价比
4. 技术实现的可行性

${revisionReason ? `【重要】这是对上一次方案的修订反馈，请仔细阅读并根据反馈意见进行改进：\n${revisionReason}\n\n` : ''}输出格式：
- technologies: 使用的主要技术列表
- interactives: 具体的互动装置方案
- technicalRequirements: 技术实现要求`;

    const humanPrompt = `请为以下展览${revisionReason ? '（根据反馈意见进行修订）' : ''}生成互动技术方案：

展览信息：
- 预算：${requirements.budget.total} ${requirements.budget.currency}
- 主题：${requirements.theme}
- 受众：${requirements.targetAudience}

概念方案：
- 核心概念：${conceptPlan.concept}
- 叙事结构：${conceptPlan.narrative}

${revisionReason ? `\n【修订反馈】\n${revisionReason}\n\n请根据以上反馈意见，对互动技术方案进行针对性改进。\n` : ''}请生成符合预算和主题的互动技术方案。`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(humanPrompt)
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
}