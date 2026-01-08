const Database = require('better-sqlite3');
const db = new Database('data/exhibition.db');

// 查看所有项目
const projects = db.prepare('SELECT id, title FROM projects LIMIT 5').all();
console.log('项目列表:');
projects.forEach(p => console.log(`- ${p.id}: ${p.title}`));

// 查看所有设计结果
const results = db.prepare(`
  SELECT id, workflow_id, result_type, 
         substr(result_data, 1, 300) as preview
  FROM design_results 
  LIMIT 5
`).all();

console.log('\n设计结果预览:');
results.forEach(r => {
  console.log(`\n${r.result_type} (workflow: ${r.workflow_id}):`);
  console.log(r.preview);
});

db.close();
