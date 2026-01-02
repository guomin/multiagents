# 智能体搜索能力集成文档

## 📖 概述

InteractiveTechAgent（互动技术智能体）现已具备**网络搜索能力**，可以自动调研最新的互动技术案例，并整合到生成的方案中。

---

## 🔌 支持的搜索服务

### 1. **智谱AI搜索** ⭐ 推荐
- **类型**: HTTP MCP服务器
- **优点**:
  - ✅ 快速稳定（直接HTTP调用）
  - ✅ 无需启动子进程
  - ✅ 中文搜索支持好
  - ✅ 提供API密钥控制

### 2. **DuckDuckGo搜索**
- **类型**: Stdio MCP服务器
- **优点**:
  - ✅ 隐私保护
  - ✅ 无需API Key
  - ✅ 全球搜索覆盖
- **缺点**:
  - ⚠️ 可能被网络限制

---

## 🚀 快速开始

### 步骤1：获取智谱AI API Key

1. 访问：https://open.bigmodel.cn/
2. 注册/登录账号
3. 进入"API密钥"页面
4. 创建新的API Key

### 步骤2：配置环境变量

**Windows (CMD):**
```cmd
set ZHIPUAI_API_KEY=your_api_key_here
```

**Windows (PowerShell):**
```powershell
$env:ZHIPUAI_API_KEY="your_api_key_here"
```

**或者创建 `.env.local` 文件：**
```env
ZHIPUAI_API_KEY=your_api_key_here
```

### 步骤3：测试搜索功能

```bash
cd backend
npx ts-node src/test/test-bigmodel-search.ts
```

### 步骤4：启动后端服务

```bash
npm run dev
```

智能体将自动使用搜索能力！

---

## 💡 工作原理

### 自动触发机制

智能体会根据**概念策划的关键词**自动决定是否搜索：

```typescript
关键词检测：
- "水利" → 搜索"博物馆水利工程互动技术"
- "历史" → 搜索"博物馆历史文化AR互动"
- "科技" → 搜索"科技馆互动技术案例"
```

### 多级降级策略

```
优先：智谱AI搜索（快速、稳定）
  ↓ 失败
降级：DuckDuckGo搜索（备选方案）
  ↓ 失败
降级：基于知识库生成（不影响流程）
```

### 搜索结果整合

搜索结果会直接添加到LLM提示词中：

```
📚 参考资料（来自真实案例）：

1. **博物馆AR互动体验设计**
   链接：https://example.com/...
   简介：增强现实技术如何提升博物馆参观体验...

2. **沉浸式投影技术在展览中的应用**
   链接：https://example.com/...
   简介：360度环绕投影营造身临其境的氛围...

基于以上案例，请生成互动技术方案...
```

---

## 📊 代码架构

```
backend/src/
├── services/
│   ├── http-mcp-client.ts       # HTTP MCP客户端（新增）
│   ├── mcp-client.ts             # Stdio MCP客户端（原有）
│   ├── search-service.ts         # DuckDuckGo搜索服务
│   └── bigmodel-search.ts        # 智谱AI搜索服务（新增）
├── agents/
│   └── interactive-tech.ts       # 互动技术智能体（已更新）
└── test/
    └── test-bigmodel-search.ts   # 智谱AI搜索测试（新增）
```

---

## 🔧 配置选项

### 环境变量

| 优先级 | 变量名 | 说明 | 必需 |
|--------|------|------|------|
| 1 | `ZHIPUAI_API_KEY` | 智谱AI API密钥 | 推荐 ✅ |
| 2 | `BIGMODEL_API_KEY` | 智谱AI API密钥（兼容） | 可选 |

### 搜索参数调整

在 `interactive-tech.ts` 中可以调整：

```typescript
// 搜索结果数量
const searchResults = await this.bigModelSearchService.search(searchQuery, 3);
//                                                                   ↑
//                                                            改为5条结果

// 触发搜索的关键词
const keywords = ["水利", "历史", "文化", "科技", "互动", "多媒体"];
// 可以添加更多关键词
```

---

## 📝 使用示例

### 示例1：水利工程展览

**用户输入：**
```json
{
  "title": "木兰陂展陈中心",
  "theme": "展示木兰陂的历史文化价值和水文知识",
  "conceptPlan": {
    "concept": "通过互动技术展示古代水利工程的智慧"
  }
}
```

**智能体行为：**
1. 检测到关键词 "水利"
2. 自动搜索：`"博物馆水利工程互动技术"`
3. 获取真实案例
4. 基于案例生成方案

### 示例2：历史文化展览

**用户输入：**
```json
{
  "conceptPlan": {
    "concept": "运用AR技术还原历史场景"
  }
}
```

**智能体行为：**
1. 检测到关键词 "历史"
2. 自动搜索：`"博物馆历史文化AR互动"`
3. 获取AR应用案例
4. 生成AR互动方案

---

## 🎯 API文档

### BigModelSearchService

```typescript
class BigModelSearchService {
  // 初始化服务
  async initialize(): Promise<void>

  // 执行搜索
  async search(query: string, maxResults?: number): Promise<SearchResult[]>

  // 关闭服务
  async close(): Promise<void>
}
```

### SearchResult 接口

```typescript
interface SearchResult {
  title: string;   // 结果标题
  link: string;    // 结果链接
  snippet: string; // 结果摘要
}
```

---

## ⚠️ 注意事项

### 1. API费用
- 智谱AI搜索可能产生费用
- 建议设置每日调用限制
- 可通过环境变量禁用搜索

### 2. 网络要求
- HTTP搜索需要稳定的网络连接
- 超时时间设置为30秒
- 失败会自动降级

### 3. 隐私安全
- API Key请妥善保管
- 不要提交到代码仓库
- 使用 `.env.local` 文件管理

---

## 🔍 故障排查

### 问题1：缺少API Key

**错误信息：**
```
缺少智谱AI API Key！请设置 ZHIPUAI_API_KEY 环境变量
```

**解决方法：**
```bash
# Windows CMD
set ZHIPUAI_API_KEY=你的密钥

# Windows PowerShell
$env:ZHIPUAI_API_KEY="你的密钥"

# Linux/Mac
export ZHIPUAI_API_KEY=你的密钥

# 或创建 .env.local 文件
echo ZHIPUAI_API_KEY=你的密钥 > backend/.env.local
```

### 问题2：搜索超时

**错误信息：**
```
搜索失败，继续生成方案
```

**解决方法：**
- 检查网络连接
- 智能体会自动降级，不影响流程

### 问题3：搜索结果为空

**日志显示：**
```
找到 0 个结果
```

**解决方法：**
- 尝试更换搜索关键词
- 系统会自动降级到DuckDuckGo
- 或基于知识库生成方案

---

## 🚀 下一步优化

- [ ] 添加搜索结果缓存
- [ ] 支持更多搜索源（Google、Bing）
- [ ] 添加搜索历史记录
- [ ] 优化关键词提取算法
- [ ] 支持自定义搜索触发规则

---

## 📞 技术支持

如有问题，请查看：
- 智谱AI文档：https://open.bigmodel.cn/dev/api
- MCP协议：https://modelcontextprotocol.io/
