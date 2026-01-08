# 模型配置测试步骤

## 测试目标

验证预算控制智能体能够正确使用智谱AI GLM-4.7 模型。

## 前置准备

### 1. 获取智谱AI API Key

1. 访问 https://open.bigmodel.cn/
2. 注册并登录账号
3. 进入用户中心 → API Keys
4. 创建新的 API Key
5. 复制保存 API Key (格式类似: `id.secret`)

### 2. 配置环境变量

在 `backend/.env` 文件中添加:

```bash
# 智谱AI配置
ZHIPUAI_API_KEY=your_actual_api_key_here

# 预算控制智能体使用智谱AI GLM-4.7
BUDGET_CONTROLLER_PROVIDER=zhipuai
BUDGET_CONTROLLER_MODEL=glm-4.7
```

**注意**: 确保 `ZHIPUAI_API_KEY` 替换为你实际获取的 API Key。

## 测试步骤

### 步骤 1: 启动服务

```bash
cd backend
npm run dev
```

### 步骤 2: 查看启动日志

在控制台日志中查找预算控制智能体的初始化信息:

**期望输出**:
```
💰 初始化预算控制智能体 modelName=undefined temperature=0.4
✅ 模型配置创建成功 {
  provider: "zhipuai",
  modelName: "glm-4.7",
  temperature: 0.4
}
✅ LLM客户端初始化完成
```

**关键验证点**:
- ✅ `provider` 应该是 `"zhipuai"`
- ✅ `modelName` 应该是 `"glm-4.7"`

如果看到以上信息,说明配置正确。

### 步骤 3: 运行测试用例

1. 打开前端界面 (通常是 http://localhost:5173)
2. 填写展览设计表单
3. 提交请求
4. 观察工作流执行过程

### 步骤 4: 验证预算控制智能体输出

当工作流执行到预算控制智能体时,查看日志:

**期望日志**:
```
💰 [预算控制智能体] 开始生成预算估算
🤖 [LLM调用] 准备调用大模型生成优化建议 {
  model: "glm-4.7",
  temperature: 0.4
}
🤖 [LLM调用] 优化建议生成完成 {
  llmDuration: "XXXms"
}
```

**验证点**:
- ✅ 模型名称显示为 `glm-4.7`
- ✅ LLM调用成功完成
- ✅ 生成优化建议而非报错

### 步骤 5: 对比测试 (可选)

为了对比不同模型的效果,可以修改配置并重新测试:

#### 测试 DeepSeek

修改 `.env`:
```bash
# 注释掉智谱AI配置
# BUDGET_CONTROLLER_PROVIDER=zhipuai
# BUDGET_CONTROLLER_MODEL=glm-4.7

# 使用 DeepSeek
BUDGET_CONTROLLER_PROVIDER=deepseek
BUDGET_CONTROLLER_MODEL=deepseek-chat
```

重启服务,使用相同测试用例运行。

#### 测试 GLM-4.7

修改 `.env`:
```bash
# 使用智谱AI
BUDGET_CONTROLLER_PROVIDER=zhipuai
BUDGET_CONTROLLER_MODEL=glm-4.7
```

重启服务,使用相同测试用例运行。

### 步骤 6: 对比输出结果

对比两种模型在以下方面的差异:

1. **响应时间**: 查看日志中的 `llmDuration`
2. **预算建议质量**: 查看生成的优化建议是否合理
3. **成本分析**: 查看预算明细的准确性
4. **建议的针对性**: 查看建议是否针对具体设计方案

## 常见问题排查

### 问题 1: 启动时报错 "ZHIPUAI_API_KEY is required"

**原因**: 未设置智谱AI API Key

**解决**:
1. 检查 `.env` 文件中是否有 `ZHIPUAI_API_KEY`
2. 确保 API Key 格式正确 (不是 `your_zhipuai_api_key_here`)
3. 重启服务

### 问题 2: 启动时日志显示 provider 是 "deepseek" 而不是 "zhipuai"

**原因**: 智能体专属配置未生效

**解决**:
1. 检查 `.env` 中是否正确设置了 `BUDGET_CONTROLLER_PROVIDER=zhipuai`
2. 确保没有拼写错误
3. 确保环境变量已加载 (重启服务)

### 问题 3: LLM调用失败

**可能原因**:
1. API Key 无效或过期
2. 网络连接问题
3. API 额度不足
4. baseURL 配置错误

**排查步骤**:
```bash
# 1. 测试 API Key 是否有效
curl -X POST "https://open.bigmodel.cn/api/paas/v4/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "glm-4.7",
    "messages": [{"role": "user", "content": "你好"}]
  }'

# 2. 检查日志中的详细错误信息
# 3. 确认智谱AI账户有可用额度
```

### 问题 4: 模型输出异常

**现象**: API调用成功但输出格式错误或内容异常

**可能原因**:
1. 模型版本问题
2. Prompt 不兼容
3. Temperature 设置不当

**解决**:
1. 尝试使用其他 GLM 模型 (如 `glm-4`, `glm-4-flash`)
2. 检查 Prompt 是否符合智谱AI的要求
3. 调整 Temperature 参数

## 测试记录模板

建议使用以下模板记录测试结果:

```markdown
## 模型对比测试记录

### 测试日期: YYYY-MM-DD
### 测试用例: [展览名称]

#### DeepSeek 配置
- 响应时间: XXXms
- 预算总额: XXXX元
- 优化建议数量: X条
- 备注: [观察到的特点]

#### GLM-4.7 配置
- 响应时间: XXXms
- 预算总额: XXXX元
- 优化建议数量: X条
- 备注: [观察到的特点]

#### 对比结论
- 速度: [哪个更快]
- 质量: [哪个建议更好]
- 成本: [成本对比]
```

## 下一步

测试通过后,你可以:

1. **为其他智能体配置专属模型**: 参考 [AGENT_MODEL_CONFIG_GUIDE.md](AGENT_MODEL_CONFIG_GUIDE.md)
2. **进行批量对比测试**: 使用多个测试用例对比不同模型
3. **优化 Prompt**: 根据模型特点优化 Prompt
4. **成本优化**: 根据测试结果选择性价比最高的模型组合

## 相关文档

- [配置指南](AGENT_MODEL_CONFIG_GUIDE.md)
- [智谱AI API文档](docs/ZHIPUAI_API.md)
- [模型配置实现](backend/src/config/model.ts)
