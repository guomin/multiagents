# 多LLM支持架构设计方案

## 📊 现有架构分析

### 当前实现

**文件**: `backend/src/config/model.ts`

```typescript
export type ModelProvider = "openai" | "deepseek";

export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  temperature: number;
  apiKey: string;
  baseURL?: string;
  organization?: string;
}
```

**特点**:
- ✅ 支持OpenAI和DeepSeek两个provider
- ✅ 通过环境变量`MODEL_PROVIDER`全局选择provider
- ✅ 每个智能体可以选择`modelName`和`temperature`
- ❌ **所有智能体必须使用同一个provider**
- ❌ **无法为不同智能体配置不同的LLM**
- ❌ **新增LLM需要修改代码**

### 智能体初始化示例

**文件**: `backend/src/agents/curator.ts:15-19`

```typescript
constructor(modelName?: string, temperature: number = 0.7) {
  // 硬编码使用 undefined 作为 provider（从环境变量读取）
  this.modelConfig = ModelConfigFactory.createModelConfig(undefined, modelName, temperature);
  // ...
}
```

**问题**: 所有智能体都共享同一个provider（从环境变量读取），无法独立选择。

---

## 🎯 改进目标

1. ✅ **支持更多LLM提供商** - 轻松添加新的LLM（Claude、Gemini、通义千问等）
2. ✅ **智能体级别的LLM选择** - 不同智能体可以使用不同的LLM
3. ✅ **配置文件驱动** - 通过配置文件管理智能体-模型映射
4. ✅ **向后兼容** - 保持现有API不变，渐进式迁移
5. ✅ **成本优化** - 可以为不同智能体配置性价比不同的模型

---

## 🏗️ 架构设计方案

### 方案一：智能体配置文件（推荐）

#### 1.1 创建智能体配置文件

**文件**: `backend/src/config/agent-models.config.ts`

```typescript
/**
 * 智能体-模型映射配置
 *
 * 说明：
 * - 每个智能体可以独立配置 provider 和 modelName
 * - 如果不指定，则使用全局默认配置
 * - temperature 可以在运行时通过参数覆盖
 */
export const AGENT_MODEL_CONFIG: Record<string, {
  provider?: ModelProvider;  // 不指定则使用全局默认
  modelName?: string;        // 不指定则使用provider的默认模型
  temperature?: number;      // 默认temperature，可被运行时参数覆盖
}> = {
  // 策划智能体 - 使用最强的模型（需要创意和深度思考）
  curator: {
    provider: "openai",
    modelName: "gpt-4-turbo-preview",
    temperature: 0.8  // 高温以产生多样化创意
  },

  // 空间设计智能体 - 使用平衡模型
  spatial_designer: {
    provider: "openai",
    modelName: "gpt-4-turbo-preview",
    temperature: 0.7
  },

  // 视觉设计智能体 - 使用成本较低的模型
  visual_designer: {
    provider: "openai",
    modelName: "gpt-3.5-turbo",
    temperature: 0.7
  },

  // 互动技术智能体 - 使用DeepSeek（技术准确性高）
  interactive_tech: {
    provider: "deepseek",
    modelName: "deepseek-coder",
    temperature: 0.5  // 低温以保证技术准确性
  },

  // 预算控制智能体 - 使用最强的模型（涉及财务计算）
  budget_controller: {
    provider: "openai",
    modelName: "gpt-4-turbo-preview",
    temperature: 0.3  // 低温以保证计算准确性
  },

  // 协调主管智能体 - 使用最强的模型（需要全局协调）
  supervisor: {
    provider: "openai",
    modelName: "gpt-4-turbo-preview",
    temperature: 0.6
  }
};

/**
 * 获取智能体的模型配置
 *
 * @param agentId - 智能体ID（如 'curator', 'spatial_designer'）
 * @param overrides - 运行时覆盖参数
 * @returns 模型配置
 */
export function getAgentModelConfig(
  agentId: string,
  overrides?: {
    provider?: ModelProvider;
    modelName?: string;
    temperature?: number;
  }
): { provider?: ModelProvider; modelName?: string; temperature: number } {
  const agentConfig = AGENT_MODEL_CONFIG[agentId] || {};

  return {
    provider: overrides?.provider || agentConfig.provider,
    modelName: overrides?.modelName || agentConfig.modelName,
    temperature: overrides?.temperature ?? agentConfig.temperature ?? 0.7
  };
}
```

#### 1.2 扩展ModelProvider类型

**文件**: `backend/src/config/model.ts`

```typescript
// 扩展支持的provider
export type ModelProvider =
  | "openai"       // OpenAI (GPT-4, GPT-3.5)
  | "deepseek"     // DeepSeek (deepseek-chat, deepseek-coder)
  | "anthropic"    // Anthropic (Claude 3 Opus/Sonnet/Haiku)
  | "google"       // Google Gemini (gemini-pro, gemini-ultra)
  | "ollama"       // Ollama (本地开源模型)
  | "qwen";        // 阿里云通义千问

export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  temperature: number;
  apiKey: string;
  baseURL?: string;
  organization?: string;
}
```

#### 1.3 更新ModelConfigFactory

**文件**: `backend/src/config/model.ts`

```typescript
export class ModelConfigFactory {
  /**
   * 创建模型配置（智能体级别）
   *
   * @param agentId - 智能体ID（用于查找配置）
   * @param overrides - 运行时覆盖参数
   */
  static createForAgent(
    agentId: string,
    overrides?: {
      provider?: ModelProvider;
      modelName?: string;
      temperature?: number;
    }
  ): ModelConfig {
    const agentConfig = getAgentModelConfig(agentId, overrides);
    return this.createModelConfig(
      agentConfig.provider,
      agentConfig.modelName,
      agentConfig.temperature
    );
  }

  /**
   * 创建模型配置（全局级别，向后兼容）
   */
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

      case "anthropic":
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error("ANTHROPIC_API_KEY is required for Anthropic provider");
        }
        return {
          provider: "anthropic",
          modelName: modelName || process.env.DEFAULT_MODEL || "claude-3-sonnet-20240229",
          temperature,
          apiKey: process.env.ANTHROPIC_API_KEY,
          baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1"
        };

      case "google":
        if (!process.env.GOOGLE_API_KEY) {
          throw new Error("GOOGLE_API_KEY is required for Google provider");
        }
        return {
          provider: "google",
          modelName: modelName || process.env.DEFAULT_MODEL || "gemini-pro",
          temperature,
          apiKey: process.env.GOOGLE_API_KEY,
          baseURL: process.env.GOOGLE_BASE_URL || "https://generativelanguage.googleapis.com/v1"
        };

      case "ollama":
        return {
          provider: "ollama",
          modelName: modelName || process.env.DEFAULT_MODEL || "llama2",
          temperature,
          apiKey: "dummy",  // Ollama不需要API key
          baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1"
        };

      case "qwen":
        if (!process.env.QWEN_API_KEY) {
          throw new Error("QWEN_API_KEY is required for Qwen provider");
        }
        return {
          provider: "qwen",
          modelName: modelName || process.env.DEFAULT_MODEL || "qwen-turbo",
          temperature,
          apiKey: process.env.QWEN_API_KEY,
          baseURL: process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1"
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
      case "anthropic":
        return ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"];
      case "google":
        return ["gemini-pro", "gemini-ultra", "gemini-pro-vision"];
      case "ollama":
        return ["llama2", "llama2:13b", "mistral", "neural-chat", "codellama"];
      case "qwen":
        return ["qwen-turbo", "qwen-plus", "qwen-max", "qwen-coder-turbo"];
      case "openai":
      default:
        return ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"];
    }
  }

  static validateConfig(): { isValid: boolean; error?: string } {
    try {
      const config = this.createModelConfig();
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
```

#### 1.4 更新智能体初始化

**文件**: `backend/src/agents/curator.ts`

```typescript
import { ModelConfigFactory } from "../config/model";
import { getAgentModelConfig } from "../config/agent-models.config";

export class CuratorAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;
  private logger = createLogger('CURATOR-AGENT');

  // ✅ 改进：支持智能体级别的模型配置
  constructor(overrides?: {
    provider?: ModelProvider;
    modelName?: string;
    temperature?: number;
  }) {
    // 使用智能体特定的配置，支持运行时覆盖
    this.modelConfig = ModelConfigFactory.createForAgent('curator', overrides);

    this.logger.info('🎨 初始化策划智能体', {
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
  }

  // ... 其他方法保持不变
}
```

#### 1.5 更新环境变量配置

**文件**: `backend/.env.example`

```bash
# ==================== 全局默认配置 ====================
# 默认模型提供商（当智能体未指定时使用）
MODEL_PROVIDER=openai

# 默认模型名称
DEFAULT_MODEL=gpt-4-turbo-preview

# ==================== OpenAI ====================
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ORGANIZATION=your_organization_id  # 可选

# ==================== DeepSeek ====================
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# ==================== Anthropic (Claude) ====================
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
ANTHROPIC_VERSION=2023-06-01

# ==================== Google (Gemini) ====================
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com/v1

# ==================== 阿里云通义千问 ====================
QWEN_API_KEY=your_qwen_api_key_here
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# ==================== Ollama (本地模型) ====================
OLLAMA_BASE_URL=http://localhost:11434/v1

# ==================== Tavily AI搜索 ====================
TAVILY_API_KEY=your_tavily_api_key_here
```

---

### 方案二：动态模型路由（高级）

#### 2.1 基于任务难度选择模型

**文件**: `backend/src/config/model-router.ts`

```typescript
/**
 * 模型路由器 - 根据任务特征动态选择模型
 */
export class ModelRouter {
  /**
   * 根据任务复杂度选择模型
   *
   * @param agentId - 智能体ID
   * @param taskComplexity - 任务复杂度（1-10）
   * @param budgetConstraint - 是否有预算约束
   * @returns 模型配置
   */
  static selectModel(
    agentId: string,
    taskComplexity: number = 5,
    budgetConstraint: boolean = false
  ): ModelConfig {
    const agentConfig = AGENT_MODEL_CONFIG[agentId];

    // 如果有预算约束，降级到更便宜的模型
    if (budgetConstraint) {
      return this.getCostEffectiveModel(agentId);
    }

    // 如果任务复杂度高，使用最强模型
    if (taskComplexity >= 8) {
      return this.getPremiumModel(agentId);
    }

    // 默认使用配置的模型
    return ModelConfigFactory.createForAgent(agentId);
  }

  private static getCostEffectiveModel(agentId: string): ModelConfig {
    // 为每个智能体定义高性价比模型
    const costEffectiveModels: Record<string, { provider: ModelProvider; modelName: string }> = {
      curator: { provider: "deepseek", modelName: "deepseek-chat" },
      visual_designer: { provider: "openai", modelName: "gpt-3.5-turbo" },
      interactive_tech: { provider: "deepseek", modelName: "deepseek-coder" },
      // ... 其他智能体
    };

    const config = costEffectiveModels[agentId] || { provider: "openai", modelName: "gpt-3.5-turbo" };
    return ModelConfigFactory.createModelConfig(config.provider, config.modelName, 0.7);
  }

  private static getPremiumModel(agentId: string): ModelConfig {
    // 为每个智能体定义最强模型
    const premiumModels: Record<string, { provider: ModelProvider; modelName: string }> = {
      curator: { provider: "anthropic", modelName: "claude-3-opus-20240229" },
      budget_controller: { provider: "openai", modelName: "gpt-4-turbo-preview" },
      // ... 其他智能体
    };

    const config = premiumModels[agentId] || { provider: "openai", modelName: "gpt-4-turbo-preview" };
    return ModelConfigFactory.createModelConfig(config.provider, config.modelName, 0.7);
  }
}
```

#### 2.2 使用示例

```typescript
// 在智能体中使用动态路由
const modelConfig = ModelRouter.selectModel(
  'curator',
  taskComplexity,  // 从任务分析中得出
  budgetConstraint  // 从用户需求中读取
);
```

---

### 方案三：配置文件驱动（最灵活）

#### 3.1 YAML配置文件

**文件**: `backend/config/agent-models.yaml`

```yaml
# 智能体-模型映射配置
version: "1.0"
default:
  provider: openai
  model: gpt-4-turbo-preview
  temperature: 0.7

agents:
  curator:
    provider: openai
    model: gpt-4-turbo-preview
    temperature: 0.8
    fallback:
      - provider: anthropic
        model: claude-3-opus-20240229

  spatial_designer:
    provider: openai
    model: gpt-4-turbo-preview
    temperature: 0.7

  visual_designer:
    provider: openai
    model: gpt-3.5-turbo
    temperature: 0.7

  interactive_tech:
    provider: deepseek
    model: deepseek-coder
    temperature: 0.5

  budget_controller:
    provider: openai
    model: gpt-4-turbo-preview
    temperature: 0.3

  supervisor:
    provider: openai
    model: gpt-4-turbo-preview
    temperature: 0.6

# 成本优化策略
cost_optimization:
  enabled: false
  max_cost_per_request: 0.01
  downgrade_agents:
    - visual_designer
    - interactive_tech

# 性能优化策略
performance_optimization:
  enabled: false
  max_latency_ms: 5000
  fast_agents:
    - visual_designer
```

#### 3.2 配置加载器

**文件**: `backend/src/config/config-loader.ts`

```typescript
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export interface AgentModelConfigYaml {
  version: string;
  default: {
    provider: ModelProvider;
    model: string;
    temperature: number;
  };
  agents: Record<string, {
    provider: ModelProvider;
    model: string;
    temperature: number;
    fallback?: Array<{ provider: ModelProvider; model: string }>;
  }>;
  cost_optimization?: {
    enabled: boolean;
    max_cost_per_request: number;
    downgrade_agents: string[];
  };
  performance_optimization?: {
    enabled: boolean;
    max_latency_ms: number;
    fast_agents: string[];
  };
}

let configCache: AgentModelConfigYaml | null = null;

export function loadAgentModelConfig(): AgentModelConfigYaml {
  if (configCache) {
    return configCache;
  }

  const configPath = path.join(process.cwd(), 'config', 'agent-models.yaml');

  if (!fs.existsSync(configPath)) {
    throw new Error(`配置文件不存在: ${configPath}`);
  }

  const fileContents = fs.readFileSync(configPath, 'utf8');
  configCache = yaml.load(fileContents) as AgentModelConfigYaml;

  return configCache;
}

export function getAgentConfigFromYaml(agentId: string): {
  provider: ModelProvider;
  modelName: string;
  temperature: number;
} | null {
  const config = loadAgentModelConfig();
  const agentConfig = config.agents[agentId];

  if (!agentConfig) {
    return null;
  }

  return {
    provider: agentConfig.provider,
    modelName: agentConfig.model,
    temperature: agentConfig.temperature
  };
}
```

---

## 📋 实施步骤

### 阶段一：基础架构（1-2天）

1. ✅ **扩展ModelProvider类型**
   - 添加anthropic、google、ollama、qwen

2. ✅ **创建智能体配置文件**
   - `backend/src/config/agent-models.config.ts`
   - 定义每个智能体的默认模型

3. ✅ **更新ModelConfigFactory**
   - 添加新provider的createModelConfig逻辑
   - 添加createForAgent方法

4. ✅ **更新环境变量配置**
   - 添加新provider的API key配置

### 阶段二：智能体迁移（2-3天）

5. ✅ **更新智能体初始化**
   - 修改所有6个智能体的constructor
   - 使用`createForAgent`替代`createModelConfig`

6. ✅ **测试验证**
   - 测试每个智能体使用指定的模型
   - 验证LLM调用成功

### 阶段三：高级功能（可选，3-4天）

7. ⭐ **实现动态模型路由**
   - 基于任务复杂度选择模型
   - 成本优化策略

8. ⭐ **支持YAML配置文件**
   - 创建agent-models.yaml
   - 实现配置加载器

---

## 💡 使用示例

### 示例1：使用默认配置

```typescript
// 自动使用 agent-models.config.ts 中定义的模型
const curator = new CuratorAgent();  // 使用 GPT-4 Turbo
const visualDesigner = new VisualDesignerAgent();  // 使用 GPT-3.5 Turbo
```

### 示例2：运行时覆盖

```typescript
// 临时覆盖配置（例如使用成本更低的模型）
const curator = new CuratorAgent({
  provider: "deepseek",
  modelName: "deepseek-chat",
  temperature: 0.7
});
```

### 示例3：为不同场景选择模型

```typescript
// 高端项目 - 使用最强模型
const premiumCurator = new CuratorAgent({
  provider: "anthropic",
  modelName: "claude-3-opus-20240229"
});

// 经济项目 - 使用高性价比模型
const budgetCurator = new CuratorAgent({
  provider: "deepseek",
  modelName: "deepseek-chat"
});
```

---

## 🔍 成本优化示例

### 当前架构（所有智能体使用GPT-4）

| 智能体 | 模型 | 每次调用成本 | 日均调用 | 日成本 |
|--------|------|------------|---------|-------|
| Curator | GPT-4 Turbo | $0.01 | 100 | $1.00 |
| Spatial | GPT-4 Turbo | $0.01 | 100 | $1.00 |
| Visual | GPT-4 Turbo | $0.01 | 100 | $1.00 |
| Interactive | GPT-4 Turbo | $0.01 | 100 | $1.00 |
| Budget | GPT-4 Turbo | $0.01 | 50 | $0.50 |
| Supervisor | GPT-4 Turbo | $0.01 | 50 | $0.50 |
| **总计** | - | - | **500** | **$5.00/天** |

### 优化后架构（混合模型）

| 智能体 | 模型 | 每次调用成本 | 日均调用 | 日成本 |
|--------|------|------------|---------|-------|
| Curator | GPT-4 Turbo | $0.01 | 100 | $1.00 |
| Spatial | GPT-4 Turbo | $0.01 | 100 | $1.00 |
| Visual | **GPT-3.5 Turbo** | **$0.0005** | 100 | **$0.05** |
| Interactive | **DeepSeek** | **$0.0001** | 100 | **$0.01** |
| Budget | GPT-4 Turbo | $0.01 | 50 | $0.50 |
| Supervisor | GPT-4 Turbo | $0.01 | 50 | $0.50 |
| **总计** | - | - | **500** | **$3.06/天** |

**节省成本**: 39% ($5.00 → $3.06)

---

## 📊 模型能力对比

| Provider | 模型 | 创意性 | 准确性 | 速度 | 成本 | 适用场景 |
|----------|------|--------|--------|------|------|---------|
| OpenAI | GPT-4 Turbo | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | $$$$ | 核心策划、预算控制 |
| OpenAI | GPT-3.5 Turbo | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $ | 视觉设计、简单任务 |
| Anthropic | Claude 3 Opus | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | $$$$ | 复杂策划、创意写作 |
| Anthropic | Claude 3 Sonnet | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $$$ | 通用任务 |
| DeepSeek | DeepSeek Coder | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $ | 技术方案、代码生成 |
| DeepSeek | DeepSeek Chat | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $ | 通用对话、简单任务 |
| Google | Gemini Pro | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $$$ | 多模态任务 |
| Qwen | Qwen Turbo | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | $$ | 中文优化 |
| Ollama | Llama2 13B | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | 免费 | 本地部署、离线使用 |

---

## 🚀 推荐配置方案

### 方案A：平衡方案（推荐）

```typescript
{
  curator: { provider: "openai", modelName: "gpt-4-turbo-preview" },
  spatial_designer: { provider: "openai", modelName: "gpt-4-turbo-preview" },
  visual_designer: { provider: "openai", modelName: "gpt-3.5-turbo" },
  interactive_tech: { provider: "deepseek", modelName: "deepseek-coder" },
  budget_controller: { provider: "openai", modelName: "gpt-4-turbo-preview" },
  supervisor: { provider: "anthropic", modelName: "claude-3-sonnet-20240229" }
}
```

**特点**: 质量/成本平衡，日成本约 $3.06

### 方案B：极致性能

```typescript
{
  curator: { provider: "anthropic", modelName: "claude-3-opus-20240229" },
  spatial_designer: { provider: "openai", modelName: "gpt-4-turbo-preview" },
  visual_designer: { provider: "anthropic", modelName: "claude-3-sonnet-20240229" },
  interactive_tech: { provider: "deepseek", modelName: "deepseek-coder" },
  budget_controller: { provider: "openai", modelName: "gpt-4-turbo-preview" },
  supervisor: { provider: "anthropic", modelName: "claude-3-opus-20240229" }
}
```

**特点**: 最高质量，日成本约 $4.50

### 方案C：成本优化

```typescript
{
  curator: { provider: "deepseek", modelName: "deepseek-chat" },
  spatial_designer: { provider: "openai", modelName: "gpt-3.5-turbo" },
  visual_designer: { provider: "openai", modelName: "gpt-3.5-turbo" },
  interactive_tech: { provider: "deepseek", modelName: "deepseek-coder" },
  budget_controller: { provider: "openai", modelName: "gpt-4-turbo-preview" },
  supervisor: { provider: "deepseek", modelName: "deepseek-chat" }
}
```

**特点**: 最低成本，日成本约 $1.60

---

## ⚠️ 注意事项

1. **API Key安全**
   - 所有API Key通过环境变量配置
   - 不要提交到代码仓库
   - 使用.env.local存储个人配置

2. **向后兼容**
   - 保持现有API不变
   - 新配置为可选功能
   - 渐进式迁移

3. **错误处理**
   - 当配置的模型不可用时，自动降级到默认模型
   - 提供清晰的错误提示

4. **监控和日志**
   - 记录每个智能体使用的模型
   - 追踪API调用成本
   - 监控模型性能

---

## 📚 相关文档

- [OpenAI模型文档](https://platform.openai.com/docs/models)
- [Anthropic Claude文档](https://docs.anthropic.com/claude/docs)
- [DeepSeek API文档](https://platform.deepseek.com/api-docs/)
- [Google Gemini文档](https://ai.google.dev/docs)
- [通义千问文档](https://help.aliyun.com/zh/dashscope/)
- [Ollama文档](https://ollama.ai/docs/)

---

**是否开始实施方案一（推荐）？**
