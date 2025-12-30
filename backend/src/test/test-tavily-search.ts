/**
 * Tavily搜索功能测试脚本
 *
 * 运行方式：
 * cd backend
 * set TAVILY_API_KEY=你的API密钥
 * npx ts-node src/test/test-tavily-search.ts
 */

import { getTavilySearchService } from '../services/tavily-search';

async function testTavilySearch() {
  console.log('🚀 开始测试Tavily搜索功能...\n');

  const searchService = getTavilySearchService();

  try {
    // 1. 测试搜索1：博物馆互动技术
    console.log('🔍 测试1: 搜索"博物馆互动技术"');
    const results1 = await searchService.search('博物馆互动技术', 3);

    console.log(`\n找到 ${results1.length} 个结果:\n`);
    results1.forEach((r, i) => {
      console.log(`${i + 1}. ${r.title}`);
      console.log(`   链接: ${r.url}`);
      console.log(`   相关性: ${(r.score * 100).toFixed(1)}%`);
      console.log(`   简介: ${r.content.substring(0, 100)}...\n`);
    });

    // 2. 测试搜索2：英文查询
    console.log('🔍 测试2: 搜索"museum interactive technology"');
    const results2 = await searchService.search('museum interactive technology', 2);

    console.log(`\n找到 ${results2.length} 个结果:\n`);
    results2.forEach((r, i) => {
      console.log(`${i + 1}. ${r.title}`);
      console.log(`   简介: ${r.content.substring(0, 100)}...\n`);
    });

    // 3. 测试AI答案
    console.log('🔍 测试3: 获取AI答案"什么是互动博物馆？"');
    const answer = await searchService.getAnswer('什么是互动博物馆？');

    console.log(`\nAI答案:\n${answer.substring(0, 200)}...\n`);

    console.log('✅ 测试完成！');

  } catch (error: any) {
    if (error.message?.includes('TAVILY_API_KEY')) {
      console.error('\n❌ 错误: 缺少Tavily API Key');
      console.log('\n请按以下步骤获取API Key：');
      console.log('1. 访问：https://tavily.com/');
      console.log('2. 注册账号（免费）');
      console.log('3. 创建API Key');
      console.log('4. 设置环境变量：set TAVILY_API_KEY=你的API密钥');
      console.log('\n免费额度：1000次搜索/月');
    } else {
      console.error('❌ 测试失败:', error);
    }
  } finally {
    // 关闭服务
    await searchService.close();
    console.log('🔌 搜索服务已关闭');
  }
}

// 运行测试
testTavilySearch().catch(console.error);
