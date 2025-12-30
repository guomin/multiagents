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
  spatialScore: number; // 空间设计分数
  visualScore: number; // 视觉设计分数
  interactiveScore: number; // 互动技术分数
  budgetScore: number; // 预算合理性分数
  feedback: string; // 反馈意见
  revisionTarget: 'none' | 'curator' | 'spatial_designer' | 'visual_designer' | 'interactive_tech' | 'budget_controller';
}

export interface AgentStatus {
  id: string;
  name: string;
  type: 'curator' | 'spatial' | 'visual' | 'interactive' | 'budget' | 'supervisor';
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

export interface ExhibitionState {
  requirements: ExhibitionRequirement;
  conceptPlan?: ConceptPlan;
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