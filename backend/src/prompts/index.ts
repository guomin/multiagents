/**
 * Prompt 模板统一管理
 * 导出所有智能体的 prompt 模板和管理器
 */

export * from './types';
export * from './PromptManager';
import { PromptTemplate } from './types';

// 导出各个智能体的 prompt 模板
export * from './curator.prompts';
export * from './outline.prompts';
export * from './spatial-designer.prompts';
export * from './visual-designer.prompts';
export * from './interactive-tech.prompts';
export * from './budget-controller.prompts';
export * from './supervisor.prompts';

import { promptManager } from './PromptManager';
import { CURATOR_PROMPTS } from './curator.prompts';
import { OUTLINE_PROMPTS } from './outline.prompts';
import { SPATIAL_DESIGNER_PROMPTS } from './spatial-designer.prompts';
import { VISUAL_DESIGNER_PROMPTS } from './visual-designer.prompts';
import { INTERACTIVE_TECH_PROMPTS } from './interactive-tech.prompts';
import { BUDGET_CONTROLLER_PROMPTS } from './budget-controller.prompts';
import { SUPERVISOR_PROMPTS } from './supervisor.prompts';

/**
 * 初始化并注册所有 prompt 模板
 */
export function initializePrompts(): void {
  // 注册所有智能体的 prompt，使用完整的 key 格式 "agentName.taskName"
  const curatorPromptsWithPrefix: Record<string, PromptTemplate> = {};
  Object.entries(CURATOR_PROMPTS).forEach(([task, template]) => {
    curatorPromptsWithPrefix[`curator.${task}`] = template;
  });
  promptManager.registerPrompts(curatorPromptsWithPrefix);

  const outlinePromptsWithPrefix: Record<string, PromptTemplate> = {};
  Object.entries(OUTLINE_PROMPTS).forEach(([task, template]) => {
    outlinePromptsWithPrefix[`outline.${task}`] = template;
  });
  promptManager.registerPrompts(outlinePromptsWithPrefix);

  const spatialDesignerPromptsWithPrefix: Record<string, PromptTemplate> = {};
  Object.entries(SPATIAL_DESIGNER_PROMPTS).forEach(([task, template]) => {
    spatialDesignerPromptsWithPrefix[`spatial_designer.${task}`] = template;
  });
  promptManager.registerPrompts(spatialDesignerPromptsWithPrefix);

  const visualDesignerPromptsWithPrefix: Record<string, PromptTemplate> = {};
  Object.entries(VISUAL_DESIGNER_PROMPTS).forEach(([task, template]) => {
    visualDesignerPromptsWithPrefix[`visual_designer.${task}`] = template;
  });
  promptManager.registerPrompts(visualDesignerPromptsWithPrefix);

  const interactiveTechPromptsWithPrefix: Record<string, PromptTemplate> = {};
  Object.entries(INTERACTIVE_TECH_PROMPTS).forEach(([task, template]) => {
    interactiveTechPromptsWithPrefix[`interactive_tech.${task}`] = template;
  });
  promptManager.registerPrompts(interactiveTechPromptsWithPrefix);

  const budgetControllerPromptsWithPrefix: Record<string, PromptTemplate> = {};
  Object.entries(BUDGET_CONTROLLER_PROMPTS).forEach(([task, template]) => {
    budgetControllerPromptsWithPrefix[`budget_controller.${task}`] = template;
  });
  promptManager.registerPrompts(budgetControllerPromptsWithPrefix);

  const supervisorPromptsWithPrefix: Record<string, PromptTemplate> = {};
  Object.entries(SUPERVISOR_PROMPTS).forEach(([task, template]) => {
    supervisorPromptsWithPrefix[`supervisor.${task}`] = template;
  });
  promptManager.registerPrompts(supervisorPromptsWithPrefix);

  console.log('✅ 所有 Prompt 模板已注册');
}

/**
 * 导出 prompt 管理器实例
 */
export { promptManager };
