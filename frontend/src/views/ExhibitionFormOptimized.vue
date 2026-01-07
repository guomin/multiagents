<template>
  <div class="exhibition-form-optimized">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-left">
        <ElButton circle @click="goBack">
          <ElIcon><ArrowLeft /></ElIcon>
        </ElButton>
        <div class="header-info">
          <h1 class="page-title">创建展览项目</h1>
          <p class="page-subtitle">配置展览需求，启动多智能体设计系统</p>
        </div>
      </div>
      <div class="header-right">
        <ElButton v-if="hasDraft" @click="loadDraft">
          <ElIcon style="margin-right: 4px"><FolderOpened /></ElIcon>
          加载草稿
        </ElButton>
        <ElButton @click="saveDraft" :disabled="!hasChanges">
          <ElIcon style="margin-right: 4px"><DocumentCopy /></ElIcon>
          保存草稿
        </ElButton>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="page-content">
      <!-- 左侧：表单 -->
      <div class="form-panel">
        <!-- 步骤导航 -->
        <FormStepper
          :steps="formSteps"
          :current-step="currentStep"
          :step-progress="stepProgress"
          @step-click="handleStepClick"
        />

        <!-- 步骤内容 -->
        <div class="steps-content">
          <!-- 步骤1: 模板选择 -->
          <div v-show="currentStep === 'template'" class="step-content">
            <TemplateSelector ref="templateSelectorRef" @select="handleTemplateSelect" />

            <!-- 快速开始提示 -->
            <div class="quick-start-card">
              <div class="quick-start-content">
                <div class="quick-start-icon">
                  <ElIcon><MagicStick /></ElIcon>
                </div>
                <div class="quick-start-text">
                  <h3>已为您预设默认值</h3>
                  <p>所有必填项已填写完整，您可以直接点击"下一步"快速创建，或自定义修改后提交</p>
                </div>
                <ElButton type="primary" size="large" @click="jumpToLastStep">
                  <ElIcon style="margin-right: 4px"><VideoPlay /></ElIcon>
                  快速开始
                </ElButton>
              </div>
            </div>
          </div>

          <!-- 步骤2: 基本信息 -->
          <div v-show="currentStep === 'basic'" class="step-content">
            <div class="form-section">
              <div class="section-header">
                <div class="section-icon">
                  <ElIcon><Document /></ElIcon>
                </div>
                <div>
                  <h3>基本信息</h3>
                  <p>描述展览的基本信息和核心理念</p>
                </div>
              </div>

              <ElForm
                ref="basicFormRef"
                :model="formData"
                :rules="basicRules"
                label-width="100px"
                class="form-content"
              >
                <ElFormItem label="展览名称" prop="title">
                  <ElInput
                    v-model="formData.title"
                    placeholder="请输入展览名称"
                    :maxlength="50"
                    show-word-limit
                    size="large"
                  >
                    <template #prefix>
                      <ElIcon><EditPen /></ElIcon>
                    </template>
                  </ElInput>
                </ElFormItem>

                <ElFormItem label="展览主题" prop="theme">
                  <ElInput
                    v-model="formData.theme"
                    type="textarea"
                    :rows="4"
                    placeholder="请详细描述展览主题和核心理念"
                    :maxlength="500"
                    show-word-limit
                  />
                </ElFormItem>

                <ElFormItem label="目标受众" prop="targetAudience">
                  <ElSelect
                    v-model="formData.targetAudience"
                    placeholder="请选择目标受众"
                    size="large"
                    class="w-full"
                  >
                    <ElOption label="儿童及家庭" value="children_family">
                      <div class="option-content">
                        <ElIcon><User /></ElIcon>
                        <span>儿童及家庭</span>
                      </div>
                    </ElOption>
                    <ElOption label="青少年" value="teenagers">
                      <div class="option-content">
                        <ElIcon><Star /></ElIcon>
                        <span>青少年</span>
                      </div>
                    </ElOption>
                    <ElOption label="大学生" value="students">
                      <div class="option-content">
                        <ElIcon><Reading /></ElIcon>
                        <span>大学生</span>
                      </div>
                    </ElOption>
                    <ElOption label="专业人士" value="professionals">
                      <div class="option-content">
                        <ElIcon><Briefcase /></ElIcon>
                        <span>专业人士</span>
                      </div>
                    </ElOption>
                    <ElOption label="普通大众" value="general_public">
                      <div class="option-content">
                        <ElIcon><UserFilled /></ElIcon>
                        <span>普通大众</span>
                      </div>
                    </ElOption>
                  </ElSelect>
                </ElFormItem>
              </ElForm>
            </div>
          </div>

          <!-- 步骤3: 场地信息 -->
          <div v-show="currentStep === 'venue'" class="step-content">
            <div class="form-section">
              <div class="section-header">
                <div class="section-icon">
                  <ElIcon><Location /></ElIcon>
                </div>
                <div>
                  <h3>场地信息</h3>
                  <p>描述展览场地的空间特征和限制条件</p>
                </div>
              </div>

              <ElForm
                ref="venueFormRef"
                :model="formData"
                :rules="venueRules"
                label-width="100px"
                class="form-content"
              >
                <div class="form-row">
                  <ElFormItem label="场地面积" prop="venueSpace.area">
                    <ElInputNumber
                      v-model="formData.venueSpace.area"
                      :min="50"
                      :max="5000"
                      :step="10"
                      class="w-full"
                      size="large"
                    />
                    <span class="unit-label">平方米</span>
                  </ElFormItem>

                  <ElFormItem label="场地高度" prop="venueSpace.height">
                    <ElInputNumber
                      v-model="formData.venueSpace.height"
                      :min="2"
                      :max="10"
                      :precision="1"
                      :step="0.1"
                      class="w-full"
                      size="large"
                    />
                    <span class="unit-label">米</span>
                  </ElFormItem>
                </div>

                <ElFormItem label="场地布局" prop="venueSpace.layout">
                  <ElInput
                    v-model="formData.venueSpace.layout"
                    type="textarea"
                    :rows="3"
                    placeholder="请描述场地的基本布局特点，如是否有柱子、天井等特殊结构"
                  />
                </ElFormItem>

                <!-- 场地类型选择 -->
                <ElFormItem label="场地类型">
                  <div class="venue-types">
                    <div
                      v-for="type in venueTypes"
                      :key="type.id"
                      class="venue-type-card"
                      :class="{ selected: selectedVenueType === type.id }"
                      @click="selectedVenueType = type.id"
                    >
                      <span class="type-icon">{{ type.icon }}</span>
                      <span class="type-name">{{ type.name }}</span>
                    </div>
                  </div>
                </ElFormItem>
              </ElForm>
            </div>
          </div>

          <!-- 步骤4: 预算配置 -->
          <div v-show="currentStep === 'budget'" class="step-content">
            <div class="form-section">
              <div class="section-header">
                <div class="section-icon">
                  <ElIcon><Coin /></ElIcon>
                </div>
                <div>
                  <h3>预算配置</h3>
                  <p>设置展览预算和货币单位</p>
                </div>
              </div>

              <ElForm
                ref="budgetFormRef"
                :model="formData"
                :rules="budgetRules"
                label-width="100px"
                class="form-content"
              >
                <div class="form-row">
                  <ElFormItem label="总预算" prop="budget.total">
                    <ElInputNumber
                      v-model="formData.budget.total"
                      :min="10000"
                      :max="10000000"
                      :step="10000"
                      :precision="0"
                      class="w-full"
                      size="large"
                      controls-position="right"
                    />
                  </ElFormItem>

                  <ElFormItem label="货币单位" prop="budget.currency">
                    <ElSelect v-model="formData.budget.currency" size="large" class="w-full">
                      <ElOption label="人民币 (CNY)" value="CNY">
                        <span class="currency-option">🇨🇳 CNY - 人民币</span>
                      </ElOption>
                      <ElOption label="美元 (USD)" value="USD">
                        <span class="currency-option">🇺🇸 USD - 美元</span>
                      </ElOption>
                      <ElOption label="欧元 (EUR)" value="EUR">
                        <span class="currency-option">🇪🇺 EUR - 欧元</span>
                      </ElOption>
                    </ElSelect>
                  </ElFormItem>
                </div>

                <!-- 预算预览 -->
                <div class="budget-preview">
                  <div class="preview-header">
                    <ElIcon><TrendCharts /></ElIcon>
                    <span>预算估算</span>
                  </div>
                  <div class="budget-breakdown">
                    <div class="budget-item">
                      <span class="item-label">策划设计</span>
                      <span class="item-value">{{ formatCurrency(formData.budget.total * 0.25) }}</span>
                    </div>
                    <div class="budget-item">
                      <span class="item-label">空间搭建</span>
                      <span class="item-value">{{ formatCurrency(formData.budget.total * 0.35) }}</span>
                    </div>
                    <div class="budget-item">
                      <span class="item-label">技术设备</span>
                      <span class="item-value">{{ formatCurrency(formData.budget.total * 0.25) }}</span>
                    </div>
                    <div class="budget-item">
                      <span class="item-label">运营推广</span>
                      <span class="item-value">{{ formatCurrency(formData.budget.total * 0.15) }}</span>
                    </div>
                    <ElDivider class="my-3" />
                    <div class="budget-item total">
                      <span class="item-label">总计</span>
                      <span class="item-value">{{ formatCurrency(formData.budget.total) }}</span>
                    </div>
                  </div>
                </div>
              </ElForm>
            </div>
          </div>

          <!-- 步骤5: 高级配置 -->
          <div v-show="currentStep === 'advanced'" class="step-content">
            <div class="form-section">
              <div class="section-header">
                <div class="section-icon">
                  <ElIcon><Setting /></ElIcon>
                </div>
                <div>
                  <h3>高级配置</h3>
                  <p>配置迭代优化和特殊要求</p>
                </div>
              </div>

              <ElForm
                ref="advancedFormRef"
                :model="formData"
                label-width="120px"
                class="form-content"
              >
                <!-- 迭代配置 -->
                <div class="config-section">
                  <h4 class="config-title">
                    <ElIcon><RefreshRight /></ElIcon>
                    迭代优化配置
                  </h4>
                  <ElFormItem label="最大迭代次数">
                    <ElSlider
                      v-model="maxIterations"
                      :min="1"
                      :max="5"
                      :marks="{ 1: '1次', 3: '3次', 5: '5次' }"
                      show-input
                      :show-input-controls="false"
                    />
                    <template #label>
                      <div class="flex items-center gap-2">
                        <span>最大迭代次数</span>
                        <ElTooltip content="系统会根据质量评估自动进行迭代优化" placement="top">
                          <ElIcon class="text-gray-400"><InfoFilled /></ElIcon>
                        </ElTooltip>
                      </div>
                    </template>
                  </ElFormItem>

                  <ElFormItem label="自动批准模式">
                    <div class="flex items-center gap-3">
                      <ElSwitch
                        v-model="autoApprove"
                        active-text="开启"
                        inactive-text="关闭"
                        :active-value="true"
                        :inactive-value="false"
                        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #dcdfe6"
                      />
                      <ElTooltip content="开启后系统自动通过质量审核；关闭后将在审核点等待人工决策" placement="top">
                        <ElIcon class="text-gray-400 cursor-help"><InfoFilled /></ElIcon>
                      </ElTooltip>
                    </div>
                  </ElFormItem>
                </div>

                <!-- 特殊要求 -->
                <div class="config-section">
                  <h4 class="config-title">
                    <ElIcon><Star /></ElIcon>
                    特殊要求
                  </h4>
                  <ElFormItem label="特殊功能">
                    <div class="special-requirements">
                      <div
                        v-for="req in specialRequirementOptions"
                        :key="req.id"
                        class="requirement-tag"
                        :class="{ selected: formData.specialRequirements.includes(req.id) }"
                        @click="toggleRequirement(req.id)"
                      >
                        <span class="tag-icon">{{ req.icon }}</span>
                        <span class="tag-label">{{ req.label }}</span>
                      </div>
                    </div>
                  </ElFormItem>

                  <ElFormItem label="其他要求">
                    <ElInput
                      v-model="otherRequirements"
                      type="textarea"
                      :rows="3"
                      placeholder="如果有其他特殊要求，请在此说明"
                    />
                  </ElFormItem>
                </div>
              </ElForm>
            </div>
          </div>
        </div>

        <!-- 步骤导航按钮 -->
        <div class="form-actions">
          <ElButton
            v-if="currentStep !== 'template'"
            size="large"
            @click="previousStep"
          >
            <ElIcon style="margin-right: 4px"><ArrowLeft /></ElIcon>
            上一步
          </ElButton>
          <ElButton
            v-if="currentStep !== 'advanced'"
            type="primary"
            size="large"
            @click="nextStep"
          >
            下一步
            <ElIcon style="margin-left: 4px"><ArrowRight /></ElIcon>
          </ElButton>
          <ElButton
            v-if="currentStep === 'advanced'"
            type="primary"
            size="large"
            :loading="submitting"
            @click="submitForm"
          >
            <ElIcon style="margin-right: 4px"><VideoPlay /></ElIcon>
            {{ submitting ? '启动中...' : '启动多智能体设计' }}
          </ElButton>
        </div>
      </div>

      <!-- 右侧：预览和提示 -->
      <div class="preview-panel">
        <!-- 实时预览 -->
        <div class="preview-card">
          <div class="card-header">
            <h3>
              <ElIcon><View /></ElIcon>
              实时预览
            </h3>
          </div>
          <div class="card-content">
            <div class="preview-item">
              <span class="label">展览名称</span>
              <span class="value">{{ formData.title || '未填写' }}</span>
            </div>
            <div class="preview-item">
              <span class="label">主题</span>
              <span class="value multiline">{{ formData.theme || '未填写' }}</span>
            </div>
            <div class="preview-item">
              <span class="label">目标受众</span>
              <span class="value">{{ getTargetAudienceLabel(formData.targetAudience) }}</span>
            </div>
            <div class="preview-item">
              <span class="label">场地面积</span>
              <span class="value">{{ formData.venueSpace.area }} 平方米</span>
            </div>
            <div class="preview-item">
              <span class="label">预算</span>
              <span class="value highlight">{{ formatCurrency(formData.budget.total) }}</span>
            </div>
          </div>
        </div>

        <!-- 提示卡片 -->
        <div class="tips-card">
          <div class="card-header">
            <h3>
              <ElIcon><InfoFilled /></ElIcon>
              填写提示
            </h3>
          </div>
          <div class="card-content">
            <div class="tip-item">
              <div class="tip-icon">💡</div>
              <div class="tip-content">
                <h4>清晰的主题描述</h4>
                <p>详细描述展览主题能帮助智能体更好地理解您的需求</p>
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-icon">📐</div>
              <div class="tip-content">
                <h4>准确的场地信息</h4>
                <p>提供准确的场地面积和高度有助于空间规划</p>
              </div>
            </div>
            <div class="tip-item">
              <div class="tip-icon">💰</div>
              <div class="tip-content">
                <h4>合理的预算范围</h4>
                <p>预算将影响设计方案的规模和复杂度</p>
              </div>
            </div>
          </div>
        </div>

        <!-- AI模型配置 -->
        <div class="model-card">
          <div class="card-header">
            <h3>
              <ElIcon><Cpu /></ElIcon>
              AI模型
            </h3>
          </div>
          <div class="card-content">
            <div class="model-item">
              <span class="model-label">提供商</span>
              <span class="model-value">{{ modelConfig?.provider || 'DeepSeek' }}</span>
            </div>
            <div class="model-item">
              <span class="model-label">模型</span>
              <span class="model-value">{{ modelConfig?.modelName || 'deepseek-chat' }}</span>
            </div>
            <div class="model-item">
              <span class="model-label">温度</span>
              <span class="model-value">{{ modelConfig?.temperature || 0.7 }}</span>
            </div>
            <div class="model-item">
              <span class="model-label">智能体</span>
              <span class="model-value highlight">6 个</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useExhibitionStore } from '@/stores/exhibition'
import FormStepper from '@/components/FormStepper.vue'
import TemplateSelector from '@/components/TemplateSelector.vue'
import {
  ArrowLeft,
  ArrowRight,
  FolderOpened,
  DocumentCopy,
  Document,
  EditPen,
  Location,
  Coin,
  Setting,
  View,
  InfoFilled,
  VideoPlay,
  Loading,
  RefreshRight,
  Star,
  Cpu,
  User,
  Reading,
  Briefcase,
  UserFilled,
  TrendCharts,
  MagicStick
} from '@element-plus/icons-vue'
import type { ExhibitionRequirement } from '@/types/exhibition'

const router = useRouter()
const exhibitionStore = useExhibitionStore()

// 表单引用
const templateSelectorRef = ref()
const basicFormRef = ref<FormInstance>()
const venueFormRef = ref<FormInstance>()
const budgetFormRef = ref<FormInstance>()
const advancedFormRef = ref<FormInstance>()

// 状态
const currentStep = ref('template')
const submitting = ref(false)
const maxIterations = ref(3)
const autoApprove = ref(false) // 自动批准模式，默认关闭（人工审核）
const selectedVenueType = ref('standard')
const otherRequirements = ref('')

// 步骤定义
const formSteps = ref([
  { id: 'template', title: '模板选择', description: '选择模板或自定义' },
  { id: 'basic', title: '基本信息', description: '展览名称和主题' },
  { id: 'venue', title: '场地信息', description: '空间和布局' },
  { id: 'budget', title: '预算配置', description: '预算设置' },
  { id: 'advanced', title: '高级配置', description: '迭代和要求' }
])

// 计算默认日期
const today = new Date()
const nextWeek = new Date(today)
nextWeek.setDate(today.getDate() + 7)

const formatDateForInput = (date: Date) => {
  return date.toISOString().split('T')[0]
}

// 表单数据 - 带默认值，用户可以直接提交
const formData = reactive<ExhibitionRequirement>({
  title: '木兰陂展陈中心',
  theme: '历史文化价值，水文知识，新时代意义',
  targetAudience: 'general_public',
  venueSpace: {
    area: 500,
    height: 3.5,
    layout: ''
  },
  budget: {
    total: 1000000,
    currency: 'CNY'
  },
  duration: {
    startDate: formatDateForInput(today),
    endDate: formatDateForInput(nextWeek)
  },
  specialRequirements: [],
  maxIterations: 3
})

// 表单验证规则
const basicRules: FormRules = {
  title: [
    { required: true, message: '请输入展览名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  theme: [
    { required: true, message: '请输入展览主题', trigger: 'blur' },
    { min: 10, max: 500, message: '长度在 10 到 500 个字符', trigger: 'blur' }
  ],
  targetAudience: [
    { required: true, message: '请选择目标受众', trigger: 'change' }
  ]
}

const venueRules: FormRules = {
  'venueSpace.area': [
    { required: true, message: '请输入场地面积', trigger: 'blur' },
    { type: 'number', min: 50, message: '面积不能小于 50 平方米', trigger: 'blur' }
  ],
  'venueSpace.height': [
    { required: true, message: '请输入场地高度', trigger: 'blur' },
    { type: 'number', min: 2, message: '高度不能小于 2 米', trigger: 'blur' }
  ]
}

const budgetRules: FormRules = {
  'budget.total': [
    { required: true, message: '请输入总预算', trigger: 'blur' },
    { type: 'number', min: 10000, message: '预算不能小于 10,000', trigger: 'blur' }
  ]
}

// 场地类型
const venueTypes = [
  { id: 'standard', name: '标准展厅', icon: '🏛️' },
  { id: 'open', name: '开放式空间', icon: '📐' },
  { id: 'mall', name: '商场中庭', icon: '🏬' },
  { id: 'outdoor', name: '户外场地', icon: '🌳' }
]

// 特殊要求选项
const specialRequirementOptions = [
  { id: '无障碍设计', label: '无障碍设计', icon: '♿' },
  { id: '多语言支持', label: '多语言支持', icon: '🌐' },
  { id: '互动体验区', label: '互动体验区', icon: '🎮' },
  { id: '文创产品销售', label: '文创产品销售', icon: '🛍️' },
  { id: '儿童友好', label: '儿童友好', icon: '👶' },
  { id: '夜间展览', label: '夜间展览', icon: '🌙' }
]

// 计算属性
const stepProgress = computed(() => {
  const stepIndex = formSteps.value.findIndex(s => s.id === currentStep.value)
  return ((stepIndex + 1) / formSteps.value.length) * 100
})

const hasDraft = computed(() => {
  return localStorage.getItem('exhibition_draft') !== null
})

const hasChanges = computed(() => {
  return formData.title !== '' || formData.theme !== ''
})

const modelConfig = computed(() => exhibitionStore.modelConfig)

// 方法
const handleTemplateSelect = (template: any) => {
  if (template && template.defaults) {
    formData.title = template.defaults.title
    formData.theme = template.defaults.theme
    formData.targetAudience = template.defaults.targetAudience
    const budget = template.defaults.budget.split(' ')[0].replace(',', '')
    formData.budget.total = parseInt(budget)
  }
}

const handleStepClick = async (stepId: string, index: number) => {
  // 验证当前步骤
  const currentFormRef = getCurrentFormRef()
  if (currentFormRef && stepId !== 'template') {
    try {
      await currentFormRef.validate()
    } catch {
      return
    }
  }
  currentStep.value = stepId
}

const getCurrentFormRef = () => {
  switch (currentStep.value) {
    case 'basic': return basicFormRef.value
    case 'venue': return venueFormRef.value
    case 'budget': return budgetFormRef.value
    case 'advanced': return advancedFormRef.value
    default: return null
  }
}

const nextStep = async () => {
  const currentFormRef = getCurrentFormRef()
  if (currentFormRef) {
    try {
      await currentFormRef.validate()
    } catch {
      return
    }
  }

  const currentIndex = formSteps.value.findIndex(s => s.id === currentStep.value)
  if (currentIndex < formSteps.value.length - 1) {
    const nextStepData = formSteps.value[currentIndex + 1]
    currentStep.value = nextStepData.id
    // 标记当前步骤为完成
    formSteps.value[currentIndex].completed = true
  }
}

const previousStep = () => {
  const currentIndex = formSteps.value.findIndex(s => s.id === currentStep.value)
  if (currentIndex > 0) {
    const prevStepData = formSteps.value[currentIndex - 1]
    currentStep.value = prevStepData.id
  }
}

const jumpToLastStep = () => {
  // 快速开始：直接跳到最后一步
  currentStep.value = 'advanced'
  // 标记前面所有步骤为完成
  formSteps.value.forEach((step, index) => {
    if (index < formSteps.value.length - 1) {
      step.completed = true
    }
  })
  ElMessage.success('已加载默认配置，您可以直接提交或继续修改')
}

const toggleRequirement = (id: string) => {
  const index = formData.specialRequirements.indexOf(id)
  if (index > -1) {
    formData.specialRequirements.splice(index, 1)
  } else {
    formData.specialRequirements.push(id)
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: formData.budget.currency
  }).format(amount)
}

const getTargetAudienceLabel = (value: string) => {
  const labels: Record<string, string> = {
    children_family: '儿童及家庭',
    teenagers: '青少年',
    students: '大学生',
    professionals: '专业人士',
    general_public: '普通大众'
  }
  return labels[value] || '未选择'
}

const submitForm = async () => {
  try {
    // 处理其他要求
    if (otherRequirements.value.trim()) {
      formData.specialRequirements.push(otherRequirements.value.trim())
    }

    // 添加最大迭代次数
    formData.maxIterations = maxIterations.value

    // 添加自动批准模式配置
    ;(formData as any).autoApprove = autoApprove.value

    console.log('📋 [FORM] 提交配置:', {
      maxIterations: maxIterations.value,
      autoApprove: autoApprove.value
    })

    // 确认提交
    await ElMessageBox.confirm(
      '提交后将启动多智能体系统开始设计，预计需要 3-5 分钟完成。确认提交吗？',
      '确认提交',
      {
        confirmButtonText: '确认启动',
        cancelButtonText: '再想想',
        type: 'info'
      }
    )

    submitting.value = true

    // 启动设计流程
    await exhibitionStore.runExhibitionDesign(formData)

    ElMessage.success('展览设计已启动！正在跳转到工作流页面...')

    // 清除草稿
    localStorage.removeItem('exhibition_draft')

    // 跳转
    router.push('/workflow')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('提交失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

const saveDraft = () => {
  const draft = {
    formData,
    maxIterations: maxIterations.value,
    autoApprove: autoApprove.value,
    selectedVenueType: selectedVenueType.value,
    otherRequirements: otherRequirements.value,
    savedAt: new Date().toISOString()
  }
  localStorage.setItem('exhibition_draft', JSON.stringify(draft))
  ElMessage.success('草稿已保存')
}

const loadDraft = () => {
  const draftStr = localStorage.getItem('exhibition_draft')
  if (draftStr) {
    const draft = JSON.parse(draftStr)
    Object.assign(formData, draft.formData)
    maxIterations.value = draft.maxIterations
    autoApprove.value = draft.autoApprove ?? false
    selectedVenueType.value = draft.selectedVenueType
    otherRequirements.value = draft.otherRequirements
    ElMessage.success('草稿已加载')
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  exhibitionStore.initializeApp()
})
</script>

<style scoped>
.exhibition-form-optimized {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
}

/* 顶部导航 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 主内容区 */
.page-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

@media (max-width: 1200px) {
  .page-content {
    grid-template-columns: 1fr;
  }
  .preview-panel {
    order: -1;
  }
}

/* 表单面板 */
.form-panel {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.steps-content {
  margin-top: 32px;
}

.step-content {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 快速开始卡片 */
.quick-start-card {
  margin-top: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #3b82f6;
  border-radius: 16px;
  animation: slideInUp 0.4s ease-out;
}

.quick-start-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.quick-start-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.quick-start-text {
  flex: 1;
}

.quick-start-text h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1e40af;
  margin: 0 0 8px 0;
}

.quick-start-text p {
  font-size: 14px;
  color: #3b82f6;
  margin: 0;
  line-height: 1.6;
}

.form-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

.section-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
}

.section-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.section-header p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.form-content {
  max-width: 700px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.unit-label {
  margin-left: 8px;
  font-size: 13px;
  color: #6b7280;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 场地类型 */
.venue-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.venue-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.venue-type-card:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.venue-type-card.selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.type-icon {
  font-size: 28px;
}

.type-name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

/* 预算预览 */
.budget-preview {
  margin-top: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.budget-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.budget-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-label {
  font-size: 13px;
  color: #6b7280;
}

.item-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.budget-item.total .item-value {
  font-size: 16px;
  color: #3b82f6;
}

/* 配置区域 */
.config-section {
  margin-bottom: 32px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.config-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px 0;
}

/* 特殊要求标签 */
.special-requirements {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.requirement-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.requirement-tag:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.requirement-tag.selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.tag-icon {
  font-size: 20px;
}

.tag-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

/* 表单操作 */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
  padding-top: 32px;
  border-top: 2px solid #f3f4f6;
}

/* 预览面板 */
.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 24px;
  height: fit-content;
}

.preview-card,
.tips-card,
.model-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.card-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-item .label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.preview-item .value {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  text-align: right;
  max-width: 200px;
}

.preview-item .value.multiline {
  white-space: pre-wrap;
  line-height: 1.5;
}

.preview-item .value.highlight {
  color: #3b82f6;
  font-size: 14px;
}

/* 提示卡片 */
.tip-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.tip-item:last-child {
  border-bottom: none;
}

.tip-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.tip-content h4 {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.tip-content p {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* 模型配置 */
.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.model-label {
  font-size: 12px;
  color: #6b7280;
}

.model-value {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.model-value.highlight {
  color: #8b5cf6;
}

.currency-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.my-3 {
  margin-top: 12px;
  margin-bottom: 12px;
}
</style>
