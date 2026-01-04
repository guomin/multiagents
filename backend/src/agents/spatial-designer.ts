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
    // 使用 PromptManager 渲染 prompt
    const rendered = promptManager.render(
      'spatial_designer',
      'generateSpatialLayout',
      {
        revisionReason,
        area: requirements.venueSpace.area,
        height: requirements.venueSpace.height,
        layout: requirements.venueSpace.layout,
        concept: conceptPlan.concept,
        narrative: conceptPlan.narrative,
        keyExhibits: conceptPlan.keyExhibits.join(", ")
      }
    );

    const messages = [
      new SystemMessage(rendered.system),
      new HumanMessage(rendered.human)
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