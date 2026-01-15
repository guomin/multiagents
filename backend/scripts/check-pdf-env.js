/**
 * PDF 环境检查脚本
 * 用于诊断 PDF 生成功能的配置问题
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 PDF 环境检查开始...\n');

// 1. 检查 Node.js 版本
console.log('1️⃣ Node.js 版本:');
console.log(`   当前版本: ${process.version}`);
console.log(`   推荐版本: >= 18.0.0\n`);

// 2. 检查 Puppeteer
console.log('2️⃣ Puppeteer 检查:');
try {
  const puppeteer = require('puppeteer');
  console.log('   ✅ Puppeteer 已安装');

  // 检查 Chromium
  const executablePath = puppeteer.executablePath();
  console.log(`   Chromium 路径: ${executablePath}`);

  if (fs.existsSync(executablePath)) {
    console.log('   ✅ Chromium 可执行文件存在');
  } else {
    console.log('   ❌ Chromium 可执行文件不存在');
    console.log('   💡 解决方案: npx puppeteer browsers install chrome');
  }
} catch (error) {
  console.log('   ❌ Puppeteer 未安装');
  console.log('   💡 解决方案: npm install puppeteer');
}
console.log('');

// 3. 检查 Worker Threads 支持
console.log('3️⃣ Worker Threads 检查:');
if (process.env.NODE_ENV !== 'production') {
  console.log('   ⚠️  当前为开发模式');
  console.log(`   USE_PDF_WORKER: ${process.env.USE_PDF_WORKER || 'false (默认)'}`);

  if (process.env.USE_PDF_WORKER === 'true') {
    console.log('   ✅ PDF Worker 已启用');
  } else {
    console.log('   ℹ️  PDF Worker 已禁用，将使用主线程生成');
    console.log('   💡 启用 Worker: 设置环境变量 USE_PDF_WORKER=true');
  }
} else {
  console.log('   ✅ 生产模式');
}
console.log('');

// 4. 检查系统字体
console.log('4️⃣ 中文字体检查:');
const platform = process.platform;
if (platform === 'win32') {
  console.log('   ✅ Windows 系统（自带微软雅黑字体）');
} else if (platform === 'darwin') {
  console.log('   ℹ️  macOS 系统');
  console.log('   💡 确保安装了中文字体');
} else {
  console.log('   ℹ️  Linux 系统');
  console.log('   💡 可能需要安装: fonts-wqy-microhei 或 fonts-wqy-zenhei');
}
console.log('');

// 5. 检查内存限制
console.log('5️⃣ 内存配置:');
console.log(`   最大旧代内存: ${process.execArgv.find(arg => arg.includes('max-old-space-size')) || '未设置'}`);
console.log(`   💡 建议设置: --max-old-space-size=4096\n`);

// 6. 尝试启动 Chromium
console.log('6️⃣ Chromium 启动测试:');
(async () => {
  try {
    const puppeteer = require('puppeteer');
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
    await page.setContent('<html><body><h1>测试</h1></body></html>');
    await browser.close();

    console.log('   ✅ Chromium 可以正常启动\n');
  } catch (error) {
    console.log(`   ❌ Chromium 启动失败: ${error.message}\n`);
  }

  // 7. 给出建议
  console.log('📋 诊断建议:\n');

  const issues = [];

  try {
    const puppeteer = require('puppeteer');
    if (!fs.existsSync(puppeteer.executablePath())) {
      issues.push('Chromium 未安装');
    }
  } catch (e) {
    issues.push('Puppeteer 未安装');
  }

  if (process.env.NODE_ENV !== 'production' && process.env.USE_PDF_WORKER !== 'true') {
    issues.push('Worker 未启用（可选）');
  }

  if (issues.length === 0) {
    console.log('   ✅ 所有检查通过，PDF 生成功能应该可以正常工作\n');
  } else {
    console.log('   ⚠️  发现以下问题:');
    issues.forEach(issue => console.log(`      - ${issue}`));
    console.log('');
  }

  console.log('🔧 快速修复命令:\n');
  console.log('   # 重新安装 Chromium');
  console.log('   npx puppeteer browsers install chrome');
  console.log('');
  console.log('   # 启用 PDF Worker（可选）');
  console.log('   # Windows: set USE_PDF_WORKER=true');
  console.log('   # Linux/Mac: export USE_PDF_WORKER=true');
  console.log('');
  console.log('   # 增加内存限制');
  console.log('   # Windows: set NODE_OPTIONS=--max-old-space-size=4096');
  console.log('   # Linux/Mac: export NODE_OPTIONS=--max-old-space-size=4096');
  console.log('');

  process.exit(0);
})();
