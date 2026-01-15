/**
 * PDF Generator Worker (JavaScript wrapper)
 * 这个文件是 TypeScript Worker 文件的包装器
 * 在开发模式下，它使用 tsx 来加载和运行 TypeScript 文件
 * 在生产模式下，TypeScript 编译器会生成正确的 .js 文件
 */

const { Worker } = require('worker_threads');
const path = require('path');

// 确定是否在开发模式
const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
  // 开发模式：使用 tsx 加载 TypeScript Worker
  const tsxPath = require.resolve('tsx');
  const workerTsPath = path.resolve(__dirname, 'pdf-generator.worker.ts');

  // 动态导入并执行 TypeScript Worker
  require(tsxPath).register();
  require(workerTsPath);
} else {
  // 生产模式：TypeScript 编译后的代码会在这里
  // 这个文件会被编译后的 pdf-generator.worker.ts 覆盖
  module.exports = require('./pdf-generator.worker.ts');
}
