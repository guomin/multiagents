const Database = require('better-sqlite3');
const db = new Database('data/exhibition.db');

// 查看设计结果表的数据
const results = db.prepare(`
  SELECT id, result_type, 
         substr(result_data, 1, 200) as preview
  FROM design_results 
  WHERE workflow_id = '35b97988-ae2a-4e23-85c6-74a65795a6ee'
  ORDER BY created_at
`).all();

console.log('设计结果数据:');
results.forEach(r => {
  console.log(`\n${r.result_type}:`);
  console.log(r.preview);
});

db.close();
