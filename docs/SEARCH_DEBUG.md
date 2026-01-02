# 智谱AI搜索服务调试指南

## ❌ 错误：身份验证失败 (code: 1000)

```
收到MCP响应: {
  "code": 1000,
  "msg": "身份验证失败。",
  "success": false
}
```

## 🔍 排查步骤

### 1. 验证API Key是否有效

```bash
# 运行环境变量检查
cd backend
npx ts-node src/test/check-env.ts
```

确认：
- ✅ API Key长度为49字符
- ✅ 格式正确（无空格）

### 2. 测试API Key（使用curl）

```bash
# 替换 YOUR_API_KEY
curl -X POST "https://open.bigmodel.cn/api/paas/v4/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-4-flash",
    "messages": [{"role": "user", "content": "hi"}]
  }'
```

如果返回正常响应，说明API Key有效。

### 3. 检查搜索服务权限

Web Search Prime 可能是**独立服务**，需要：

1. 访问 https://open.bigmodel.cn/
2. 查看控制台是否有"搜索服务"开关
3. 检查是否需要额外申请

### 4. 确认API端点是否正确

当前使用的端点：
```
https://open.bigmodel.cn/api/mcp/web_search_prime/mcp
```

可能正确的端点：
```
https://open.bigmodel.cn/api/mcp/search/mcp
https://open.bigmodel.cn/api/mcp/web_search/mcp
```

### 5. 尝试直接API调用

```typescript
// 测试不同的端点
const endpoints = [
  'https://open.bigmodel.cn/api/mcp/web_search_prime/mcp',
  'https://open.bigmodel.cn/api/mcp/search/mcp',
  'https://open.bigmodel.cn/api/mcp/web_search/mcp'
];

for (const endpoint of endpoints) {
  console.log(`测试端点: ${endpoint}`);
  // 尝试连接...
}
```

## 💡 临时解决方案

如果智谱AI搜索服务暂时无法使用，系统会自动降级到：

1. **DuckDuckGo搜索** - 已集成
2. **基于知识库生成** - 不影响流程

## 📞 获取帮助

- 智谱AI文档：https://open.bigmodel.cn/dev/api
- 工单支持：控制台 → 提交工单
- 技术群：查看官方联系方式

## 🔧 代码中手动指定API Key（测试用）

如果环境变量有问题，可以直接在代码中设置：

```typescript
// backend/src/test/test-bigmodel-search.ts
const searchService = new BigModelSearchService('你的实际API_Key');

// 或者
process.env.ZHIPUAI_API_KEY = '你的实际API_Key';
const searchService = getBigModelSearchService();
```
