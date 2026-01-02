# 🔍 WebSocket 消息排查指南

## 快速检查清单

### ✅ **步骤 1：验证 WebSocket 连接**

#### 方法 1：使用 Node.js 测试脚本
```bash
# 运行测试脚本
cd backend
node src/test/debug-websocket.js
```

**预期输出：**
```
✅ WebSocket 连接成功！
📊 等待接收消息...
📤 已发送 ping 消息
📨 [1] 收到消息: pong
  心跳响应
```

#### 方法 2：使用浏览器测试工具
1. 启动后端：`cd backend && npm start`
2. 在浏览器中打开：`backend/src/test/websocket-test.html`
3. 查看状态是否显示"✅ 已连接"

---

### ✅ **步骤 2：触发后端广播**

#### 通过 API 触发
```bash
# 使用 curl 发送测试请求
curl -X POST http://localhost:3001/api/exhibition/run \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试展览",
    "theme": "测试主题",
    "targetAudience": "general_public",
    "venueSpace": {
      "area": 500,
      "height": 3.5
    },
    "budget": {
      "total": 300000,
      "currency": "CNY"
    }
  }'
```

#### 通过前端触发
1. 打开前端：`http://localhost:3000`
2. 创建新展览
3. 点击"启动多智能体设计"

---

### ✅ **步骤 3：检查后端日志**

#### 查看广播日志
后端应该输出类似内容：
```
📡 广播智能体状态 {
  agentId: 'curator',
  status: 'running',
  clientCount: 1,  // ← 重要：必须有客户端连接
  connectedClients: [1]
}
✅ 智能体状态广播完成 {
  agentId: 'curator',
  successCount: 1,  // ← 重要：成功发送数量
  totalClients: 1
}
```

#### 🔴 **如果 clientCount = 0**
- **原因：** WebSocket 客户端没有连接
- **检查：**
  1. 前端是否启动？
  2. 浏览器开发者工具 → Network → WS 标签，是否有 WebSocket 连接？
  3. 检查 WebSocket URL：`frontend/.env` 中的 `VITE_WS_URL`

---

### ✅ **步骤 4：检查前端连接**

#### 浏览器开发者工具检查

**1. Network 标签**
- 打开开发者工具（F12）
- 切换到 Network 标签
- 筛选 WS（WebSocket）
- 查看是否有连接到 `ws://localhost:3001`
- 点击连接，查看 Messages 标签

**2. Console 标签**
应该看到：
```
WebSocket 连接已建立
📨 [WebSocket] 收到消息: agentStatus { ... }
📨 [WebSocket] 收到消息: log { ... }
```

#### 🔴 **如果没有连接**
检查环境变量：
```bash
# frontend/.env
VITE_WS_URL=ws://localhost:3001  # ← 确保这个正确
```

---

### ✅ **步骤 5：验证消息格式**

#### 后端发送格式
```json
{
  "type": "agentStatus",
  "agentId": "curator",
  "status": {
    "status": "running",
    "startTime": "2024-12-31T10:00:00.000Z"
  },
  "timestamp": "2024-12-31T10:00:00.000Z"
}
```

#### 前端接收处理
`frontend/src/composables/useWebSocket.ts:104-109`
```javascript
const handleWebSocketMessage = (data: any) => {
  console.log('📨 [WebSocket] 收到消息:', data.type, data)
  switch (data.type) {
    case 'agentStatus':
      // 处理逻辑
```

---

## 🔍 **常见问题排查**

### 问题 1：后端显示 clientCount = 0

**症状：**
```
📡 广播智能体状态 {
  agentId: 'curator',
  clientCount: 0,  // ❌ 没有客户端
  connectedClients: []
}
```

**排查步骤：**
1. 确认前端是否启动：`cd frontend && npm run dev`
2. 确认前端页面是否打开
3. 检查浏览器 Console 是否有 WebSocket 错误
4. 检查防火墙是否阻止了 3001 端口

**解决方法：**
- 确保前端页面在浏览器中打开
- 检查 WebSocket URL 配置

---

### 问题 2：前端收不到消息，但后端显示 successCount > 0

**症状：**
- 后端：`successCount: 1`
- 前端：浏览器 Console 没有消息日志

**排查步骤：**
1. 浏览器开发者工具 → Network → WS
2. 点击 WebSocket 连接
3. 查看 Messages 标签，是否有数据？

**解决方法：**
- 可能是前端事件监听器问题
- 检查 `useWebSocket.ts` 是否正确导出和使用

---

### 问题 3：后端没有发送任何消息

**症状：**
- 后端日志没有任何广播记录
- 测试工具也收不到消息

**可能原因：**
1. 工作流没有真正执行
2. 使用了错误的图（旧版本）
3. 异步执行错误

**排查步骤：**
```bash
# 查看后端完整日志
cd backend
npm start 2>&1 | tee server.log

# 查看是否有这些日志：
# 🤖 [ASYNC] 正在获取 ExhibitionGraphWithHuman 实例...
# 📡 广播智能体状态
```

**解决方法：**
- 确认使用的是 `/api/exhibition/run` 接口
- 检查 `exhibition.ts:250-251` 是否使用 `getExhibitionGraphWithHuman()`

---

## 🛠️ **调试工具使用**

### 1. Node.js 测试脚本（推荐）
```bash
cd backend
node src/test/debug-websocket.js
```
**优点：** 纯净的测试环境，不影响前端

### 2. 浏览器测试工具
打开：`backend/src/test/websocket-test.html`

**优点：** 可视化界面，实时统计

### 3. 浏览器开发者工具
```javascript
// 在浏览器 Console 中运行
const ws = new WebSocket('ws://localhost:3001');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到:', data.type, data);
};
```

---

## 📊 **消息接收测试顺序**

### 正常情况下的消息序列：
```
1. 连接建立 ✅
2. pong (心跳响应)
3. agentStatus (curator → running)
4. log (策划智能体开始工作...)
5. agentStatus (curator → completed)
6. log (策划智能体完成工作)
7. progress (25%)
8. agentStatus (spatial_designer → running)
9. ... 继续后续节点
```

### 🔴 **如果第 2 步就失败了**
- 问题：连接没建立
- 检查：端口、URL、防火墙

### 🔴 **如果只有 pong 消息**
- 问题：后端没有触发工作流
- 检查：是否通过 API 触发了工作流执行

### 🔴 **如果有 progress 但没有 agentStatus**
- 问题：后端使用了旧版图
- 检查：`exhibition.ts:250` 的图加载代码

---

## 🎯 **快速诊断命令**

```bash
# 1. 检查后端是否运行
curl http://localhost:3001/api/model-config

# 2. 检查 WebSocket 端口
netstat -an | grep 3001

# 3. 测试 WebSocket 连接（需要安装 wscat）
npm install -g wscat
wscat -c ws://localhost:3001

# 4. 触发测试工作流
curl -X POST http://localhost:3001/api/exhibition/run \
  -H "Content-Type: application/json" \
  -d '{"title":"测试","theme":"测试"}'

# 5. 查看后端日志
tail -f backend/logs/*.log  # 或者直接看控制台输出
```

---

## 📝 **检查报告模板**

请按以下格式反馈：

```
**环境信息：**
- 后端版本：[运行 `cd backend && npm run build` 的输出]
- 前端版本：[运行 `cd frontend && npm run build` 的输出]
- Node.js 版本：node -v
- 浏览器：[Chrome/Firefox/Edge 版本]

**检查结果：**
- ✅/❌ Node.js 测试脚本能连接
- ✅/❌ 浏览器测试工具能连接
- ✅/❌ 前端页面能连接
- ✅/❌ 后端日志显示 clientCount > 0
- ✅/❌ 后端日志显示 successCount > 0
- ✅/❌ 浏览器 Console 有 "📨 [WebSocket] 收到消息" 日志

**后端日志（触发工作流后）：**
[粘贴后端控制台输出，特别是包含 "📡 广播" 的行]

**浏览器 Console 日志：**
[粘贴浏览器开发者工具 Console 输出]

**浏览器 Network → WS → Messages：**
[粘贴 WebSocket 消息列表]
```
