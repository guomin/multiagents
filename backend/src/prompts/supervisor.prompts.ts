import { PromptTemplate } from './types';

/**
 * Supervisor Agent (主管智能体) Prompt 模板
 */
export const SUPERVISOR_PROMPTS: Record<string, PromptTemplate> = {
  analyzeProgress: {
    version: { major: 1, minor: 0, patch: 0 },
    description: "分析项目进展状态",
    author: "Claude",
    createdAt: "2025-01-02",
    systemTemplate: `你是展陈设计多智能体系统的协调主管。你需要分析当前项目的进展状态，确定下一步行动，并提供专业建议。

你的职责包括：
1. 分析各智能体的工作进展
2. 识别潜在的问题和冲突
3. 协调各专业领域的工作
4. 确保项目质量和进度

请输出：
- nextAction: 下一步应该执行的操作
- recommendations: 改进建议
- issues: 发现的问题或风险`,
    humanTemplate: `请分析当前展陈设计项目的状态：

当前步骤：{{currentStep}}
已有成果：
{{#if hasConceptPlan}}✅ 概念策划已完成{{else}}❌ 概念策划待完成{{/if}}
{{#if hasSpatialLayout}}✅ 空间设计已完成{{else}}❌ 空间设计待完成{{/if}}
{{#if hasVisualDesign}}✅ 视觉设计已完成{{else}}❌ 视觉设计待完成{{/if}}
{{#if hasInteractiveSolution}}✅ 互动技术方案已完成{{else}}❌ 互动技术方案待完成{{/if}}
{{#if hasBudgetEstimate}}✅ 预算估算已完成{{else}}❌ 预算估算待完成{{/if}}

展览信息：{{title}}
主题：{{theme}}
预算：{{budget}} {{currency}}

请提供分析和建议。`
  },

  evaluateQuality: {
    version: { major: 1, minor: 0, patch: 0 },
    description: "评估设计方案质量",
    author: "Claude",
    createdAt: "2025-01-02",
    systemTemplate: `你是展陈设计系统的质量评估专家。你需要全面评估当前设计方案的质量，并提供客观的分数和建设性的反馈。

评估维度（每个维度0-1分）：
1. 概念策划（conceptScore）：创意性、主题契合度、叙事逻辑
2. 空间设计（spatialScore）：布局合理性、动线流畅度、功能完整性
3. 视觉设计（visualScore）：美学价值、品牌一致性、可实施性
4. 互动技术（interactiveScore）：技术可行性、用户体验、创新性
5. 预算合理性（budgetScore）：成本控制、性价比、风险控制

输出格式（JSON）：
{
  "overallScore": 0.85,
  "conceptScore": 0.9,
  "spatialScore": 0.8,
  "visualScore": 0.85,
  "interactiveScore": 0.8,
  "budgetScore": 0.85,
  "feedback": "总体评价...",
  "revisionTarget": "none" | "curator" | "spatial_designer" | "visual_designer" | "interactive_tech" | "budget_controller"
}

评估标准：
- 0.9-1.0：优秀，可直接通过
- 0.75-0.9：良好，有小问题可忽略
- 0.6-0.75：合格，需要轻微修订
- 0.6以下：不合格，需要大幅修订

如果需要修订，revisionTarget 应该指向需要改进的节点。如果总体分数低于0.6，建议返回 curator 重新规划。
如果有多个问题，优先选择分数最低的对应节点。`,
    humanTemplate: `请评估以下展陈设计方案：

【项目信息】
- 标题：{{title}}
- 主题：{{theme}}
- 预算：{{budget}} {{currency}}

【当前迭代】第 {{iterationCount}} 次（最多 {{maxIterations}} 次）

【设计方案】
{{#if conceptPlan}}
1. 概念策划：
   - 核心概念：{{concept}}
   - 叙事结构：{{narrative}}
   - 重点展品：{{keyExhibits}}
   - 观众动线：{{visitorFlow}}
{{else}}❌ 概念策划未完成{{/if}}

{{#if spatialLayout}}
2. 空间设计：
   - 布局：{{spatialLayoutDesc}}
   - 参观路线：{{visitorRoute}}
   - 功能区域：{{zones}}
{{else}}❌ 空间设计未完成{{/if}}

{{#if visualDesign}}
3. 视觉设计：
   - 色彩方案：{{colorScheme}}
   - 字体设计：{{typography}}
   - 品牌元素：{{brandElements}}
   - 视觉风格：{{visualStyle}}
{{else}}❌ 视觉设计未完成{{/if}}

{{#if interactiveSolution}}
4. 互动技术：
   - 使用技术：{{technologies}}
   - 互动装置：{{interactives}}
{{else}}❌ 互动技术方案未完成{{/if}}

{{#if budgetEstimate}}
5. 预算估算：
   - 总成本：{{totalCost}} {{currency}}
   - 预算明细：{{breakdown}}
   - 优化建议：{{recommendations}}
{{else}}❌ 预算估算未完成{{/if}}

{{#if feedbackHistory}}
【历史反馈】
{{feedbackHistory}}
{{/if}}

请进行全面的质量评估，输出 JSON 格式的评估结果。`
  },

  generateFinalReport: {
    version: { major: 1, minor: 0, patch: 0 },
    description: "生成最终项目报告",
    author: "Claude",
    createdAt: "2025-01-02",
    systemTemplate: `你是展陈设计系统的报告生成专家。你需要根据所有设计方案，生成一份完整、专业、易读的项目报告。

报告应该包括：
1. 项目概述
2. 所有设计方案的详细说明
3. 项目完成度统计
4. 专业建议和总结`,
    humanTemplate: `请根据以下设计方案生成最终项目报告：

项目信息：
- 展览名称：{{title}}
- 展览主题：{{theme}}
- 目标受众：{{targetAudience}}
- 展期：{{startDate}} 至 {{endDate}}
- 场地面积：{{area}}平方米

设计方案：
{{#if conceptPlan}}
- 核心概念：{{concept}}
- 叙事结构：{{narrative}}
- 重点展品：{{keyExhibits}}
{{/if}}

{{#if spatialLayout}}
- 空间布局：{{spatialLayoutDesc}}
- 参观路线：{{visitorRoute}}
- 功能区域：{{zones}}
{{/if}}

{{#if visualDesign}}
- 色彩方案：{{colorScheme}}
- 字体设计：{{typography}}
- 品牌元素：{{brandElements}}
{{/if}}

{{#if interactiveSolution}}
- 互动技术：{{technologies}}
- 互动装置：{{interactives}}
{{/if}}

{{#if budgetEstimate}}
- 总成本：{{totalCost}} {{currency}}
- 预算明细：{{breakdown}}
{{/if}}`
  }
};
