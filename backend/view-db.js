const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'exhibition.db');
const db = new Database(dbPath);

console.log('=== 项目列表 ===');
const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC LIMIT 10').all();
projects.forEach(p => {
  console.log(`\n📁 项目ID: ${p.id}`);
  console.log(`   标题: ${p.title}`);
  console.log(`   主题: ${p.theme}`);
  console.log(`   状态: ${p.status}`);
  console.log(`   创建时间: ${p.created_at}`);
});

if (projects.length > 0) {
  const latestProject = projects[0];
  console.log('\n\n=== 最新项目详情 ===');

  const workflows = db.prepare('SELECT * FROM workflows WHERE project_id = ?').all(latestProject.id);
  if (workflows.length > 0) {
    const workflow = workflows[0];
    console.log(`工作流ID: ${workflow.id}`);
    console.log(`状态: ${workflow.status}`);
    console.log(`进度: ${workflow.progress}%`);

    console.log('\n=== 设计结果 ===');
    const results = db.prepare('SELECT result_type, result_data FROM design_results WHERE workflow_id = ?').all(workflow.id);
    results.forEach(r => {
      console.log(`\n${r.result_type}:`);
      console.log(JSON.parse(r.result_data));
    });
  }
}

db.close();
