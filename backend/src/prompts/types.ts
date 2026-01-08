/**
 * Prompt 模板类型定义
 */

/**
 * Prompt 版本信息
 */
export interface PromptVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Prompt 变量类型
 */
export type PromptVariables = Record<string, string | number | boolean | string[] | undefined>;

/**
 * Prompt 模板定义
 */
export interface PromptTemplate {
  /** 模板版本 */
  version: PromptVersion;
  /** 系统提示词模板 */
  systemTemplate: string;
  /** 用户提示词模板 */
  humanTemplate: string;
  /** 模板描述 */
  description?: string;
  /** 作者 */
  author?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * Prompt 配置
 */
export interface PromptConfig {
  /** 智能体名称 */
  agentName: string;
  /** 任务名称 */
  taskName: string;
  /** Prompt 版本（可选，默认使用最新版本） */
  version?: string;
}

/**
 * 渲染后的 Prompt
 */
export interface RenderedPrompt {
  /** 系统提示词 */
  system: string;
  /** 用户提示词 */
  human: string;
  /** 使用的版本 */
  version: PromptVersion;
  /** 渲染时间戳 */
  renderedAt: string;
}

/**
 * Prompt 统计信息
 */
export interface PromptStats {
  /** 模板变量数量 */
  variableCount: number;
  /** 系统提示词长度 */
  systemLength: number;
  /** 用户提示词长度 */
  humanLength: number;
  /** 总字符数 */
  totalLength: number;
}
