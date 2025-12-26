export type ModelProvider = "openai" | "deepseek";

export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  temperature: number;
  apiKey: string;
  baseURL?: string;
  organization?: string;
}

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

  static getAvailableModels(provider?: ModelProvider): string[] {
    const currentProvider = provider || (process.env.MODEL_PROVIDER?.toLowerCase() as ModelProvider) || "openai";

    switch (currentProvider) {
      case "deepseek":
        return ["deepseek-chat", "deepseek-coder"];
      case "openai":
      default:
        return ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"];
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