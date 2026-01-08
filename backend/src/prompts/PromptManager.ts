import Handlebars from 'handlebars';
import {
  PromptTemplate,
  PromptVariables,
  RenderedPrompt,
  PromptStats,
  PromptVersion
} from './types';
import { createLogger } from '../utils/logger';

const logger = createLogger('PROMPT-MANAGER');

/**
 * Prompt 管理器
 * 负责加载、管理和渲染智能体 prompt 模板
 */
export class PromptManager {
  private static instance: PromptManager;
  private prompts: Map<string, PromptTemplate> = new Map();

  private constructor() {
    this.registerHelpers();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager();
    }
    return PromptManager.instance;
  }

  /**
   * 注册 Handlebars 辅助函数
   */
  private registerHelpers(): void {
    // 条件判断辅助函数
    Handlebars.registerHelper('if_eq', function (this: any, a: any, b: any, options: any) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    // 数组连接辅助函数
    Handlebars.registerHelper('join', function (array: string[], separator: string = ', ') {
      if (!Array.isArray(array)) return '';
      return array.join(separator);
    });

    // 长度辅助函数
    Handlebars.registerHelper('length', function (array: any[]) {
      return array ? array.length : 0;
    });

    // 默认值辅助函数
    Handlebars.registerHelper('default', function (value: any, defaultValue: any) {
      return value !== undefined && value !== null && value !== '' ? value : defaultValue;
    });

    // 乘法辅助函数（用于计算面积比例等）
    Handlebars.registerHelper('multiply', function (a: number, b: number) {
      return a * b;
    });

    // 除法辅助函数
    Handlebars.registerHelper('divide', function (a: number, b: number) {
      return b !== 0 ? a / b : 0;
    });

    // 减法辅助函数
    Handlebars.registerHelper('subtract', function (a: number, b: number) {
      return a - b;
    });

    // 加法辅助函数
    Handlebars.registerHelper('add', function (a: number, b: number) {
      return a + b;
    });

    logger.debug('Handlebars 辅助函数注册完成');
  }

  /**
   * 注册 prompt 模板
   * @param key 格式: "agentName.taskName" (例如: "curator.generateConceptPlan")
   * @param template Prompt 模板
   */
  registerPrompt(key: string, template: PromptTemplate): void {
    const versionString = this.formatVersion(template.version);
    const fullKey = `${key}@${versionString}`;

    this.prompts.set(fullKey, template);
    logger.info('注册 Prompt 模板', { key: fullKey, description: template.description });
  }

  /**
   * 批量注册 prompt 模板
   */
  registerPrompts(prompts: Record<string, PromptTemplate>): void {
    Object.entries(prompts).forEach(([key, template]) => {
      this.registerPrompt(key, template);
    });
  }

  /**
   * 获取 prompt 模板
   * @param agentName 智能体名称
   * @param taskName 任务名称
   * @param version 版本号（可选，默认最新）
   */
  getPromptTemplate(
    agentName: string,
    taskName: string,
    version?: string
  ): PromptTemplate | null {
    const baseKey = `${agentName}.${taskName}`;

    // 如果指定了版本，直接获取
    if (version) {
      const key = `${baseKey}@${version}`;
      const template = this.prompts.get(key);
      if (template) {
        return template;
      }
      logger.warn('未找到指定版本的 Prompt 模板', { key, version });
      return null;
    }

    // 未指定版本，获取最新版本
    const latestTemplate = this.getLatestTemplate(baseKey);
    return latestTemplate;
  }

  /**
   * 获取指定 key 的最新模板
   */
  private getLatestTemplate(baseKey: string): PromptTemplate | null {
    let latestTemplate: PromptTemplate | null = null;
    let latestVersion: PromptVersion = { major: 0, minor: 0, patch: 0 };

    for (const [key, template] of this.prompts.entries()) {
      if (key.startsWith(baseKey + '@')) {
        if (this.compareVersions(template.version, latestVersion) > 0) {
          latestVersion = template.version;
          latestTemplate = template;
        }
      }
    }

    if (!latestTemplate) {
      logger.warn('未找到 Prompt 模板', { baseKey });
    }

    return latestTemplate;
  }

  /**
   * 渲染 prompt
   * @param agentName 智能体名称
   * @param taskName 任务名称
   * @param variables 模板变量
   * @param version 版本号（可选）
   */
  render(
    agentName: string,
    taskName: string,
    variables: PromptVariables = {},
    version?: string
  ): RenderedPrompt {
    const template = this.getPromptTemplate(agentName, taskName, version);

    if (!template) {
      throw new Error(`未找到 Prompt 模板: ${agentName}.${taskName}${version ? `@${version}` : ''}`);
    }

    try {
      // 编译并渲染系统提示词
      const systemCompile = Handlebars.compile(template.systemTemplate);
      const system = systemCompile(variables);

      // 编译并渲染用户提示词
      const humanCompile = Handlebars.compile(template.humanTemplate);
      const human = humanCompile(variables);

      const rendered: RenderedPrompt = {
        system,
        human,
        version: template.version,
        renderedAt: new Date().toISOString()
      };

      logger.debug('Prompt 渲染完成', {
        agentName,
        taskName,
        version: this.formatVersion(template.version),
        systemLength: system.length,
        humanLength: human.length
      });

      return rendered;
    } catch (error) {
      logger.error('Prompt 渲染失败', error as Error, { agentName, taskName, variables });
      throw error;
    }
  }

  /**
   * 获取 prompt 统计信息
   */
  getStats(agentName: string, taskName: string, version?: string): PromptStats | null {
    const template = this.getPromptTemplate(agentName, taskName, version);

    if (!template) {
      return null;
    }

    // 提取模板变量（简单实现，查找 {{ }} 中的内容）
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const systemVariables = template.systemTemplate.match(variablePattern) || [];
    const humanVariables = template.humanTemplate.match(variablePattern) || [];
    const allVariables = new Set([...systemVariables, ...humanVariables]);

    return {
      variableCount: allVariables.size,
      systemLength: template.systemTemplate.length,
      humanLength: template.humanTemplate.length,
      totalLength: template.systemTemplate.length + template.humanTemplate.length
    };
  }

  /**
   * 列出所有已注册的 prompt
   */
  listPrompts(): Array<{ key: string; version: string; description: string }> {
    const list: Array<{ key: string; version: string; description: string }> = [];

    for (const [key, template] of this.prompts.entries()) {
      const [baseKey, version] = key.split('@');
      list.push({
        key: baseKey,
        version,
        description: template.description || ''
      });
    }

    return list.sort((a, b) => a.key.localeCompare(b.key));
  }

  /**
   * 比较版本号
   * @returns 1: v1 > v2, -1: v1 < v2, 0: v1 === v2
   */
  private compareVersions(v1: PromptVersion, v2: PromptVersion): number {
    if (v1.major !== v2.major) return v1.major > v2.major ? 1 : -1;
    if (v1.minor !== v2.minor) return v1.minor > v2.minor ? 1 : -1;
    if (v1.patch !== v2.patch) return v1.patch > v2.patch ? 1 : -1;
    return 0;
  }

  /**
   * 格式化版本号
   */
  private formatVersion(version: PromptVersion): string {
    return `${version.major}.${version.minor}.${version.patch}`;
  }

  /**
   * 清空所有已注册的 prompt
   */
  clear(): void {
    this.prompts.clear();
    logger.info('已清空所有 Prompt 模板');
  }
}

/**
 * 导出单例实例
 */
export const promptManager = PromptManager.getInstance();
