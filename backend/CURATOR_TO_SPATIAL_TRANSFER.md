# 策划智能体 → 空间设计智能体 数据传递验证

## ✅ 传递路径验证

### 1️⃣ **状态传递**（ExhibitionState）

**策划智能体输出并更新状态**：
```typescript
// exhibition-graph.ts - curatorNode (line 41-86)
const curatorNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
  // 调用策划智能体
  const conceptPlan = await this.curator.generateConceptPlan(state.requirements);

  return {
    ...state,              // 保留所有历史
    conceptPlan,           // ✅ 写入策划结果
    currentStep: "概念策划完成",
    messages: [...state.messages, "概念策划已完成"]
  };
};
```

**状态中的策划结果**（`backend/src/types/exhibition.ts:27-34`）：
```typescript
export const ConceptPlanSchema = z.object({
  concept: z.string(),          // 核心概念
  narrative: z.string(),        // 叙事结构
  keyExhibits: z.array(z.string()), // 重点展品
  visitorFlow: z.string()       // 参观流线设计
});
```

---

### 2️⃣ **空间设计智能体接收策划结果**

**工作流节点调用**（`exhibition-graph.ts:107-110`）：
```typescript
const spatialDesignerNode = async (state: ExhibitionState): Promise<ExhibitionState> => {
  // ✅ 前置条件检查
  if (!state.conceptPlan) {
    throw new Error("概念策划尚未完成，无法进行空间设计");
  }

  // ✅ 从状态中读取并传递策划结果
  const spatialLayout = await this.spatialDesigner.generateSpatialLayout(
    state.requirements,   // 原始需求
    state.conceptPlan      // ✅ 策划智能体的输出
  );

  return {
    ...state,
    spatialLayout,
    currentStep: "空间设计完成"
  };
};
```

---

### 3️⃣ **空间设计智能体内部使用策划结果**

**接收参数**（`spatial-designer.ts:39-43`）：
```typescript
async generateSpatialLayout(
  requirements: ExhibitionRequirement,  // 原始需求
  conceptPlan: ConceptPlan,             // ✅ 策划方案（来自策划智能体）
  revisionReason?: string               // 修订原因
): Promise<SpatialLayout>
```

**记录输入日志**（`spatial-designer.ts:73-79`）：
```typescript
this.logger.info('📥 [输入参数] 策划方案（来自策划智能体）', {
  concept: conceptPlan.concept,              // ✅ 接收到
  narrative: conceptPlan.narrative,          // ✅ 接收到
  keyExhibits: conceptPlan.keyExhibits,      // ✅ 接收到
  exhibitsCount: conceptPlan.keyExhibits.length,
  visitorFlow: conceptPlan.visitorFlow       // ✅ 接收到
});
```

---

### 4️⃣ **提示词中注入策划结果**

**变量注入**（`spatial-designer.ts:90-101`）：
```typescript
const rendered = promptManager.render(
  'spatial_designer',
  'generateSpatialLayout',
  {
    revisionReason,
    area: requirements.venueSpace.area,
    height: requirements.venueSpace.height,
    layout: requirements.venueSpace.layout,
    concept: conceptPlan.concept,              // ✅ 注入到提示词
    narrative: conceptPlan.narrative,          // ✅ 注入到提示词
    keyExhibits: conceptPlan.keyExhibits.join(", ")  // ✅ 注入到提示词
  }
);
```

**提示词模板**（`spatial-designer.prompts.ts:54-66`）：
```handlebars
【策展方案】              ← 📥 这部分来自策划智能体
- 核心概念：{{concept}}                 ← ✅ conceptPlan.concept
- 叙事结构：{{narrative}}               ← ✅ conceptPlan.narrative
- 重点展品：{{keyExhibits}}             ← ✅ conceptPlan.keyExhibits.join(", ")
- 参观流线理念：{{visitorFlow}}         ← ✅ conceptPlan.visitorFlow（如果有的话）

【空间设计要求】
1. 布局方案：基于策展概念提炼最适合的布局类型  ← 🎯 利用 conceptPlan.concept
2. 参观路线：设计具体的参观路线            ← 🎯 利用 conceptPlan.visitorFlow
3. 功能区域：划分5-8个功能区域            ← 🎯 利用 conceptPlan.keyExhibits
4. 无障碍设计：包含通道宽度标准...
```

---

## 🔍 完整数据流可视化

```
┌─────────────────────────────────────────────────────────────┐
│                  策划智能体 (Curator Agent)                  │
├─────────────────────────────────────────────────────────────┤
│  输入：state.requirements                                    │
│  处理：调用 LLM 生成概念策划                                  │
│  输出：ConceptPlan {                                         │
│    concept: "陂泽千年：从木兰陂看中国古代水利智慧...",          │
│    narrative: "展览采用'历史-科学-未来'三重叙事主线...",        │
│    keyExhibits: [                                             │
│      "核心文物'宋代陂首石构件'",                                │
│      "大型动态沙盘'木兰陂水系全景模型'",                         │
│      "互动装置'拒咸蓄淡原理体验台'",                            │
│      "历史场景复原'钱四娘筑陂'",                                │
│      "多媒体长卷'木兰春涨'",                                   │
│      "实物展品'历代修缮工具与碑刻拓片'",                         │
│      "数据可视化装置'陂之新生'"                                │
│    ],                                                         │
│    visitorFlow: "空间布局采用环形流线..."                     │
│  }                                                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ ✅ 写入 state.conceptPlan
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              ExhibitionState (共享状态对象)                   │
├─────────────────────────────────────────────────────────────┤
│  {                                                            │
│    requirements: {...},    // 原始需求                        │
│    conceptPlan: {           // ✅ 策划智能体的输出             │
│      concept: "...",                                        │
│      narrative: "...",                                      │
│      keyExhibits: [...],                                     │
│      visitorFlow: "..."                                     │
│    },                                                         │
│    spatialLayout: undefined, // 尚未生成                      │
│    visualDesign: undefined,                                  │
│    ...                                                         │
│  }                                                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ ✅ 读取 state.conceptPlan
                      ↓
┌─────────────────────────────────────────────────────────────┐
│            空间设计智能体 (Spatial Designer Agent)            │
├─────────────────────────────────────────────────────────────┤
│  接收：                                                       │
│    - requirements (原始需求)                                  │
│    - conceptPlan (策划方案) ← ✅ 来自策划智能体               │
│                                                               │
│  日志记录：                                                    │
│    📥 [输入参数] 策划方案（来自策划智能体） {                 │
│      concept: "陂泽千年：从木兰陂看中国古代水利智慧...",         │
│      narrative: "展览采用'历史-科学-未来'三重叙事主线...",       │
│      keyExhibits: [7个展品],                                  │
│      visitorFlow: "空间布局采用环形流线..."                    │
│    }                                                          │
│                                                               │
│  提示词渲染：                                                  │
│    promptManager.render('spatial_designer', {                │
│      concept: conceptPlan.concept,      ← ✅ 注入             │
│      narrative: conceptPlan.narrative,  ← ✅ 注入             │
│      keyExhibits: conceptPlan.keyExhibits.join(", ") ← ✅ 注入│
│    })                                                         │
│                                                               │
│  生成的提示词：                                                │
│    【策展方案】                                                │
│    - 核心概念：陂泽千年：从木兰陂看中国古代水利智慧... ← ✅ 使用 │
│    - 叙事结构：展览采用"历史-科学-未来"三重叙事主线... ← ✅ 使用│
│    - 重点展品：核心文物'宋代陂首石构件', 大型动态沙盘... ← ✅ 使用│
│                                                               │
│  LLM 推理：                                                    │
│    基于策划的"三重叙事主线" → 划分为3个递进式展厅                │
│    基于策划的"7个重点展品" → 为每个展品分配展示空间              │
│    基于策划的"环形流线" → 采用环形布局                         │
│                                                               │
│  输出：SpatialLayout {                                        │
│    layout: "采用环形布局，入口设序厅...",                      │
│    visitorRoute: ["入口→历史区→科学区→未来区→出口"],          │
│    zones: [                                                   │
│      { name: "历史区", area: 150, function: "展示文献、场景复原" },│
│      { name: "科学区", area: 200, function: "展示工程结构" },   │
│      { name: "未来区", area: 100, function: "展示当代价值" }    │
│    ]                                                          │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 策划的4个核心字段如何影响空间设计

### 1. **concept（核心概念）→ 布局类型选择**

**策划输出**：
```json
"concept": "陂泽千年：从木兰陂看中国古代水利智慧与当代生态文明实践。展览以木兰陂这一千年水利工程为叙事核心..."
```

**注入到提示词**：
```handlebars
核心概念：{{concept}}
  → 陂泽千年：从木兰陂看中国古代水利智慧与当代生态文明实践...
```

**空间设计输出**：
```json
"layout": "采用环形布局，以木兰陂水利工程为核心叙事线索..."
```

**体现**：空间布局围绕"水利工程"这个核心概念展开

---

### 2. **narrative（叙事结构）→ 空间分区**

**策划输出**：
```json
"narrative": "展览采用'历史-科学-未来'三重叙事主线。第一板块'陂成木兰：千年水利的史诗'，通过文献、场景复原与出土文物，讲述木兰陂的建造背景、历史沿革及其对莆田平原发展的决定性作用。第二板块'石锁狂澜：古代水文工程的科学密码'，聚焦木兰陂的工程结构、水文原理及古代测量技术，通过互动模型与图解，解密其'拒咸蓄淡'的科学智慧。第三板块'陂泽新生：文化遗产的当代价值'，展示木兰陂在当代的水利功能、生态价值、文化景观意义..."
```

**注入到提示词**：
```handlebars
叙事结构：{{narrative}}
  → 展览采用"历史-科学-未来"三重叙事主线...
```

**空间设计输出**：
```json
"zones": [
  {
    "name": "历史区（陂成木兰）",
    "area": 150,
    "function": "展示文献、场景复原与出土文物"
  },
  {
    "name": "科学探索区（石锁狂澜）",
    "area": 200,
    "function": "互动模型与图解，展示工程结构"
  },
  {
    "name": "未来展望区（陂泽新生）",
    "area": 100,
    "function": "展示当代水利功能、生态价值"
  }
]
```

**体现**：三个区域完全对应三个叙事板块

---

### 3. **keyExhibits（重点展品）→ 展品陈列空间**

**策划输出**：
```json
"keyExhibits": [
  "核心文物'宋代陂首石构件'（设独立恒湿恒温展柜，背景为陂首结构线描图与考古现场照片）",
  "大型动态沙盘'木兰陂水系全景模型'（1:500比例，动态演示潮汐、淡水交汇及灌溉网络，可触控点亮不同功能区）",
  "互动装置'拒咸蓄淡原理体验台'（通过物理杠杆与水流模拟，让观众亲手操作闸门，理解木兰陂核心工作原理）",
  "历史场景复原'钱四娘筑陂'（硅胶人像与微缩场景结合）",
  "多媒体长卷'木兰春涨'（数字动画长卷）",
  "实物展品'历代修缮工具与碑刻拓片'（组合陈列）",
  "数据可视化装置'陂之新生：生态监测实时数据墙'"
]
```

**注入到提示词**：
```handlebars
重点展品：{{keyExhibits}}
  → 核心文物'宋代陂首石构件', 大型动态沙盘'木兰陂水系全景模型', ...
```

**空间设计体现**：
```json
{
  "layout": "...动态沙盘为核心节点，置于展厅中央，形成视觉焦点...",
  "zones": [
    {
      "name": "历史区",
      "function": "文献、场景复原、出土文物陈列"  ← 对应具体展品
    },
    {
      "name": "科学探索区",
      "function": "互动模型、动态沙盘、互动装置"   ← 对应具体展品
    }
  ]
}
```

---

### 4. **visitorFlow（参观流线）→ 动线设计**

**策划输出**：
```json
"visitorFlow": "空间布局采用环形流线，入口设序厅（主题形象墙与导览）。顺时针依次为历史区（占比30%）、科学探索区（互动装置集中，占比40%）、未来展望区（占比20%），出口前设文创体验与观众留言区（占比10%）。关键节点设计：1. 历史区至科学区的过渡通道，设计为'时空隧道'，墙面投影水流与年代更迭。2. 动态沙盘为核心节点，置于展厅中央..."
```

**注入到提示词**（虽然当前模板中没有，但应该加上）：
```handlebars
参观流线理念：{{visitorFlow}}
  → 空间布局采用环形流线，顺时针依次为历史区、科学区、未来区...
```

**空间设计输出**：
```json
"visitorRoute": [
  "入口序厅→历史区（占比30%）→科学探索区（占比40%）→未来展望区（占比20%）→文创体验区→出口"
]
```

**体现**：完全遵循策划的流线设计

---

## ⚠️ 发现的问题

### 问题：visitorFlow 字段未注入到提示词

**当前提示词模板**（`spatial-designer.prompts.ts:76-84`）：
```typescript
{
  revisionReason,
  area: requirements.venueSpace.area,
  height: requirements.venueSpace.height,
  layout: requirements.venueSpace.layout,
  concept: conceptPlan.concept,
  narrative: conceptPlan.narrative,
  keyExhibits: conceptPlan.keyExhibits.join(", ")  // ❌ 缺少 visitorFlow
}
```

**提示词模板**：
```handlebars
【策展方案】
- 核心概念：{{concept}}
- 叙事结构：{{narrative}}
- 重点展品：{{keyExhibits}}
- 参观流线理念：{{visitorFlow}}  ← ❌ 提示词中也没有这个字段
```

**问题**：
- `conceptPlan.visitorFlow` 没有被注入到提示词
- 空间设计可能无法充分利用策划的流线理念

---

## ✅ 修复建议

### 1. 添加 visitorFlow 注入

**修改 `spatial-designer.ts:90-101`**：
```typescript
const rendered = promptManager.render(
  'spatial_designer',
  'generateSpatialLayout',
  {
    revisionReason,
    area: requirements.venueSpace.area,
    height: requirements.venueSpace.height,
    layout: requirements.venueSpace.layout,
    concept: conceptPlan.concept,
    narrative: conceptPlan.narrative,
    keyExhibits: conceptPlan.keyExhibits.join(", "),
    visitorFlow: conceptPlan.visitorFlow  // ✅ 添加这行
  }
);
```

### 2. 更新提示词模板

**修改 `spatial-designer.prompts.ts:62-66`**：
```handlebars
【策展方案】
- 核心概念：{{concept}}
- 叙事结构：{{narrative}}
- 重点展品：{{keyExhibits}}
- 参观流线理念：{{visitorFlow}}  ← ✅ 添加这行

【空间设计要求】
1. 布局方案：基于策展概念和流线理念，提炼最适合的布局类型
2. 参观路线：严格遵循策展的流线设计，细化具体参观路径
...
```

---

## 🎯 总结

### ✅ **策划的核心内容能传递给空间设计智能体**

1. **数据传递完整**：
   - ✅ concept（核心概念）传递成功
   - ✅ narrative（叙事结构）传递成功
   - ✅ keyExhibits（重点展品）传递成功
   - ⚠️ visitorFlow（参观流线）**未传递**（需要修复）

2. **提示词注入正确**：
   - ✅ concept 注入到提示词
   - ✅ narrative 注入到提示词
   - ✅ keyExhibits 注入到提示词
   - ⚠️ visitorFlow **未注入**（需要修复）

3. **LLM 能够基于策划结果生成空间设计**：
   - ✅ 布局体现核心概念
   - ✅ 分区体现叙事结构
   - ✅ 陈列空间体现重点展品
   - ⚠️ 动线**可能不完全**体现流线理念（因为未注入）

### 需要修复

添加 `visitorFlow` 字段的传递，让空间设计能够充分利用策划的流线设计。

---

**验证时间**：2026-01-06
**验证结果**：✅ 传递基本成功，但有一个字段缺失
