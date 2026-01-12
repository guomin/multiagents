import axios from 'axios'
import type { ExhibitionRequirement, ExhibitionState, ModelConfig } from '@/types/exhibition'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 300000, // 5分钟超时
})

// 项目类型定义
export interface Project {
  id: string
  title: string
  theme: string
  target_audience: string
  venue_area: number
  venue_height: number
  venue_layout: string
  budget_total: number
  budget_currency: string
  start_date: string
  end_date: string
  special_requirements: string
  status: 'pending' | 'running' | 'completed' | 'error'
  created_at: string
  updated_at: string
}

export interface ProjectStats {
  total: number
  pending: number
  running: number
  completed: number
  error: number
}

export const exhibitionAPI = {
  // 获取模型配置
  async getModelConfig(): Promise<ModelConfig> {
    try {
      const response = await api.get('/model-config')
      return response.data
    } catch (error) {
      console.error('Failed to get model config:', error)
      // 返回默认配置
      return {
        provider: 'deepseek',
        modelName: 'deepseek-chat',
        temperature: 0.7,
        baseURL: 'https://api.deepseek.com/v1'
      }
    }
  },

  // 运行展览设计
  async runExhibition(requirements: ExhibitionRequirement): Promise<any> {
    try {
      const response = await api.post('/exhibition/run', requirements)
      return response.data
    } catch (error) {
      console.error('Failed to run exhibition:', error)
      throw error
    }
  },

  // 提交人工审核决策
  async submitDecision(projectId: string, decision: 'approve' | 'revise' | 'reject', feedback?: string, revisionTarget?: string): Promise<any> {
    try {
      const response = await api.post(`/exhibition/decision/${projectId}`, {
        decision,
        feedback,
        revisionTarget
      })
      return response.data
    } catch (error) {
      console.error('Failed to submit decision:', error)
      throw error
    }
  },

  // 获取工作流状态
  async getWorkflowStatus(id: string): Promise<any> {
    try {
      const response = await api.get(`/exhibition/workflow/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to get workflow status:', error)
      throw error
    }
  },

  // 取消工作流
  async cancelWorkflow(id: string): Promise<void> {
    try {
      await api.delete(`/exhibition/workflow/${id}`)
    } catch (error) {
      console.error('Failed to cancel workflow:', error)
      throw error
    }
  },

  // 导出报告
  async exportReport(id: string, format: 'pdf' | 'docx' | 'markdown', forceRegenerate: boolean = false): Promise<Blob> {
    try {
      const response = await api.get(`/exhibition/export/${id}`, {
        params: { format, force: forceRegenerate ? 'true' : 'false' },
        responseType: 'blob',
        timeout: 120000 // 2分钟超时（PDF生成可能需要较长时间）
      })
      return response.data
    } catch (error: any) {
      console.error('导出报告失败:', error)

      // 提供更详细的错误信息
      if (error.code === 'ECONNABORTED') {
        throw new Error('导出超时，请稍后重试')
      } else if (error.response) {
        throw new Error(`服务器错误: ${error.response.status}`)
      } else {
        throw error
      }
    }
  },

  // ============ 项目管理 API ============

  // 获取所有项目
  async getProjects(limit = 50, offset = 0): Promise<Project[]> {
    try {
      const response = await api.get('/projects', { params: { limit, offset } })
      return response.data.data
    } catch (error) {
      console.error('Failed to get projects:', error)
      throw error
    }
  },

  // 获取项目统计
  async getProjectStats(): Promise<ProjectStats> {
    try {
      const response = await api.get('/projects/stats')
      return response.data.data
    } catch (error) {
      console.error('Failed to get project stats:', error)
      throw error
    }
  },

  // 获取项目详情
  async getProjectById(id: string): Promise<any> {
    try {
      const response = await api.get(`/projects/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Failed to get project details:', error)
      throw error
    }
  },

  // 删除项目
  async deleteProject(id: string): Promise<void> {
    try {
      await api.delete(`/projects/${id}`)
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  },

  // 获取项目的工作流列表
  async getProjectWorkflows(id: string): Promise<any[]> {
    try {
      const response = await api.get(`/projects/${id}/workflows`)
      return response.data.data
    } catch (error) {
      console.error('Failed to get project workflows:', error)
      throw error
    }
  },

  // ============ 智能体结果 API ============

  // 获取指定智能体的执行结果
  async getAgentResult(projectId: string, agentType: string): Promise<any> {
    try {
      const response = await api.get(`/exhibition/agent-result/${projectId}/${agentType}`)
      return response.data
    } catch (error: any) {
      console.error('Failed to get agent result:', error)

      // 提供更详细的错误信息
      if (error.response?.status === 404) {
        throw new Error('智能体结果未找到，可能尚未完成执行')
      } else if (error.response?.status === 400) {
        throw new Error(`不支持的智能体类型: ${agentType}`)
      } else {
        throw new Error(error.response?.data?.details || '获取智能体结果失败')
      }
    }
  }
}