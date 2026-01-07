export type ModelProvider = "openai" | "deepseek" | "zhipuai";

export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  temperature: number;
  apiKey: string;
  baseURL?: string;
  organization?: string;
}

/**
 * 智能体类型标识
 */
export type AgentType =
  | "curator"
  | "spatial_designer"
  | "visual_designer"
  | "interactive_tech"
  | "budget_controller"
  | "supervisor";

export class ModelConfigFactory {
  static createModelConfig(
    requestedProvider?: ModelProvider,
    modelName?: string,
    temperature: number = 0.7
  ): ModelConfig {
    const provider = (requestedProvider || process.env.MODEL_PROVIDER?.toLowerCase() as ModelProvider) || "openai";

    switch (provider) {
      case "deepseek":
        if (!process.env.DEEPSEEK_API_KEY) {
          throw new Error("DEEPSEEK_API_KEY is required for DeepSeek provider");
        }
        return {
          provider: "deepseek",
          modelName: modelName || process.env.DEFAULT_MODEL || "deepseek-chat",
          temperature,
          apiKey: process.env.DEEPSEEK_API_KEY,
          baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1"
        };

      case "zhipuai":
        if (!process.env.ZHIPUAI_API_KEY) {
          throw new Error("ZHIPUAI_API_KEY is required for ZhipuAI provider");
        }
        console.log(`[Config] Using ZhipuAI provider with model: ${modelName || process.env.DEFAULT_MODEL || "glm-4.7"}`);
        console.log(`[Config] ZhipuAI Base URL: ${process.env.ZHIPUAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4"}`);
        console.log(`[Config] Temperature: ${temperature}`);
        console.log(`[Config] API Key: ${process.env.ZHIPUAI_API_KEY ? "Provided" : "Not Provided"}`);
        // 输出api key的value，后10位
        console.log(`[Config] API Key Value: ${process.env.ZHIPUAI_API_KEY ? process.env.ZHIPUAI_API_KEY.slice(-10) : "N/A"}`);

        return {
          provider: "zhipuai",
          modelName: modelName || process.env.DEFAULT_MODEL || "glm-4.7",
          temperature,
          apiKey: process.env.ZHIPUAI_API_KEY,
          baseURL: process.env.ZHIPUAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4"
        };

      case "openai":
      default:
        if (!process.env.OPENAI_API_KEY) {
          throw new Error("OPENAI_API_KEY is required for OpenAI provider");
        }
        return {
          provider: "openai",
          modelName: modelName || process.env.DEFAULT_MODEL || "gpt-4-turbo-preview",
          temperature,
          apiKey: process.env.OPENAI_API_KEY,
          organization: process.env.OPENAI_ORGANIZATION
        };
    }
  }

  /**
   * 为特定智能体创建模型配置
   * 优先级: 智能体环境变量 > 全局环境变量 > 代码默认值
   *
   * @param agentType 智能体类型
   * @param modelName 模型名称（可选，会被环境变量覆盖）
   * @param temperature 温度参数
   * @returns 模型配置对象
   */
  static createModelConfigForAgent(
    agentType: AgentType,
    modelName?: string,
    temperature: number = 0.7
  ): ModelConfig {
    // 1. 尝试读取智能体专属配置
    const agentProvider = process.env[`${agentType.toUpperCase()}_PROVIDER`] as ModelProvider;
    const agentModel = process.env[`${agentType.toUpperCase()}_MODEL`];

    // 2. 如果有智能体专属配置，使用专属配置
    if (agentProvider) {
      return this.createModelConfig(agentProvider, agentModel || modelName, temperature);
    }

    // 3. 否则使用全局配置
    return this.createModelConfig(undefined, modelName, temperature);
  }

  static getAvailableModels(provider?: ModelProvider): string[] {
    const currentProvider = provider || (process.env.MODEL_PROVIDER?.toLowerCase() as ModelProvider) || "openai";

    switch (currentProvider) {
      case "deepseek":
        return ["deepseek-chat"];
      case "zhipuai":
        return ["glm-4.7"];
      case "openai":
      default:
        return [];
    }
  }

  static validateConfig(): { isValid: boolean; error?: string } {
    try {
      const config = this.createModelConfig();

      // 验证模型名称是否在支持列表中
      const availableModels = this.getAvailableModels(config.provider);
      if (!availableModels.includes(config.modelName)) {
        return {
          isValid: false,
          error: `Model ${config.modelName} is not supported by ${config.provider}. Available models: ${availableModels.join(", ")}`
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}