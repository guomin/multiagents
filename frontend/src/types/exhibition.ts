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