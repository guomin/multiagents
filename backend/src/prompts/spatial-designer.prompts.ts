import { PromptTemplate } from './types';

/**
 * SpatialDesigner Agent (空间设计智能体) Prompt 模板
 */
export const SPATIAL_DESIGNER_PROMPTS: Record<string, PromptTemplate> = {
  generateSpatialLayout: {
    version: { major: 1, minor: 0, patch: 0 },
    description: "生成空间布局方案",
    author: "Claude",
    createdAt: "2025-01-02",
    systemTemplate: `你是一位专业的展陈空间设计师，具有丰富的空间规划和动线设计经验。你需要根据展览需求和概念策划，生成空间布局方案。

请考虑以下方面：
1. 空间利用的最优化
2. 参观动线的流畅性
3. 功能区域的合理性
4. 无障碍设计的完备性

{{#if revisionReason}}
【重要】这是对上一次方案的修订反馈，请仔细阅读并根据反馈意见进行改进：
{{revisionReason}}

{{/if}}输出格式：
- layout: 空间布局的详细描述
- visitorRoute: 具体的参观路线说明
- zones: 功能区域划分（名称、面积、功能）
- accessibility: 无障碍设计说明`,
    humanTemplate: `请为以下展览{{#if revisionReason}}（根据反馈意见进行修订）{{/if}}生成空间布局方案：

场地信息：
- 面积：{{area}}平方米
- 层高：{{height}}米
- 布局：{{layout}}

展览概念：
- 核心概念：{{concept}}
- 叙事结构：{{narrative}}
- 重点展品：{{keyExhibits}}

{{#if revisionReason}}
【修订反馈】
{{revisionReason}}

请根据以上反馈意见，对空间布局进行针对性改进。
{{/if}}请生成符合展览主题的空间设计方案。`
  }
};
