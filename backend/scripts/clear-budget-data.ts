import { db } from '../src/database/index'
import { createLogger } from '../src/utils/logger'

const logger = createLogger('CLEAR-BUDGET-DATA')

try {
  // 查看当前的budget_estimate数据
  const stmt = db.prepare('SELECT id, workflow_id, created_at, substr(result_data, 1, 500) as preview FROM design_results WHERE result_type = ? ORDER BY created_at DESC LIMIT 5')
  const results = stmt.all('budget_estimate')

  console.log('📊 当前数据库中的budget_estimate记录:')
  console.table(results)

  // 如果发现乱码数据，删除它们
  const deleteStmt = db.prepare('DELETE FROM design_results WHERE result_type = ? AND json_extract(result_data, "$.totalCost") NOT LIKE "[0-9]%"')
  const info = deleteStmt.run('budget_estimate')

  console.log(`✅ 已删除 ${info.changes} 条乱码记录`)

  // 验证修复后的数据
  const validStmt = db.prepare('SELECT id, json_extract(result_data, "$.totalCost") as totalCost FROM design_results WHERE result_type = ? ORDER BY created_at DESC LIMIT 5')
  const validResults = validStmt.all('budget_estimate')

  console.log('📊 修复后的budget_estimate记录:')
  console.table(validResults)

} catch (error) {
  logger.error('❌ 清除数据失败', error as Error)
  process.exit(1)
}
