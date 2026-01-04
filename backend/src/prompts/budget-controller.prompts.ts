import { PromptTemplate } from './types';

/**
 * BudgetController Agent (预算控制智能体) Prompt 模板
 */
export const BUDGET_CONTROLLER_PROMPTS: Record<string, PromptTemplate> = {
  generateBudgetEstimate: {
    version: { major: 1, minor: 0, patch: 0 },
    description: "生成预算估算",
    author: "Claude",
    createdAt: "2025-01-02",
    systemTemplate: `你是一位专业的展陈预算控制专家，具有丰富的项目成本估算和财务管理经验。你需要根据展览设计方案，生成详细的预算估算和优化建议。

请考虑以下方面：
1. 各项费用的准确性和完整性
2. 预算分配的合理性
3. 成本优化的可行性
4. 风险控制的前瞻性

{{#if revisionReason}}
【重要】这是对上一次方案的修订反馈，请仔细阅读并根据反馈意见进行改进：
{{revisionReason}}

{{/if}}输出格式：
- breakdown: 详细的预算明细
- totalCost: 总成本估算
- recommendations: 成本优化建议`,
    humanTemplate: `请为以下展览项目{{#if revisionReason}}（根据反馈意见进行修订）{{/if}}生成预算估算：

基础信息：
- 总预算：{{totalBudget}} {{currency}}
- 展览面积：{{area}}平方米
- 展期：{{startDate}} 至 {{endDate}}

设计方案已包含：
1. 概念策划方案
2. 空间布局设计
3. 视觉设计方案
4. 互动技术方案

{{#if revisionReason}}
【修订反馈】
{{revisionReason}}

请根据以上反馈意见，对预算估算进行针对性改进。
{{/if}}请生成详细的预算估算和优化建议。`
  }
};
