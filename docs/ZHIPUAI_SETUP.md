# 智谱AI搜索配置快速指南

## 🔑 获取API Key

### 步骤1：注册账号
1. 访问：https://open.bigmodel.cn/
2. 点击右上角"注册"
3. 使用手机号或邮箱注册

### 步骤2：创建API Key
1. 登录后进入控制台
2. 点击左侧"API密钥"
3. 点击"创建新的API Key"
4. 复制生成的API Key

---

## ⚙️ 配置方式

### 方式1：环境变量（临时）

**Windows CMD:**
```cmd
set ZHIPUAI_API_KEY=你的API密钥
```

**Windows PowerShell:**
```powershell
$env:ZHIPUAI_API_KEY="你的API密钥"
```

**Linux/Mac:**
```bash
export ZHIPUAI_API_KEY=你的API密钥
```

### 方式2：.env.local文件（持久）

在 `backend` 目录下创建 `.env.local` 文件：

```env
ZHIPUAI_API_KEY=你的API密钥
```

### 方式3：系统环境变量（永久）

**Windows:**
1. 右键"此电脑" → 属性
2. 高级系统设置 → 环境变量
3. 新建用户变量：
   - 变量名：`ZHIPUAI_API_KEY`
   - 变量值：你的API密钥

**Linux/Mac:**
在 `~/.bashrc` 或 `~/.zshrc` 添加：
```bash
export ZHIPUAI_API_KEY="你的API密钥"
```

---

## 🧪 测试配置

### 测试命令
```bash
cd backend
npx ts-node src/test/test-bigmodel-search.ts
```

### 预期输出
```
🚀 开始测试智谱AI搜索功能...

📡 初始化搜索服务...
✅ 搜索服务已连接

🔍 测试1: 搜索"博物馆互动技术"
找到 3 个结果:
1. [结果标题]
   链接: [URL]
   简介: [摘要]

✅ 测试完成！
```

### 如果失败
检查：
1. API Key是否正确设置
2. 网络连接是否正常
3. API Key是否有效

---

## 🚀 启动服务

配置完成后启动后端：
```bash
cd backend
npm run dev
```

智能体现在会自动使用搜索能力！

---

## 📊 支持的环境变量

| 优先级 | 环境变量名 | 说明 |
|--------|-----------|------|
| 1 | `ZHIPUAI_API_KEY` | 智谱AI密钥（推荐）✅ |
| 2 | `BIGMODEL_API_KEY` | 智谱AI密钥（兼容） |

系统会优先使用 `ZHIPUAI_API_KEY`，如果不存在则使用 `BIGMODEL_API_KEY`。

---

## 💡 调用示例

### 在代码中直接使用
```typescript
import { getBigModelSearchService } from '../services/bigmodel-search';

const searchService = getBigModelSearchService();
await searchService.initialize();

const results = await searchService.search('博物馆互动技术', 5);
console.log(results);
```

### 智能体自动使用
```typescript
// InteractiveTechAgent会自动调用
const agent = new InteractiveTechAgent();
const solution = await agent.generateInteractiveSolution(requirements, conceptPlan);
// 日志显示：🔍 调研中: 博物馆水利工程互动技术
```

---

## 🔍 故障排查

### 问题1：API Key未找到
**错误：**
```
缺少智谱AI API Key！请设置 ZHIPUAI_API_KEY 环境变量
```

**解决：**
```bash
# 检查环境变量
echo %ZHIPUAI_API_KEY%        # Windows CMD
echo $env:ZHIPUAI_API_KEY     # PowerShell
echo $ZHIPUAI_API_KEY         # Linux/Mac

# 如果为空，重新设置
set ZHIPUAI_API_KEY=你的密钥
```

### 问题2：网络超时
**错误：**
```
Error: Request timeout
```

**解决：**
- 检查网络连接
- 智能体会自动降级到DuckDuckGo
- 不影响整体流程

### 问题3：API配额不足
**错误：**
```
API quota exceeded
```

**解决：**
- 登录 https://open.bigmodel.cn/
- 查看配额使用情况
- 充值或升级套餐

---

## 📞 技术支持

- 智谱AI文档：https://open.bigmodel.cn/dev/api
- 搜索API文档：https://open.bigmodel.cn/dev/api#web_search_prime
- 工单支持：控制台 → 提交工单
