import { ExhibitionState, QualityEvaluation } from "../types/exhibition";
import { createLogger } from "../utils/logger";

const logger = createLogger('REVISION-CONTROLLER');

/**
 * 检查预算是否超支
 */
export function checkBudgetOverrun(state: ExhibitionState): boolean {
  if (!state.budgetEstimate) return false;

  const totalBudget = state.requirements.budget.total;
  const estimatedCost = state.budgetEstimate.totalCost;

  // 如果估算成本超过总预算的 95%，视为预警
  const isOverBudget = estimatedCost > totalBudget * 0.95;

  if (isOverBudget) {
    logger.warn('⚠️  预算预警', {
      estimatedCost,
      totalBudget,
      overrunPercentage: ((estimatedCost - totalBudget) / totalBudget * 100).toFixed(2) + '%'
    });
  }

  return isOverBudget;
}

/**
 * 根据质量评估决定下一步
 */
export function determineNextStep(
  state: ExhibitionState
): {
  target: string;
  reason: string;
} {
  const evaluation = state.qualityEvaluation;
  const iterationCount = state.iterationCount;
  const maxIterations = state.maxIterations;

  if (!evaluation) {
    return { target: "finalize", reason: "无质量评估，直接完成" };
  }

  // 质量足够高
  if (evaluation.overallScore >= 0.85) {
    logger.info('✅ 质量优秀，直接完成', { score: evaluation.overallScore });
    return {
      target: "finalize",
      reason: `质量优秀(${evaluation.overallScore.toFixed(2)})，无需修订`
    };
  }

  // 达到最大迭代次数
  if (iterationCount >= maxIterations) {
    logger.info('🔄 达到最大迭代次数', { iterationCount, maxIterations });
    return {
      target: "finalize",
      reason: `已达到最大迭代次数(${maxIterations})，接受当前方案`
    };
  }

  // 需要修订
  if (evaluation.revisionTarget !== "none") {
    logger.info('🔧 需要修订', {
      revisionTarget: evaluation.revisionTarget,
      feedback: evaluation.feedback
    });
    return {
      target: evaluation.revisionTarget,
      reason: evaluation.feedback
    };
  }

  return { target: "finalize", reason: "完成流程" };
}

/**
 * 更新迭代状态
 */
export function updateIterationState(
  state: ExhibitionState,
  feedback: string
): Partial<ExhibitionState> {
  const newIterationCount = state.iterationCount + 1;

  logger.info('🔄 更新迭代状态', {
    previousIteration: state.iterationCount,
    newIteration: newIterationCount,
    maxIterations: state.maxIterations
  });

  return {
    iterationCount: newIterationCount,
    feedbackHistory: [...state.feedbackHistory, feedback],
    messages: [
      ...state.messages,
      `第 ${newIterationCount} 次迭代: ${feedback}`
    ]
  };
}

/**
 * 准备修订状态（清理下游数据）
 */
export function prepareRevisionState(
  state: ExhibitionState
): Partial<ExhibitionState> {
  const revisionTarget = state.qualityEvaluation?.revisionTarget || "curator";

  logger.info('🔧 准备修订状态', { revisionTarget });

  // 根据修订目标清除相应的数据
  const updates: Partial<ExhibitionState> = {
    lastRevisionStep: revisionTarget,
    needsRevision: true
  };

  // 如果是策展人修订，需要清除所有后续数据
  if (revisionTarget === "curator") {
    updates.conceptPlan = undefined;
    updates.spatialLayout = undefined;
    updates.visualDesign = undefined;
    updates.interactiveSolution = undefined;
    updates.budgetEstimate = undefined;
  }
  // 如果是空间设计修订，清除视觉设计及之后的数据
  else if (revisionTarget === "spatial_designer") {
    updates.spatialLayout = undefined;
    updates.visualDesign = undefined;
    updates.interactiveSolution = undefined;
    updates.budgetEstimate = undefined;
  }
  // 如果是视觉设计修订，清除互动技术及之后的数据
  else if (revisionTarget === "visual_designer") {
    updates.visualDesign = undefined;
    updates.interactiveSolution = undefined;
    updates.budgetEstimate = undefined;
  }
  // 如果是互动技术修订，只清除预算数据
  else if (revisionTarget === "interactive_tech") {
    updates.interactiveSolution = undefined;
    updates.budgetEstimate = undefined;
  }
  // 如果是预算修订，只清除预算数据
  else if (revisionTarget === "budget_controller") {
    updates.budgetEstimate = undefined;
  }

  return updates;
}
