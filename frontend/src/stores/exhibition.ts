import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ExhibitionRequirement, ExhibitionState, AgentStatus, ModelConfig, AgentGroup } from '@/types/exhibition'
import { exhibitionAPI } from '@/api/exhibition'

export const useExhibitionStore = defineStore('exhibition', () => {
  // 状态
  const currentExhibition = ref<ExhibitionRequirement | null>(null)
  const currentWorkflow = ref<ExhibitionState | null>(null)
  const agentStatuses = ref<AgentStatus[]>([])
  const modelConfig = ref<ModelConfig | null>(null)
  const isProcessing = ref(false)
  const processingProgress = ref(0)
  const currentProjectId = ref<string>('') // 新增：当前项目ID

  // 新增：迭代状态
  const iterationCount = ref(0)
  const maxIterations = ref(3)
  const revisionTarget = ref<string | null>(null)
  const qualityEvaluation = ref<any>(null)
  const waitingForHuman = ref(false)

  // 初始化智能体状态（旧版，保持兼容）
  const initializeAgents = (): AgentStatus[] => [
    {
      id: 'curator',
      name: '策划智能体',
      type: 'curator',
      status: 'pending'
    },
    {
      id: 'spatial',
      name: '空间设计智能体',
      type: 'spatial',
      status: 'pending'
    },
    {
      id: 'visual',
      name: '视觉设计智能体',
      type: 'visual',
      status: 'pending'
    },
    {
      id: 'interactive',
      name: '互动技术智能体',
      type: 'interactive',
      status: 'pending'
    },
    {
      id: 'budget',
      name: '预算控制智能体',
      type: 'budget',
      status: 'pending'
    },
    {
      id: 'supervisor',
      name: '协调主管智能体',
      type: 'supervisor',
      status: 'pending'
    }
  ]

  // 新增：初始化智能体组（支持并行）
  const initializeAgentGroups = (): AgentGroup[] => [
    {
      id: 'curator',
      name: '策划智能体',
      type: 'single',
      status: 'pending'
    },
    {
      id: 'spatial',
      name: '空间设计智能体',
      type: 'single',
      status: 'pending'
    },
    {
      id: 'parallel_designs',
      name: '并行设计',
      type: 'parallel',
      status: 'pending',
      members: [
        {
          id: 'visual',
          name: '视觉设计',
          type: 'single',
          status: 'pending'
        },
        {
          id: 'interactive',
          name: '互动技术',
          type: 'single',
          status: 'pending'
        }
      ]
    },
    {
      id: 'budget',
      name: '预算控制智能体',
      type: 'single',
      status: 'pending'
    },
    {
      id: 'supervisor',
      name: '协调主管',
      type: 'single',
      status: 'pending',
      isReviewPoint: true
    }
  ]

  // 计算属性
  const completedAgents = computed(() =>
    agentStatuses.value.filter(agent => agent.status === 'completed').length
  )

  const totalAgents = computed(() => agentStatuses.value.length)

  const progressPercentage = computed(() =>
    totalAgents.value > 0 ? Math.round((completedAgents.value / totalAgents.value) * 100) : 0
  )

  const currentRunningAgent = computed(() =>
    agentStatuses.value.find(agent => agent.status === 'running')
  )

  // 方法
  const setExhibition = (requirements: ExhibitionRequirement) => {
    currentExhibition.value = requirements
    agentStatuses.value = initializeAgents()
  }

  const updateAgentStatus = (agentId: string, updates: Partial<AgentStatus>) => {
    const agentIndex = agentStatuses.value.findIndex(agent => agent.id === agentId)
    if (agentIndex !== -1) {
      agentStatuses.value[agentIndex] = {
        ...agentStatuses.value[agentIndex],
        ...updates
      }
    }
  }

  const startProcessing = () => {
    isProcessing.value = true
    processingProgress.value = 0
    agentStatuses.value = initializeAgents()
    // 重置迭代状态
    iterationCount.value = 0
    revisionTarget.value = null
    qualityEvaluation.value = null
    waitingForHuman.value = false
  }

  const updateProgress = (agentId: string, status: AgentStatus['status']) => {
    const now = new Date()

    if (status === 'running') {
      updateAgentStatus(agentId, {
        status,
        startTime: now
      })
    } else if (status === 'completed') {
      updateAgentStatus(agentId, {
        status,
        endTime: now
      })

      processingProgress.value = progressPercentage.value
    } else if (status === 'error') {
      updateAgentStatus(agentId, {
        status,
        endTime: now
      })
    }
  }

  const completeProcessing = (state: ExhibitionState) => {
    currentWorkflow.value = state
    isProcessing.value = false
    processingProgress.value = 100
  }

  const setModelError = (agentId: string, error: string) => {
    updateAgentStatus(agentId, {
      status: 'error',
      error,
      endTime: new Date()
    })
  }

  // 新增：设置人工审核状态
  const setWaitingForHuman = (evaluation: any) => {
    qualityEvaluation.value = evaluation
    waitingForHuman.value = true
  }

  // 新增：更新迭代状态
  const setIterationInfo = (count: number, target?: string) => {
    iterationCount.value = count
    revisionTarget.value = target || null
  }

  // 新增：清除人工审核状态
  const clearWaitingForHuman = () => {
    waitingForHuman.value = false
  }

  // API 调用
  const runExhibitionDesign = async (requirements: ExhibitionRequirement) => {
    try {
      startProcessing()
      setExhibition(requirements)

      const response = await exhibitionAPI.runExhibition(requirements)

      // 调试：完整输出响应
      console.log('📦 [API] 完整响应:', response)
      console.log('📦 [API] response.projectId:', response.projectId)
      console.log('📦 [API] response.success:', response.success)

      // 保存项目ID
      if (response.projectId) {
        currentProjectId.value = response.projectId
        // 同时保存到 localStorage 作为备份
        localStorage.setItem('current_project_id', response.projectId)
        console.log('✅ [STORE] 项目ID已保存到 store:', response.projectId)
      } else {
        console.warn('⚠️  [STORE] 响应中没有 projectId!', response)
      }

      // 后端返回的只是启动确认，不是完整结果
      // 真正的结果会通过WebSocket推送过来
      console.log('🚀 工作流已启动，等待WebSocket推送结果...', response)

      // 只有当响应中包含完整结果时才完成处理
      if (response && response.conceptPlan) {
        completeProcessing(response)
      }

      return response
    } catch (error) {
      isProcessing.value = false
      throw error
    }
  }

  const loadModelConfig = async () => {
    try {
      modelConfig.value = await exhibitionAPI.getModelConfig()
    } catch (error) {
      console.error('Failed to load model config:', error)
    }
  }

  const initializeApp = async () => {
    await loadModelConfig()
  }

  return {
    // 状态
    currentExhibition,
    currentWorkflow,
    agentStatuses,
    modelConfig,
    isProcessing,
    processingProgress,
    currentProjectId, // 新增：项目ID

    // 迭代状态
    iterationCount,
    maxIterations,
    revisionTarget,
    qualityEvaluation,
    waitingForHuman,

    // 计算属性
    completedAgents,
    totalAgents,
    progressPercentage,
    currentRunningAgent,

    // 方法
    setExhibition,
    updateAgentStatus,
    startProcessing,
    updateProgress,
    completeProcessing,
    setModelError,
    setWaitingForHuman,
    setIterationInfo,
    clearWaitingForHuman,
    runExhibitionDesign,
    loadModelConfig,
    initializeApp
  }
})