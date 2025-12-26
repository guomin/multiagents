import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

import { ModelConfigFactory } from '../config/model';

console.log('🔍 验证模型配置...\n');

// 显示当前环境变量
console.log('📋 环境变量状态:');
console.log(`MODEL_PROVIDER: ${process.env.MODEL_PROVIDER}`);
console.log(`DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`DEFAULT_MODEL: ${process.env.DEFAULT_MODEL || '未设置'}\n`);

// 验证配置
const validation = ModelConfigFactory.validateConfig();
console.log('🔍 配置验证结果:', validation);

if (validation.isValid) {
  // 显示可用模型
  console.log('\n📊 可用模型:');
  const openaiModels = ModelConfigFactory.getAvailableModels('openai');
  const deepseekModels = ModelConfigFactory.getAvailableModels('deepseek');
  console.log('OpenAI:', openaiModels.join(', '));
  console.log('DeepSeek:', deepseekModels.join(', '));

  // 显示当前配置
  const config = ModelConfigFactory.createModelConfig();
  console.log('\n✅ 当前配置:');
  console.log(`提供商: ${config.provider}`);
  console.log(`模型: ${config.modelName}`);
  console.log(`温度: ${config.temperature}`);
  if (config.baseURL) {
    console.log(`API 端点: ${config.baseURL}`);
  }
}