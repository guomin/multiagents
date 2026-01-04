import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ExhibitionRequirement, ConceptPlan, VisualDesign } from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";
import { promptManager } from "../prompts";
import { createLogger } from "../utils/logger";

export class VisualDesignerAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;
  private logger = createLogger('VISUAL-DESIGNER-AGENT');

  constructor(modelName?: string, temperature: number = 0.6) {
    this.logger.info('🎨 初始化视觉设计智能体', { modelName, temperature });
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
    conceptPlan: ConceptPlan,
    revisionReason?: string
  ): Promise<VisualDesign> {
    // 使用 PromptManager 渲染 prompt
    const rendered = promptManager.render(
      'visual_designer',
      'generateVisualDesign',
      {
        revisionReason,
        title: requirements.title,
        theme: requirements.theme,
        targetAudience: requirements.targetAudience,
        concept: conceptPlan.concept,
        narrative: conceptPlan.narrative
      }
    );

    const messages = [
      new SystemMessage(rendered.system),
      new HumanMessage(rendered.human)
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