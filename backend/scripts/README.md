# 数据库查询指南 - 大纲细化数据

## 📍 数据库位置

```
backend/data/exhibition.db
```

## 🗄️ 表结构

### `design_results` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| workflow_id | TEXT | 关联的工作流ID |
| result_type | TEXT | **'outline'** (大纲细化) |
| result_data | TEXT | JSON格式的ExhibitionOutline数据 |
| created_at | TEXT | 创建时间 |

## 🔍 查询方法

### 方法1：使用便捷脚本（推荐）

```bash
# 在 backend 目录下执行
npm run query:outline
```

**输出内容**：
1. ✅ 所有设计结果类型统计
2. 📋 大纲细化记录列表
3. 📊 第一条大纲记录详情：
   - 展区数量、展品数量、互动装置数量
   - 展区列表（名称、占比、面积、功能）
   - 展品列表（前10件）
   - 完整JSON数据（格式化）
4. 🔗 关联的工作流信息

---

### 方法2：使用 SQLite 命令行

```bash
# 进入 backend 目录
cd backend

# 打开数据库
sqlite3 data/exhibition.db

# 查询所有大纲记录
SELECT id, workflow_id, created_at
FROM design_results
WHERE result_type = 'outline'
ORDER BY created_at DESC;

# 查看第一条记录的JSON数据（格式化）
SELECT result_data
FROM design_results
WHERE result_type = 'outline'
ORDER BY created_at DESC
LIMIT 1;
```

---

### 方法3：使用 SQL 脚本文件

```bash
# 在 backend 目录下执行
sqlite3 data/exhibition.db < scripts/query-outline.sql
```

---

## 📋 大纲数据结构

```json
{
  "conceptPlan": { /* 概念策划数据 */ },
  "zones": [
    {
      "id": "string",
      "name": "展区名称",
      "percentage": 25,
      "area": 150,
      "function": "功能描述",
      "exhibitIds": ["id1", "id2"],
      "interactiveIds": ["id1"],
      "budgetAllocation": 100000
    }
  ],
  "exhibits": [
    {
      "id": "string",
      "name": "展品名称",
      "type": "类型",
      "protectionLevel": "一级/二级/三级",
      "showcaseRequirement": "展柜要求",
      "dimensions": {
        "length": 1.5,
        "width": 0.8,
        "height": 1.2
      },
      "insurance": 5000,
      "transportCost": 3000
    }
  ],
  "interactivePlan": [
    {
      "id": "string",
      "name": "装置名称",
      "type": "AR/VR/触摸屏等",
      "priority": "high/medium/low",
      "zoneId": "展区ID",
      "estimatedCost": 50000,
      "description": "功能描述"
    }
  ],
  "budgetAllocation": {
    "total": 8740000,
    "breakdown": [
      {
        "category": "空间设计与施工",
        "amount": 2500000,
        "subCategories": [...]
      }
    ]
  },
  "spaceConstraints": {
    "totalArea": 1000,
    "minZoneCount": 4,
    "maxZoneCount": 8,
    "minAisleWidth": 2.5,
    "mainZoneRatio": 0.6
  }
}
```

---

## 🔧 常用查询示例

### 查询某个项目的大纲记录

```sql
SELECT dr.id, dr.result_data
FROM design_results dr
JOIN workflows w ON dr.workflow_id = w.id
WHERE w.project_id = '你的项目ID'
  AND dr.result_type = 'outline';
```

### 统计每个项目的大纲记录数量

```sql
SELECT p.id, p.title, COUNT(dr.id) as outline_count
FROM projects p
LEFT JOIN workflows w ON p.id = w.project_id
LEFT JOIN design_results dr ON w.id = dr.workflow_id AND dr.result_type = 'outline'
GROUP BY p.id;
```

### 查询最新生成的大纲记录

```sql
SELECT id, workflow_id, created_at, length(result_data) as data_size
FROM design_results
WHERE result_type = 'outline'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 💡 提示

1. **确认数据存在**：如果查询返回空结果，说明多智能体流程可能没有正确执行大纲细化节点
2. **查看日志**：检查 `backend/logs/info.log` 中是否有大纲细化相关的日志
3. **重新运行**：如果数据缺失，需要重新运行多智能体流程

---

## 🛠️ 故障排查

### 问题：查询返回空结果

**可能原因**：
1. 多智能体流程未完成大纲细化节点
2. 数据未正确保存到数据库
3. result_type 值不是 'outline'

**排查步骤**：
```sql
-- 1. 检查所有 result_type
SELECT DISTINCT result_type FROM design_results;

-- 2. 检查是否有 outline 类型
SELECT COUNT(*) FROM design_results WHERE result_type = 'outline';

-- 3. 查看最新的设计结果
SELECT result_type, created_at
FROM design_results
ORDER BY created_at DESC
LIMIT 10;
```
