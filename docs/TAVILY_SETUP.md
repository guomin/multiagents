# Tavily 搜索服务配置指南

## ⚡ 快速开始（3分钟）

### 1. 获取API Key（1分钟）

1. 访问：https://tavily.com/
2. 点击 "Sign Up" 注册
3. 使用 Google/GitHub 账号登录
4. 进入 "API Keys" 页面
5. 点击 "Create API Key"
6. 复制 API Key

### 2. 配置环境变量（1分钟）

**Windows CMD:**
```cmd
set TAVILY_API_KEY=你的API密钥
```

**Windows PowerShell:**
```powershell
$env:TAVILY_API_KEY="你的API密钥"
```

**或者创建 `.env.local` 文件：**
```env
TAVILY_API_KEY=你的API密钥
```

### 3. 测试验证（1分钟）

```bash
cd backend
npx ts-node src/test/test-tavily-search.ts
```

看到搜索结果就成功了！

---

## 🎯 核心优势

- ✅ **专为AI设计** - 返回格式直接适合LLM
- ✅ **简单易用** - REST API，无需MCP协议
- ✅ **免费额度** - 1000次搜索/月
- ✅ **全球搜索** - 不受地区限制
- ✅ **中文支持** - 支持多语言搜索
- ✅ **快速响应** - 平均响应时间 <2秒

---

## 💰 定价

| 套餐 | 价格 | 搜索次数 |
|------|------|---------|
| **免费** | $0 | 1000次/月 |
| **基础** | $20/月 | 10,000次 |
| **专业** | $100/月 | 60,000次 |

> 对于个人项目/开发测试，免费额度完全够用！

---

## 📖 API文档

### 基础搜索

```typescript
GET https://api.tavily.com/search
参数：
  query: "搜索关键词"
  api_key: "你的API密钥"
  max_results: 5 (最多10条)
  search_depth: "basic" | "advanced"
  include_answer: true (包含AI生成摘要)
```

### 响应格式

```json
{
  "answer": "搜索结果摘要...",
  "results": [
    {
      "title": "文章标题",
      "url": "https://...",
      "content": "内容摘要...",
      "score": 0.95
    }
  ]
}
```

---

## 🚀 使用方式

### 方式1：环境变量
```bash
set TAVILY_API_KEY=你的密钥
npm run dev
```

### 方式2：.env文件
```env
# backend/.env.local
TAVILY_API_KEY=你的密钥
```

### 方式3：代码中直接指定
```typescript
import { TavilySearchService } from './services/tavily-search';

const searchService = new TavilySearchService('你的密钥');
const results = await searchService.search('博物馆互动技术', 5);
```

---

## 🔍 故障排查

### 问题1：API Key未找到
```
错误：缺少Tavily API Key！请设置 TAVILY_API_KEY 环境变量
```

**解决：**
```bash
# 检查环境变量
echo %TAVILY_API_KEY%

# 如果为空，重新设置
set TAVILY_API_KEY=你的密钥
```

### 问题2：配额用完
```
错误：API quota exceeded
```

**解决：**
- 登录 https://tavily.com/
- 查看剩余配额
- 升级套餐或等下个月

### 问题3：搜索超时
```
错误：timeout of 15000ms exceeded
```

**解决：**
- 检查网络连接
- 降低 max_results 数量
- 智能体会基于知识库继续生成

---

## 📊 对比其他搜索服务

| 特性 | Tavily | DuckDuckGo | 智谱AI |
|------|--------|------------|--------|
| **难度** | ⭐ 简单 | ⭐⭐⭐ MCP | ⭐⭐⭐⭐ HTTP MCP |
| **免费** | 1000次/月 | 无限 | 需申请 |
| **速度** | ⚡ 快 | ⚡ 较慢 | ⚡ 快 |
| **中文** | ✅ | ✅ | ✅✅ |
| **LLM优化** | ✅✅ | ❌ | ❌ |
| **稳定性** | ✅✅ | ⚠️ 地区限制 | ⚠️ |
| **文档** | ✅ 详细 | ⚠️ 较少 | ⚠️ 较少 |

---

## 🎉 快速体验

注册后即可获得免费额度，立即测试：

```bash
# 1. 设置API Key
set TAVILY_API_KEY=tvly-xxxxxxxxxxxxx

# 2. 运行测试
cd backend
npx ts-node src/test/test-tavily-search.ts

# 3. 启动服务
npm run dev
```

智能体现在会自动使用Tavily搜索最新案例！
