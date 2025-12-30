import { z } from "zod";

// 展览需求基础类型
export const ExhibitionRequirementSchema = z.object({
  title: z.string().describe("展览标题"),
  theme: z.string().describe("展览主题"),
  targetAudience: z.string().describe("目标受众"),
  venueSpace: z.object({
    area: z.number().describe("场地面积(平方米)"),
    height: z.number().describe("场地高度(米)"),
    layout: z.string().describe("场地布局描述")
  }),
  budget: z.object({
    total: z.number().describe("总预算"),
    currency: z.string().default("CNY")
  }),
  duration: z.object({
    startDate: z.string().describe("开始日期"),
    endDate: z.string().describe("结束日期")
  }),
  specialRequirements: z.array(z.string()).optional().describe("特殊要求")
});

export type ExhibitionRequirement = z.infer<typeof ExhibitionRequirementSchema>;

// 智能体输出结果类型
export const ConceptPlanSchema = z.object({
  concept: z.string().describe("核心概念"),
  narrative: z.string().describe("叙事结构"),
  keyExhibits: z.array(z.string()).describe("重点展品"),
  visitorFlow: z.string().describe("观众动线设计")
});

export type ConceptPlan = z.infer<typeof ConceptPlanSchema>;

export const SpatialLayoutSchema = z.object({
  layout: z.string().describe("空间布局描述"),
  visitorRoute: z.array(z.string()).describe("参观路线"),
  zones: z.array(z.object({
    name: z.string(),
    area: z.number(),
    function: z.string()
  })).describe("功能区域"),
  accessibility: z.string().describe("无障碍设计")
});

export type SpatialLayout = z.infer<typeof SpatialLayoutSchema>;

export const VisualDesignSchema = z.object({
  colorScheme: z.array(z.string()).describe("色彩方案"),
  typography: z.string().describe("字体设计"),
  brandElements: z.array(z.string()).describe("品牌元素"),
  visualStyle: z.string().describe("视觉风格")
});

export type VisualDesign = z.infer<typeof VisualDesignSchema>;

export const InteractiveSolutionSchema = z.object({
  technologies: z.array(z.string()).describe("使用的技术"),
  interactives: z.array(z.object({
    name: z.string(),
    description: z.string(),
    type: z.string(),
    cost: z.number().optional()
  })).describe("互动装置"),
  technicalRequirements: z.string().describe("技术要求")
});

export type InteractiveSolution = z.infer<typeof InteractiveSolutionSchema>;

export const BudgetEstimateSchema = z.object({
  breakdown: z.array(z.object({
    category: z.string(),
    amount: z.number(),
    description: z.string()
  })).describe("预算明细"),
  totalCost: z.number().describe("总成本"),
  recommendations: z.array(z.string()).describe("优化建议")
});

export type BudgetEstimate = z.infer<typeof BudgetEstimateSchema>;

// 质量评估结果类型
export const QualityEvaluationSchema = z.object({
  overallScore: z.number().describe("总体质量分数(0-1)"),
  conceptScore: z.number().describe("概念策划分数(0-1)"),
  spatialScore: z.number().describe("空间设计分数(0-1)"),
  visualScore: z.number().describe("视觉设计分数(0-1)"),
  interactiveScore: z.number().describe("互动技术分数(0-1)"),
  budgetScore: z.number().describe("预算合理性分数(0-1)"),
  feedback: z.string().describe("反馈意见"),
  revisionTarget: z.enum([
    'none',
    'curator',
    'spatial_designer',
    'parallel_designs',
    'visual_designer',
    'interactive_tech',
    'budget_controller'
  ]).describe("需要修订的节点")
});

export type QualityEvaluation = z.infer<typeof QualityEvaluationSchema>;

// 联合状态类型
export const ExhibitionStateSchema = z.object({
  requirements: ExhibitionRequirementSchema,
  conceptPlan: ConceptPlanSchema.optional(),
  spatialLayout: SpatialLayoutSchema.optional(),
  visualDesign: VisualDesignSchema.optional(),
  interactiveSolution: InteractiveSolutionSchema.optional(),
  budgetEstimate: BudgetEstimateSchema.optional(),
  currentStep: z.string().describe("当前步骤"),
  messages: z.array(z.string()).describe("处理消息"),

  // 迭代控制相关字段
  iterationCount: z.number().default(0).describe("当前迭代次数"),
  maxIterations: z.number().default(3).describe("最大迭代次数"),
  qualityEvaluation: QualityEvaluationSchema.optional().describe("质量评估结果"),
  feedbackHistory: z.array(z.string()).default([]).describe("历史反馈记录"),
  needsRevision: z.boolean().default(false).describe("是否需要修订"),
  revisionReason: z.string().optional().describe("修订原因"),
  lastRevisionStep: z.string().optional().describe("上次修订的步骤"),

  // 人在回路相关字段
  humanDecision: z.enum(["approve", "revise", "reject"]).optional().describe("人工决策: approve=通过, revise=修订, reject=拒绝"),
  humanFeedback: z.string().optional().describe("人工反馈意见"),
  waitingForHuman: z.boolean().default(false).describe("是否等待人工审核")
});

export type ExhibitionState = z.infer<typeof ExhibitionStateSchema>;