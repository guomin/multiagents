import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// 数据库文件路径
const dbDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dbDir, 'exhibition.db')

// 确保数据目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// 创建数据库连接
export const db: Database.Database = new Database(dbPath)

// 启用外键约束
db.pragma('foreign_keys = ON')

// 初始化数据库表
export function initializeDatabase() {
  // 项目表
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      theme TEXT NOT NULL,
      target_audience TEXT,
      venue_area INTEGER,
      venue_height REAL,
      venue_layout TEXT,
      budget_total REAL,
      budget_currency TEXT,
      start_date TEXT,
      end_date TEXT,
      special_requirements TEXT,
      outline_draft TEXT,
      step_by_step INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // 工作流表
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      current_step TEXT,
      progress INTEGER DEFAULT 0,
      status TEXT DEFAULT 'running',
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      error_message TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `)

  // 智能体执行记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_executions (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      started_at TEXT,
      completed_at TEXT,
      error_message TEXT,
      result_data TEXT,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    )
  `)

  // 设计结果表
  db.exec(`
    CREATE TABLE IF NOT EXISTS design_results (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      result_type TEXT NOT NULL,
      result_data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    )
  `)

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
    CREATE INDEX IF NOT EXISTS idx_workflows_project_id ON workflows(project_id);
    CREATE INDEX IF NOT EXISTS idx_agent_executions_workflow_id ON agent_executions(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_design_results_workflow_id ON design_results(workflow_id);
  `)

  console.log('✅ 数据库表初始化完成')

  // 迁移：添加 outline_draft 列（如果不存在）
  try {
    const columns = db.prepare("PRAGMA table_info(projects)").all() as any[]
    const hasOutlineDraft = columns.some(col => col.name === 'outline_draft')

    if (!hasOutlineDraft) {
      db.exec(`
        ALTER TABLE projects ADD COLUMN outline_draft TEXT
      `)
      console.log('✅ 数据库迁移完成：已添加 outline_draft 列')
    }
  } catch (error) {
    console.warn('⚠️  数据库迁移警告:', error)
  }

  // 迁移：添加 step_by_step 列（如果不存在）
  try {
    const columns = db.prepare("PRAGMA table_info(projects)").all() as any[]
    const hasStepByStep = columns.some(col => col.name === 'step_by_step')

    if (!hasStepByStep) {
      db.exec(`
        ALTER TABLE projects ADD COLUMN step_by_step INTEGER DEFAULT 0
      `)
      console.log('✅ 数据库迁移完成：已添加 step_by_step 列')
    }
  } catch (error) {
    console.warn('⚠️  数据库迁移警告:', error)
  }
}

// 项目数据类型
export interface ProjectDB {
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
  outline_draft?: string
  step_by_step?: number
  status: 'pending' | 'running' | 'completed' | 'error'
  created_at: string
  updated_at: string
}

// 工作流数据类型
export interface WorkflowDB {
  id: string
  project_id: string
  current_step: string
  progress: number
  status: 'running' | 'completed' | 'error'
  started_at: string
  completed_at: string | null
  error_message: string | null
}

// 智能体执行记录类型
export interface AgentExecutionDB {
  id: string
  workflow_id: string
  agent_id: string
  agent_name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  result_data: string | null
}

// 设计结果类型
export interface DesignResultDB {
  id: string
  workflow_id: string
  result_type: string
  result_data: string
  created_at: string
}
