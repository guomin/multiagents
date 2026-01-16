import { db } from '../src/database/schema'
import { createLogger } from '../src/utils/logger'

const logger = createLogger('CHECK-WORKFLOW-RESULTS')

// 从命令行参数获取 projectId
const projectId = process.argv[2]

if (!projectId) {
  console.error('❌ 请提供 projectId 作为参数')
  console.log('用法: npm run check-results <projectId>')
  process.exit(1)
}

try {
  console.log(`\n📊 检查项目 ${projectId} 的工作流和结果数据\n`)

  // 1. 检查项目是否存在
  const projectStmt = db.prepare('SELECT * FROM projects WHERE id = ?')
  const project = projectStmt.get(projectId)

  if (!project) {
    console.log('❌ 项目不存在')
    process.exit(1)
  }

  console.log('✅ 项目信息:')
  console.table([project])

  // 2. 获取该项目的所有工作流
  const workflowStmt = db.prepare('SELECT * FROM workflows WHERE project_id = ? ORDER BY started_at DESC')
  const workflows = workflowStmt.all(projectId)

  if (!workflows || workflows.length === 0) {
    console.log('\n❌ 该项目没有工作流记录')
    process.exit(0)
  }

  console.log(`\n📋 找到 ${workflows.length} 个工作流:`)
  console.table(workflows.map(w => ({
    id: w.id,
    status: w.status,
    current_step: w.current_step,
    progress: w.progress,
    started_at: w.started_at,
    completed_at: w.completed_at
  })))

  // 3. 检查每个工作流的设计结果
  workflows.forEach((workflow, index) => {
    console.log(`\n🔍 工作流 #${index + 1} (${workflow.id}) 的设计结果:`)

    const resultStmt = db.prepare('SELECT result_type, created_at, length(result_data) as data_size FROM design_results WHERE workflow_id = ? ORDER BY created_at')
    const results = resultStmt.all(workflow.id)

    if (!results || results.length === 0) {
      console.log('  ⚠️  该工作流没有设计结果记录')
    } else {
      console.log('  ✅ 设计结果:')
      console.table(results)
    }
  })

  // 4. 详细检查最新工作流的每种结果类型
  const latestWorkflow = workflows[0]
  console.log(`\n🎯 最新工作流 (${latestWorkflow.id}) 的详细结果检查:`)

  const resultTypes = ['concept', 'outline', 'spatial', 'visual', 'interactive', 'budget', 'report']
  resultTypes.forEach(type => {
    const detailStmt = db.prepare('SELECT * FROM design_results WHERE workflow_id = ? AND result_type = ?')
    const result = detailStmt.get(latestWorkflow.id, type)

    if (result) {
      console.log(`  ✅ ${type}: 存在 (${result.created_at})`)
    } else {
      console.log(`  ❌ ${type}: 不存在`)
    }
  })

  console.log('\n')

} catch (error) {
  logger.error('❌ 检查失败', error as Error)
  process.exit(1)
}
