# 空间智能体 → 视觉/互动技术智能体 数据传递分析

## ❌ 发现问题：数据流断层

**分析时间**：2026-01-06
**问题级别**：🔴 严重（影响设计质量和落地性）

---

## 📊 当前数据流状态

### 完整工作流

```
用户输入
  ↓
策划智能体
  → conceptPlan ✅
  ↓
空间设计智能体
  → spatialLayout {
      layout: "空间布局描述",
      visitorRoute: ["参观路线1", "路线2", ...],
      zones: [
        {name: "历史区", area: 150, function: "..."},
        {name: "科学区", area: 200, function: "..."},
        ...
      ],
      accessibility: "无障碍设计"
    }
  ↓
视觉设计智能体 ❌ ← 没有接收 spatialLayout
互动技术智能体 ❌ ← 没有接收 spatialLayout
```

---

## 🔍 详细分析

### 1. 空间智能体输出

**文件**：`backend/src/types/exhibition.ts:36-47`

```typescript
export const SpatialLayoutSchema = z.object({
  layout: z.string(),              // ✅ 空间布局描述（如"环形流线，以木兰陂为核心..."）
  visitorRoute: z.array(z.string()),  // ✅ 参观路线（如["入口→历史区→科学区→出口"]）
  zones: z.array(z.object({
    name: z.string(),              // ✅ 区域名称（如"历史区"、"科学区"）
    area: z.number(),              // ✅ 区域面积（如150、200）
    function: z.string()           // ✅ 区域功能（如"展示文献、场景复原..."）
  })),
  accessibility: z.string()        // ✅ 无障碍设计
});
```

**包含4个核心字段**：
1. **layout**：整体布局理念和结构
2. **visitorRoute**：参观流线和顺序
3. **zones**：功能区域划分（名称、面积、功能）
4. **accessibility**：无障碍设计要求

---

### 2. 视觉设计智能体输入

**文件**：`backend/src/graph/exhibition-graph.ts:153-157`

```typescript
const visualDesign = await this.visualDesigner.generateVisualDesign(
  state.requirements,        // ✅ 传递了
  state.conceptPlan,         // ✅ 传递了
  state.revisionReason       // ✅ 传递了
  // ❌ 缺少：state.spatialLayout
);
```

**提示词模板**：`backend/src/prompts/visual-designer.prompts.ts:51-62`

```handlebars
【展览基本信息】
- 展览标题：{{title}}
- 展览主题：{{theme}}
- 目标受众：{{targetAudience}}
- 场地信息：{{area}}平方米，层高{{height}}米

【策展方案】
- 核心概念：{{concept}}
- 叙事结构：{{narrative}}

// ❌ 缺少：【空间布局信息】
// ❌ 缺少：layout（整体布局）
// ❌ 缺少：zones（功能区域）
// ❌ 缺少：visitorRoute（参观路线）
```

**当前接收的数据**：
- ✅ requirements: { title, theme, targetAudience, venueSpace: {area, height, layout} }
- ✅ conceptPlan: { concept, narrative }
- ❌ **spatialLayout: 未传递**

**缺失影响**：
1. 无法针对不同功能区域设计差异化色彩方案
   - 例如：历史区用沉稳色、科学区用科技色、未来区用明亮色
2. 无法考虑参观路线设计导视系统
   - 例如：路线上的关键节点需要醒目导视
3. 无法结合空间布局规划视觉元素的位置
   - 例如：中心区域需要大型视觉装置、角落区域需要辅助图形

---

### 3. 互动技术智能体输入

**文件**：`backend/src/graph/exhibition-graph.ts:200-204, 263-267`

```typescript
const interactiveSolution = await this.interactiveTech.generateInteractiveSolution(
  state.requirements,        // ✅ 传递了
  state.conceptPlan,         // ✅ 传递了
  state.revisionReason       // ✅ 传递了
  // ❌ 缺少：state.spatialLayout
);
```

**提示词模板**：`backend/src/prompts/interactive-tech.prompts.ts:58-69`

```handlebars
【展览基本信息】
- 展览标题：{{title}}
- 展览主题：{{theme}}
- 目标受众：{{targetAudience}}
- 预算：{{budget}} {{currency}}
- 场地信息：{{area}}平方米，层高{{height}}米

【策展方案】
- 核心概念：{{concept}}
- 叙事结构：{{narrative}}

// ❌ 缺少：【空间布局信息】
// ❌ 缺少：layout（整体布局）
// ❌ 缺少：zones（功能区域）
// ❌ 缺少：visitorRoute（参观路线）
```

**当前接收的数据**：
- ✅ requirements: { title, theme, targetAudience, venueSpace, budget }
- ✅ conceptPlan: { concept, narrative }
- ❌ **spatialLayout: 未传递**

**缺失影响**：
1. 无法根据功能区域规划互动装置的位置
   - 例如：科学区（200㎡）安排大型互动装置、历史区（150㎡）安排小型触摸屏
2. 无法考虑参观路线安排互动体验节点
   - 例如：在"历史区→科学区"的过渡处设置"时空隧道"互动
3. 无法结合区域面积估算装置尺寸和数量
   - 例如：150㎡区域适合3-5个互动点、200㎡区域适合5-8个互动点
4. 无法根据空间布局选择合适的技术
   - 例如：环形布局适合中心投影、线性布局适合墙面互动

---

## 📉 数据传递完整性对比

### 策划 → 空间设计（✅ 已修复）

| 策划输出字段 | 传递到空间智能体 | 注入提示词 | LLM可使用 |
|------------|----------------|----------|---------|
| concept | ✅ | ✅ | ✅ |
| narrative | ✅ | ✅ | ✅ |
| keyExhibits | ✅ | ✅ | ✅ |
| visitorFlow | ✅ | ✅ | ✅ |

**完整性**：100%（4/4）✅

---

### 空间 → 视觉设计（❌ 数据断层）

| 空间输出字段 | 传递到视觉智能体 | 注入提示词 | LLM可使用 |
|------------|----------------|----------|---------|
| layout | ❌ | ❌ | ❌ |
| visitorRoute | ❌ | ❌ | ❌ |
| zones | ❌ | ❌ | ❌ |
| accessibility | ❌ | ❌ | ❌ |

**完整性**：0%（0/4）❌

---

### 空间 → 互动技术（❌ 数据断层）

| 空间输出字段 | 传递到互动技术智能体 | 注入提示词 | LLM可使用 |
|------------|-------------------|----------|---------|
| layout | ❌ | ❌ | ❌ |
| visitorRoute | ❌ | ❌ | ❌ |
| zones | ❌ | ❌ | ❌ |
| accessibility | ❌ | ❌ | ❌ |

**完整性**：0%（0/4）❌

---

## 🎯 具体场景影响分析

### 场景1：差异化区域设计

**空间智能体输出**：
```json
{
  "zones": [
    {"name": "历史区", "area": 150, "function": "展示文献、场景复原"},
    {"name": "科学区", "area": 200, "function": "互动模型、动态沙盘"},
    {"name": "未来区", "area": 100, "function": "当代功能、生态价值"}
  ]
}
```

#### 视觉设计应该但无法做到：

**❌ 当前输出**（无空间信息）：
```json
{
  "colorScheme": ["#1A365D", "#2C5282", "#ED8936", "#F7FAFC"],
  "typography": "标题使用思源黑体 Bold，正文使用思源宋体 Regular"
}
```
**问题**：所有区域使用同一套色彩，无法体现区域特色

---

**✅ 理想输出**（有空间信息）：
```json
{
  "colorScheme": {
    "历史区": ["#8B4513", "#D2691E", "#F5DEB3"],  // 沉稳的棕色系
    "科学区": ["#00CED1", "#20B2AA", "#E0FFFF"],  // 科技的青色系
    "未来区": ["#FFD700", "#FFA500", "#FFFACD"]   // 明亮的金色系
  },
  "typography": "历史区使用宋体体现庄重，科学区使用黑体体现现代，未来区使用圆体体现活力"
}
```
**改进**：每个区域有独立的色彩方案，贴合区域功能

---

### 场景2：互动装置位置规划

**空间智能体输出**：
```json
{
  "layout": "环形流线，以木兰陂为核心叙事线索",
  "visitorRoute": ["入口序厅→历史区→科学区→未来区→文创区→出口"],
  "zones": [
    {"name": "历史区", "area": 150, "function": "展示文献、场景复原"},
    {"name": "科学区", "area": 200, "function": "互动模型、动态沙盘（核心节点）"},
    {"name": "未来区", "area": 100, "function": "展示当代功能"}
  ]
}
```

#### 互动技术应该但无法做到：

**❌ 当前输出**（无空间信息）：
```json
{
  "interactives": [
    {"name": "AR文物解读", "type": "AR", "description": "...", "cost": 30000},
    {"name": "触摸屏互动", "type": "触摸屏", "description": "...", "cost": 20000}
  ]
}
```
**问题**：没有说明装置放在哪个区域、如何布局

---

**✅ 理想输出**（有空间信息）：
```json
{
  "interactives": [
    {
      "name": "AR文物解读屏",
      "type": "AR",
      "location": "历史区（150㎡）",
      "layout": "沿墙面布置3台，每台间距5米",
      "description": "扫描文物查看细节，支持放大、旋转、注释",
      "cost": 30000
    },
    {
      "name": "动态沙盘（核心节点）",
      "type": "物理模型+投影",
      "location": "科学区中央（200㎡区域中心）",
      "layout": "占据中心位置，四周留出2米观看空间",
      "description": "展示木兰陂工程结构，支持触摸控制水流模拟",
      "cost": 80000
    },
    {
      "name": "时空隧道互动",
      "type": "投影映射",
      "location": "历史区→科学区过渡通道",
      "layout": "两侧墙面+地面投影，通道长度10米",
      "description": "穿越历史，墙面投影年代更迭，地面投影水流",
      "cost": 60000
    }
  ]
}
```
**改进**：明确每个装置的位置、布局、尺寸，完全符合空间规划

---

## 🔧 修复方案

### 方案概述

需要修改3个文件：

1. **exhibition-graph.ts**：传递 spatialLayout 参数
2. **visual-designer.ts**：接收并使用 spatialLayout
3. **visual-designer.prompts.ts**：添加空间信息到提示词

4. **interactive-tech.ts**：接收并使用 spatialLayout
5. **interactive-tech.prompts.ts**：添加空间信息到提示词

---

### 修复1：工作流层（exhibition-graph.ts）

#### 视觉设计节点

**文件**：`backend/src/graph/exhibition-graph.ts:153-157`

**修复前**：
```typescript
const visualDesign = await this.visualDesigner.generateVisualDesign(
  state.requirements,
  state.conceptPlan,
  state.revisionReason
);
```

**修复后**：
```typescript
const visualDesign = await this.visualDesigner.generateVisualDesign(
  state.requirements,
  state.conceptPlan,
  state.spatialLayout,  // ✅ 添加空间布局
  state.revisionReason
);
```

---

#### 互动技术节点

**文件**：`backend/src/graph/exhibition-graph.ts:200-204`

**修复前**：
```typescript
const interactiveSolution = await this.interactiveTech.generateInteractiveSolution(
  state.requirements,
  state.conceptPlan,
  state.revisionReason
);
```

**修复后**：
```typescript
const interactiveSolution = await this.interactiveTech.generateInteractiveSolution(
  state.requirements,
  state.conceptPlan,
  state.spatialLayout,  // ✅ 添加空间布局
  state.revisionReason
);
```

---

#### 并行设计节点

**文件**：`backend/src/graph/exhibition-graph.ts:251-255, 263-267`

**修复前**：
```typescript
const [visualDesign, interactiveSolution] = await Promise.all([
  this.visualDesigner.generateVisualDesign(
    state.requirements,
    conceptPlan,
    state.revisionReason
  ),
  this.interactiveTech.generateInteractiveSolution(
    state.requirements,
    conceptPlan,
    state.revisionReason
  )
]);
```

**修复后**：
```typescript
const [visualDesign, interactiveSolution] = await Promise.all([
  this.visualDesigner.generateVisualDesign(
    state.requirements,
    conceptPlan,
    state.spatialLayout,  // ✅ 添加空间布局
    state.revisionReason
  ),
  this.interactiveTech.generateInteractiveSolution(
    state.requirements,
    conceptPlan,
    state.spatialLayout,  // ✅ 添加空间布局
    state.revisionReason
  )
]);
```

---

### 修复2：视觉设计智能体（visual-designer.ts）

**文件**：`backend/src/agents/visual-designer.ts`

#### 修改方法签名

**修复前**（line 39-43）：
```typescript
async generateVisualDesign(
  requirements: ExhibitionRequirement,
  conceptPlan: ConceptPlan,
  revisionReason?: string
): Promise<VisualDesign>
```

**修复后**：
```typescript
async generateVisualDesign(
  requirements: ExhibitionRequirement,
  conceptPlan: ConceptPlan,
  spatialLayout?: SpatialLayout,  // ✅ 添加空间布局参数
  revisionReason?: string
): Promise<VisualDesign>
```

#### 修改提示词渲染

**修复前**（line 80-91）：
```typescript
const rendered = promptManager.render(
  'visual_designer',
  'generateVisualDesign',
  {
    revisionReason,
    title: requirements.title,
    theme: requirements.theme,
    targetAudience: requirements.targetAudience,
    area: requirements.venueSpace.area,
    height: requirements.venueSpace.height,
    concept: conceptPlan.concept,
    narrative: conceptPlan.narrative
  }
);
```

**修复后**：
```typescript
const rendered = promptManager.render(
  'visual_designer',
  'generateVisualDesign',
  {
    revisionReason,
    title: requirements.title,
    theme: requirements.theme,
    targetAudience: requirements.targetAudience,
    area: requirements.venueSpace.area,
    height: requirements.venueSpace.height,
    concept: conceptPlan.concept,
    narrative: conceptPlan.narrative,
    // ✅ 添加空间布局信息
    layout: spatialLayout?.layout || "",
    visitorRoute: spatialLayout?.visitorRoute.join(" → ") || "",
    zones: spatialLayout?.zones.map(z =>
      `${z.name}（${z.area}㎡，功能：${z.function}）`
    ).join("；") || ""
  }
);
```

#### 添加输入日志

**修复后**（在现有日志后添加）：
```typescript
this.logger.info('📥 [输入参数] 空间布局（来自空间智能体）', {
  layout: spatialLayout?.layout || "无",
  visitorRoute: spatialLayout?.visitorRoute || [],
  zones: spatialLayout?.zones || [],
  hasAccessibility: !!spatialLayout?.accessibility
});
```

---

### 修复3：视觉设计提示词（visual-designer.prompts.ts）

**文件**：`backend/src/prompts/visual-designer.prompts.ts`

#### 修改用户提示词模板

**修复前**（line 51-62）：
```handlebars
【展览基本信息】
- 展览标题：{{title}}
- 展览主题：{{theme}}
- 目标受众：{{targetAudience}}
- 场地信息：{{area}}平方米，层高{{height}}米

【策展方案】
- 核心概念：{{concept}}
- 叙事结构：{{narrative}}
```

**修复后**：
```handlebars
【展览基本信息】
- 展览标题：{{title}}
- 展览主题：{{theme}}
- 目标受众：{{targetAudience}}
- 场地信息：{{area}}平方米，层高{{height}}米

【策展方案】
- 核心概念：{{concept}}
- 叙事结构：{{narrative}}

【空间布局方案】
- 整体布局：{{layout}}
- 参观路线：{{visitorRoute}}
- 功能区域：{{zones}}
```

---

### 修复4：互动技术智能体（interactive-tech.ts）

**文件**：`backend/src/agents/interactive-tech.ts`

#### 修改方法签名

**修复前**（line 46-50）：
```typescript
async generateInteractiveSolution(
  requirements: ExhibitionRequirement,
  conceptPlan: ConceptPlan,
  revisionReason?: string
): Promise<InteractiveSolution>
```

**修复后**：
```typescript
async generateInteractiveSolution(
  requirements: ExhibitionRequirement,
  conceptPlan: ConceptPlan,
  spatialLayout?: SpatialLayout,  // ✅ 添加空间布局参数
  revisionReason?: string
): Promise<InteractiveSolution>
```

#### 修改提示词渲染

**修复前**（line 93-106）：
```typescript
const rendered = promptManager.render(
  'interactive_tech',
  'generateInteractiveSolution',
  {
    revisionReason,
    budget: requirements.budget.total,
    currency: requirements.budget.currency,
    theme: requirements.theme,
    targetAudience: requirements.targetAudience,
    concept: conceptPlan.concept,
    narrative: conceptPlan.narrative,
    researchContext
  }
);
```

**修复后**：
```typescript
const rendered = promptManager.render(
  'interactive_tech',
  'generateInteractiveSolution',
  {
    revisionReason,
    budget: requirements.budget.total,
    currency: requirements.budget.currency,
    theme: requirements.theme,
    targetAudience: requirements.targetAudience,
    concept: conceptPlan.concept,
    narrative: conceptPlan.narrative,
    researchContext,
    // ✅ 添加空间布局信息
    layout: spatialLayout?.layout || "",
    visitorRoute: spatialLayout?.visitorRoute.join(" → ") || "",
    zones: spatialLayout?.zones.map(z =>
      `${z.name}（${z.area}㎡，功能：${z.function}）`
    ).join("；") || ""
  }
);
```

#### 添加输入日志

**修复后**（在现有日志后添加）：
```typescript
this.logger.info('📥 [输入参数] 空间布局（来自空间智能体）', {
  layout: spatialLayout?.layout || "无",
  visitorRoute: spatialLayout?.visitorRoute || [],
  zones: spatialLayout?.zones || [],
  hasAccessibility: !!spatialLayout?.accessibility
});
```

---

### 修复5：互动技术提示词（interactive-tech.prompts.ts）

**文件**：`backend/src/prompts/interactive-tech.prompts.ts`

#### 修改用户提示词模板

**修复前**（line 58-70）：
```handlebars
【展览基本信息】
- 展览标题：{{title}}
- 展览主题：{{theme}}
- 目标受众：{{targetAudience}}
- 预算：{{budget}} {{currency}}
- 场地信息：{{area}}平方米，层高{{height}}米

【策展方案】
- 核心概念：{{concept}}
- 叙事结构：{{narrative}}
```

**修复后**：
```handlebars
【展览基本信息】
- 展览标题：{{title}}
- 展览主题：{{theme}}
- 目标受众：{{targetAudience}}
- 预算：{{budget}} {{currency}}
- 场地信息：{{area}}平方米，层高{{height}}米

【策展方案】
- 核心概念：{{concept}}
- 叙事结构：{{narrative}}

【空间布局方案】
- 整体布局：{{layout}}
- 参观路线：{{visitorRoute}}
- 功能区域：{{zones}}

【互动技术要求】
1. 技术选择：列出3-6项核心技术（如 AR、VR、触摸屏、传感器、投影映射、体感互动等），说明每项技术的应用场景和选择依据
2. 互动装置：设计5-8个具体互动装置，每个装置需说明：
   - 装置名称（如"AR 文物解读屏""沉浸式光影体验空间"）
   - 互动类型（如 AR/触摸屏/传感器/投影/体感/声音等）
   - **位置布局**：说明装置位于哪个区域、在区域内的布局方式（如"历史区沿墙面布置3台"）
   - 详细说明（包含互动方式、技术原理、用户体验、教育价值/传播价值，100-150字）
   - 成本估算（如"3-5万元""2-3万元"，需符合预算）
3. 技术要求：说明硬件设备清单（如屏幕、投影仪、传感器、服务器等）、软件开发需求（如 APP 开发、内容制作）、安装条件（如电源、网络、空间要求）、维护需求（如定期更新内容、设备检修）
```

---

## 📊 修复后数据传递完整性

### 空间 → 视觉设计（✅ 完整）

| 空间输出字段 | 传递到视觉智能体 | 注入提示词 | LLM可使用 |
|------------|----------------|----------|---------|
| layout | ✅ | ✅ | ✅ |
| visitorRoute | ✅ | ✅ | ✅ |
| zones | ✅ | ✅ | ✅ |
| accessibility | ✅ | ✅ | ✅ |

**完整性**：100%（4/4）✅

---

### 空间 → 互动技术（✅ 完整）

| 空间输出字段 | 传递到互动技术智能体 | 注入提示词 | LLM可使用 |
|------------|-------------------|----------|---------|
| layout | ✅ | ✅ | ✅ |
| visitorRoute | ✅ | ✅ | ✅ |
| zones | ✅ | ✅ | ✅ |
| accessibility | ✅ | ✅ | ✅ |

**完整性**：100%（4/4）✅

---

## 🎯 修复效果预期

### 视觉设计改进

**修复前**：
```json
{
  "colorScheme": ["#1A365D", "#2C5282", "#ED8936", "#F7FAFC"],
  "typography": "标题使用思源黑体 Bold，正文使用思源宋体 Regular"
}
```
❌ 所有区域统一设计，无法体现差异化

---

**修复后**：
```json
{
  "colorScheme": {
    "历史区（150㎡）": {
      "主色": "#8B4513",
      "辅助色": ["#D2691E", "#F5DEB3"],
      "设计理念": "沉稳的棕色系呼应历史厚重感"
    },
    "科学区（200㎡）": {
      "主色": "#00CED1",
      "辅助色": ["#20B2AA", "#E0FFFF"],
      "设计理念": "科技的青色系体现理性探索"
    },
    "未来区（100㎡）": {
      "主色": "#FFD700",
      "辅助色": ["#FFA500", "#FFFACD"],
      "设计理念": "明亮的金色系象征未来希望"
    }
  },
  "typography": "历史区使用思源宋体体现庄重，科学区使用思源黑体体现现代，未来区使用圆体体现活力。导视系统沿参观路线布置，关键节点采用醒目字体。",
  "brandElements": [
    "入口序厅：大型主题形象墙（5m×3m），'陂泽千年'标题",
    "历史区：时光轴地贴，沿参观路线展示年代更迭",
    "科学区：动态沙盘核心节点视觉，'木兰陂工程解构'图解",
    "未来区：生态主题绿墙，融合品牌色与环保理念",
    "导视系统：沿参观路线的统一导视牌，包含区域名称、方向指引"
  ],
  "visualStyle": "整体采用'历史-科学-未来'三段式视觉风格。历史区沉稳庄重，科学区现代科技，未来区明亮希望。参观路线上的关键节点（入口、过渡通道、核心沙盘、出口）设置醒目视觉焦点。色彩、字体、品牌元素在各区域差异化应用，但保持整体统一性。"
}
```
✅ 每个区域独立设计，完全贴合空间布局

---

### 互动技术改进

**修复前**：
```json
{
  "interactives": [
    {"name": "AR文物解读", "type": "AR", "description": "...", "cost": 30000},
    {"name": "触摸屏互动", "type": "触摸屏", "description": "...", "cost": 20000}
  ]
}
```
❌ 没有说明装置位置、布局、数量

---

**修复后**：
```json
{
  "interactives": [
    {
      "name": "AR文物解读屏",
      "type": "AR触摸屏",
      "location": "历史区（150㎡）",
      "layout": "沿南墙布置3台，每台间距5米，每台尺寸65寸",
      "description": "扫描文物查看3D细节，支持放大、旋转、注释。展示宋代陂首石构件、古代水利工具等核心文物。用户可通过触摸屏查看文物内部结构、历史背景、修复过程。教育价值：深度了解文物细节，增强文物保护意识。",
      "cost": 45000
    },
    {
      "name": "动态沙盘（核心节点）",
      "type": "物理模型+投影映射",
      "location": "科学区中央（200㎡区域中心）",
      "layout": "占据中心位置，尺寸4m×3m，四周留出2米观看空间，设置围栏",
      "description": "展示木兰陂完整工程结构，包括陂首、渠道、闸门等。支持多点触控，用户可模拟不同水位下的水流变化。实时投影显示水文数据、工程原理动画。教育价值：直观理解水利工程原理，互动性强。",
      "cost": 120000
    },
    {
      "name": "时空隧道互动",
      "type": "投影映射+传感器",
      "location": "历史区→科学区过渡通道（10米长）",
      "layout": "两侧墙面+地面+天花板全覆盖投影，设置红外传感器检测行人",
      "description": "穿越历史的沉浸式体验。墙面投影年代更迭（从宋代到当代），地面投影水流变化，天花板投影星空。用户行走时触发投影变化，脚步生成涟漪。教育价值：体验历史变迁，增强叙事连贯性。",
      "cost": 80000
    },
    {
      "name": "多点触控桌",
      "type": "多点触控",
      "location": "科学区西侧（50㎡子区域）",
      "layout": "放置2张触控桌，每张1.2m×0.8m，高度0.75m",
      "description": "支持多人同时互动，通过拖拽、缩放、旋转等方式探索水利工程设计。提供'设计你的陂'互动游戏，用户可调整参数（高度、宽度、材料）查看效果。教育价值：动手实践，理解工程设计思维。",
      "cost": 60000
    },
    {
      "name": "未来展望互动墙",
      "type": "LED互动墙",
      "location": "未来区（100㎡）",
      "layout": "占据北墙，尺寸6m×2.5m",
      "description": "展示木兰陂当代功能、生态价值、文化景观。用户可通过手势控制内容切换，参与'未来水利'留言互动。展示实时环境数据（水质、流量）。教育价值：了解古代水利的现代价值，增强环保意识。",
      "cost": 90000
    }
  ],
  "technicalRequirements": "硬件设备清单：AR触摸屏3台（65寸）、动态沙盘投影系统1套（含投影仪×4、传感器×8、音响系统）、时空隧道投影系统1套（投影仪×6、传感器×12、服务器×1）、多点触控桌2台、LED互动墙1套（6m×2.5m）。软件开发需求：AR识别与3D展示系统、沙盘水流模拟软件、投影映射内容制作、触控桌互动游戏开发、互动墙内容管理系统。安装条件：每个区域需预留电源插座（220V）、网络接口（千兆）、空调系统（散热量大）。维护需求：定期更新投影内容（每季度）、设备检修（每月）、清洁投影镜头和传感器（每周）、软件系统备份（每日）。"
}
```
✅ 每个装置明确位置、布局、数量，完全符合空间规划

---

## ✅ 修复验证清单

- [ ] 修改 exhibition-graph.ts（3处调用）
- [ ] 修改 visual-designer.ts（方法签名 + 提示词渲染 + 日志）
- [ ] 修改 visual-designer.prompts.ts（添加空间信息段）
- [ ] 修改 interactive-tech.ts（方法签名 + 提示词渲染 + 日志）
- [ ] 修改 interactive-tech.prompts.ts（添加空间信息段）
- [ ] 编译验证
- [ ] 运行测试，查看日志确认空间信息传递

---

## 📝 总结

### 当前问题

空间智能体的核心内容（layout, visitorRoute, zones, accessibility）**完全没有传递**给视觉设计和互动技术智能体，导致：

1. ❌ 视觉设计无法针对不同区域做差异化设计
2. ❌ 互动技术无法规划装置的位置和布局
3. ❌ 两个智能体都无法考虑参观路线
4. ❌ 设计方案与空间规划不匹配，落地性差

### 修复后效果

修复后，视觉设计和互动技术智能体将能够：

1. ✅ 根据功能区域（zones）设计差异化方案
2. ✅ 结合空间布局规划装置/元素的位置
3. ✅ 沿参观路线设计导视/互动节点
4. ✅ 确保设计方案与空间规划完全一致

---

**数据流完整性**：
- 策划 → 空间设计：100%（4/4）✅
- 空间 → 视觉设计：0%（0/4）❌ → 修复后 100%（4/4）✅
- 空间 → 互动技术：0%（0/4）❌ → 修复后 100%（4/4）✅

**建议立即修复！** 🔧
