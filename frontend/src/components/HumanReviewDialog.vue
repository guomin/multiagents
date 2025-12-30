<template>
  <el-dialog
    v-model="visible"
    title="👔 人工审核"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <!-- 质量评估结果 -->
    <div v-if="qualityEvaluation" class="quality-evaluation mb-6">
      <div class="evaluation-header mb-4">
        <h3 class="text-lg font-bold text-gray-800">质量评估结果</h3>
        <div class="overall-score">
          <div class="score-label">总体评分</div>
          <div class="score-value">
            {{ (qualityEvaluation.overallScore * 100).toFixed(1) }} 分
          </div>
          <el-progress
            :percentage="qualityEvaluation.overallScore * 100"
            :color="getScoreColor(qualityEvaluation.overallScore)"
            :stroke-width="20"
            :show-text="false"
          />
        </div>
      </div>

      <!-- 各维度分数 -->
      <div class="dimension-scores grid grid-cols-2 gap-3 mb-4">
        <div class="score-card">
          <div class="score-label">概念策划</div>
          <div class="score-bar">
            <div
              class="score-fill"
              :style="{ width: `${qualityEvaluation.conceptScore * 100}%` }"
            ></div>
          </div>
          <div class="score-value">{{ (qualityEvaluation.conceptScore * 100).toFixed(0) }}%</div>
        </div>

        <div class="score-card">
          <div class="score-label">空间设计</div>
          <div class="score-bar">
            <div
              class="score-fill"
              :style="{ width: `${qualityEvaluation.spatialScore * 100}%` }"
            ></div>
          </div>
          <div class="score-value">{{ (qualityEvaluation.spatialScore * 100).toFixed(0) }}%</div>
        </div>

        <div class="score-card">
          <div class="score-label">视觉设计</div>
          <div class="score-bar">
            <div
              class="score-fill"
              :style="{ width: `${qualityEvaluation.visualScore * 100}%` }"
            ></div>
          </div>
          <div class="score-value">{{ (qualityEvaluation.visualScore * 100).toFixed(0) }}%</div>
        </div>

        <div class="score-card">
          <div class="score-label">互动技术</div>
          <div class="score-bar">
            <div
              class="score-fill"
              :style="{ width: `${qualityEvaluation.interactiveScore * 100}%` }"
            ></div>
          </div>
          <div class="score-value">{{ (qualityEvaluation.interactiveScore * 100).toFixed(0) }}%</div>
        </div>

        <div class="score-card">
          <div class="score-label">预算合理性</div>
          <div class="score-bar">
            <div
              class="score-fill"
              :style="{ width: `${qualityEvaluation.budgetScore * 100}%` }"
            ></div>
          </div>
          <div class="score-value">{{ (qualityEvaluation.budgetScore * 100).toFixed(0) }}%</div>
        </div>
      </div>

      <!-- 系统反馈 -->
      <div class="feedback-section mb-4">
        <h4 class="font-semibold text-gray-700 mb-2">💬 系统反馈</h4>
        <div class="feedback-content p-3 rounded-lg bg-gray-50">
          {{ qualityEvaluation.feedback }}
        </div>
      </div>

      <!-- 建议修订目标 -->
      <div v-if="qualityEvaluation.revisionTarget !== 'none'" class="revision-target">
        <h4 class="font-semibold text-gray-700 mb-2">🎯 建议修订环节</h4>
        <el-tag :type="getTargetTagType(qualityEvaluation.revisionTarget)">
          {{ getTargetName(qualityEvaluation.revisionTarget) }}
        </el-tag>
      </div>

      <!-- 迭代信息 -->
      <div class="iteration-info text-sm text-gray-600 mt-4">
        当前第 {{ (iterationCount || 0) + 1 }} 次迭代 / 最多 {{ maxIterations || 3 }} 次
      </div>
    </div>

    <!-- 人工反馈输入 -->
    <div class="feedback-input mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        📝 您的反馈意见
      </label>
      <el-input
        v-model="userFeedback"
        type="textarea"
        :rows="3"
        placeholder="请输入您的修改建议或审批意见..."
        :maxlength="500"
        show-word-limit
      />
    </div>

    <!-- 决策按钮 -->
    <div class="decision-buttons">
      <el-button
        type="success"
        size="large"
        @click="submitDecision('approve')"
        :loading="submitting"
        :icon="Check"
      >
        ✅ 通过方案
      </el-button>

      <el-button
        type="warning"
        size="large"
        @click="submitDecision('revise')"
        :loading="submitting"
        :icon="Edit"
        :disabled="qualityEvaluation?.revisionTarget === 'none'"
      >
        🔧 要求修改
      </el-button>

      <el-button
        type="danger"
        size="large"
        @click="submitDecision('reject')"
        :loading="submitting"
        :icon="Close"
      >
        ❌ 拒绝方案
      </el-button>
    </div>

    <!-- 底部说明 -->
    <div class="footer-note mt-4 pt-4 border-t border-gray-200">
      <div class="text-sm text-gray-600 space-y-1">
        <p>💡 <strong>通过：</strong>认可当前方案，继续生成最终报告</p>
        <p>🔧 <strong>修改：</strong>要求返回对应环节优化（会根据您的反馈修改）</p>
        <p>❌ <strong>拒绝：</strong>方案不符合要求，终止流程</p>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Edit, Close } from '@element-plus/icons-vue'
import type { QualityEvaluation } from '@/types/exhibition'

interface Props {
  modelValue: boolean
  qualityEvaluation?: QualityEvaluation
  iterationCount?: number
  maxIterations?: number
  projectId?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'decision', decision: { type: string; feedback: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const userFeedback = ref('')
const submitting = ref(false)

const getScoreColor = (score: number) => {
  if (score >= 0.85) return '#67c23a'
  if (score >= 0.75) return '#409eff'
  if (score >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

const getTargetName = (target: string) => {
  const names: Record<string, string> = {
    curator: '策展人',
    spatial_designer: '空间设计师',
    visual_designer: '视觉设计师',
    interactive_tech: '互动技术工程师',
    budget_controller: '预算控制师'
  }
  return names[target] || target
}

const getTargetTagType = (target: string) => {
  const types: Record<string, any> = {
    curator: 'danger',
    spatial_designer: 'warning',
    visual_designer: 'info',
    interactive_tech: 'success',
    budget_controller: 'primary'
  }
  return types[target] || ''
}

const submitDecision = async (decision: string) => {
  if (decision === 'revise' && !userFeedback.value.trim()) {
    ElMessage.warning('请输入您的修改建议')
    return
  }

  if (decision === 'reject') {
    try {
      await ElMessageBox.confirm(
        '确认要拒绝此方案吗？流程将终止，所有进度将丢失。',
        '确认拒绝',
        {
          confirmButtonText: '确认拒绝',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }

  submitting.value = true

  try {
    emit('decision', {
      type: decision,
      feedback: userFeedback.value.trim()
    })

    ElMessage.success('决策已提交')
    visible.value = false
    userFeedback.value = ''
  } catch (error) {
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.quality-evaluation {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border-radius: 12px;
  padding: 20px;
}

.evaluation-header {
  text-align: center;
}

.overall-score {
  margin-top: 16px;
}

.score-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.score-value {
  font-size: 32px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 12px;
}

.dimension-scores {
  margin-bottom: 20px;
}

.score-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.score-card .score-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.score-card .score-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.score-card .score-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.5s ease;
}

.score-card .score-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  text-align: right;
}

.feedback-section h4 {
  color: #374151;
}

.feedback-content {
  color: #4b5563;
  line-height: 1.6;
}

.revision-target {
  margin-bottom: 16px;
}

.revision-target h4 {
  margin-bottom: 8px;
}

.decision-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.decision-buttons .el-button {
  flex: 1;
  height: 44px;
}

.footer-note {
  border-top: 1px solid #e5e7eb;
}
</style>
