# 智能体模型配置指南

本文档说明如何为不同的智能体配置不同的大语言模型。

## 快速开始

### 让预算控制智能体使用智谱AI GLM-4.7

在 `.env` 文件中添加或取消注释以下配置:

```bash
# 智谱AI API密钥 (从 https://open.bigmodel.cn/ 获取)
ZHIPUAI_API_KEY=your_actual_api_key_here

# 预算控制智能体使用智谱AI
BUDGET_CONTROLLER_PROVIDER=zhipuai
BUDGET_CONTROLLER_MODEL=glm-4.7
```

重启服务后,预算控制智能体将使用 GLM-4.7 模型。

## 配置优先级

系统按以下优先级读取配置(从高到低):

1. **智能体专属环境变量** (如 `BUDGET_CONTROLLER_PROVIDER`)
2. **全局环境变量** (如 `MODEL_PROVIDER`)
3. **代码默认值**

## 支持的 Provider

| Provider | 说明 | 可用模型 |
|----------|------|----------|
| `openai` | OpenAI | `gpt-4-turbo-preview`, `gpt-4`, `gpt-3.5-turbo` |
| `deepseek` | DeepSeek | `deepseek-chat`, `deepseek-coder` |
| `zhipuai` | 智谱AI | `glm-4.7`, `glm-4`, `glm-4-flash`, `glm-4-plus` |

## 支持的智能体

| 智能体代码 | 智能体名称 | 环境变量前缀 |
|------------|-----------|-------------|
| `curator` | 策划智能体 | `CURATOR_PROVIDER`, `CURATOR_MODEL` |
| `spatial_designer` | 空间设计智能体 | `SPATIAL_DESIGNER_PROVIDER`, `SPATIAL_DESIGNER_MODEL` |
| `visual_designer` | 视觉设计智能体 | `VISUAL_DESIGNER_PROVIDER`, `VISUAL_DESIGNER_MODEL` |
| `interactive_tech` | 互动技术智能体 | `INTERACTIVE_TECH_PROVIDER`, `INTERACTIVE_TECH_MODEL` |
| `budget_controller` | 预算控制智能体 | `BUDGET_CONTROLLER_PROVIDER`, `BUDGET_CONTROLLER_MODEL` |
| `supervisor` | 监督智能体 | `SUPERVISOR_PROVIDER`, `SUPERVISOR_MODEL` |

## 配置示例

### 示例 1: 预算控制使用 GLM-4.7,其他使用 DeepSeek

```bash
# 全局默认使用 DeepSeek
MODEL_PROVIDER=deepseek
DEFAULT_MODEL=deepseek-chat
DEEPSEEK_API_KEY=your_deepseek_key

# 预算控制智能体使用智谱AI
ZHIPUAI_API_KEY=your_zhipuai_key
BUDGET_CONTROLLER_PROVIDER=zhipuai
BUDGET_CONTROLLER_MODEL=glm-4.7
```

### 示例 2: 所有智能体使用 GLM-4.7

```bash
MODEL_PROVIDER=zhipuai
DEFAULT_MODEL=glm-4.7
ZHIPUAI_API_KEY=your_zhipuai_key
```

### 示例 3: 混合配置

```bash
# 全局默认
MODEL_PROVIDER=deepseek
DEFAULT_MODEL=deepseek-chat

# 策划使用 GPT-4
OPENAI_API_KEY=your_openai_key
CURATOR_PROVIDER=openai
CURATOR_MODEL=gpt-4-turbo-preview

# 视觉设计和互动技术使用智谱AI
ZHIPUAI_API_KEY=your_zhipuai_key
VISUAL_DESIGNER_PROVIDER=zhipuai
VISUAL_DESIGNER_MODEL=glm-4-flash
INTERACTIVE_TECH_PROVIDER=zhipuai
INTERACTIVE_TECH_MODEL=glm-4.7

# 预算控制也使用智谱AI
BUDGET_CONTROLLER_PROVIDER=zhipuai
BUDGET_CONTROLLER_MODEL=glm-4.7
```

### 示例 4: 对比测试

测试不同模型的效果时,只需修改 `.env` 并重启服务:

```bash
# 测试 DeepSeek
MODEL_PROVIDER=deepseek
DEFAULT_MODEL=deepseek-chat

# 测试 GLM-4.7 (修改这两行)
MODEL_PROVIDER=zhipuai
DEFAULT_MODEL=glm-4.7

# 测试 GPT-4 (修改这两行)
MODEL_PROVIDER=openai
DEFAULT_MODEL=gpt-4-turbo-preview
```

## 获取 API Keys

### DeepSeek
1. 访问 https://platform.deepseek.com/
2. 注册并登录
3. 创建 API Key
4. 设置到 `DEEPSEEK_API_KEY`

### 智谱AI
1. 访问 https://open.bigmodel.cn/
2. 注册并登录
3. 进入 API Keys 页面
4. 创建 API Key
5. 设置到 `ZHIPUAI_API_KEY`

### OpenAI
1. 访问 https://platform.openai.com/
2. 注册并登录
3. 进入 API Keys 页面
4. 创建 API Key
5. 设置到 `OPENAI_API_KEY`

## 验证配置

启动服务后,查看日志确认配置生效:

```
✅ 模型配置创建成功 {
  provider: "zhipuai",
  modelName: "glm-4.7",
  temperature: 0.4
}
```

如果看到类似的日志,说明配置成功。

## 故障排除

### 错误: "ZHIPUAI_API_KEY is required for ZhipuAI provider"

**原因**: 使用智谱AI但未设置 API Key

**解决**: 在 `.env` 中设置 `ZHIPUAI_API_KEY=your_actual_key`

### 错误: "DEEPSEEK_API_KEY is required for DeepSeek provider"

**原因**: 使用 DeepSeek 但未设置 API Key

**解决**: 在 `.env` 中设置 `DEEPSEEK_API_KEY=your_actual_key`

### 模型调用失败

**检查清单**:
1. API Key 是否正确
2. baseURL 是否正确
3. 模型名称是否在支持列表中
4. 网络连接是否正常
5. API 额度是否充足

## 性能对比建议

为科学对比不同模型的效果,建议:

1. **使用相同的测试用例**: 使用相同的展览设计需求
2. **记录关键指标**:
   - 响应时间
   - 输出质量
   - 成本 (每1000 tokens价格)
3. **多次测试**: 每个模型运行3-5次取平均值
4. **保存结果**: 记录每次运行的输出用于对比

## 扩展:为其他智能体配置专属模型

如果需要为其他智能体(如策划、空间设计等)配置专属模型:

1. 在 `.env` 中添加对应的环境变量
2. 参考上面"支持的智能体"表格中的环境变量前缀
3. 重启服务

例如,让策划智能体使用 GPT-4:

```bash
OPENAI_API_KEY=your_openai_key
CURATOR_PROVIDER=openai
CURATOR_MODEL=gpt-4-turbo-preview
```

## 技术细节

### 环境变量命名规则

- 格式: `{AGENT_TYPE}_{PARAMETER}`
- Agent Type 转大写并替换 `-` 为 `_`
- 例如: `budget_controller` → `BUDGET_CONTROLLER_PROVIDER`

### 配置读取逻辑

系统在 `backend/src/config/model.ts` 中实现:

```typescript
static createModelConfigForAgent(
  agentType: AgentType,
  modelName?: string,
  temperature: number = 0.7
): ModelConfig {
  // 1. 读取智能体专属配置
  const agentProvider = process.env[`${agentType.toUpperCase()}_PROVIDER`];
  const agentModel = process.env[`${agentType.toUpperCase()}_MODEL`];

  // 2. 如果有专属配置,使用专属配置
  if (agentProvider) {
    return this.createModelConfig(agentProvider, agentModel || modelName, temperature);
  }

  // 3. 否则使用全局配置
  return this.createModelConfig(undefined, modelName, temperature);
}
```

## 相关文件

- 配置实现: [backend/src/config/model.ts](backend/src/config/model.ts)
- 智谱AI文档: [docs/ZHIPUAI_API.md](docs/ZHIPUAI_API.md)
- 环境变量示例: [backend/.env.example](backend/.env.example)
