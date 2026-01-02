<template>
  <div class="workflow-steps">
    <div class="steps-container">
      <div
        v-for="(step, index) in steps"
        :key="step.id"
        class="step-item"
        :class="{
          'active': step.id === currentStep,
          'completed': isStepCompleted(step.id),
          'pending': !isStepCompleted(step.id) && step.id !== currentStep
        }"
      >
        <!-- 步骤图标和标题 -->
        <div class="step-header" @click="onStepClick(step.id)">
          <div class="step-icon">
            <ElIcon v-if="isStepCompleted(step.id)" class="completed-icon">
              <Check />
            </ElIcon>
            <ElIcon v-else-if="step.id === currentStep" class="active-icon">
              <component :is="step.icon || Loading" />
            </ElIcon>
            <span v-else class="pending-number">{{ index + 1 }}</span>
          </div>
          <div class="step-info">
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-status">{{ getStepStatusText(step) }}</p>
          </div>
        </div>

        <!-- 步骤详情（展开） -->
        <div v-if="step.id === currentStep" class="step-details">
          <slot :name="step.id" :step="step">
            <div class="default-details">
              <p>{{ step.description }}</p>
              <div v-if="step.progress !== undefined" class="progress-bar">
                <ElProgress
                  :percentage="step.progress"
                  :status="getProgressStatus(step.progress)"
                  :stroke-width="8"
                />
              </div>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, Loading, Document, Cpu, Connection, CircleCheckFilled, Star } from '@element-plus/icons-vue'

interface Step {
  id: string
  title: string
  description?: string
  icon?: any
  progress?: number
  completed?: boolean
}

interface Props {
  steps: Step[]
  currentStep: string
  completedSteps?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  completedSteps: () => []
})

const emit = defineEmits<{
  (e: 'stepClick', stepId: string): void
}>()

const isStepCompleted = (stepId: string) => {
  return props.completedSteps.includes(stepId) || props.steps.find(s => s.id === stepId)?.completed
}

const getStepStatusText = (step: Step) => {
  if (isStepCompleted(step.id)) return '已完成'
  if (step.id === props.currentStep) {
    if (step.progress !== undefined) return `${step.progress}%`
    return '进行中'
  }
  return '等待中'
}

const getProgressStatus = (progress: number) => {
  if (progress >= 100) return 'success'
  if (progress > 0) return undefined
  return 'exception'
}

const onStepClick = (stepId: string) => {
  emit('stepClick', stepId)
}
</script>

<style scoped>
.workflow-steps {
  width: 100%;
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-item {
  position: relative;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  animation: slideInUp 0.4s ease-out;
}

.step-item.active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.step-item.completed {
  border-color: #10b981;
  background: #f0fdf4;
}

.step-item.pending {
  opacity: 0.7;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.step-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #f3f4f6;
  color: #9ca3af;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.step-item.active .step-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.step-item.completed .step-icon {
  background: #10b981;
  color: white;
}

.completed-icon {
  animation: checkmark 0.3s ease-in-out;
}

.step-info {
  flex: 1;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.step-status {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.step-item.active .step-status {
  color: #3b82f6;
  font-weight: 500;
}

.step-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  animation: expand 0.3s ease-out;
}

.default-details {
  color: #4b5563;
  font-size: 14px;
}

.progress-bar {
  margin-top: 12px;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes expand {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 300px;
  }
}

@keyframes checkmark {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
