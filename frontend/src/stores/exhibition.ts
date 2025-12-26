import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ExhibitionRequirement, ExhibitionState, AgentStatus, ModelConfig } from '@/types/exhibition'
import { exhibitionAPI } from '@/api/exhibition'

export const useExhibitionStore = defineStore('exhibition', () => {
  // 状态
  const currentExhibition = ref<ExhibitionRequirement | null>(null)
  const currentWorkflow = ref<ExhibitionState | null>(null)
  const agentStatuses = ref<AgentStatus[]>([])
  const modelConfig = ref<ModelConfig | null>(null)
  const isProcessing = ref(false)
  const processingProgress = ref(0)

  // 初始化智能体状态
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

  // API 调用
  const runExhibitionDesign = async (requirements: ExhibitionRequirement) => {
    try {
      startProcessing()
      setExhibition(requirements)

      const response = await exhibitionAPI.runExhibition(requirements)

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
    runExhibitionDesign,
    loadModelConfig,
    initializeApp
  }
})