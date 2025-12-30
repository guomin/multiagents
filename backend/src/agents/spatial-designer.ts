import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionRequirement, ConceptPlan, SpatialLayout } from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";

export class SpatialDesignerAgent {
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

  async generateSpatialLayout(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan,
    revisionReason?: string
  ): Promise<SpatialLayout> {
    const systemPrompt = `你是一位专业的展陈空间设计师，具有丰富的空间规划和动线设计经验。你需要根据展览需求和概念策划，生成空间布局方案。

请考虑以下方面：
1. 空间利用的最优化
2. 参观动线的流畅性
3. 功能区域的合理性
4. 无障碍设计的完备性

${revisionReason ? `【重要】这是对上一次方案的修订反馈，请仔细阅读并根据反馈意见进行改进：\n${revisionReason}\n\n` : ''}输出格式：
- layout: 空间布局的详细描述
- visitorRoute: 具体的参观路线说明
- zones: 功能区域划分（名称、面积、功能）
- accessibility: 无障碍设计说明`;

    const humanPrompt = `请为以下展览${revisionReason ? '（根据反馈意见进行修订）' : ''}生成空间布局方案：

场地信息：
- 面积：${requirements.venueSpace.area}平方米
- 层高：${requirements.venueSpace.height}米
- 布局：${requirements.venueSpace.layout}

展览概念：
- 核心概念：${conceptPlan.concept}
- 叙事结构：${conceptPlan.narrative}
- 重点展品：${conceptPlan.keyExhibits.join(", ")}

${revisionReason ? `\n【修订反馈】\n${revisionReason}\n\n请根据以上反馈意见，对空间布局进行针对性改进。\n` : ''}请生成符合展览主题的空间设计方案。`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(humanPrompt)
    ];

    const response = await this.llm.invoke(messages);

    return {
      layout: response.content.toString(),
      visitorRoute: [
        "入口大厅 - 主题介绍区",
        "主展区 - 按时间/主题顺序参观",
        "互动体验区 - 深度参与",
        "尾厅 - 总结与展望"
      ],
      zones: [
        {
          name: "前厅接待区",
          area: Math.floor(requirements.venueSpace.area * 0.1),
          function: "票务、咨询、安检"
        },
        {
          name: "主展区",
          area: Math.floor(requirements.venueSpace.area * 0.6),
          function: "核心展品展示"
        },
        {
          name: "互动体验区",
          area: Math.floor(requirements.venueSpace.area * 0.2),
          function: "多媒体互动和深度体验"
        },
        {
          name: "服务区",
          area: Math.floor(requirements.venueSpace.area * 0.1),
          function: "休息、文创商店"
        }
      ],
      accessibility: "设有无障碍通道、轮椅租借、盲文导览等无障碍设施"
    };
  }
}