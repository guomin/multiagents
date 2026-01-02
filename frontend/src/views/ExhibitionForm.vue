<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- 页面标题 -->
    <div class="text-center mb-12 slide-in-up">
      <div class="hero-gradient inline-block p-4 rounded-3xl mb-6 shadow-2xl float-animation">
        <ElIcon class="text-white text-5xl"><InfoFilled /></ElIcon>
      </div>
      <h1 class="text-5xl font-bold text-gradient mb-4">创建展览项目</h1>
      <p class="text-gray-600 text-xl max-w-2xl mx-auto">
        填写展览需求，让6个专业智能体为您设计完整的展陈方案
      </p>
      <div class="flex justify-center items-center mt-6 space-x-4">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-sm text-gray-600">智能协作</span>
        </div>
        <div class="text-gray-400">•</div>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span class="text-sm text-gray-600">实时生成</span>
        </div>
        <div class="text-gray-400">•</div>
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span class="text-sm text-gray-600">专业方案</span>
        </div>
      </div>
    </div>

    <!-- 表单 -->
    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="form-glass slide-in-up"
      style="animation-delay: 0.3s"
    >
      <!-- 基本信息 -->
      <div class="mb-10">
        <div class="flex items-center mb-8">
          <div class="info-gradient p-3 rounded-xl mr-4">
            <ElIcon class="text-white text-xl"><InfoFilled /></ElIcon>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gradient">基本信息</h2>
            <p class="text-gray-600">描述展览的基本信息和核心理念</p>
          </div>
        </div>

        <ElFormItem label="展览名称" prop="title">
          <ElInput
            v-model="form.title"
            placeholder="请输入展览名称"
            :maxlength="50"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="展览主题" prop="theme">
          <ElInput
            v-model="form.theme"
            type="textarea"
            :rows="3"
            placeholder="请详细描述展览主题和核心理念"
            :maxlength="200"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="目标受众" prop="targetAudience">
          <ElSelect
            v-model="form.targetAudience"
            placeholder="请选择目标受众"
            class="w-full"
          >
            <ElOption label="儿童及家庭" value="children_family" />
            <ElOption label="青少年" value="teenagers" />
            <ElOption label="大学生" value="students" />
            <ElOption label="专业人士" value="professionals" />
            <ElOption label="普通大众" value="general_public" />
            <ElOption label="VIP客户" value="vip_clients" />
          </ElSelect>
        </ElFormItem>
      </div>

      <!-- 场地信息 -->
      <div class="mb-10">
        <div class="flex items-center mb-8">
          <div class="success-gradient p-3 rounded-xl mr-4">
            <ElIcon class="text-white text-xl"><Location /></ElIcon>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gradient">场地信息</h2>
            <p class="text-gray-600">描述展览场地的空间特征和限制条件</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ElFormItem label="场地面积" prop="venueSpace.area">
            <ElInputNumber
              v-model="form.venueSpace.area"
              :min="50"
              :max="5000"
              class="w-full"
            />
            <span class="ml-2 text-gray-600">平方米</span>
          </ElFormItem>

          <ElFormItem label="场地高度" prop="venueSpace.height">
            <ElInputNumber
              v-model="form.venueSpace.height"
              :min="2"
              :max="10"
              :precision="1"
              class="w-full"
            />
            <span class="ml-2 text-gray-600">米</span>
          </ElFormItem>
        </div>

        <ElFormItem label="场地布局" prop="venueSpace.layout">
          <ElInput
            v-model="form.venueSpace.layout"
            type="textarea"
            :rows="2"
            placeholder="请描述场地的基本布局特点，如是否有柱子、天井等"
          />
        </ElFormItem>
      </div>

      <!-- 预算信息 -->
      <div class="mb-8">
        <h2 class="text-xl font-bold text-gray-800 mb-6 pb-2 border-b">
          <ElIcon class="mr-2 text-yellow-600"><Money /></ElIcon>
          预算信息
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ElFormItem label="总预算" prop="budget.total">
            <ElInputNumber
              v-model="form.budget.total"
              :min="10000"
              :max="10000000"
              class="w-full"
            />
          </ElFormItem>

          <ElFormItem label="货币单位" prop="budget.currency">
            <ElSelect v-model="form.budget.currency" class="w-full">
              <ElOption label="人民币 (CNY)" value="CNY" />
              <ElOption label="美元 (USD)" value="USD" />
              <ElOption label="欧元 (EUR)" value="EUR" />
            </ElSelect>
          </ElFormItem>
        </div>
      </div>

      <!-- 展期信息 -->
      <div class="mb-8">
        <h2 class="text-xl font-bold text-gray-800 mb-6 pb-2 border-b">
          <ElIcon class="mr-2 text-purple-600"><Calendar /></ElIcon>
          展期信息
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ElFormItem label="开始日期" prop="duration.startDate">
            <ElDatePicker
              v-model="form.duration.startDate"
              type="date"
              placeholder="选择开始日期"
              class="w-full"
            />
          </ElFormItem>

          <ElFormItem label="结束日期" prop="duration.endDate">
            <ElDatePicker
              v-model="form.duration.endDate"
              type="date"
              placeholder="选择结束日期"
              class="w-full"
            />
          </ElFormItem>
        </div>
      </div>

      <!-- 特殊要求 -->
      <div class="mb-8">
        <h2 class="text-xl font-bold text-gray-800 mb-6 pb-2 border-b">
          <ElIcon class="mr-2 text-red-600"><Star /></ElIcon>
          特殊要求
        </h2>

        <ElFormItem label="特殊要求">
          <ElSelect
            v-model="form.specialRequirements"
            multiple
            placeholder="选择特殊要求（可多选）"
            class="w-full"
          >
            <ElOption label="无障碍设计" value="无障碍设计" />
            <ElOption label="多语言支持" value="多语言支持" />
            <ElOption label="互动体验区" value="互动体验区" />
            <ElOption label="文创产品销售" value="文创产品销售" />
            <ElOption label="社交媒体分享" value="社交媒体分享" />
            <ElOption label="儿童友好" value="儿童友好" />
            <ElOption label="VIP服务" value="VIP服务" />
            <ElOption label="夜间展览" value="夜间展览" />
          </ElSelect>
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

      <!-- 迭代优化配置 -->
      <div class="mb-10">
        <div class="flex items-center mb-8">
          <div class="warning-gradient p-3 rounded-xl mr-4">
            <ElIcon class="text-white text-xl"><Setting /></ElIcon>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gradient">迭代优化配置</h2>
            <p class="text-gray-600">配置质量评估和迭代优化参数</p>
          </div>
        </div>

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
            <div class="flex items-center space-x-2">
              <span>最大迭代次数</span>
              <ElTooltip content="系统会根据质量评估自动进行迭代优化，提升设计质量" placement="top">
                <ElIcon class="text-gray-400 cursor-help"><InfoFilled /></ElIcon>
              </ElTooltip>
            </div>
          </template>
        </ElFormItem>

        <ElFormItem label="自动批准模式">
          <div class="flex items-center space-x-4">
            <ElSwitch
              v-model="autoApprove"
              active-text="开启"
              inactive-text="关闭"
              :active-value="true"
              :inactive-value="false"
              style="--el-switch-on-color: #13ce66; --el-switch-off-color: #dcdfe6"
            />
            <ElTooltip content="开启后，系统将自动通过质量审核并完成设计；关闭后，将在审核点等待人工决策" placement="top">
              <ElIcon class="text-gray-400 cursor-help"><InfoFilled /></ElIcon>
            </ElTooltip>
          </div>
        </ElFormItem>

        <div class="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
          <div class="flex items-start space-x-3">
            <ElIcon class="text-blue-500 mt-1"><InfoFilled /></ElIcon>
            <div class="flex-1">
              <div class="font-semibold text-gray-800 mb-2">智能迭代优化</div>
              <div class="text-sm text-gray-600 space-y-1">
                <p>• 主管智能体会对设计方案进行多维度质量评估</p>
                <p>• 根据评估结果，系统会自动返回相应环节进行优化</p>
                <p>• 支持预算预警、设计协调性检查等多重质量保障</p>
                <p class="text-blue-600">• 当前配置：最多迭代 {{ maxIterations }} 次</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="flex justify-center space-x-6 mt-12">
        <button
          @click="resetForm"
          class="px-8 py-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-2"
        >
          <ElIcon><RefreshRight /></ElIcon>
          <span>重置表单</span>
        </button>
        <button
          @click="submitForm"
          :disabled="submitting"
          class="btn-primary px-8 py-4 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ElIcon v-if="!submitting"><Plus /></ElIcon>
          <ElIcon v-else class="animate-spin"><Loading /></ElIcon>
          <span>{{ submitting ? '智能体正在启动...' : '启动多智能体设计' }}</span>
        </button>
      </div>
    </ElForm>

    <!-- 模型配置显示 -->
    <div class="glass rounded-2xl p-8 mt-12 slide-in-up" style="animation-delay: 0.6s">
      <div class="flex items-center mb-6">
        <div class="hero-gradient p-3 rounded-xl mr-4">
          <ElIcon class="text-white text-xl"><Cpu /></ElIcon>
        </div>
        <div>
          <h3 class="text-xl font-bold text-gradient">AI模型配置</h3>
          <p class="text-gray-600">当前使用的智能模型参数</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
          <div class="text-2xl font-bold text-blue-600 mb-2">
            {{ modelConfig?.provider || 'DeepSeek' }}
          </div>
          <div class="text-sm text-gray-600">模型提供商</div>
        </div>
        <div class="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
          <div class="text-2xl font-bold text-purple-600 mb-2">
            {{ modelConfig?.modelName || 'deepseek-chat' }}
          </div>
          <div class="text-sm text-gray-600">模型名称</div>
        </div>
        <div class="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-teal-50">
          <div class="text-2xl font-bold text-green-600 mb-2">
            {{ modelConfig?.temperature || 0.7 }}
          </div>
          <div class="text-sm text-gray-600">温度参数</div>
        </div>
        <div class="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50">
          <div class="text-2xl font-bold text-orange-600 mb-2">6</div>
          <div class="text-sm text-gray-600">智能体数量</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useExhibitionStore } from '@/stores/exhibition'
import {
  InfoFilled,
  Location,
  Money,
  Calendar,
  Star,
  Cpu,
  Setting
} from '@element-plus/icons-vue'
import type { ExhibitionRequirement } from '@/types/exhibition'

const router = useRouter()
const exhibitionStore = useExhibitionStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const otherRequirements = ref('')
const modelConfig = exhibitionStore.modelConfig
const maxIterations = ref(3) // 新增：最大迭代次数，默认3次
const autoApprove = ref(false) // 新增：自动批准模式，默认关闭（人工审核）

// 计算默认日期
const today = new Date()
const nextWeek = new Date(today)
nextWeek.setDate(today.getDate() + 7)

const formatDateForInput = (date: Date) => {
  return date.toISOString().split('T')[0]
}

const form = reactive<ExhibitionRequirement>({
  title: '木兰陂展陈中心',
  theme: '历史文化价值，水文知识，新时代意义',
  targetAudience: 'general_public',
  venueSpace: {
    area: 500,
    height: 3.5,
    layout: ''
  },
  budget: {
    total: 300000,
    currency: 'CNY'
  },
  duration: {
    startDate: formatDateForInput(today),
    endDate: formatDateForInput(nextWeek)
  },
  specialRequirements: [],
  maxIterations: 3 // 新增：默认值
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入展览名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  theme: [
    { required: true, message: '请输入展览主题', trigger: 'blur' },
    { min: 10, max: 200, message: '长度在 10 到 200 个字符', trigger: 'blur' }
  ],
  targetAudience: [
    { required: true, message: '请选择目标受众', trigger: 'change' }
  ],
  'venueSpace.area': [
    { required: true, message: '请输入场地面积', trigger: 'blur' },
    { type: 'number', min: 50, message: '面积不能小于 50 平方米', trigger: 'blur' }
  ],
  'venueSpace.height': [
    { required: true, message: '请输入场地高度', trigger: 'blur' },
    { type: 'number', min: 2, message: '高度不能小于 2 米', trigger: 'blur' }
  ],
  'budget.total': [
    { required: true, message: '请输入总预算', trigger: 'blur' },
    { type: 'number', min: 10000, message: '预算不能小于 10,000', trigger: 'blur' }
  ],
  'duration.startDate': [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  'duration.endDate': [
    { required: true, message: '请选择结束日期', trigger: 'change' }
  ]
}

const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    // 确认提交
    await ElMessageBox.confirm(
      '提交后将启动多智能体系统开始设计，预计需要 3-5 分钟完成。确认提交吗？',
      '确认提交',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    submitting.value = true

    // 处理其他要求
    if (otherRequirements.value.trim()) {
      form.specialRequirements.push(otherRequirements.value.trim())
    }

    // 添加最大迭代次数配置
    form.maxIterations = maxIterations.value

    // 添加自动批准模式配置
    ;(form as any).autoApprove = autoApprove.value

    console.log('📋 [FORM] 提交配置:', {
      maxIterations: maxIterations.value,
      autoApprove: autoApprove.value
    })

    // 启动多智能体设计流程
    await exhibitionStore.runExhibitionDesign(form)

    ElMessage.success('展览设计已启动！正在跳转到工作流页面...')

    // 跳转到工作流页面
    router.push('/workflow')

  } catch (error) {
    console.error('提交失败:', error)
    if (error !== 'cancel') {
      ElMessage.error('提交失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  if (!formRef.value) return
  formRef.value.resetFields()
  otherRequirements.value = ''
}

onMounted(() => {
  exhibitionStore.initializeApp()
})
</script>