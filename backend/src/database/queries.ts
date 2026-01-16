import { db, type ProjectDB, type WorkflowDB, type AgentExecutionDB, type DesignResultDB } from './schema'
import { v4 as uuidv4 } from 'uuid'

// 简单的日志函数
const log = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toLocaleTimeString('zh-CN')
  if (data) {
    console.log(`[${timestamp}] [${category}] ${message}`, JSON.stringify(data, null, 2))
  } else {
    console.log(`[${timestamp}] [${category}] ${message}`)
  }
}

// ============ 项目操作 ============

export const projectQueries = {
  // 创建项目
  create(project: Omit<ProjectDB, 'id' | 'created_at' | 'updated_at'>): ProjectDB {
    const id = uuidv4()
    const now = new Date().toISOString()

    const stmt = db.prepare(`
      INSERT INTO projects (
        id, title, theme, target_audience, venue_area, venue_height, venue_layout,
        budget_total, budget_currency, start_date, end_date, special_requirements, outline_draft, step_by_step,
        status, user_id, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      project.title,
      project.theme,
      project.target_audience,
      project.venue_area,
      project.venue_height,
      project.venue_layout,
      project.budget_total,
      project.budget_currency,
      project.start_date,
      project.end_date,
      project.special_requirements,
      project.outline_draft || null,
      project.step_by_step || 0,
      project.status,
      project.user_id || null,
      project.created_by || null,
      now,
      now
    )

    log('💾 数据库', `✅ 项目创建成功`, {
      id,
      title: project.title,
      status: project.status,
      userId: project.user_id,
      hasOutlineDraft: !!project.outline_draft,
      stepByStep: project.step_by_step === 1
    })

    return { ...project, id, created_at: now, updated_at: now }
  },

  // 获取所有项目（保持向后兼容）
  getAll(limit = 50, offset = 0): ProjectDB[] {
    const stmt = db.prepare(`
      SELECT * FROM projects
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)
    const projects = stmt.all(limit, offset) as ProjectDB[]
    log('💾 数据库', `📋 获取项目列表`, { count: projects.length, limit, offset })
    return projects
  },

  // 获取用户自己的项目
  getAllForUser(userId: string, limit = 50, offset = 0): ProjectDB[] {
    const stmt = db.prepare(`
      SELECT * FROM projects
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)
    const projects = stmt.all(userId, limit, offset) as ProjectDB[]
    log('💾 数据库', `📋 获取用户项目列表`, { userId, count: projects.length, limit, offset })
    return projects
  },

  // 根据状态获取项目
  getByStatus(status: string): ProjectDB[] {
    const stmt = db.prepare(`
      SELECT * FROM projects
      WHERE status = ?
      ORDER BY created_at DESC
    `)
    return stmt.all(status) as ProjectDB[]
  },

  // 根据 ID 获取项目（保持向后兼容）
  getById(id: string): ProjectDB | undefined {
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?')
    return stmt.get(id) as ProjectDB | undefined
  },

  // 根据 ID 获取用户项目（验证所有权）
  getByIdForUser(id: string, userId: string): ProjectDB | undefined {
    const stmt = db.prepare(`
      SELECT * FROM projects
      WHERE id = ? AND (user_id = ? OR user_id IS NULL)
    `)
    return stmt.get(id, userId) as ProjectDB | undefined
  },

  // 更新项目状态
  updateStatus(id: string, status: string): void {
    const stmt = db.prepare(`
      UPDATE projects
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    stmt.run(status, id)
  },

  // 删除项目（保持向后兼容）
  delete(id: string): void {
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?')
    stmt.run(id)
  },

  // 删除用户项目（验证所有权）
  deleteForUser(id: string, userId: string): boolean {
    const stmt = db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?')
    const result = stmt.run(id, userId)
    return result.changes > 0
  },

  // 获取项目统计
  getStats(): {
    total: number
    pending: number
    running: number
    completed: number
    error: number
  } {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error
      FROM projects
    `)
    const stats = stmt.get() as any
    log('💾 数据库', `📊 项目统计`, stats)
    return stats
  }
}

// ============ 工作流操作 ============

export const workflowQueries = {
  // 创建工作流
  create(workflow: Omit<WorkflowDB, 'id' | 'started_at'>): WorkflowDB {
    const id = uuidv4()
    const now = new Date().toISOString()

    const stmt = db.prepare(`
      INSERT INTO workflows (
        id, project_id, current_step, progress, status,
        started_at, completed_at, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      workflow.project_id,
      workflow.current_step,
      workflow.progress,
      workflow.status,
      now,
      workflow.completed_at || null,
      workflow.error_message || null
    )

    log('💾 数据库', `✅ 工作流创建成功`, { id, projectId: workflow.project_id, step: workflow.current_step })

    return { ...workflow, id, started_at: now }
  },

  // 获取工作流
  getById(id: string): WorkflowDB | undefined {
    const stmt = db.prepare('SELECT * FROM workflows WHERE id = ?')
    return stmt.get(id) as WorkflowDB | undefined
  },

  // 根据项目 ID 获取工作流
  getByProjectId(projectId: string): WorkflowDB[] {
    const stmt = db.prepare('SELECT * FROM workflows WHERE project_id = ? ORDER BY started_at DESC')
    return stmt.all(projectId) as WorkflowDB[]
  },

  // 更新工作流进度
  updateProgress(id: string, currentStep: string, progress: number): void {
    const stmt = db.prepare(`
      UPDATE workflows
      SET current_step = ?, progress = ?
      WHERE id = ?
    `)
    stmt.run(currentStep, progress, id)
  },

  // 更新工作流状态
  updateStatus(id: string, status: string): void {
    const stmt = db.prepare(`
      UPDATE workflows
      SET status = ?
      WHERE id = ?
    `)
    stmt.run(status, id)
    log('💾 数据库', `🔄 工作流状态更新`, { id, status })
  },

  // 完成工作流
  complete(id: string): void {
    const stmt = db.prepare(`
      UPDATE workflows
      SET status = 'completed', completed_at = datetime('now'), progress = 100
      WHERE id = ?
    `)
    stmt.run(id)
    log('💾 数据库', `🎉 工作流完成`, { workflowId: id })
  },

  // 工作流错误
  error(id: string, errorMessage: string): void {
    const stmt = db.prepare(`
      UPDATE workflows
      SET status = 'error', completed_at = datetime('now'), error_message = ?
      WHERE id = ?
    `)
    stmt.run(errorMessage, id)
    log('💾 数据库', `❌ 工作流出错`, { workflowId: id, error: errorMessage })
  }
}

// ============ 智能体执行记录操作 ============

export const agentExecutionQueries = {
  // 创建执行记录
  create(execution: Omit<AgentExecutionDB, 'id'>): AgentExecutionDB {
    const id = uuidv4()

    const stmt = db.prepare(`
      INSERT INTO agent_executions (
        id, workflow_id, agent_id, agent_name, status,
        started_at, completed_at, error_message, result_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      execution.workflow_id,
      execution.agent_id,
      execution.agent_name,
      execution.status,
      execution.started_at || null,
      execution.completed_at || null,
      execution.error_message || null,
      execution.result_data || null
    )

    return { ...execution, id }
  },

  // 获取工作流的所有智能体执行记录
  getByWorkflowId(workflowId: string): AgentExecutionDB[] {
    const stmt = db.prepare('SELECT * FROM agent_executions WHERE workflow_id = ? ORDER BY started_at')
    return stmt.all(workflowId) as AgentExecutionDB[]
  },

  // 更新智能体状态
  updateStatus(id: string, status: string): void {
    const now = new Date().toISOString()

    if (status === 'running') {
      const stmt = db.prepare(`
        UPDATE agent_executions
        SET status = ?, started_at = ?
        WHERE id = ?
      `)
      stmt.run(status, now, id)
    } else if (status === 'completed' || status === 'error') {
      const stmt = db.prepare(`
        UPDATE agent_executions
        SET status = ?, completed_at = ?
        WHERE id = ?
      `)
      stmt.run(status, now, id)
    }
  },

  // 保存智能体结果
  saveResult(id: string, resultData: string): void {
    const stmt = db.prepare(`
      UPDATE agent_executions
      SET result_data = ?
      WHERE id = ?
    `)
    stmt.run(resultData, id)
  }
}

// ============ 设计结果操作 ============

export const designResultQueries = {
  // 保存设计结果
  save(workflowId: string, resultType: string, resultData: string): DesignResultDB {
    const id = uuidv4()
    const now = new Date().toISOString()

    const stmt = db.prepare(`
      INSERT INTO design_results (id, workflow_id, result_type, result_data, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)

    stmt.run(id, workflowId, resultType, resultData, now)

    const typeNames: Record<string, string> = {
      concept: '概念策划',
      spatial: '空间设计',
      visual: '视觉设计',
      interactive: '互动技术',
      budget: '预算估算'
    }

    log('💾 数据库', `💾 保存设计结果`, {
      id,
      workflowId,
      type: typeNames[resultType] || resultType
    })

    return { id, workflow_id: workflowId, result_type: resultType, result_data: resultData, created_at: now }
  },

  // 获取工作流的所有设计结果
  getByWorkflowId(workflowId: string): DesignResultDB[] {
    const stmt = db.prepare('SELECT * FROM design_results WHERE workflow_id = ? ORDER BY created_at')
    return stmt.all(workflowId) as DesignResultDB[]
  },

  // 根据类型获取设计结果
  getByType(workflowId: string, resultType: string): DesignResultDB | undefined {
    const stmt = db.prepare(`
      SELECT * FROM design_results
      WHERE workflow_id = ? AND result_type = ?
      ORDER BY created_at DESC
      LIMIT 1
    `)
    return stmt.get(workflowId, resultType) as DesignResultDB | undefined
  }
}
