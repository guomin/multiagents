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

// 展览大纲细化类型（新增）
export const ExhibitionOutlineSchema = z.object({
  // 引用策划方案
  conceptPlan: ConceptPlanSchema,

  // 展区划分（详细）
  zones: z.array(z.object({
    id: z.string().describe("展区ID（如zone-1, zone-2）"),
    name: z.string().describe("展区名称"),
    area: z.number().describe("展区面积（平方米）"),
    percentage: z.number().describe("占总面积百分比（0-100）"),
    function: z.string().describe("功能描述"),
    exhibitIds: z.array(z.string()).describe("包含的展品ID列表"),
    interactiveIds: z.array(z.string()).describe("包含的互动装置ID列表"),
    budgetAllocation: z.number().describe("预算分配（元）")
  })).describe("展区划分"),

  // 展品清单（详细）
  exhibits: z.array(z.object({
    id: z.string().describe("展品ID（如ex-1, ex-2）"),
    name: z.string().describe("展品名称"),
    zoneId: z.string().describe("所属展区ID"),
    type: z.string().describe("展品类型（文物/复制品/艺术品/模型等）"),
    protectionLevel: z.string().describe("保护等级（普通/二级/一级）"),
    showcaseRequirement: z.string().describe("展柜要求"),
    dimensions: z.object({
      length: z.number().describe("长度（米）"),
      width: z.number().describe("宽度（米）"),
      height: z.number().describe("高度（米）")
    }).optional().describe("展品尺寸"),
    insurance: z.number().describe("保险费用（元）"),
    transportCost: z.number().describe("运输费用（元）")
  })).describe("展品清单"),

  // 互动装置规划
  interactivePlan: z.array(z.object({
    id: z.string().describe("互动装置ID（如int-1, int-2）"),
    name: z.string().describe("装置名称"),
    zoneId: z.string().describe("放置展区ID"),
    type: z.string().describe("装置类型（AR/VR/触摸屏/投影/传感器等）"),
    estimatedCost: z.number().describe("预估成本（元）"),
    priority: z.enum(["high", "medium", "low"]).describe("优先级"),
    description: z.string().describe("功能描述")
  })).describe("互动装置规划"),

  // 预算框架
  budgetAllocation: z.object({
    total: z.number().describe("总预算"),
    breakdown: z.array(z.object({
      category: z.string().describe("类别（按展区或功能）"),
      amount: z.number().describe("金额"),
      subCategories: z.array(z.object({
        name: z.string().describe("子类别名称"),
        amount: z.number().describe("金额")
      })).optional().describe("子类别明细")
    })).describe("预算明细")
  }).describe("预算分配框架"),

  // 空间约束
  spaceConstraints: z.object({
    totalArea: z.number().describe("总面积"),
    minZoneCount: z.number().describe("最少展区数量"),
    maxZoneCount: z.number().describe("最多展区数量"),
    minAisleWidth: z.number().describe("最小通道宽度（米）"),
    mainZoneRatio: z.number().describe("主展区占比（0-1）")
  }).describe("空间设计约束")
});

export type ExhibitionOutline = z.infer<typeof ExhibitionOutlineSchema>;

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
    cost: z.union([z.number(), z.string()]).optional().transform(val => {
      // 已经是数字，直接返回
      if (typeof val === 'number' && !isNaN(val)) {
        return val;
      }

      // 字符串转换
      if (typeof val === 'string') {
        // 移除所有非数字字符（保留小数点和数字）
        let cleaned = val
          .replace(/[万元千万]/g, '') // 移除中文单位
          .replace(/[-~～至到]\s*/g, ' ') // 处理区间值
          .trim();

        // 如果包含区间，取中间值或平均值
        const parts = cleaned.split(/\s+/).filter(p => p);
        if (parts.length >= 2) {
          const nums = parts.map(p => parseFloat(p)).filter(n => !isNaN(n));
          if (nums.length >= 2) {
            return (nums[0] + nums[1]) / 2; // 取平均值
          }
        }

        // 提取第一个有效数字
        const match = cleaned.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          let num = parseFloat(match[1]);

          // 处理"万元"单位
          if (val.includes('万')) {
            num *= 10000;
          }

          return num;
        }

        return 0;
      }

      return 0;
    })
  })).describe("互动装置"),
  technicalRequirements: z.string().describe("技术要求")
});

export type InteractiveSolution = z.infer<typeof InteractiveSolutionSchema>;

export const BudgetEstimateSchema = z.object({
  breakdown: z.array(z.object({
    category: z.string(),
    amount: z.union([z.number(), z.string()]).transform(val => {
      // 已经是数字，直接返回
      if (typeof val === 'number' && !isNaN(val)) {
        return val;
      }

      // 字符串转换
      if (typeof val === 'string') {
        // 移除所有非数字字符（保留小数点和数字）
        let cleaned = val
          .replace(/[万元千万]/g, '') // 移除中文单位
          .replace(/[-~～至到]\s*/g, ' ') // 处理区间值
          .trim();

        // 如果包含区间，取中间值或平均值
        const parts = cleaned.split(/\s+/).filter(p => p);
        if (parts.length >= 2) {
          const nums = parts.map(p => parseFloat(p)).filter(n => !isNaN(n));
          if (nums.length >= 2) {
            return (nums[0] + nums[1]) / 2; // 取平均值
          }
        }

        // 提取第一个有效数字
        const match = cleaned.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          let num = parseFloat(match[1]);

          // 处理"万元"单位
          if (val.includes('万')) {
            num *= 10000;
          }

          return num;
        }

        return 0;
      }

      return 0;
    }),
    description: z.string()
  })).describe("预算明细"),
  totalCost: z.union([z.number(), z.string()]).transform(val => {
    // 已经是数字，直接返回
    if (typeof val === 'number' && !isNaN(val)) {
      return val;
    }

    // 字符串转换
    if (typeof val === 'string') {
      // 移除所有非数字字符（保留小数点和数字）
      let cleaned = val
        .replace(/[万元千万]/g, '') // 移除中文单位
        .replace(/[-~～至到]\s*/g, ' ') // 处理区间值
        .trim();

      // 如果包含区间，取中间值或平均值
      const parts = cleaned.split(/\s+/).filter(p => p);
      if (parts.length >= 2) {
        const nums = parts.map(p => parseFloat(p)).filter(n => !isNaN(n));
        if (nums.length >= 2) {
          return (nums[0] + nums[1]) / 2; // 取平均值
        }
      }

      // 提取第一个有效数字
      const match = cleaned.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        let num = parseFloat(match[1]);

        // 处理"万元"单位
        if (val.includes('万')) {
          num *= 10000;
        }

        return num;
      }

      return 0;
    }

    return 0;
  }).describe("总成本"),
  recommendations: z.array(z.string()).describe("优化建议")
});

export type BudgetEstimate = z.infer<typeof BudgetEstimateSchema>;

// 质量评估结果类型
export const QualityEvaluationSchema = z.object({
  overallScore: z.number().describe("总体质量分数(0-1)"),
  conceptScore: z.number().describe("概念策划分数(0-1)"),
  outlineScore: z.number().describe("大纲细化分数(0-1)"),
  spatialScore: z.number().describe("空间设计分数(0-1)"),
  visualScore: z.number().describe("视觉设计分数(0-1)"),
  interactiveScore: z.number().describe("互动技术分数(0-1)"),
  budgetScore: z.number().describe("预算合理性分数(0-1)"),
  feedback: z.string().describe("反馈意见"),
  revisionTarget: z.enum([
    'none',
    'curator',
    'outline',
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
  exhibitionOutline: ExhibitionOutlineSchema.optional(), // 新增：展览大纲
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
  waitingForHuman: z.boolean().default(false).describe("是否等待人工审核"),
  autoApprove: z.boolean().default(true).describe("是否自动批准（无需人工审核）"),
  finalReport: z.string().optional().describe("最终报告内容")
});

export type ExhibitionState = z.infer<typeof ExhibitionStateSchema>;