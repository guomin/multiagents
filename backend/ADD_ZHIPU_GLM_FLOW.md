# 添加智谱AI（GLM）流程

## 📋 智谱AI API 关键信息

### API端点
```
https://open.bigmodel.cn/api/paas/v4
```

**注意**：
- 通用API端点：`https://open.bigmodel.cn/api/paas/v4`
- Coding专属端点：`https://open.bigmodel.cn/api/coding/paas/v4`（仅限Coding场景）

### 认证方式
```
Authorization: Bearer YOUR_API_KEY
```

### 支持的模型（GLM系列）

根据智谱AI官方文档，主要模型包括：

| 模型名称 | 特点 | 适用场景 |
|---------|------|---------|
| `glm-4-plus` | 最新最强模型 | 复杂任务、创意策划 |
| `glm-4-0520` | GLM-4稳定版 | 通用场景 |
| `glm-4-air` | 轻量级，快速响应 | 简单任务、实时交互 |
| `glm-4-flash` | 超快速，低成本 | 大规模调用 |
| `glm-4-long` | 长文本支持（128K） | 长文档处理 |
| `glm-3-turbo` | 上一代模型 | 成本优化 |

### API兼容性

✅ **好消息**：智谱AI API **完全兼容OpenAI API格式**

这意味着：
- 可以直接使用 LangChain 的 `ChatOpenAI` 类
- 只需要修改 `baseURL` 和 `apiKey`
- 代码改动最小

---

## 🚀 添加流程（7步）

### 第1步：扩展 ModelProvider 类型

**文件**: `backend/src/config/model.ts:1`

```typescript
// 修改前
export type ModelProvider = "openai" | "deepseek";

// 修改后
export type ModelProvider = "openai" | "deepseek" | "zhipu";
```

---

### 第2步：在 ModelConfigFactory 添加智谱AI配置逻辑

**文件**: `backend/src/config/model.ts:20-45`

在 `createModelConfig` 方法的 `switch` 语句中添加 `zhipu` case：

```typescript
export class ModelConfigFactory {
  static createModelConfig(
    requestedProvider?: ModelProvider,
    modelName?: string,
    temperature: number = 0.7
  ): ModelConfig {
    const provider = (requestedProvider || process.env.MODEL_PROVIDER?.toLowerCase() as ModelProvider) || "openai";

    switch (provider) {
      // ... 其他 case ...

      case "zhipu":
        if (!process.env.ZHIPU_API_KEY) {
          throw new Error("ZHIPU_API_KEY is required for ZhipuAI provider");
        }
        return {
          provider: "zhipu",
          modelName: modelName || process.env.DEFAULT_MODEL || "glm-4-flash",
          temperature,
          apiKey: process.env.ZHIPU_API_KEY,
          baseURL: process.env.ZHIPU_BASE_URL || "https://open.bigmodel.cn/api/paas/v4"
        };

      // ... 其他 case ...
    }
  }
}
```

**关键配置说明**：
- `ZHIPU_API_KEY`: 智谱AI的API密钥
- `ZHIPU_BASE_URL`: 默认 `https://open.bigmodel.cn/api/paas/v4`
- 默认模型：`glm-4-flash`（快速且经济）

---

### 第3步：更新可用模型列表

**文件**: `backend/src/config/model.ts:48-58`

在 `getAvailableModels` 方法中添加智谱AI的模型列表：

```typescript
static getAvailableModels(provider?: ModelProvider): string[] {
  const currentProvider = provider || (process.env.MODEL_PROVIDER?.toLowerCase() as ModelProvider) || "openai";

  switch (currentProvider) {
    // ... 其他 case ...

    case "zhipu":
      return [
        "glm-4-plus",      // 最强模型
        "glm-4-0520",      // 稳定版
        "glm-4-air",       // 轻量级
        "glm-4-flash",     // 超快速
        "glm-4-long",      // 长文本
        "glm-3-turbo"      // 上一代
      ];

    // ... 其他 case ...
  }
}
```

---

### 第4步：更新环境变量配置

**文件**: `backend/.env.example`

添加智谱AI的配置项：

```bash
# ==================== 智谱AI (GLM) ====================
# 获取方式：访问 https://bigmodel.cn/usercenter/proj-mgmt/apikeys
ZHIPU_API_KEY=your_zhipu_api_key_here
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4

# 默认模型（可选）
# 推荐选项：
#   - glm-4-plus: 最强模型，适合复杂任务
#   - glm-4-flash: 快速经济，适合大规模调用
#   - glm-4-air: 平衡性能和成本
#   - glm-4-long: 长文本支持（128K）
DEFAULT_MODEL_ZHIPU=glm-4-flash
```

**实际环境变量文件** (`backend/.env`)：

```bash
# 添加你的实际API Key
ZHIPU_API_KEY=your_actual_zhipu_api_key_here
```

---

### 第5步：创建智能体配置（可选）

如果使用方案一（智能体配置文件），创建 `backend/src/config/agent-models.config.ts`：

```typescript
import { ModelProvider } from './model';

export const AGENT_MODEL_CONFIG: Record<string, {
  provider?: ModelProvider;
  modelName?: string;
  temperature?: number;
}> = {
  // 使用智谱AI的智能体配置示例
  curator: {
    provider: "zhipu",
    modelName: "glm-4-plus",      // 策划需要最强模型
    temperature: 0.8
  },

  spatial_designer: {
    provider: "zhipu",
    modelName: "glm-4-air",       // 空间设计用平衡模型
    temperature: 0.7
  },

  visual_designer: {
    provider: "zhipu",
    modelName: "glm-4-flash",     // 视觉设计用快速模型
    temperature: 0.7
  },

  interactive_tech: {
    provider: "zhipu",
    modelName: "glm-4-0520",      // 技术方案用稳定版
    temperature: 0.5
  },

  budget_controller: {
    provider: "openai",           // 预算控制仍用GPT-4
    modelName: "gpt-4-turbo-preview",
    temperature: 0.3
  },

  supervisor: {
    provider: "zhipu",
    modelName: "glm-4-plus",      // 协调需要最强模型
    temperature: 0.6
  }
};
```

---

### 第6步：测试验证

创建测试脚本 `backend/test-zhipu.ts`：

```typescript
import { ModelConfigFactory } from './src/config/model';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

async function testZhipuAI() {
  console.log('🧪 开始测试智谱AI集成...\n');

  try {
    // 1. 创建模型配置
    console.log('1️⃣ 创建模型配置');
    const modelConfig = ModelConfigFactory.createModelConfig(
      'zhipu',
      'glm-4-flash',
      0.7
    );

    console.log('✅ 配置创建成功:', {
      provider: modelConfig.provider,
      modelName: modelConfig.modelName,
      baseURL: modelConfig.baseURL
    });

    // 2. 初始化 LLM 客户端
    console.log('\n2️⃣ 初始化 LLM 客户端');
    const llm = new ChatOpenAI({
      modelName: modelConfig.modelName,
      temperature: modelConfig.temperature,
      openAIApiKey: modelConfig.apiKey,
      configuration: {
        baseURL: modelConfig.baseURL
      }
    });

    console.log('✅ LLM 客户端初始化成功');

    // 3. 发送测试请求
    console.log('\n3️⃣ 发送测试请求');
    const message = new HumanMessage('你好，请用一句话介绍智谱AI的GLM模型。');

    const startTime = Date.now();
    const response = await llm.invoke([message]);
    const duration = Date.now() - startTime;

    console.log('✅ 请求成功');
    console.log('\n📤 响应内容:');
    console.log(response.content.toString());
    console.log(`\n⏱️  响应时间: ${duration}ms`);

    // 4. 测试不同模型
    console.log('\n4️⃣ 测试不同模型');
    const models = ['glm-4-flash', 'glm-4-air', 'glm-4-plus'];

    for (const model of models) {
      console.log(`\n测试模型: ${model}`);
      const testConfig = ModelConfigFactory.createModelConfig('zhipu', model, 0.7);
      const testLLM = new ChatOpenAI({
        modelName: testConfig.modelName,
        temperature: testConfig.temperature,
        openAIApiKey: testConfig.apiKey,
        configuration: { baseURL: testConfig.baseURL }
      });

      const testStart = Date.now();
      const testResponse = await testLLM.invoke([new HumanMessage('简单回复：测试成功')]);
      const testDuration = Date.now() - testStart;

      console.log(`✅ ${model}: ${testDuration}ms`);
    }

    console.log('\n✅ 所有测试通过！智谱AI集成成功！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

testZhipuAI();
```

**运行测试**：
```bash
cd backend
npx ts-node test-zhipu.ts
```

---

### 第7步：在实际智能体中使用

有两种使用方式：

#### 方式A：全局使用智谱AI

**文件**: `backend/.env`

```bash
# 设置默认provider为智谱AI
MODEL_PROVIDER=zhipu
DEFAULT_MODEL=glm-4-flash
```

这样所有智能体都会使用智谱AI（除非在代码中特别指定）。

#### 方式B：特定智能体使用智谱AI

**示例：让策划智能体使用智谱AI**

```typescript
// backend/src/agents/curator.ts

constructor(overrides?: {
  provider?: ModelProvider;
  modelName?: string;
  temperature?: number;
}) {
  // 如果没有提供override，使用智谱AI
  const defaultConfig = {
    provider: 'zhipu' as ModelProvider,
    modelName: 'glm-4-plus',
    temperature: 0.8
  };

  const finalConfig = { ...defaultConfig, ...overrides };

  this.modelConfig = ModelConfigFactory.createModelConfig(
    finalConfig.provider,
    finalConfig.modelName,
    finalConfig.temperature
  );

  // ... 其余代码保持不变
}
```

---

## 📊 智谱AI模型对比

| 模型 | 能力 | 速度 | 成本 | 适用智能体 |
|------|------|------|------|-----------|
| **glm-4-plus** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | $$$$ | Curator, Supervisor |
| **glm-4-0520** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $$$ | 所有智能体通用 |
| **glm-4-air** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $$ | Spatial, Interactive |
| **glm-4-flash** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | $ | Visual, 简单任务 |
| **glm-4-long** | ⭐⭐⭐⭐ | ⭐⭐ | $$$$ | 需要长文本的场景 |
| **glm-3-turbo** | ⭐⭐⭐ | ⭐⭐⭐⭐ | $ | 成本优化 |

---

## 💰 成本对比（估算）

| Provider | 模型 | 输入（元/1K tokens） | 输出（元/1K tokens） |
|----------|------|---------------------|---------------------|
| 智谱AI | glm-4-flash | ¥0.0001 (约$0.000014) | ¥0.0002 (约$0.000028) |
| 智谱AI | glm-4-air | ¥0.0005 | ¥0.0005 |
| 智谱AI | glm-4-plus | ¥0.01 | ¥0.01 |
| OpenAI | GPT-3.5 Turbo | $0.0005 | $0.0015 |
| OpenAI | GPT-4 Turbo | $0.01 | $0.03 |

**结论**：智谱AI的 `glm-4-flash` 成本极低，非常适合大规模调用。

---

## ⚠️ 注意事项

### 1. API Key 安全

✅ **正确做法**：
```bash
# 在 .env 文件中配置
ZHIPU_API_KEY=your_api_key_here
```

❌ **错误做法**：
```typescript
// 不要硬编码在代码中
const apiKey = "your_api_key_here";  // ❌ 危险
```

### 2. 错误处理

智谱AI可能会返回特殊错误码，需要处理：

```typescript
try {
  const response = await llm.invoke(messages);
} catch (error: any) {
  if (error.message?.includes('invalid_api_key')) {
    console.error('❌ API Key无效，请检查 ZHIPU_API_KEY');
  } else if (error.message?.includes('rate_limit')) {
    console.error('❌ 请求过于频繁，请稍后重试');
  } else {
    console.error('❌ 请求失败:', error.message);
  }
}
```

### 3. 模型选择建议

**根据任务复杂度选择**：

```typescript
const modelMapping = {
  // 创意任务 - 用最强模型
  creative: 'glm-4-plus',

  // 技术任务 - 用稳定版
  technical: 'glm-4-0520',

  // 简单任务 - 用快速版
  simple: 'glm-4-flash',

  // 长文本 - 用长文本模型
  longContext: 'glm-4-long'
};
```

### 4. 兼容性测试

虽然智谱AI兼容OpenAI API格式，但仍需测试：

- ✅ 基础对话功能
- ✅ System prompt 支持
- ✅ Temperature 参数生效
- ✅ 多轮对话
- ✅ 错误处理

---

## 🎯 快速开始清单

- [ ] 1. 注册智谱AI账号：https://bigmodel.cn/
- [ ] 2. 获取API Key：https://bigmodel.cn/usercenter/proj-mgmt/apikeys
- [ ] 3. 更新 `.env` 文件，添加 `ZHIPU_API_KEY`
- [ ] 4. 修改 `model.ts`，添加 `zhipu` provider
- [ ] 5. 运行测试脚本验证集成
- [ ] 6. 配置智能体使用智谱AI
- [ ] 7. 测试完整工作流

---

## 🚀 下一步

**选择你的实施路径**：

### 选项A：最小化测试（推荐开始）
1. 只添加 `zhipu` provider 支持
2. 创建测试脚本
3. 验证单个智能体（如 Curator）
4. 成功后推广到所有智能体

**预计时间**：30分钟

### 选项B：完整集成
1. 添加 `zhipu` provider 支持
2. 创建智能体配置文件
3. 为每个智能体配置合适的GLM模型
4. 全面测试

**预计时间**：1-2小时

### 选项C：混合配置（成本优化）
1. 部分智能体用GLM（便宜）
2. 核心智能体用GPT-4（质量）
3. 根据效果调整

**预计时间**：1小时

---

**你想选择哪个选项？或者我直接开始实施选项A（最小化测试）？**
