# 空间布局智能体 → 互动技术智能体 信息传递详解

## 📊 信息传递全景图

```
空间设计智能体
  ↓
SpatialLayout {
  layout: string,              // 整体布局描述
  visitorRoute: string[],      // 参观路线
  zones: Array<{               // 功能区域
    name: string,              // 区域名称
    area: number,              // 区域面积
    function: string           // 区域功能
  }>,
  accessibility: string        // 无障碍设计
}
  ↓
互动技术智能体接收并使用
```

---

## 🔍 详细传递清单

### 1️⃣ layout（整体布局描述）

#### 数据来源

**文件**：`backend/src/types/exhibition.ts:36`

```typescript
export const SpatialLayoutSchema = z.object({
  layout: z.string().describe("空间布局描述"),
  // ...
});
```

#### 空间智能体输出

**文件**：`backend/src/agents/spatial-designer.ts`

空间智能体的 `layout` 字段包含：
- 布局类型（环形流线、线性布局、串联式等）
- 核心设计理念
- 关键节点说明

**示例输出**：
```json
{
  "layout": "采用环形流线，以木兰陂水利工程为核心叙事线索。入口设序厅（主题形象墙与导览），顺时针依次为历史区（30%，150㎡）、科学区（40%，200㎡）、未来区（20%，100㎡），出口前设文创体验与观众留言区（10%，50㎡）。关键节点设计：1. 历史区至科学区的过渡通道设计为'时空隧道'，墙面投影水流与年代更迭。2. 动态沙盘为核心节点，置于展厅中央，形成视觉焦点与休憩观察点。"
}
```

#### 传递给互动技术智能体

**文件**：`backend/src/agents/interactive-tech.ts:120`

```typescript
const rendered = promptManager.render(
  'interactive_tech',
  'generateInteractiveSolution',
  {
    // ...
    layout: spatialLayout?.layout || "",  // ✅ 直接传递字符串
    // ...
  }
);
```

**传递方式**：完整字符串，无处理

#### 注入到提示词

**文件**：`backend/src/prompts/interactive-tech.prompts.ts:72`

```handlebars
【空间布局方案】
- 整体布局：{{layout}}
```

#### 实际渲染效果

```text
【空间布局方案】
- 整体布局：采用环形流线，以木兰陂水利工程为核心叙事线索。入口设序厅（主题形象墙与导览），顺时针依次为历史区（30%，150㎡）、科学区（40%，200㎡）、未来区（20%，100㎡），出口前设文创体验与观众留言区（10%，50㎡）。关键节点设计：1. 历史区至科学区的过渡通道设计为'时空隧道'，墙面投影水流与年代更迭。2. 动态沙盘为核心节点，置于展厅中央，形成视觉焦点与休憩观察点。
```

#### LLM如何使用

LLM基于 `layout` 信息能够：
1. **选择合适的技术类型**
   - 环形流线 → 中心投影、环幕技术
   - 线性布局 → 墙面互动、触摸屏导览

2. **设计核心互动节点**
   - 识别"动态沙盘为核心节点"
   - 识别"时空隧道过渡通道"
   - 针对这些关键节点设计重点互动装置

3. **遵循设计理念**
   - "以木兰陂为核心" → 所有互动围绕木兰陂展开
   - "视觉焦点与休憩观察点" → 沙盘周围设置休息区互动

---

### 2️⃣ visitorRoute（参观路线）

#### 数据来源

**文件**：`backend/src/types/exhibition.ts:37`

```typescript
export const SpatialLayoutSchema = z.object({
  visitorRoute: z.array(z.string()).describe("参观路线"),
  // ...
});
```

#### 空间智能体输出

**文件**：`backend/src/agents/spatial-designer.ts`

`visitorRoute` 是一个字符串数组，描述参观路径

**示例输出**：
```json
{
  "visitorRoute": [
    "入口序厅 → 历史区 → 科学区 → 未来区 → 文创体验区 → 出口",
    "路线设计逻辑：环形顺时针流线，符合策展的环形布局设计，历史区至科学区设置'时空隧道'过渡，动态沙盘位于科学区中央"
  ]
}
```

#### 传递给互动技术智能体

**文件**：`backend/src/agents/interactive-tech.ts:121`

```typescript
const rendered = promptManager.render(
  'interactive_tech',
  'generateInteractiveSolution',
  {
    // ...
    visitorRoute: spatialLayout?.visitorRoute.join(" → ") || "",  // ✅ 数组join为字符串
    // ...
  }
);
```

**传递方式**：
- 原始：`["路线1", "路线2"]`
- 处理：`join(" → ")`
- 结果：`"路线1 → 路线2"`

#### 注入到提示词

**文件**：`backend/src/prompts/interactive-tech.prompts.ts:73`

```handlebars
【空间布局方案】
- 参观路线：{{visitorRoute}}
```

#### 实际渲染效果

```text
【空间布局方案】
- 参观路线：入口序厅 → 历史区 → 科学区 → 未来区 → 文创体验区 → 出口 → 路线设计逻辑：环形顺时针流线，符合策展的环形布局设计，历史区至科学区设置'时空隧道'过渡，动态沙盘位于科学区中央
```

#### LLM如何使用

LLM基于 `visitorRoute` 信息能够：
1. **沿路线安排互动节点**
   - 在"历史区 → 科学区"过渡处设计"时空隧道互动"
   - 在"入口"设置欢迎互动
   - 在"出口"设置留言互动

2. **设计互动流线**
   - 确保互动体验符合参观顺序
   - 避免互动装置打乱参观路线
   - 在路线关键节点设置高光互动

3. **强化路线叙事**
   - 每个区域的互动体验承上启下
   - 过渡区域的互动连接前后主题

---

### 3️⃣ zones（功能区域）

#### 数据来源

**文件**：`backend/src/types/exhibition.ts:38-43`

```typescript
export const SpatialLayoutSchema = z.object({
  zones: z.array(z.object({
    name: z.string(),              // 区域名称
    area: z.number(),              // 区域面积（平方米）
    function: z.string()           // 区域功能描述
  })).describe("功能区域"),
  // ...
});
```

#### 空间智能体输出

**文件**：`backend/src/agents/spatial-designer.ts`

`zones` 是一个对象数组，每个对象包含区域的名称、面积和功能

**示例输出**：
```json
{
  "zones": [
    {
      "name": "入口序厅",
      "area": 50,
      "function": "主题形象墙、导览图、票务、咨询、安检"
    },
    {
      "name": "历史区",
      "area": 150,
      "function": "展示文献、场景复原与出土文物，讲述木兰陂的建造背景和历史沿革"
    },
    {
      "name": "科学区",
      "area": 200,
      "function": "互动模型、图解、动态沙盘（核心节点，置于中央），展示工程结构和水文原理"
    },
    {
      "name": "未来区",
      "area": 100,
      "function": "展示当代水利功能、生态价值、文化景观意义"
    },
    {
      "name": "文创体验区",
      "area": 50,
      "function": "文创产品、观众留言、互动体验"
    }
  ]
}
```

#### 传递给互动技术智能体

**文件**：`backend/src/agents/interactive-tech.ts:122-124`

```typescript
const rendered = promptManager.render(
  'interactive_tech',
  'generateInteractiveSolution',
  {
    // ...
    zones: spatialLayout?.zones.map(z =>
      `${z.name}（${z.area}㎡，功能：${z.function}）`
    ).join("；") || ""
    // ...
  }
);
```

**传递方式**：
- 原始：`[{name: "历史区", area: 150, function: "..."}]`
- 处理：`map(z => \`${z.name}（${z.area}㎡，功能：${z.function}）\`).join("；")`
- 结果：`"历史区（150㎡，功能：展示文献...）；科学区（200㎡，功能：互动模型...）..."`

#### 注入到提示词

**文件**：`backend/src/prompts/interactive-tech.prompts.ts:74`

```handlebars
【空间布局方案】
- 功能区域：{{zones}}
```

#### 实际渲染效果

```text
【空间布局方案】
- 功能区域：入口序厅（50㎡，功能：主题形象墙、导览图、票务、咨询、安检）；历史区（150㎡，功能：展示文献、场景复原与出土文物，讲述木兰陂的建造背景和历史沿革）；科学区（200㎡，功能：互动模型、图解、动态沙盘（核心节点，置于中央），展示工程结构和水文原理）；未来区（100㎡，功能：展示当代水利功能、生态价值、文化景观意义）；文创体验区（50㎡，功能：文创产品、观众留言、互动体验）
```

#### LLM如何使用

LLM基于 `zones` 信息能够：

**1. 为每个区域设计适配的互动装置**

| 区域 | 面积 | 功能 | 互动装置设计 |
|------|------|------|------------|
| **入口序厅** | 50㎡ | 主题形象墙、导览图 | 小型AR导览屏、互动欢迎屏 |
| **历史区** | 150㎡ | 展示文献、文物 | AR文物解读屏（沿墙布置3台） |
| **科学区** | 200㎡ | 互动模型、动态沙盘 | 大型动态沙盘（中央，4m×3m）+ 多点触控桌 |
| **未来区** | 100㎡ | 当代功能、生态价值 | LED互动墙（6m×2.5m） |
| **文创体验区** | 50㎡ | 文创产品、留言 | 数字留言屏、互动纪念品生成 |

**2. 根据区域面积规划装置数量和尺寸**

- **50㎡区域**（序厅、文创区）：适合1-2个小型互动装置
- **100㎡区域**（未来区）：适合1个中型互动装置
- **150㎡区域**（历史区）：适合3-4个中小型互动装置
- **200㎡区域**（科学区）：适合1个大型 + 2-3个中型互动装置

**3. 根据区域功能选择互动类型**

- **历史区**（展示文献、文物）→ AR解读、触摸屏详情（低调不抢戏）
- **科学区**（互动模型、沙盘）→ 体感互动、多点触控、投影映射（互动性强）
- **未来区**（当代功能、生态）→ LED互动墙、实时数据显示（科技感）

---

### 4️⃣ accessibility（无障碍设计）

#### 数据来源

**文件**：`backend/src/types/exhibition.ts:44`

```typescript
export const SpatialLayoutSchema = z.object({
  accessibility: z.string().describe("无障碍设计"),
  // ...
});
```

#### 空间智能体输出

**文件**：`backend/src/agents/spatial-designer.ts`

`accessibility` 描述无障碍设施和要求

**示例输出**：
```json
{
  "accessibility": "设有无障碍通道、轮椅租借、盲文导览、语音导览系统、触觉互动装置等无障碍设施。互动装置需考虑轮椅使用者高度（操作面板高度0.8-1.2米），视觉障碍者可通过语音导览和触觉反馈体验互动内容。"
}
```

#### 传递给互动技术智能体

**文件**：`backend/src/agents/interactive-tech.ts`

**❌ 未传递**！

```typescript
const rendered = promptManager.render(
  'interactive_tech',
  'generateInteractiveSolution',
  {
    // ...
    layout: spatialLayout?.layout || "",
    visitorRoute: spatialLayout?.visitorRoute.join(" → ") || "",
    zones: spatialLayout?.zones.map(z =>
      `${z.name}（${z.area}㎡，功能：${z.function}）`
    ).join("；") || ""
    // ❌ 缺少：accessibility
  }
);
```

#### 注入到提示词

**❌ 未注入**！

提示词模板中没有使用 `{{accessibility}}` 变量

#### 影响

互动技术智能体**无法获得无障碍设计要求**，可能导致：
- 互动装置操作面板高度不合适
- 没有考虑轮椅使用者的操作空间
- 缺少盲文导览和语音导览功能
- 没有触觉互动装置

---

## 📊 传递完整性统计

### 空间布局输出的4个字段

| 字段名 | 类型 | 传递状态 | 注入提示词 | LLM可使用 |
|--------|------|---------|----------|---------|
| **layout** | string | ✅ 已传递 | ✅ 已注入 | ✅ 可用 |
| **visitorRoute** | string[] | ✅ 已传递（join为字符串） | ✅ 已注入 | ✅ 可用 |
| **zones** | Array<{name, area, function}> | ✅ 已传递（map格式化） | ✅ 已注入 | ✅ 可用 |
| **accessibility** | string | ❌ **未传递** | ❌ **未注入** | ❌ **不可用** |

**传递完整性**：**75%（3/4字段）** ❌

---

## 🎯 实际应用示例

### 示例1：基于 layout 设计核心互动装置

**输入**（layout）：
```
采用环形流线，以木兰陂水利工程为核心叙事线索...动态沙盘为核心节点，置于展厅中央...
```

**LLM生成**：
```json
{
  "interactives": [
    {
      "name": "动态沙盘（核心节点）",
      "type": "物理模型+投影映射",
      "location": "科学区中央（200㎡区域中心）",
      "layout": "占据中心位置，尺寸4m×3m，四周留出2米观看空间",
      "description": "展示木兰陂完整工程结构，支持多点触控。置于中央作为视觉焦点，呼应空间布局的'核心节点'定位。",
      "cost": 120000
    }
  ]
}
```

✅ LLM识别了"动态沙盘为核心节点"，并将其作为重点互动装置

---

### 示例2：基于 visitorRoute 设计过渡互动

**输入**（visitorRoute）：
```
入口序厅 → 历史区 → 科学区 → 未来区 → 文创体验区 → 出口
```

**LLM生成**：
```json
{
  "interactives": [
    {
      "name": "时空隧道互动",
      "type": "投影映射+传感器",
      "location": "历史区→科学区过渡通道（参观路线关键节点）",
      "layout": "通道长度10米，两侧墙面+地面+天花板全覆盖投影",
      "description": "穿越历史的沉浸式体验，强化参观路线的节点体验，呼应历史区至科学区的过渡。",
      "cost": 80000
    }
  ]
}
```

✅ LLM识别了"历史区→科学区"的过渡，在路线的关键节点设计互动

---

### 示例3：基于 zones 设计区域适配的互动

**输入**（zones）：
```
历史区（150㎡，功能：展示文献、场景复原与出土文物）
科学区（200㎡，功能：互动模型、图解、动态沙盘（核心节点，置于中央））
未来区（100㎡，功能：展示当代水利功能、生态价值、文化景观意义）
```

**LLM生成**：
```json
{
  "interactives": [
    {
      "name": "AR文物解读屏",
      "type": "AR触摸屏",
      "location": "历史区（150㎡）",
      "layout": "沿南墙布置3台，每台间距5米",
      "description": "扫描文物查看3D细节，适合历史区的'展示文献、文物'功能，低调不抢戏。",
      "cost": 45000
    },
    {
      "name": "多点触控桌",
      "type": "多点触控",
      "location": "科学区西侧（200㎡区域内约50㎡子区域）",
      "layout": "放置2张触控桌，每张1.2m×0.8m",
      "description": "支持多人同时互动，适合科学区的'互动模型'功能，符合200㎡大面积布局。",
      "cost": 60000
    },
    {
      "name": "未来展望互动墙",
      "type": "LED互动墙",
      "location": "未来区（100㎡）",
      "layout": "占据北墙，尺寸6m×2.5m",
      "description": "展示木兰陂当代功能、生态价值，符合未来区的'当代功能、生态价值'主题，适合100㎡区域尺度。",
      "cost": 90000
    }
  ]
}
```

✅ LLM为每个区域设计了适配其功能和面积的互动装置

---

## 📝 数据格式转换总结

### layout（字符串）

| 阶段 | 格式 |
|------|------|
| 空间智能体输出 | `"采用环形流线，以木兰陂为核心..."` |
| 传递给互动智能体 | `"采用环形流线，以木兰陂为核心..."` |
| 注入提示词 | `{{layout}}` |
| 渲染结果 | `采用环形流线，以木兰陂为核心...` |

**处理方式**：✅ 直接传递，无转换

---

### visitorRoute（数组 → 字符串）

| 阶段 | 格式 |
|------|------|
| 空间智能体输出 | `["路线1", "路线2"]` |
| 传递给互动智能体 | `"路线1 → 路线2"` |
| 注入提示词 | `{{visitorRoute}}` |
| 渲染结果 | `路线1 → 路线2` |

**处理方式**：✅ `.join(" → ")`

---

### zones（对象数组 → 格式化字符串）

| 阶段 | 格式 |
|------|------|
| 空间智能体输出 | `[{name: "历史区", area: 150, function: "..."}]` |
| 传递给互动智能体 | `"历史区（150㎡，功能：...）；科学区（200㎡，功能：...）"` |
| 注入提示词 | `{{zones}}` |
| 渲染结果 | `历史区（150㎡，功能：...）；科学区（200㎡，功能：...）` |

**处理方式**：✅ `.map(z => \`${z.name}（${z.area}㎡，功能：${z.function}）\`).join("；")`

---

## ❌ 发现的问题

### accessibility 字段未传递

**空间智能体输出**：
```json
{
  "accessibility": "设有无障碍通道、轮椅租借、盲文导览、语音导览系统、触觉互动装置等无障碍设施。互动装置需考虑轮椅使用者高度（操作面板高度0.8-1.2米），视觉障碍者可通过语音导览和触觉反馈体验互动内容。"
}
```

**互动技术智能体接收**：❌ 未传递

**影响**：
- 互动装置可能没有考虑无障碍设计
- 缺少轮椅使用者的操作空间规划
- 缺少盲文、语音、触觉等多模态互动

**修复建议**：
```typescript
const rendered = promptManager.render(
  'interactive_tech',
  'generateInteractiveSolution',
  {
    // ...
    layout: spatialLayout?.layout || "",
    visitorRoute: spatialLayout?.visitorRoute.join(" → ") || "",
    zones: spatialLayout?.zones.map(z =>
      `${z.name}（${z.area}㎡，功能：${z.function}）`
    ).join("；") || "",
    accessibility: spatialLayout?.accessibility || ""  // ✅ 添加
  }
);
```

并在提示词模板中添加：
```handlebars
【空间布局方案】
- 整体布局：{{layout}}
- 参观路线：{{visitorRoute}}
- 功能区域：{{zones}}
- 无障碍设计：{{accessibility}}  ← ✅ 添加
```

**修复后完整性**：**100%（4/4字段）** ✅

---

## 📊 总结

### 当前传递状态

| 空间布局字段 | 传递状态 | 注入提示词 | LLM使用效果 |
|------------|---------|----------|-----------|
| layout | ✅ 已传递 | ✅ 已注入 | LLM能识别核心节点和设计理念 |
| visitorRoute | ✅ 已传递 | ✅ 已注入 | LLM能沿路线安排互动节点 |
| zones | ✅ 已传递 | ✅ 已注入 | LLM能为每个区域设计适配的互动 |
| accessibility | ❌ **未传递** | ❌ **未注入** | LLM**无法**考虑无障碍设计 |

**传递完整性**：**75%（3/4）** ❌

### 修复后预期

**传递完整性**：**100%（4/4）** ✅

LLM将能够：
- ✅ 识别核心节点并设计重点互动
- ✅ 沿参观路线安排互动体验节点
- ✅ 为每个区域设计功能适配的互动装置
- ✅ 考虑无障碍设计要求

---

**是否需要立即修复 accessibility 字段的缺失？**
