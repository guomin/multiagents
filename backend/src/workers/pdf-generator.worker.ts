import { parentPort, workerData } from 'worker_threads';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

interface PDFWorkerMessage {
  type: 'generate';
  markdown: string;
  projectId: string;
  outputPath?: string;
}

interface PDFWorkerResponse {
  type: 'success' | 'error';
  buffer?: Buffer;
  error?: string;
  projectId: string;
}

/**
 * PDF 生成 Worker
 * 在独立线程中运行，避免阻塞主线程
 */
async function generatePDF(markdown: string): Promise<Buffer> {
  // 1. 将 Markdown 转换为 HTML
  const htmlContent = marked(markdown);

  // 2. 创建专业的 HTML 文档（包含完整样式）
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* ========== 全局样式 ========== */
    * {
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 25mm 15mm 20mm 15mm;
    }

    body {
      font-family: 'Microsoft YaHei', '微软雅黑', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.8;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 10px 5px;
      font-size: 11pt;
    }

    /* ========== 标题样式 ========== */
    h1 {
      color: #1e40af;
      font-size: 24pt;
      font-weight: 700;
      margin: 0 0 25px 0;
      padding-bottom: 12px;
      border-bottom: 3px solid #3b82f6;
      page-break-after: avoid;
    }

    h2 {
      color: #1e3a8a;
      font-size: 18pt;
      font-weight: 600;
      margin: 30px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #93c5fd;
      page-break-after: avoid;
    }

    h3 {
      color: #1e40af;
      font-size: 15pt;
      font-weight: 600;
      margin: 25px 0 12px 0;
      padding-left: 12px;
      border-left: 4px solid #3b82f6;
      page-break-after: avoid;
    }

    h4 {
      color: #2563eb;
      font-size: 13pt;
      font-weight: 600;
      margin: 20px 0 10px 0;
      page-break-after: avoid;
    }

    h5 {
      color: #3b82f6;
      font-size: 12pt;
      font-weight: 600;
      margin: 15px 0 8px 0;
      page-break-after: avoid;
    }

    h6 {
      color: #60a5fa;
      font-size: 11pt;
      font-weight: 600;
      margin: 12px 0 8px 0;
      page-break-after: avoid;
    }

    /* ========== 段落样式 ========== */
    p {
      margin: 10px 0 15px 0;
      text-align: justify;
    }

    /* ========== 列表样式 ========== */
    ul, ol {
      margin: 12px 0;
      padding-left: 30px;
    }

    li {
      margin: 8px 0;
      line-height: 1.7;
    }

    ul li {
      list-style-type: disc;
    }

    ul ul li {
      list-style-type: circle;
    }

    ol li {
      list-style-type: decimal;
    }

    /* ========== 强调样式 ========== */
    strong {
      color: #1e40af;
      font-weight: 600;
    }

    b {
      color: #1e3a8a;
      font-weight: 600;
    }

    em {
      color: #7c3aed;
      font-style: italic;
    }

    /* ========== 代码样式 ========== */
    code {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      color: #dc2626;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 10pt;
      border: 1px solid #d1d5db;
    }

    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 18px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 18px 0;
      border: 1px solid #374151;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    pre code {
      background: transparent;
      color: #f9fafb;
      padding: 0;
      border: none;
      font-size: 9pt;
    }

    /* ========== 引用样式 ========== */
    blockquote {
      border-left: 5px solid #3b82f6;
      background: linear-gradient(90deg, #eff6ff 0%, #ffffff 100%);
      margin: 20px 0;
      padding: 15px 20px;
      font-style: italic;
      color: #4b5563;
      border-radius: 0 8px 8px 0;
    }

    blockquote p {
      margin: 0;
    }

    /* ========== 表格样式 ========== */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }

    th {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: #ffffff;
      font-weight: 600;
      padding: 14px 16px;
      text-align: left;
      font-size: 11pt;
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      border-right: 1px solid #f3f4f6;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:last-child td:first-child {
      border-bottom-left-radius: 8px;
    }

    tr:last-child td:last-child {
      border-bottom-right-radius: 8px;
    }

    tr:nth-child(even) {
      background: #f9fafb;
    }

    tr:hover {
      background: #eff6ff;
    }

    /* ========== 水平线样式 ========== */
    hr {
      border: none;
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%);
      margin: 30px 0;
    }

    /* ========== 链接样式 ========== */
    a {
      color: #2563eb;
      text-decoration: none;
      border-bottom: 1px dashed #2563eb;
    }

    a:hover {
      color: #1e40af;
      border-bottom-style: solid;
    }

    /* ========== 图片样式 ========== */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      margin: 15px 0;
    }

    /* ========== 特殊元素样式 ========== */
    .warning {
      background: #fef3c7;
      border-left: 5px solid #f59e0b;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }

    .info {
      background: #dbeafe;
      border-left: 5px solid #3b82f6;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }

    .success {
      background: #d1fae5;
      border-left: 5px solid #10b981;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }

    /* ========== 打印优化 ========== */
    @media print {
      body {
        padding: 40px 50px;
      }

      h1, h2, h3, h4 {
        page-break-after: avoid;
      }

      table, pre, blockquote {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
  `;

  // 3. 使用 Puppeteer 生成 PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: {
      top: '30mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="
        font-size: 9pt;
        color: #6b7280;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
        width: 100%;
        display: flex;
        justify-content: space-between;
      ">
        <span style="margin-left: 15mm;">展陈设计报告</span>
        <span style="margin-right: 15mm;" class="date"></span>
      </div>
    `,
    footerTemplate: `
      <div style="
        font-size: 8pt;
        color: #9ca3af;
        padding: 8px 0;
        border-top: 1px solid #e5e7eb;
        width: 100%;
        text-align: center;
      ">
        第 <span class="pageNumber"></span> 页 / 共 <span class="totalPages"></span> 页
      </div>
    `,
    preferCSSPageSize: true
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
}

/**
 * Worker 消息处理
 */
parentPort?.on('message', async (message: PDFWorkerMessage) => {
  const { type, markdown, projectId } = message;

  if (type !== 'generate') {
    parentPort?.postMessage({
      type: 'error',
      error: 'Unknown message type',
      projectId
    } as PDFWorkerResponse);
    return;
  }

  try {
    console.log(`[PDF Worker] 开始生成 PDF，项目ID: ${projectId}, Markdown 长度: ${markdown.length}`);

    const startTime = Date.now();
    const buffer = await generatePDF(markdown);
    const duration = Date.now() - startTime;

    console.log(`[PDF Worker] PDF 生成完成，耗时: ${duration}ms, 大小: ${buffer.length} bytes`);

    parentPort?.postMessage({
      type: 'success',
      buffer,
      projectId
    } as PDFWorkerResponse);

  } catch (error) {
    console.error(`[PDF Worker] PDF 生成失败:`, error);

    parentPort?.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      projectId
    } as PDFWorkerResponse);
  }
});

// Worker 错误处理
process.on('uncaughtException', (error) => {
  console.error('[PDF Worker] 未捕获的异常:', error);
  parentPort?.postMessage({
    type: 'error',
    error: error.message,
    projectId: workerData?.projectId || 'unknown'
  } as PDFWorkerResponse);
});
