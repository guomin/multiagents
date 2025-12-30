import axios from 'axios';
import { createLogger } from "../utils/logger";

const logger = createLogger('TAVILY-SEARCH');

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

/**
 * Tavily AI搜索服务
 * 专为LLM优化的搜索引擎
 */
export class TavilySearchService {
  private apiKey: string;
  private baseURL = 'https://api.tavily.com/search';
  private initialized: boolean = false;

  constructor(apiKey?: string) {
    // 从环境变量获取API Key
    this.apiKey = apiKey || process.env.TAVILY_API_KEY || '';
    console.log(`🔑 使用Tavily API Key (长度: ${this.apiKey.length})`);
    console.log(`   前10位: ${this.apiKey.substring(0, 10)}...`);
    console.log(`   后10位: ...${this.apiKey.substring(this.apiKey.length - 10)}`); 

    if (!this.apiKey) {
      throw new Error('缺少Tavily API Key！请设置 TAVILY_API_KEY 环境变量');
    }
  }

  /**
   * 初始化搜索服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 测试API连接
      await this.search('test', 1);
      this.initialized = true;
      logger.info('✅ Tavily搜索服务已初始化');

    } catch (error) {
      logger.error('Tavily搜索服务初始化失败', error as Error);
      throw error;
    }
  }

  /**
   * 执行搜索
   * @param query 搜索关键词
   * @param maxResults 最大结果数
   * @returns 搜索结果数组
   */
  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      logger.info(`🔍 Tavily搜索: "${query}"`);

      const response = await axios.post(this.baseURL, {
        api_key: this.apiKey,
        query: query,
        max_results: Math.min(maxResults, 10),
        search_depth: 'basic',
        include_answer: true,
        include_raw_content: false
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // 解析响应
      if (response.data.error) {
        throw new Error(`Tavily Error: ${response.data.error}`);
      }

      // 提取搜索结果
      const results: SearchResult[] = [];

      // Tavily返回格式：{ answer, results: [{title, url, content, score}] }
      if (response.data.results && Array.isArray(response.data.results)) {
        for (const item of response.data.results) {
          results.push({
            title: item.title,
            url: item.url,
            content: item.content,
            score: item.score || 0
          });
        }
      }

      logger.info(`✅ 搜索到 ${results.length} 个结果`);

      return results.slice(0, maxResults);

    } catch (error: any) {
      logger.error('Tavily搜索失败', error as Error);

      // 返回降级结果
      return [{
        title: '搜索暂时不可用',
        url: '',
        content: `关于"${query}"的相关信息暂时无法获取。智能体将继续基于已有知识生成方案。`,
        score: 0
      }];
    }
  }

  /**
   * 获取搜索摘要（AI生成的答案）
   * @param query 查询
   * @returns AI生成的答案摘要
   */
  async getAnswer(query: string): Promise<string> {
    try {
      logger.info(`🧠 Tavily AI答案: "${query}"`);

      const response = await axios.post(this.baseURL, {
        api_key: this.apiKey,
        query: query,
        max_results: 5,
        include_answer: true,
        include_raw_content: false
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.answer || '';

    } catch (error) {
      logger.error('获取Tavily答案失败', error as Error);
      return '';
    }
  }

  /**
   * 关闭服务
   */
  async close(): Promise<void> {
    this.initialized = false;
    logger.info('🔌 Tavily搜索服务已关闭');
  }
}

// 单例模式
let searchInstance: TavilySearchService | null = null;

/**
 * 获取Tavily搜索服务单例
 */
export function getTavilySearchService(): TavilySearchService {
  if (!searchInstance) {
    searchInstance = new TavilySearchService();
  }
  return searchInstance;
}
