/**
 * 查询数据库中的大纲细化记录
 * 使用方法: npx ts-node scripts/query-outline.ts
 */

import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'exhibition.db')
const db = new Database(dbPath)

console.log('📊 数据库路径:', dbPath)
console.log('')

// 1. 查询所有结果类型统计
console.log('=== 1. 所有设计结果类型统计 ===')
const typeStats = db.prepare(`
  SELECT result_type, COUNT(*) as count, MAX(created_at) as latest
  FROM design_results
  GROUP BY result_type
  ORDER BY result_type
`).all()

console.table(typeStats)
console.log('')

// 2. 查询大纲细化记录
console.log('=== 2. 大纲细化记录列表 ===')
const outlineRecords = db.prepare(`
  SELECT id, workflow_id, created_at
  FROM design_results
  WHERE result_type = 'outline'
  ORDER BY created_at DESC
`).all()

if (outlineRecords.length === 0) {
  console.log('❌ 没有找到大纲细化记录 (result_type="outline")')
} else {
  console.log(`✅ 找到 ${outlineRecords.length} 条大纲细化记录`)
  console.table(outlineRecords)

  // 3. 显示第一条大纲记录的详细信息
  console.log('\n=== 3. 第一条大纲记录详情 ===')
  const firstOutline = db.prepare(`
    SELECT result_data
    FROM design_results
    WHERE result_type = 'outline'
    ORDER BY created_at DESC
    LIMIT 1
  `).get() as { result_data: string }

  if (firstOutline) {
    try {
      const outline = JSON.parse(firstOutline.result_data)
      console.log('📋 大纲数据概要:')
      console.log('  - 展区数量:', outline.zones?.length || 0)
      console.log('  - 展品数量:', outline.exhibits?.length || 0)
      console.log('  - 互动装置数量:', outline.interactivePlan?.length || 0)
      console.log('  - 预算框架:', outline.budgetAllocation ? '✅' : '❌')
      console.log('  - 空间约束:', outline.spaceConstraints ? '✅' : '❌')

      if (outline.zones && outline.zones.length > 0) {
        console.log('\n🏛️  展区列表:')
        outline.zones.forEach((z: any, idx: number) => {
          console.log(`  ${idx + 1}. ${z.name} (${z.percentage}%): ${z.area}㎡ - ${z.function}`)
        })
      }

      if (outline.exhibits && outline.exhibits.length > 0) {
        console.log('\n🎨 展品列表（前10件）:')
        outline.exhibits.slice(0, 10).forEach((e: any, idx: number) => {
          console.log(`  ${idx + 1}. ${e.name} (${e.type}, 保护等级: ${e.protectionLevel})`)
        })
        if (outline.exhibits.length > 10) {
          console.log(`  *注：共 ${outline.exhibits.length} 件展品，以上仅展示前 10 件`)
        }
      }

      console.log('\n💾 完整JSON数据（格式化）:')
      console.log(JSON.stringify(outline, null, 2))
    } catch (e) {
      console.error('❌ 解析JSON失败:', e)
      console.log('原始数据:', firstOutline.result_data)
    }
  }
}

console.log('\n=== 4. 关联的工作流信息 ===')
const workflowInfo = db.prepare(`
  SELECT w.id, w.project_id, w.status, w.current_step, w.progress
  FROM workflows w
  WHERE w.id IN (
    SELECT DISTINCT workflow_id
    FROM design_results
    WHERE result_type = 'outline'
  )
`).all()

if (workflowInfo.length > 0) {
  console.table(workflowInfo)
}

db.close()
