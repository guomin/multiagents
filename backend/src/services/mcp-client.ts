import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createLogger } from "../utils/logger";

const logger = createLogger('MCP-CLIENT');

/**
 * 精简MCP客户端
 * 用于连接和调用MCP服务器工具
 */
export class SimpleMCPClient {
  private client: Client;
  private transport: StdioClientTransport;
  private serverName: string;

  constructor(serverName: string, command: string, args: string[]) {
    this.serverName = serverName;

    // 创建stdio传输层
    this.transport = new StdioClientTransport({
      command,
      args
    });

    // 创建MCP客户端
    this.client = new Client(
      {
        name: "exhibition-backend",
        version: "1.0.0"
      },
      {
        capabilities: {}
      }
    );
  }

  /**
   * 连接到MCP服务器
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect(this.transport);
      logger.info(`✅ 已连接到MCP服务器: ${this.serverName}`);
    } catch (error) {
      logger.error(`❌ 连接MCP服务器失败: ${this.serverName}`, error as Error);
      throw error;
    }
  }

  /**
   * 调用MCP工具
   * @param toolName 工具名称
   * @param args 工具参数
   * @returns 工具返回结果
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    try {
      logger.debug(`调用MCP工具: ${toolName}`, args);

      const result: any = await this.client.callTool({
        name: toolName,
        arguments: args
      });

      // 解析返回内容
      const content = result.content?.[0];

      if (content?.type === 'text') {
        const text = content.text;
        // 尝试解析JSON
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }

      return content;

    } catch (error) {
      logger.error(`MCP工具调用失败: ${toolName}`, error as Error);
      throw error;
    }
  }

  /**
   * 列出可用工具
   */
  async listTools(): Promise<any[]> {
    try {
      const response = await this.client.listTools();
      return response.tools || [];
    } catch (error) {
      logger.error('获取工具列表失败', error as Error);
      return [];
    }
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    try {
      await this.client.close();
      await this.transport.close();
      logger.info(`🔌 已断开MCP服务器: ${this.serverName}`);
    } catch (error) {
      logger.error('关闭MCP连接失败', error as Error);
    }
  }
}
