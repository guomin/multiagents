import { Worker } from 'worker_threads';
import path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('PDF-WORKER-MANAGER');

interface PDFGenerateOptions {
  markdown: string;
  projectId: string;
}

interface PDFGenerateResult {
  buffer: Buffer;
  duration: number;
}

/**
 * PDF Worker 管理器
 * 负责创建和管理 PDF 生成 Worker
 */
export class PDFWorkerManager {
  private worker: Worker | null = null;
  private isInitialized = false;
  private useWorker = true; // 是否使用 Worker（开发环境可以选择禁用）

  /**
   * 初始化 Worker
   */
  private initializeWorker(): void {
    if (this.isInitialized) {
      return;
    }

    // 检查是否在开发模式且没有编译输出
    const isDev = process.env.NODE_ENV !== 'production';
    const distPath = path.resolve(__dirname, 'pdf-generator.worker.js');
    const useWorkerInDev = process.env.USE_PDF_WORKER === 'true';

    // 开发环境下默认不使用 Worker，除非明确设置 USE_PDF_WORKER=true
    if (isDev && !useWorkerInDev) {
      logger.info('⚠️ 开发模式：PDF Worker 已禁用，使用主线程生成');
      this.useWorker = false;
      this.isInitialized = true;
      return;
    }

    try {
      const workerPath = distPath;

      logger.info('初始化 PDF Worker', {
        workerPath,
        nodeVersion: process.version
      });

      this.worker = new Worker(workerPath, {
        resourceLimits: {
          maxOldGenerationSizeMb: 512,  // 限制内存使用
          maxYoungGenerationSizeMb: 128
        }
      });

      // Worker 错误处理
      this.worker.on('error', (error) => {
        logger.error('PDF Worker 错误', error as Error);
        this.cleanup();
        // Worker 出错时降级到主线程
        this.useWorker = false;
      });

      this.worker.on('exit', (code) => {
        logger.info('PDF Worker 退出', { code });
        this.isInitialized = false;
        this.worker = null;
      });

      this.isInitialized = true;
      logger.info('✅ PDF Worker 初始化成功');

    } catch (error) {
      logger.error('❌ PDF Worker 初始化失败', error as Error);
      // 初始化失败时降级到主线程
      this.useWorker = false;
      this.isInitialized = true;
    }
  }

  /**
   * 生成 PDF
   */
  async generatePDF(options: PDFGenerateOptions): Promise<PDFGenerateResult> {
    const { markdown, projectId } = options;

    // 如果不使用 Worker，直接调用主线程版本
    if (!this.useWorker) {
      return this.generatePDFMainThread(options);
    }

    logger.info('📄 开始生成 PDF', {
      projectId,
      markdownLength: markdown.length
    });

    // 确保 Worker 已初始化
    this.initializeWorker();

    if (!this.worker) {
      // Worker 初始化失败，使用主线程
      logger.warn('⚠️ Worker 不可用，使用主线程生成');
      return this.generatePDFMainThread(options);
    }

    const startTime = Date.now();

    try {
      // 在这个代码块中，我们确保 worker 不为 null（已在上面检查）
      const worker = this.worker!;

      // 创建 Promise 包装 Worker 消息
      const result = await new Promise<PDFGenerateResult>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('PDF 生成超时（120秒）'));
        }, 120000); // 2分钟超时

        // 设置消息监听
        const messageHandler = (message: any) => {
          clearTimeout(timeout);

          if (message.projectId !== projectId) {
            return; // 忽略其他项目的消息
          }

          if (message.type === 'success') {
            const duration = Date.now() - startTime;

            // Worker 传递的 Buffer 会被序列化，需要重新构造
            let pdfBuffer: Buffer;
            if (Buffer.isBuffer(message.buffer)) {
              pdfBuffer = message.buffer;
            } else if (message.buffer instanceof Uint8Array) {
              pdfBuffer = Buffer.from(message.buffer.buffer || message.buffer);
            } else if (message.buffer && typeof message.buffer === 'object') {
              // Buffer 被序列化成对象，包含 data 数组
              const data = message.buffer.data || (message.buffer as any).buffer?.data;
              pdfBuffer = Buffer.from(data || message.buffer);
            } else {
              const error = new Error(`PDF 生成失败：无效的 buffer 类型 (${typeof message.buffer})`);
              logger.error('❌ 无效的 buffer 类型', error, {
                bufferType: typeof message.buffer,
                constructorName: message.buffer?.constructor?.name
              });
              reject(error);
              return;
            }

            logger.info('✅ PDF 生成成功', {
              projectId,
              duration: `${duration}ms`,
              size: `${pdfBuffer.length} bytes`
            });

            resolve({
              buffer: pdfBuffer,
              duration
            });

            worker.off('message', messageHandler);
          } else if (message.type === 'error') {
            logger.error('❌ PDF 生成失败', new Error(message.error));
            reject(new Error(message.error));
            worker.off('message', messageHandler);
          }
        };

        // 监听 Worker 消息
        worker.on('message', messageHandler);

        // 发送生成任务到 Worker
        worker.postMessage({
          type: 'generate',
          markdown,
          projectId
        });
      });

      return result;

    } catch (error) {
      logger.error('PDF 生成异常', error as Error, { projectId });
      // Worker 失败时降级到主线程
      logger.warn('⚠️ Worker 生成失败，降级到主线程');
      return this.generatePDFMainThread(options);
    }
  }

  /**
   * 主线程生成 PDF（降级方案）
   */
  private async generatePDFMainThread(options: PDFGenerateOptions): Promise<PDFGenerateResult> {
    const { markdown, projectId } = options;
    const startTime = Date.now();

    logger.info('📄 [主线程] 开始生成 PDF', {
      projectId,
      markdownLength: markdown.length
    });

    try {
      // 动态导入以避免在启动时就加载 Puppeteer
      const { marked } = await import('marked');
      const puppeteer = await import('puppeteer');

      // 1. 将 Markdown 转换为 HTML
      const htmlContent = marked(markdown);

      // 2. 创建完整的 HTML 文档
      const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* 全局样式 */
    * { box-sizing: border-box; }
    @page { size: A4; margin: 25mm 15mm 20mm 15mm; }
    body {
      font-family: 'Microsoft YaHei', '微软雅黑', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.8;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 10px 5px;
      font-size: 11pt;
    }
    h1 { color: #1e40af; font-size: 24pt; font-weight: 700; margin: 0 0 25px 0; padding-bottom: 12px; border-bottom: 3px solid #3b82f6; }
    h2 { color: #1e3a8a; font-size: 18pt; font-weight: 600; margin: 30px 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #93c5fd; }
    h3 { color: #1e40af; font-size: 15pt; font-weight: 600; margin: 25px 0 12px 0; padding-left: 12px; border-left: 4px solid #3b82f6; }
    p { margin: 10px 0 15px 0; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; padding: 14px 16px; text-align: left; }
    td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
    code { background: #f3f4f6; color: #dc2626; padding: 3px 8px; border-radius: 4px; font-family: 'Consolas', monospace; }
    pre { background: #1f2937; color: #f9fafb; padding: 18px; border-radius: 8px; }
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
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      });

      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '30mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true
      });

      // 确保 pdfBuffer 是 Buffer 类型
      const finalBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);

      await browser.close();

      const duration = Date.now() - startTime;

      logger.info('✅ [主线程] PDF 生成成功', {
        projectId,
        duration: `${duration}ms`,
        size: finalBuffer.length
      });

      return {
        buffer: finalBuffer,
        duration
      };

    } catch (error) {
      logger.error('❌ [主线程] PDF 生成失败', error as Error, { projectId });
      throw error;
    }
  }

  /**
   * 清理 Worker
   */
  private cleanup(): void {
    if (this.worker) {
      logger.info('清理 PDF Worker');
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  /**
   * 销毁 Worker 管理器
   */
  destroy(): void {
    this.cleanup();
  }

  /**
   * 检查 Worker 是否可用
   */
  isAvailable(): boolean {
    return this.isInitialized && this.worker !== null && this.useWorker;
  }
}

// 单例模式
let pdfWorkerManager: PDFWorkerManager | null = null;

/**
 * 获取 PDF Worker 管理器实例
 */
export function getPDFWorkerManager(): PDFWorkerManager {
  if (!pdfWorkerManager) {
    pdfWorkerManager = new PDFWorkerManager();
  }
  return pdfWorkerManager;
}

/**
 * 销毁 PDF Worker 管理器
 */
export function destroyPDFWorkerManager(): void {
  if (pdfWorkerManager) {
    pdfWorkerManager.destroy();
    pdfWorkerManager = null;
  }
}
