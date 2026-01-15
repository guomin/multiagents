/**
 * PDF 生成测试脚本
 * 用于测试 PDF 生成功能是否正常工作
 */

const puppeteer = require('puppeteer');
const { marked } = require('marked');
const fs = require('fs');
const path = require('path');

console.log('🧪 PDF 生成测试开始...\n');

async function testPDFGeneration() {
  const testMarkdown = `
# 展览设计测试报告

## 1. 概念策划

这是一个测试展览设计报告。

### 1.1 展览主题
- 主题：科技与未来
- 面积：500平方米
- 目标观众：青少年

## 2. 展区划分

### 2.1 入口区
- 欢迎墙
- 互动屏幕

### 2.2 主展区
- 科技展品
- 多媒体展示

## 3. 预算估算

| 项目 | 预算（元） |
|------|-----------|
| 设计费 | 50,000 |
| 施工费 | 100,000 |
| 设备费 | 80,000 |

**总计：230,000元**

## 4. 技术方案

代码示例：
\`\`\`javascript
console.log('Hello, Exhibition!');
\`\`\`

> 这是一个提示信息
  `;

  try {
    console.log('1️⃣ 转换 Markdown 为 HTML...');
    const htmlContent = marked(testMarkdown);
    console.log('   ✅ HTML 转换完成\n');

    console.log('2️⃣ 创建完整 HTML 文档...');
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
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
    h1 { color: #1e40af; font-size: 24pt; font-weight: 700; margin: 0 0 25px 0; padding-bottom: 12px; border-bottom: 3px solid #3b82f6; page-break-after: avoid; }
    h2 { color: #1e3a8a; font-size: 18pt; font-weight: 600; margin: 30px 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #93c5fd; page-break-after: avoid; }
    h3 { color: #1e40af; font-size: 15pt; font-weight: 600; margin: 25px 0 12px 0; padding-left: 12px; border-left: 4px solid #3b82f6; page-break-after: avoid; }
    p { margin: 10px 0 15px 0; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
    th { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; padding: 14px 16px; text-align: left; }
    td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
    code { background: #f3f4f6; color: #dc2626; padding: 3px 8px; border-radius: 4px; font-family: 'Consolas', monospace; }
    pre { background: #1f2937; color: #f9fafb; padding: 18px; border-radius: 8px; }
    pre code { background: transparent; color: #f9fafb; padding: 0; }
    blockquote { border-left: 5px solid #3b82f6; background: #eff6ff; margin: 20px 0; padding: 15px 20px; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
    `;
    console.log('   ✅ HTML 文档创建完成\n');

    console.log('3️⃣ 启动 Chromium 浏览器...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    console.log('   ✅ 浏览器启动成功\n');

    console.log('4️⃣ 生成 PDF...');
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
          <span style="margin-left: 15mm;">展陈设计测试报告</span>
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
    console.log('   ✅ PDF 生成成功\n');

    // 验证 PDF
    console.log('5️⃣ 验证 PDF 文件...');
    const headerBytes = pdfBuffer.slice(0, 4);
    const header = String.fromCharCode(headerBytes[0], headerBytes[1], headerBytes[2], headerBytes[3]);
    console.log(`   📋 文件头: "${header}" (字节: ${Array.from(headerBytes).join(',')})`);

    if (header !== '%PDF') {
      throw new Error(`生成的文件不是有效的 PDF 格式 (文件头: "${header}")`);
    }
    console.log('   ✅ PDF 文件格式正确\n');

    // 保存测试文件
    const outputPath = path.join(__dirname, 'test-output.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log('6️⃣ 保存测试文件...');
    console.log(`   📄 文件路径: ${outputPath}`);
    console.log(`   📊 文件大小: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);

    console.log('✅ 测试完成！PDF 生成功能正常工作\n');
    console.log('💡 您可以用以下方式打开测试文件：');
    console.log(`   1. 双击文件: ${outputPath}`);
    console.log('   2. 或在浏览器中打开: file://' + outputPath);
    console.log('');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('');
    console.error('错误详情:');
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
testPDFGeneration().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});
