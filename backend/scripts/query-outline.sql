-- 查询数据库中的大纲细化记录
-- 使用方法: sqlite3 backend/data/exhibition.db < scripts/query-outline.sql

-- 1. 查看所有结果类型统计
.mode column
.headers on
SELECT result_type as '结果类型', COUNT(*) as '数量', MAX(created_at) as '最新时间'
FROM design_results
GROUP BY result_type
ORDER BY result_type;

-- 输出空行
SELECT '';

-- 2. 查询大纲细化记录列表
SELECT '=== 大纲细化记录列表 ===' as '';
SELECT id as 'ID', workflow_id as '工作流ID', created_at as '创建时间'
FROM design_results
WHERE result_type = 'outline'
ORDER BY created_at DESC;

-- 3. 查询第一条大纲记录的JSON数据
SELECT '';
SELECT '=== 第一条大纲记录完整数据 ===' as '';
SELECT result_data
FROM design_results
WHERE result_type = 'outline'
ORDER BY created_at DESC
LIMIT 1;
