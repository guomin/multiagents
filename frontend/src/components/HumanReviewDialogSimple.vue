<template>
  <!-- 人工审核对话框 -->
  <ElDialog
    v-model="visible"
    title="⏸️ 等待人工审核"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
  >
    <!-- 迭代信息 -->
    <div v-if="iterationCount > 0" class="iteration-info">
      <span class="iteration-badge">🔄 迭代 #{{ iterationCount }}</span>
      <span class="iteration-progress">{{ iterationCount }} / {{ maxIterations }}</span>
    </div>

    <!-- 质量评估 -->
    <div class="quality-section">
      <h3>📊 质量评估</h3>
      <div class="overall-score">
        <span class="score-label">总体评分：</span>
        <span class="score-value">{{ (qualityEvaluation.overallScore * 100).toFixed(0) }}分</span>
        <ElProgress
          :percentage="qualityEvaluation.overallScore * 100"
          :color="getScoreColor(qualityEvaluation.overallScore)"
          :stroke-width="12"
        />
      </div>

      <!-- 分项评分 -->
      <div class="score-breakdown">
        <div class="score-item">
          <span>策划概念</span>
          <span>{{ (qualityEvaluation.conceptScore * 100).toFixed(0) }}分</span>
        </div>
        <ElProgress
          :percentage="qualityEvaluation.conceptScore * 100"
          :show-text="false"
          :stroke-width="6"
        />
        <div class="score-item">
          <span>空间设计</span>
          <span>{{ (qualityEvaluation.spatialScore * 100).toFixed(0) }}分</span>
        </div>
        <ElProgress
          :percentage="qualityEvaluation.spatialScore * 100"
          :show-text="false"
          :stroke-width="6"
        />
        <div class="score-item">
          <span>视觉设计</span>
          <span>{{ (qualityEvaluation.visualScore * 100).toFixed(0) }}分</span>
        </div>
        <ElProgress
          :percentage="qualityEvaluation.visualScore * 100"
          :show-text="false"
          :stroke-width="6"
        />
        <div class="score-item">
          <span>互动技术</span>
          <span>{{ (qualityEvaluation.interactiveScore * 100).toFixed(0) }}分</span>
        </div>
        <ElProgress
          :percentage="qualityEvaluation.interactiveScore * 100"
          :show-text="false"
          :stroke-width="6"
        />
        <div class="score-item">
          <span>预算控制</span>
          <span>{{ (qualityEvaluation.budgetScore * 100).toFixed(0) }}分</span>
        </div>
        <ElProgress
          :percentage="qualityEvaluation.budgetScore * 100"
          :show-text="false"
          :stroke-width="6"
        />
      </div>
    </div>

    <!-- 主管建议 -->
    <div class="feedback-section">
      <h4>💬 主管建议</h4>
      <p>{{ qualityEvaluation.feedback }}</p>
    </div>

    <!-- 决策按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleReject" type="danger" size="large">
          ❌ 拒绝
        </ElButton>
        <ElButton @click="showRevisionSelector = true" type="warning" size="large">
          ✏️ 修订
        </ElButton>
        <ElButton @click="handleApprove" type="primary" size="large">
          ✅ 通过
        </ElButton>
      </div>
    </template>
  </ElDialog>

  <!-- 修订目标选择对话框 -->
  <ElDialog
    v-model="showRevisionSelector"
    title="选择修订目标"
    width="500px"
  >
    <div class="revision-targets">
      <p class="tip">💡 可同时选择多个环节进行并行修订</p>

      <ElCheckboxGroup v-model="selectedTargets">
        <ElCheckbox
          v-for="target in revisionTargetOptions"
          :key="target.id"
          :label="target.id"
          class="target-checkbox"
        >
          <div class="target-content">
            <div>
              <strong>{{ target.name }}</strong>
              <span class="score">{{ target.score }}分</span>
            </div>
            <p v-if="target.recommended" class="recommendation">
              ⭐ 推荐：{{ target.reason }}
            </p>
          </div>
        </ElCheckbox>
      </ElCheckboxGroup>
    </div>

    <!-- 反馈输入 -->
    <div class="feedback-input">
      <label>📝 修订意见（可选）</label>
      <ElInput
        v-model="feedback"
        type="textarea"
        placeholder="请输入您对方案的修改建议..."
        :rows="3"
      />
    </div>

    <template #footer>
      <ElButton @click="showRevisionSelector = false">取消</ElButton>
      <ElButton
        type="primary"
        @click="submitRevision"
        :disabled="selectedTargets.length === 0"
      >
        确认修订 ({{ selectedTargets.length }})
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  qualityEvaluation: any
  iterationCount: number
  maxIterations: number
  projectId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'decision', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const showRevisionSelector = ref(false)
const selectedTargets = ref<string[]>([])
const feedback = ref('')

// 修订目标选项
const revisionTargetOptions = computed(() => {
  const evalData = props.qualityEvaluation
  return [
    {
      id: 'curator',
      name: '策划概念',
      score: (evalData.conceptScore * 100).toFixed(0),
      recommended: evalData.revisionTarget === 'curator',
      reason: '概念策划需要优化'
    },
    {
      id: 'spatial_designer',
      name: '空间设计',
      score: (evalData.spatialScore * 100).toFixed(0),
      recommended: evalData.revisionTarget === 'spatial_designer',
      reason: '空间布局需要改进'
    },
    {
      id: 'parallel_designs',
      name: '视觉 + 互动（并行）',
      score: ((evalData.visualScore + evalData.interactiveScore) / 2 * 100).toFixed(0),
      recommended: evalData.revisionTarget === 'parallel_designs' ||
                      evalData.revisionTarget === 'visual_designer' ||
                      evalData.revisionTarget === 'interactive_tech',
      reason: '视觉设计和互动技术需要同时优化'
    },
    {
      id: 'budget_controller',
      name: '预算控制',
      score: (evalData.budgetScore * 100).toFixed(0),
      recommended: evalData.revisionTarget === 'budget_controller',
      reason: '预算方案需要调整'
    }
  ]
})

// 根据推荐自动选择
watch(() => props.qualityEvaluation, (newVal) => {
  if (newVal?.revisionTarget && newVal.revisionTarget !== 'none') {
    selectedTargets.value = [newVal.revisionTarget]
  }
}, { immediate: true })

const getScoreColor = (score: number) => {
  if (score >= 0.9) return '#67c23a'
  if (score >= 0.75) return '#e6a23c'
  return '#f56c6c'
}

const handleApprove = () => {
  emit('decision', {
    decision: 'approve',
    projectId: props.projectId
  })
  visible.value = false
}

const handleReject = () => {
  emit('decision', {
    decision: 'reject',
    projectId: props.projectId,
    feedback: feedback.value
  })
  visible.value = false
}

const submitRevision = () => {
  emit('decision', {
    decision: 'revise',
    projectId: props.projectId,
    targets: selectedTargets.value,
    feedback: feedback.value
  })
  showRevisionSelector.value = false
  visible.value = false
  ElMessage.success('已提交修订，工作流将继续执行...')
}
</script>

<style scoped>
.iteration-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 20px;
  color: white;
}

.iteration-badge {
  font-weight: bold;
  font-size: 16px;
}

.iteration-progress {
  opacity: 0.9;
}

.quality-section {
  margin-bottom: 24px;
}

.quality-section h3 {
  margin-bottom: 16px;
  font-size: 18px;
  color: #333;
}

.overall-score {
  margin-bottom: 20px;
}

.score-label {
  font-weight: 500;
  margin-right: 8px;
}

.score-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.score-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.feedback-section {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.feedback-section h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.feedback-section p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.revision-targets {
  margin-bottom: 20px;
}

.tip {
  color: #909399;
  font-size: 14px;
  margin-bottom: 16px;
}

.target-checkbox {
  display: flex;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s;
}

.target-checkbox:hover {
  border-color: #409eff;
  background: #f5f7fa;
}

.target-content {
  margin-left: 8px;
  flex: 1;
}

.target-content > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.target-content .score {
  color: #409eff;
  font-weight: 500;
}

.target-content .recommendation {
  margin: 4px 0 0 0;
  color: #e6a23c;
  font-size: 13px;
}

.feedback-input {
  margin-top: 20px;
}

.feedback-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}
</style>
