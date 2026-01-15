# PDF Worker 配置指南

## 概述

PDF Worker 是一个用于在独立线程中生成 PDF 的功能，可以避免阻塞主线程。本文档详细说明了如何配置和使用 PDF Worker。

## 架构说明

```
请求 → PDF Worker Manager
         ↓
    [Worker Thread] ← 失败时降级到
         ↓              ↓
    PDF 生成      [主线程生成]
         ↓              ↓
    返回 PDF      返回 PDF
```

### 关键组件

1. **PDF Worker Manager** ([backend/src/workers/pdf-manager.ts](backend/src/workers/pdf-manager.ts))
   - 管理 Worker 生命周期
   - 处理 Worker 失败时的降级
   - 单例模式，全局共享

2. **PDF Worker** ([backend/src/workers/pdf-generator.worker.ts](backend/src/workers/pdf-generator.worker.ts))
   - 在独立线程中运行
   - 使用 Puppeteer 生成 PDF
   - 处理 Markdown 到 HTML 的转换

## 环境配置

### 1. 开发环境配置

**默认行为：**
- 开发环境（`NODE_ENV !== 'production'`）下，PDF Worker **默认禁用**
- 所有 PDF 生成在主线程执行
- 这样可以避免 TypeScript 编译问题

**启用 Worker（推荐）：**

如果要在开发环境启用 Worker，需要：

1. **编译 Worker 文件：**
   ```bash
   cd backend
   npm run build
   ```

2. **设置环境变量：**
   ```bash
   # Windows (CMD)
   set USE_PDF_WORKER=true

   # Windows (PowerShell)
   $env:USE_PDF_WORKER="true"

   # Linux/Mac
   export USE_PDF_WORKER=true
   ```

3. **启动服务器：**
   ```bash
   npm run dev
   ```

### 2. 生产环境配置

生产环境（`NODE_ENV === 'production'`）下，PDF Worker **默认启用**。

**环境变量：**

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NODE_ENV` | `development` | 生产环境设为 `production` |
| `USE_PDF_WORKER` | `false` (dev) / `true` (prod) | 强制启用/禁用 Worker |

**示例 .env 配置：**

```bash
# 生产环境
NODE_ENV=production
USE_PDF_WORKER=true

# 开发环境（启用 Worker）
NODE_ENV=development
USE_PDF_WORKER=true
```

## 使用方式

### API 调用

```typescript
import { getPDFWorkerManager } from './workers/pdf-manager';

// 获取管理器实例
const pdfManager = getPDFWorkerManager();

// 生成 PDF
const result = await pdfManager.generatePDF({
  markdown: '# Hello World\n\nThis is a test PDF.',
  projectId: 'project-123'
});

// result.buffer: Buffer - PDF 文件内容
// result.duration: number - 生成耗时（毫秒）
```

### 路由示例

```typescript
// backend/src/routes/exhibition.ts
router.post('/exhibition/:projectId/export', async (req, res) => {
  const { markdown } = req.body;
  const { projectId } = req.params;

  const pdfManager = getPDFWorkerManager();
  const result = await pdfManager.generatePDF({ markdown, projectId });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${projectId}.pdf"`);
  res.send(result.buffer);
});
```

## 降级机制

### 自动降级流程

```
PDF 生成请求
    ↓
Worker 可用？
    ├─ 是 → 使用 Worker 生成
    │         ↓
    │      成功？
    │         ├─ 是 → 返回 PDF
    │         └─ 否 → 降级到主线程
    │
    └─ 否 → 直接使用主线程
```

### 降级触发条件

1. **Worker 初始化失败**
   - Worker 文件不存在
   - Worker 编译出错
   - 内存限制不足

2. **Worker 执行失败**
   - Puppeteer 错误
   - 超时（120秒）
   - Worker 进程崩溃

### 降级行为

- Worker 失败时，自动切换到主线程生成
- 主线程使用相同的 Puppeteer 配置
- 可能阻塞其他请求（但保证 PDF 生成成功）

**日志示例：**

```
⚠️ 开发模式：PDF Worker 已禁用，使用主线程生成
⚠️ [降级方案] Worker 不可用，使用主线程生成
⚠️ [降级方案] Worker 生成失败，降级到主线程
```

## 故障排查

### 问题 1：Worker 不启动

**症状：**
```
⚠️ 开发模式：PDF Worker 已禁用，使用主线程生成
```

**解决方案：**
```bash
# 1. 编译 TypeScript
npm run build

# 2. 启用 Worker
export USE_PDF_WORKER=true

# 3. 重启服务器
npm run dev
```

### 问题 2：Worker 文件不存在

**症状：**
```
Error: Cannot find module './workers/pdf-generator.worker.js'
```

**解决方案：**
```bash
# 编译 TypeScript 文件
npm run build

# 检查文件是否存在
ls -la dist/workers/pdf-generator.worker.js
```

### 问题 3：Puppeteer 错误

**症状：**
```
Error: Failed to launch the browser process!
```

**解决方案：**
```bash
# 安装 Chromium
npx puppeteer browsers install chrome

# 检查环境
node scripts/check-pdf-env.js

# 测试生成
node scripts/test-pdf-generation.js
```

### 问题 4：内存不足

**症状：**
```
Error: Worker terminated with code: 1
```

**解决方案：**

增加 Node.js 内存限制：
```bash
# Windows
set NODE_OPTIONS=--max-old-space-size=4096

# Linux/Mac
export NODE_OPTIONS=--max-old-space-size=4096
```

或调整 Worker 内存限制（pdf-manager.ts:56-59）：
```typescript
this.worker = new Worker(workerPath, {
  resourceLimits: {
    maxOldGenerationSizeMb: 512,  // 增加到 1024
    maxYoungGenerationSizeMb: 128  // 增加到 256
  }
});
```

## 性能优化

### 1. Worker 池（未来优化）

当前实现使用单 Worker，未来可以扩展为 Worker 池：

```typescript
class PDFWorkerPool {
  private workers: Worker[] = [];
  private maxSize = 4; // 并发 Worker 数量

  async generatePDF(options: PDFGenerateOptions): Promise<PDFGenerateResult> {
    const worker = await this.acquireWorker();
    try {
      return await worker.generatePDF(options);
    } finally {
      this.releaseWorker(worker);
    }
  }
}
```

### 2. 缓存机制（未来优化）

```typescript
// 缓存已生成的 PDF
const pdfCache = new Map<string, Buffer>();

const cacheKey = generateHash(markdown);
if (pdfCache.has(cacheKey)) {
  return { buffer: pdfCache.get(cacheKey), duration: 0 };
}
```

### 3. 增量生成（未来优化）

对于大型报告，可以分块生成 PDF：
- 生成目录
- 生成各个章节
- 合并最终 PDF

## 测试

### 1. 环境检查

```bash
node scripts/check-pdf-env.js
```

输出示例：
```
🔍 PDF 环境检查开始...

1️⃣ Node.js 版本:
   当前版本: v20.10.0
   推荐版本: >= 18.0.0

2️⃣ Puppeteer 检查:
   ✅ Puppeteer 已安装
   Chromium 路径: C:\Users\...\.cache\puppeteer\chrome\...
   ✅ Chromium 可执行文件存在

3️⃣ Worker Threads 检查:
   ✅ PDF Worker 已启用

4️⃣ 中文字体检查:
   ✅ Windows 系统（自带微软雅黑字体）

6️⃣ Chromium 启动测试:
   ✅ Chromium 可以正常启动
```

### 2. PDF 生成测试

```bash
node scripts/test-pdf-generation.js
```

生成文件：`backend/scripts/test-output.pdf`

## 监控和日志

### 关键日志点

1. **Worker 初始化：**
   ```
   ✅ PDF Worker 初始化成功
   ```

2. **PDF 生成开始：**
   ```
   📄 开始生成 PDF
     projectId: project-123
     markdownLength: 5432
   ```

3. **PDF 生成成功：**
   ```
   ✅ PDF 生成成功
     duration: 2341ms
     size: 123456 bytes
   ```

4. **降级警告：**
   ```
   ⚠️ [降级方案] Worker 不可用，使用主线程生成
   ```

### 监控指标

建议监控以下指标：
- PDF 生成耗时（正常：< 5秒，降级：< 10秒）
- 降级频率（正常：< 5%）
- Worker 失败率（正常：< 1%）
- PDF 文件大小（正常：100KB - 5MB）

## 最佳实践

### 1. 开发环境

- ✅ **推荐：** 启用 Worker（`USE_PDF_WORKER=true`）
  - 优点：与生产环境一致，提前发现问题
  - 缺点：需要 `npm run build`

- ⚠️ **备选：** 禁用 Worker（默认）
  - 优点：快速开发，无需编译
  - 缺点：测试环境与生产不一致

### 2. 生产环境

- ✅ **必须启用 Worker**
  - 避免阻塞主线程
  - 提高并发处理能力
  - 降级机制作为容错

### 3. 错误处理

```typescript
try {
  const result = await pdfManager.generatePDF({ markdown, projectId });
  return result.buffer;
} catch (error) {
  // Worker Manager 已处理降级
  // 如果仍然抛出错误，说明主线程也失败了
  logger.error('PDF 生成彻底失败', error);
  throw new Error('PDF 生成失败，请联系管理员');
}
```

### 4. 超时设置

当前超时为 120 秒（2分钟）。如需调整：

```typescript
// pdf-manager.ts:120
const timeout = setTimeout(() => {
  reject(new Error('PDF 生成超时（120秒）'));
}, 120000); // 调整此处
```

## 相关文件

| 文件 | 说明 |
|------|------|
| [backend/src/workers/pdf-manager.ts](backend/src/workers/pdf-manager.ts) | Worker 管理器 |
| [backend/src/workers/pdf-generator.worker.ts](backend/src/workers/pdf-generator.worker.ts) | Worker 线程代码 |
| [backend/src/routes/exhibition.ts](backend/src/routes/exhibition.ts) | PDF 导出路由 |
| [backend/scripts/check-pdf-env.js](backend/scripts/check-pdf-env.js) | 环境检查脚本 |
| [backend/scripts/test-pdf-generation.js](backend/scripts/test-pdf-generation.js) | PDF 生成测试脚本 |

## 参考资料

- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)
- [Puppeteer Documentation](https://pptr.dev/)
- [PDF Generation Best Practices](https://pptr.dev/guides/pdf-generation)

## 更新日志

- **2025-01-15:** 添加详细配置指南和故障排查
- **2025-01-10:** 修复 Worker Buffer 序列化问题
- **2025-01-05:** 添加降级机制和日志优化
