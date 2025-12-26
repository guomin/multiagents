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

// 联合状态类型
export const ExhibitionStateSchema = z.object({
  requirements: ExhibitionRequirementSchema,
  conceptPlan: ConceptPlanSchema.optional(),
  spatialLayout: SpatialLayoutSchema.optional(),
  visualDesign: VisualDesignSchema.optional(),
  interactiveSolution: InteractiveSolutionSchema.optional(),
  budgetEstimate: BudgetEstimateSchema.optional(),
  currentStep: z.string().describe("当前步骤"),
  messages: z.array(z.string()).describe("处理消息")
});

export type ExhibitionState = z.infer<typeof ExhibitionStateSchema>;