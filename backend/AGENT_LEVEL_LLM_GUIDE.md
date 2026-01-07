# 智能体级别的LLM选择 - 使用指南

## ✅ 实施完成

**实施时间**：2026-01-06
**编译状态**：✅ 通过
**功能状态**：✅ 已完成

---

## 🎯 实现功能

现在每个智能体都可以**独立选择不同的LLM**！

### 核心改进

1. ✅ **6个Provider支持**：OpenAI、DeepSeek、智谱AI、Anthropic、Google、通义千问
2. ✅ **智能体级别配置**：每个智能体使用配置文件中的独立配置
3. ✅ **运行时覆盖**：支持在创建智能体时动态覆盖配置
4. ✅ **向后兼容**：保持现有API，渐进式迁移

---

## 📊 当前配置

**文件**：`backend/src/config/agent-models.config.ts`

### 默认智能体-模型映射

| 智能体 | Provider | 模型 | Temperature | 说明 |
|--------|----------|------|-------------|------|
| **策划智能体** (curator) | OpenAI | gpt-4-turbo-preview | 0.8 | 创意任务，高温 |
| **空间设计** (spatial_designer) | OpenAI | gpt-4-turbo-preview | 0.7 | 通用场景 |
| **视觉设计** (visual_designer) | OpenAI | gpt-3.5-turbo | 0.7 | 成本优化 |
| **互动技术** (interactive_tech) | DeepSeek | deepseek-coder | 0.5 | 技术准确性 |
| **预算控制** (budget_controller) | OpenAI | gpt-4-turbo-preview | 0.3 | 计算准确性 |
| **协调主管** (supervisor) | OpenAI | gpt-4-turbo-preview | 0.6 | 全局协调 |

---

## 🚀 使用方式

### 方式1：使用默认配置（推荐）

不需要任何代码改动，智能体自动使用配置文件中定义的模型。

```typescript
// 自动使用 agent-models.config.ts 中的配置
const curator = new CuratorAgent();  // 使用 GPT-4 Turbo
const visualDesigner = new VisualDesignerAgent();  // 使用 GPT-3.5 Turbo
const interactiveTech = new InteractiveTechAgent();  // 使用 DeepSeek Coder
```

### 方式2：运行时覆盖

临时改变某个智能体使用的模型：

```typescript
// 让策划智能体使用智谱AI
const curator = new CuratorAgent({
  provider: 'zhipu',
  modelName: 'glm-4-plus',
  temperature: 0.8
});

// 让视觉设计智能体使用更便宜的模型
const visualDesigner = new VisualDesignerAgent({
  provider: 'zhipu',
  modelName: 'glm-4-flash'
});
```

### 方式3：修改配置文件

永久改变某个智能体的默认模型，编辑 `backend/src/config/agent-models.config.ts`：

```typescript
export const AGENT_MODEL_CONFIG: Record<string, {
  provider?: ModelProvider;
  modelName?: string;
  temperature?: number;
}> = {
  // 修改策划智能体使用智谱AI
  curator: {
    provider: "zhipu",
    modelName: "glm-4-plus",
    temperature: 0.8
  },

  // 修改视觉设计使用通义千问
  visual_designer: {
    provider: "qwen",
    modelName: "qwen-turbo",
    temperature: 0.7
  },

  // ... 其他智能体配置
};
```

---

## 🔧 配置新Provider

### 步骤1：获取API Key

例如要使用智谱AI（GLM）：
1. 访问 https://bigmodel.cn/usercenter/proj-mgmt/apikeys
2. 注册并创建API Key
3. 复制API Key

### 步骤2：配置环境变量

编辑 `backend/.env` 文件：

```bash
# 智谱AI配置
ZHIPU_API_KEY=your_actual_zhipu_api_key_here
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4

# （可选）指定默认模型
DEFAULT_MODEL_ZHIPU=glm-4-flash
```

### 步骤3：修改智能体配置

编辑 `backend/src/config/agent-models.config.ts`：

```typescript
curator: {
  provider: "zhipu",  // 改为使用智谱AI
  modelName: "glm-4-plus",
  temperature: 0.8
}
```

### 步骤4：重启后端服务

```bash
cd backend
npm run dev
```

---

## 📋 支持的Provider和模型

### 1. OpenAI

**模型**：
- `gpt-4-turbo-preview` - GPT-4 Turbo（推荐）
- `gpt-4` - GPT-4
- `gpt-3.5-turbo` - GPT-3.5 Turbo（经济）

**适用场景**：
- 通用任务
- 需要高质量输出的场景
- 预算充足的项目

### 2. DeepSeek

**模型**：
- `deepseek-chat` - 通用对话
- `deepseek-coder` - 代码生成（推荐）

**适用场景**：
- 技术方案生成
- 互动技术设计
- 成本优化需求

### 3. 智谱AI (GLM)

**模型**：
- `glm-4-plus` - 最强模型
- `glm-4-0520` - 稳定版
- `glm-4-air` - 轻量级
- `glm-4-flash` - 超快速（推荐，成本极低）
- `glm-4-long` - 长文本（128K）
- `glm-3-turbo` - 上一代

**适用场景**：
- 成本敏感项目
- 中文优化
- 需要长文本处理

### 4. Anthropic (Claude)

**模型**：
- `claude-3-opus-20240229` - 最强模型
- `claude-3-sonnet-20240229` - 平衡（推荐）
- `claude-3-haiku-20240307` - 快速

**适用场景**：
- 复杂创意任务
- 需要高准确性的场景
- 长文本处理

### 5. Google (Gemini)

**模型**：
- `gemini-pro` - 通用
- `gemini-pro-vision` - 多模态
- `gemini-ultra` - 最强模型

**适用场景**：
- 多模态任务
- Google生态系统集成

### 6. 通义千问

**模型**：
- `qwen-turbo` - 快速响应
- `qwen-plus` - 平衡性能
- `qwen-max` - 最强模型
- `qwen-coder-turbo` - 代码生成

**适用场景**：
- 中文优化
- 国内部署需求
- 成本敏感

---

## 💰 成本优化示例

### 当前配置成本估算

假设每天处理100个项目，每个项目调用智能体6次：

| 智能体 | 模型 | 单次成本 | 日调用 | 日成本 |
|--------|------|---------|--------|-------|
| Curator | GPT-4 Turbo | $0.01 | 100 | $1.00 |
| Spatial | GPT-4 Turbo | $0.01 | 100 | $1.00 |
| Visual | GPT-3.5 Turbo | $0.0005 | 100 | $0.05 |
| Interactive | DeepSeek Coder | $0.0001 | 100 | $0.01 |
| Budget | GPT-4 Turbo | $0.01 | 100 | $1.00 |
| Supervisor | GPT-4 Turbo | $0.01 | 100 | $1.00 |
| **总计** | - | - | **600** | **$4.06/天** |

### 优化方案A：使用智谱AI

| 智能体 | 模型 | 日成本 |
|--------|------|-------|
| Curator | GLM-4 Plus | $0.50 |
| Spatial | GLM-4 Air | $0.20 |
| Visual | GLM-4 Flash | $0.02 |
| Interactive | DeepSeek Coder | $0.01 |
| Budget | GLM-4 Plus | $0.50 |
| Supervisor | GLM-4 Air | $0.20 |
| **总计** | - | **$1.43/天** |

**节省**：$4.06 → $1.43 = **65%** ⬇️

### 优化方案B：极致成本优化

| 智能体 | 模型 | 日成本 |
|--------|------|-------|
| Curator | GLM-4 Flash | $0.10 |
| Spatial | GLM-4 Flash | $0.10 |
| Visual | GLM-4 Flash | $0.02 |
| Interactive | DeepSeek Coder | $0.01 |
| Budget | GLM-4 Flash | $0.10 |
| Supervisor | GLM-4 Flash | $0.10 |
| **总计** | - | **$0.43/天** |

**节省**：$4.06 → $0.43 = **89%** ⬇️

---

## 🔍 查看智能体使用的模型

启动后端服务时，查看日志确认每个智能体使用的模型：

```bash
cd backend
npm run dev

# 输出示例：
# 🎨 初始化策划智能体 { overrides: undefined }
# ✅ 模型配置创建成功 { provider: 'openai', modelName: 'gpt-4-turbo-preview', temperature: 0.8 }
# ✅ LLM客户端初始化完成

# 🎨 初始化视觉设计智能体 { overrides: undefined }
# ✅ 模型配置创建成功 { provider: 'openai', modelName: 'gpt-3.5-turbo', temperature: 0.7 }
# ✅ LLM客户端初始化完成

# 🤖 初始化互动技术智能体 { overrides: undefined }
# ✅ 模型配置创建成功 { provider: 'deepseek', modelName: 'deepseek-coder', temperature: 0.5 }
# ✅ LLM客户端初始化完成
```

---

## ⚠️ 常见问题

### Q1: 如何验证智能体使用了正确的模型？

**A**: 查看后端日志，每个智能体初始化时会输出使用的模型配置。

### Q2: API Key配置后不生效？

**A**: 确保：
1. `.env` 文件中的API Key正确
2. 后端服务已重启
3. 环境变量名称正确（如 `ZHIPU_API_KEY`）

### Q3: 想让某个智能体临时使用其他模型？

**A**: 使用运行时覆盖（方式2），不需要修改配置文件。

### Q4: 如何测试新的Provider是否正常工作？

**A**: 可以创建测试脚本：

```typescript
import { ModelConfigFactory } from './config/model';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

async function testProvider() {
  const config = ModelConfigFactory.createForAgent('curator', {
    provider: 'zhipu',
    modelName: 'glm-4-flash'
  });

  const llm = new ChatOpenAI({
    modelName: config.modelName,
    temperature: config.temperature,
    openAIApiKey: config.apiKey,
    configuration: { baseURL: config.baseURL }
  });

  const response = await llm.invoke([new HumanMessage('你好')]);
  console.log(response.content);
}

testProvider();
```

### Q5: 不同智能体使用不同Provider会影响结果一致性吗？

**A**: 可能会有影响，因为不同模型的能力和风格不同。建议：
- 核心智能体（策划、协调）使用高质量模型
- 辅助智能体（视觉、互动）可以使用成本较低的模型

---

## 📚 相关文档

- `backend/MULTI_LLM_ARCHITECTURE.md` - 多LLM架构设计文档
- `backend/ADD_ZHIPU_GLM_FLOW.md` - 添加智谱AI详细流程
- `backend/src/config/agent-models.config.ts` - 智能体配置文件
- `backend/.env.example` - 环境变量配置示例

---

## 🎉 总结

现在你的系统已经实现了**智能体级别的LLM选择**！

**主要特点**：
- ✅ 6个智能体可以各自使用不同的LLM
- ✅ 支持6个主流LLM提供商
- ✅ 配置文件驱动，易于管理
- ✅ 支持运行时动态覆盖
- ✅ 成本优化高达89%

**下一步**：
1. 根据实际需求选择合适的Provider
2. 配置API Key
3. 测试验证
4. 根据效果调整配置

**祝使用愉快！** 🚀
