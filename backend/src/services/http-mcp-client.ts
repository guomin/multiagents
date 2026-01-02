import axios, { AxiosInstance } from 'axios';
import { createLogger } from "../utils/logger";

const logger = createLogger('HTTP-MCP-CLIENT');

/**
 * HTTP MCP客户端
 * 用于连接基于HTTP的MCP服务器
 */
export class HTTPMCPClient {
  private axios: AxiosInstance;
  private serverName: string;
  private url: string;

  constructor(serverName: string, url: string, apiKey?: string) {
    this.serverName = serverName;
    this.url = url;

    // 创建axios实例
    this.axios = axios.create({
      baseURL: url,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      timeout: 30000 // 30秒超时
    });

    // 调试：显示请求配置
    console.log(`📡 HTTP MCP客户端配置:`);
    console.log(`   URL: ${url}`);
    console.log(`   有API Key: ${!!apiKey}`);
    if (apiKey) {
      console.log(`   API Key长度: ${apiKey.length}`);
    }
  }

  /**
   * 连接到HTTP MCP服务器
   * HTTP模式下连接是即时的，无需实际连接操作
   */
  async connect(): Promise<void> {
    logger.info(`✅ HTTP MCP客户端已就绪: ${this.serverName}`);
  }

  /**
   * 调用MCP工具
   * @param toolName 工具名称
   * @param args 工具参数
   * @returns 工具返回结果
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    try {
      logger.debug(`调用HTTP MCP工具: ${toolName}`, args);

      // 构造MCP请求
      const mcpRequest = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      };

      // 调试日志（使用console.log记录复杂对象）
      console.log('🔍 发送MCP请求:', JSON.stringify(mcpRequest, null, 2));

      const response = await this.axios.post('', mcpRequest);

      console.log('📨 收到MCP响应:', JSON.stringify(response.data, null, 2));

      // 解析MCP响应
      if (response.data.error) {
        throw new Error(`MCP Error: ${JSON.stringify(response.data.error)}`);
      }

      // 检查响应数据
      if (!response.data) {
        logger.error('响应数据为空');
        return null;
      }

      const result = response.data.result || response.data;

      // 解析返回内容
      if (result.content && Array.isArray(result.content)) {
        const content = result.content[0];

        if (content?.type === 'text') {
          const text = content.text;

          // 尝试解析JSON
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        }
      }

      // 如果直接是搜索结果数组
      if (Array.isArray(result)) {
        return result;
      }

      // 如果包含results字段
      if (result.results && Array.isArray(result.results)) {
        return result.results;
      }

      return result;

    } catch (error: any) {
      logger.error(`HTTP MCP工具调用失败: ${toolName}`, error);

      // 如果是axios错误，记录更多信息
      if (error.response) {
        console.error('❌ 响应数据:', JSON.stringify(error.response.data, null, 2));
        console.error('❌ 响应状态:', error.response.status);
      }

      throw error;
    }
  }

  /**
   * 列出可用工具
   */
  async listTools(): Promise<any[]> {
    try {
      const mcpRequest = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/list"
      };

      const response = await this.axios.post('', mcpRequest);

      if (response.data.error) {
        throw new Error(`MCP Error: ${JSON.stringify(response.data.error)}`);
      }

      return response.data.result?.tools || [];

    } catch (error) {
      logger.error('获取工具列表失败', error as Error);
      return [];
    }
  }

  /**
   * 关闭连接
   * HTTP模式下无需关闭操作
   */
  async close(): Promise<void> {
    logger.info(`🔌 HTTP MCP客户端已关闭: ${this.serverName}`);
  }
}
