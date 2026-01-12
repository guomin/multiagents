export interface ExhibitionRequirement {
  title: string;
  theme: string;
  targetAudience: string;
  venueSpace: {
    area: number;
    height: number;
    layout: string;
  };
  budget: {
    total: number;
    currency: string;
  };
  duration: {
    startDate: string;
    endDate: string;
  };
  specialRequirements: string[];
  maxIterations?: number; // 新增：最大迭代次数
}

export interface QualityEvaluation {
  overallScore: number; // 总体质量分数 (0-1)
  conceptScore: number; // 概念策划分数
  outlineScore: number; // 大纲细化分数
  spatialScore: number; // 空间设计分数
  visualScore: number; // 视觉设计分数
  interactiveScore: number; // 互动技术分数
  budgetScore: number; // 预算合理性分数
  feedback: string; // 反馈意见
  revisionTarget: 'none' | 'curator' | 'outline' | 'spatial_designer' | 'parallel_designs' | 'visual_designer' | 'interactive_tech' | 'budget_controller';
}

export interface AgentStatus {
  id: string;
  name: string;
  type: 'curator' | 'outline' | 'spatial' | 'visual' | 'interactive' | 'budget' | 'supervisor';
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

// 并行组类型
export interface AgentGroup {
  id: string;
  name: string;
  type: 'single' | 'parallel'; // 单独执行 或 并行执行
  status: 'pending' | 'running' | 'completed' | 'error';
  members?: AgentGroup[]; // 并行组的成员
  isReviewPoint?: boolean; // 是否为审核点
}

export interface ExhibitionState {
  requirements: ExhibitionRequirement;
  conceptPlan?: ConceptPlan;
  detailedOutline?: ExhibitionOutline; // 详细大纲（outline 智能体生成，使用 ExhibitionOutline 类型）
  exhibitionOutline?: ExhibitionOutline; // 展览大纲（旧字段，保留兼容性）
  spatialLayout?: SpatialLayout;
  visualDesign?: VisualDesign;
  interactiveSolution?: InteractiveSolution;
  budgetEstimate?: BudgetEstimate;
  currentStep: string;
  messages: string[];
  agents: AgentStatus[];

  // 新增：迭代控制相关字段
  iterationCount?: number; // 当前迭代次数
  maxIterations?: number; // 最大迭代次数
  qualityEvaluation?: QualityEvaluation; // 质量评估结果
  feedbackHistory?: string[]; // 历史反馈记录
  needsRevision?: boolean; // 是否需要修订
  revisionReason?: string; // 修订原因
  lastRevisionStep?: string; // 上次修订的步骤

  // 人在回路相关字段
  humanDecision?: 'approve' | 'revise' | 'reject'; // 人工决策
  humanFeedback?: string; // 人工反馈意见
  waitingForHuman?: boolean; // 是否等待人工审核
}

export interface ConceptPlan {
  concept: string;
  narrative: string;
  keyExhibits: string[];
  visitorFlow: string;
}

// 展览大纲类型（新增）
export interface ExhibitionOutline {
  conceptPlan: ConceptPlan; // 引用策划方案

  zones: Array<{
    id: string;
    name: string;
    area: number;
    percentage: number;
    function: string;
    exhibitIds: string[];
    interactiveIds: string[];
    budgetAllocation: number;
  }>;

  exhibits: Array<{
    id: string;
    name: string;
    zoneId: string;
    type: string;
    protectionLevel: string;
    showcaseRequirement: string;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    insurance: number;
    transportCost: number;
  }>;

  interactivePlan: Array<{
    id: string;
    name: string;
    zoneId: string;
    type: string;
    estimatedCost: number;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }>;

  budgetAllocation: {
    total: number;
    breakdown: Array<{
      category: string;
      amount: number;
      subCategories?: Array<{
        name: string;
        amount: number;
      }>;
    }>;
  };

  spaceConstraints: {
    totalArea: number;
    minZoneCount: number;
    maxZoneCount: number;
    minAisleWidth: number;
    mainZoneRatio: number;
  };
}

export interface SpatialLayout {
  layout: string;
  visitorRoute: string[];
  zones: Array<{
    name: string;
    area: number;
    function: string;
  }>;
  accessibility: string;
}

export interface VisualDesign {
  colorScheme: string[];
  typography: string;
  brandElements: string[];
  visualStyle: string;
}

export interface InteractiveSolution {
  technologies: string[];
  interactives: Array<{
    name: string;
    description: string;
    type: string;
    cost?: number;
  }>;
  technicalRequirements: string;
}

export interface BudgetEstimate {
  breakdown: Array<{
    category: string;
    amount: number;
    description: string;
  }>;
  totalCost: number;
  recommendations: string[];
}

export interface ExecutionLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface ModelConfig {
  provider: 'openai' | 'deepseek';
  modelName: string;
  temperature: number;
  baseURL?: string;
}