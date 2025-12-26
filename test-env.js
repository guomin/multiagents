// 简单的环境变量测试
require('dotenv').config();

console.log('🔍 检查环境变量:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MODEL_PROVIDER:', process.env.MODEL_PROVIDER);
console.log('DEEPSEEK_API_KEY 是否存在:', !!process.env.DEEPSEEK_API_KEY);
console.log('DEEPSEEK_API_KEY 长度:', process.env.DEEPSEEK_API_KEY?.length || 0);

// 尝试创建配置
try {
  const { ModelConfigFactory } = require('./src/config/model');
  const config = ModelConfigFactory.createModelConfig();
  console.log('✅ 配置创建成功:', config.provider, config.modelName);
} catch (error) {
  console.log('❌ 配置创建失败:', error.message);
}