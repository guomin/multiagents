import { createLogger } from '../utils/logger';

const logger = createLogger('MODEL-CONFIG');

export type ModelProvider = "openai" | "deepseek" | "zhipuai";

export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  temperature: number;
  apiKey: string;
  baseURL?: string;
  organization?: string;
  maxTokens?: number;
}

/**
 * 安全地脱敏API Key，只显示后4位
 */
function maskApiKey(apiKey?: string): string {
  if (!apiKey) return 'N/A';
  if (apiKey.length <= 4) return '****';
  return `****${apiKey.slice(-4)}`;
}

/**
 * 智能体类型标识
 */
export type AgentType =
  | "curator"
  | "outline"
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
          baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
          maxTokens: process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS) : undefined
        };

      case "zhipuai":
        if (!process.env.ZHIPUAI_API_KEY) {
          throw new Error("ZHIPUAI_API_KEY is required for ZhipuAI provider");
        }

        const zhipuaiModelName = modelName || process.env.DEFAULT_MODEL || "glm-4.7";
        const zhipuaiBaseURL = process.env.ZHIPUAI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";

        logger.info('使用 ZhipuAI 提供商', {
          model: zhipuaiModelName,
          baseURL: zhipuaiBaseURL,
          temperature,
          apiKey: maskApiKey(process.env.ZHIPUAI_API_KEY)
        });

        return {
          provider: "zhipuai",
          modelName: zhipuaiModelName,
          temperature,
          apiKey: process.env.ZHIPUAI_API_KEY,
          baseURL: zhipuaiBaseURL,
          maxTokens: process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS) : undefined
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
          organization: process.env.OPENAI_ORGANIZATION,
          maxTokens: process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS) : undefined
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
    const agentMaxTokens = process.env[`${agentType.toUpperCase()}_MAX_TOKENS`];

    // 2. 如果有智能体专属maxTokens，临时设置全局MAX_TOKENS
    const originalMaxTokens = process.env.MAX_TOKENS;
    if (agentMaxTokens) {
      process.env.MAX_TOKENS = agentMaxTokens;
    }

    // 3. 使用专属或全局配置
    let config: ModelConfig;
    if (agentProvider) {
      config = this.createModelConfig(agentProvider, agentModel || modelName, temperature);
    } else {
      config = this.createModelConfig(undefined, modelName, temperature);
    }

    // 4. 恢复原始MAX_TOKENS值
    if (agentMaxTokens) {
      if (originalMaxTokens) {
        process.env.MAX_TOKENS = originalMaxTokens;
      } else {
        delete process.env.MAX_TOKENS;
      }
    }

    return config;
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