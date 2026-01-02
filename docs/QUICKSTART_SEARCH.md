# 🚀 智能体搜索能力 - 快速开始

## 3分钟配置指南

### 1️⃣ 获取API Key（1分钟）
```
访问：https://open.bigmodel.cn/
注册 → 控制台 → API密钥 → 创建密钥
复制密钥
```

### 2️⃣ 配置环境（1分钟）

**推荐方式：**
```bash
# 创建配置文件
echo ZHIPUAI_API_KEY=你的密钥 > backend/.env.local
```

**或者环境变量：**
```bash
# Windows
set ZHIPUAI_API_KEY=你的密钥

# Linux/Mac
export ZHIPUAI_API_KEY=你的密钥
```

### 3️⃣ 测试验证（1分钟）

```bash
cd backend
npx ts-node src/test/test-bigmodel-search.ts
```

看到 "✅ 搜索服务已连接" 就成功了！

---

## ✅ 立即使用

配置完成后直接启动服务即可：

```bash
npm run dev
```

智能体会**自动使用搜索能力**，无需额外配置！

---

## 📋 支持的环境变量

| 优先级 | 环境变量 | 状态 |
|--------|---------|------|
| ✅ **优先** | `ZHIPUAI_API_KEY` | **推荐使用** |
| 兼容 | `BIGMODEL_API_KEY` | 备用方案 |

---

## 🎯 核心特性

- ✅ **自动触发** - 检测关键词自动搜索
- ✅ **双搜索源** - 智谱AI + DuckDuckGo
- ✅ **智能降级** - 搜索失败不影响流程
- ✅ **结果整合** - 真实案例融入提示词

---

## 📖 详细文档

- [完整配置指南](./ZHIPUAI_SETUP.md)
- [功能说明文档](./SEARCH_INTEGRATION.md)

---

## 🎉 开始体验

现在你的智能体可以：
- 🔍 实时搜索最新技术案例
- 📊 基于真实数据生成方案
- 🚀 持续学习行业趋势
