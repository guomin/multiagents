<template>
  <div class="form-stepper">
    <div class="stepper-container">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="step-item"
        :class="{
          'active': step.id === currentStep,
          'completed': isStepCompleted(step.id),
          'pending': !isStepCompleted(step.id) && step.id !== currentStep
        }"
        @click="onStepClick(step.id, index)"
      >
        <!-- 步骤指示器 -->
        <div class="step-indicator">
          <div v-if="isStepCompleted(step.id)" class="step-icon completed">
            <ElIcon><Check /></ElIcon>
          </div>
          <div v-else-if="step.id === currentStep" class="step-icon active">
            <span class="step-number">{{ index + 1 }}</span>
          </div>
          <div v-else class="step-icon pending">
            <span class="step-number">{{ index + 1 }}</span>
          </div>

          <!-- 进度环（进行中的步骤） -->
          <svg v-if="step.id === currentStep" class="progress-ring" viewBox="0 0 36 36">
            <path
              class="progress-ring-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="progress-ring-circle"
              :stroke-dasharray="`${stepProgress}, 100`"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
        </div>

        <!-- 步骤信息 -->
        <div class="step-content">
          <h4 class="step-title">{{ step.title }}</h4>
          <p class="step-description">{{ step.description }}</p>
        </div>

        <!-- 连接线 -->
        <div v-if="index < steps.length - 1" class="step-connector" :class="{ completed: isStepCompleted(step.id) }"></div>
      </div>
    </div>

    <!-- 步骤进度条 -->
    <div class="progress-bar-container">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${overallProgress}%` }"
        ></div>
      </div>
      <span class="progress-text">{{ overallProgress }}% 完成</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '@element-plus/icons-vue'

interface Step {
  id: string
  title: string
  description: string
  completed?: boolean
}

interface Props {
  steps: Step[]
  currentStep: string
  stepProgress?: number
}

const props = withDefaults(defineProps<Props>(), {
  stepProgress: 0
})

const emit = defineEmits<{
  stepClick: [stepId: string, index: number]
}>()

const isStepCompleted = (stepId: string) => {
  const step = props.steps.find(s => s.id === stepId)
  return step?.completed || false
}

const overallProgress = computed(() => {
  const completedSteps = props.steps.filter(s => s.completed).length
  const currentIndex = props.steps.findIndex(s => s.id === props.currentStep)
  const progress = Math.round(((completedSteps + (currentIndex >= 0 ? 1 : 0)) / props.steps.length) * 100)
  return Math.min(progress, 100)
})

const onStepClick = (stepId: string, index: number) => {
  // 只允许点击已完成的步骤或下一步
  const step = props.steps[index]
  if (step.completed || index === props.steps.findIndex(s => s.id === props.currentStep) + 1) {
    emit('stepClick', stepId, index)
  }
}
</script>

<style scoped>
.form-stepper {
  width: 100%;
}

.stepper-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;
}

.step-item {
  flex: 1;
  display: flex;
  align-items: flex-start;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.step-item:not(:last-child) {
  padding-right: 20px;
}

.step-item:hover:not(.pending) {
  transform: translateY(-2px);
}

/* 步骤指示器 */
.step-indicator {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.step-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.step-icon.completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.step-icon.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.step-icon.pending {
  background: #f3f4f6;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
}

.step-number {
  font-size: 18px;
  font-weight: 600;
}

/* 进度环 */
.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  pointer-events: none;
}

.progress-ring-bg {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 2;
}

.progress-ring-circle {
  fill: none;
  stroke: #3b82f6;
  stroke-width: 2;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease;
}

/* 步骤内容 */
.step-content {
  flex: 1;
  margin-top: 4px;
  margin-left: 12px;
}

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
  transition: color 0.3s ease;
}

.step-item.active .step-title {
  color: #3b82f6;
}

.step-item.completed .step-title {
  color: #10b981;
}

.step-description {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

/* 连接线 */
.step-connector {
  position: absolute;
  top: 24px;
  left: 48px;
  right: -20px;
  height: 2px;
  background: #e5e7eb;
  z-index: 0;
}

.step-connector.completed {
  background: linear-gradient(90deg, #10b981 0%, #10b981 100%);
}

/* 进度条 */
.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
  min-width: 80px;
  text-align: right;
}

/* 响应式 */
@media (max-width: 768px) {
  .stepper-container {
    flex-direction: column;
    gap: 16px;
  }

  .step-item {
    flex-direction: row;
    align-items: center;
  }

  .step-item:not(:last-child) {
    padding-right: 0;
    padding-bottom: 16px;
  }

  .step-connector {
    display: none;
  }

  .step-content {
    margin-left: 12px;
    margin-top: 0;
  }
}
</style>
