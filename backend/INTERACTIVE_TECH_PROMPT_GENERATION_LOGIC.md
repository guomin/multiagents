# 互动技术智能体（INTERACTIVE-TECH-AGENT）用户提示词生成逻辑

## 📝 生成逻辑概述

**生成位置**：`backend/src/agents/interactive-tech.ts:96-120`
**提示词模板**：`backend/src/prompts/interactive-tech.prompts.ts:58-103`
**渲染引擎**：PromptManager (Handlebars模板引擎)

---

## 🔧 生成流程

### 步骤1：智能调研（Tavily外部知识检索）

**代码**：`interactive-tech.ts:96-98`

```typescript
// 🔍 智能调研（使用Tavily搜索）
this.logger.info('🔍 [智能调研] 准备外部知识调研');
const researchContext = await this.performResearch(conceptPlan);
```

#### 1.1 搜索查询构建

**方法**：`buildSearchQuery(conceptPlan)` (line 424-447)

**逻辑**：
```typescript
private buildSearchQuery(conceptPlan: ConceptPlan): string {
  const concept = conceptPlan.concept.toLowerCase();
  const keywords = ["水利", "历史", "文化", "科技", "互动", "多媒体"];

  // 检查是否包含相关关键词
  const hasKeyword = keywords.some(kw => concept.includes(kw));

  if (!hasKeyword) {
    return ""; // 不需要调研
  }

  // 提取主题关键词
  let topic = "博物馆";
  if (concept.includes("水利")) topic = "博物馆水利工程";
  else if (concept.includes("历史")) topic = "博物馆历史文化";
  else if (concept.includes("科技")) topic = "科技馆";

  return `${topic}互动技术案例`;
}
```

**示例**：
- 输入：`conceptPlan.concept = "陂泽千年：从木兰陂看中国古代水利智慧"`
- 输出：`"博物馆水利工程互动技术案例"`

#### 1.2 执行Tavily搜索

**代码**：`line 257`
```typescript
const searchResults = await this.tavilySearchService.search(searchQuery, 3);
```

**参数**：
- `searchQuery`：搜索关键词（如"博物馆水利工程互动技术案例"）
- `3`：返回前3个搜索结果

#### 1.3 格式化搜索结果

**方法**：`formatSearchResults(results)` (line 452-463)

**输出格式**：
```typescript
return results.map((r, i) => `
${i + 1}. **${r.title}**
   链接：${r.url}
   简介：${r.content.substring(0, 150)}...
`).join("\n");
```

**示例输出**：
```
1. **博物馆互动技术应用案例**
   链接：https://example.com/case1
   简介：本文介绍了某博物馆使用AR技术增强文物展示的实践，包括技术选型、实施过程和效果评估...

2. **水利工程展览多媒体互动设计**
   链接：https://example.com/case2
   简介：探讨水利工程主题展览中的互动技术应用，重点分析沙盘投影、体感互动等技术的应用...
```

#### 1.4 调研结果注入

如果搜索成功，`researchContext` 变量包含格式化的搜索结果；
如果搜索失败或无需调研，`researchContext` 为空字符串 `""`。

---

### 步骤2：变量准备与注入

**代码**：`interactive-tech.ts:101-120`

```typescript
const rendered = promptManager.render(
  'interactive_tech',           // ✅ 提示词配置名称
  'generateInteractiveSolution', // ✅ 提示词模板名称
  {
    // 📝 注入的变量
    revisionReason,
    budget: requirements.budget.total,
    currency: requirements.budget.currency,
    theme: requirements.theme,
    targetAudience: requirements.targetAudience,
    concept: conceptPlan.concept,
    narrative: conceptPlan.narrative,
    researchContext,  // 📊 来自智能调研
    // 🏗️ 空间布局信息
    layout: spatialLayout?.layout || "",
    visitorRoute: spatialLayout?.visitorRoute.join(" → ") || "",
    zones: spatialLayout?.zones.map(z =>
      `${z.name}（${z.area}㎡，功能：${z.function}）`
    ).join("；") || ""
  }
);
```

#### 变量注入清单

| 变量名 | 数据来源 | 处理逻辑 | 状态 |
|--------|---------|---------|------|
| `revisionReason` | 参数 | 直接传递 | ✅ |
| `budget` | `requirements.budget.total` | 直接传递 | ✅ |
| `currency` | `requirements.budget.currency` | 直接传递 | ✅ |
| `theme` | `requirements.theme` | 直接传递 | ✅ |
| `targetAudience` | `requirements.targetAudience` | 直接传递 | ✅ |
| `concept` | `conceptPlan.concept` | 直接传递 | ✅ |
| `narrative` | `conceptPlan.narrative` | 直接传递 | ✅ |
| `researchContext` | `performResearch()` | Tavily搜索结果 | ✅ |
| `layout` | `spatialLayout.layout` | 可选，默认为空字符串 | ✅ |
| `visitorRoute` | `spatialLayout.visitorRoute` | 数组join为" → "分隔 | ✅ |
| `zones` | `spatialLayout.zones` | 数组map格式化，分号分隔 | ✅ |
| **`title`** | **`requirements.title`** | **❌ 未注入** | **❌ 缺失** |
| **`area`** | **`requirements.venueSpace.area`** | **❌ 未注入** | **❌ 缺失** |
| **`height`** | **`requirements.venueSpace.height`** | **❌ 未注入** | **❌ 缺失** |

**注入完整性**：**78.6%（11/14）** ❌

---

### 步骤3：提示词模板渲染

**模板文件**：`interactive-tech.prompts.ts:58-103`

#### 3.1 用户提示词模板结构

```handlebars
请为以下展览需求{{#if revisionReason}}（根据反馈意见进行修订）{{/if}}生成互动技术方案：

【展览基本信息】
- 展览标题：{{title}}              ← ❌ 未注入，会显示为空
- 展览主题：{{theme}}              ← ✅ 已注入
- 目标受众：{{targetAudience}}      ← ✅ 已注入
- 预算：{{budget}} {{currency}}    ← ✅ 已注入
- 场地信息：{{area}}平方米，层高{{height}}米  ← ❌ 都未注入，会显示为"平方米，层高米"

【策展方案】
- 核心概念：{{concept}}            ← ✅ 已注入
- 叙事结构：{{narrative}}          ← ✅ 已注入

【空间布局方案】
- 整体布局：{{layout}}             ← ✅ 已注入
- 参观路线：{{visitorRoute}}       ← ✅ 已注入
- 功能区域：{{zones}}              ← ✅ 已注入

{{#if researchContext}}           ← ✅ 条件渲染
【参考资料（来自真实展览案例）】
{{researchContext}}                ← ✅ 如果有调研结果则显示
{{/if}}

【互动技术要求】
1. 技术选择：列出3-6项核心技术...
2. 互动装置：设计5-8个具体互动装置...
3. 技术要求：说明硬件设备清单...

【质量标准】
- 技术需成熟可靠，避免实验性过强的技术
- 互动需符合展览主题和受众特征
- 成本需在预算范围内，性价比合理
- 方案需具备可实施性和可维护性

{{#if revisionReason}}             ← ✅ 条件渲染
【修订反馈】
{{revisionReason}}
请根据以上反馈，对互动技术方案进行针对性改进，说明修改的专业依据。
{{/if}}

请严格按照指定的 JSON 格式输出互动技术方案。
```

#### 3.2 条件渲染逻辑

**条件1：修订原因**
```handlebars
{{#if revisionReason}}
（根据反馈意见进行修订）
...
【修订反馈】
{{revisionReason}}
请根据以上反馈，对互动技术方案进行针对性改进，说明修改的专业依据。
{{/if}}
```

**逻辑**：
- 如果 `revisionReason` 存在且非空，则显示修订相关内容
- 首次生成时，`revisionReason` 为 `undefined`，不显示修订内容
- 修订时，`revisionReason` 包含反馈意见，显示修订要求

**条件2：参考资料**
```handlebars
{{#if researchContext}}
【参考资料（来自真实展览案例）】
{{researchContext}}
{{/if}}
```

**逻辑**：
- 如果 `researchContext` 存在且非空，则显示参考资料
- 如果调研成功，显示Tavily搜索结果
- 如果调研失败或无需调研，不显示此段

---

### 步骤4：最终生成的用户提示词

#### 示例：首次生成（无修订，有调研）

```text
请为以下展览需求生成互动技术方案：

【展览基本信息】
- 展览标题：                        ← ❌ 空白
- 展览主题：展示木兰陂这一千年水利工程的历史价值与科学原理
- 目标受众：历史爱好者、学生群体、水利工程专业人士
- 预算：500000 CNY
- 场地信息：平方米，层高米          ← ❌ 缺少数值

【策展方案】
- 核心概念：陂泽千年：从木兰陂看中国古代水利智慧
- 叙事结构：展览采用"历史-科学-未来"三重叙事主线。历史区展示文献、场景复原与出土文物，讲述木兰陂的建造背景和历史沿革...

【空间布局方案】
- 整体布局：环形流线，以木兰陂为核心叙事线索...
- 参观路线：入口序厅 → 历史区 → 科学区 → 未来区 → 文创区 → 出口
- 功能区域：入口序厅（50㎡，功能：票务、咨询、安检）；历史区（150㎡，功能：展示文献、场景复原）；科学区（200㎡，功能：互动模型、动态沙盘）；未来区（100㎡，功能：展示当代功能）；文创区（50㎡，功能：文创产品、观众留言）

【参考资料（来自真实展览案例）】
1. **博物馆互动技术应用案例**
   链接：https://example.com/case1
   简介：本文介绍了某博物馆使用AR技术增强文物展示的实践，包括技术选型、实施过程和效果评估...

2. **水利工程展览多媒体互动设计**
   链接：https://example.com/case2
   简介：探讨水利工程主题展览中的互动技术应用，重点分析沙盘投影、体感互动等技术的应用...

【互动技术要求】
1. 技术选择：列出3-6项核心技术...
2. 互动装置：设计5-8个具体互动装置...
3. 技术要求：说明硬件设备清单...

【质量标准】
- 技术需成熟可靠，避免实验性过强的技术
- 互动需符合展览主题和受众特征
- 成本需在预算范围内，性价比合理
- 方案需具备可实施性和可维护性

请严格按照指定的 JSON 格式输出互动技术方案。
```

---

#### 示例：修订生成（有修订原因）

```text
请为以下展览需求（根据反馈意见进行修订）生成互动技术方案：

【展览基本信息】
- 展览标题：木兰陂水利工程展览        ← ✅ 如果修复后会显示
- 展览主题：展示木兰陂这一千年水利工程的历史价值与科学原理
...

【修订反馈】
互动装置成本过高，超出预算50万。建议减少大型投影装置数量，增加性价比高的触摸屏互动。同时需要增加每个装置的具体位置和布局说明。

请根据以上反馈，对互动技术方案进行针对性改进，说明修改的专业依据。

请严格按照指定的 JSON 格式输出互动技术方案。
```

---

## 🐛 发现的问题

### 问题1：缺少3个关键变量

**缺少的变量**：
1. `title`（展览标题）- 来自 `requirements.title`
2. `area`（场地面积）- 来自 `requirements.venueSpace.area`
3. `height`（层高）- 来自 `requirements.venueSpace.height`

**影响**：
- 提示词中的展览标题显示为空白
- 场地信息显示为"平方米，层高米"，缺少具体数值
- LLM 无法获得完整的展览基本信息

**修复方案**：
```typescript
const rendered = promptManager.render(
  'interactive_tech',
  'generateInteractiveSolution',
  {
    revisionReason,
    // ✅ 添加展览基本信息
    title: requirements.title,  // ← 添加
    area: requirements.venueSpace.area,  // ← 添加
    height: requirements.venueSpace.height,  // ← 添加
    budget: requirements.budget.total,
    currency: requirements.budget.currency,
    theme: requirements.theme,
    targetAudience: requirements.targetAudience,
    concept: conceptPlan.concept,
    narrative: conceptPlan.narrative,
    researchContext,
    // 空间布局信息
    layout: spatialLayout?.layout || "",
    visitorRoute: spatialLayout?.visitorRoute.join(" → ") || "",
    zones: spatialLayout?.zones.map(z =>
      `${z.name}（${z.area}㎡，功能：${z.function}）`
    ).join("；") || ""
  }
);
```

---

## 📊 生成逻辑总结

### 完整生成流程图

```
用户输入
  ↓
requirements: {
  title: "木兰陂水利工程展览",
  theme: "展示木兰陂...",
  targetAudience: "历史爱好者...",
  venueSpace: { area: 500, height: 4, layout: "矩形" },
  budget: { total: 500000, currency: "CNY" }
}
conceptPlan: {
  concept: "陂泽千年...",
  narrative: "三重叙事..."
}
spatialLayout: {
  layout: "环形流线...",
  visitorRoute: ["入口→历史区..."],
  zones: [{name: "历史区", area: 150, ...}]
}
revisionReason?: "互动装置成本过高..."（可选）
  ↓
┌─────────────────────────────────────────┐
│ 步骤1：智能调研（Tavily搜索）            │
├─────────────────────────────────────────┤
│ 1.1 构建搜索查询                         │
│     conceptPlan.concept = "陂泽千年..." │
│     → 包含"水利"关键词                   │
│     → searchQuery = "博物馆水利工程互动技术案例" │
│                                         │
│ 1.2 执行Tavily搜索                       │
│     tavilySearchService.search(query, 3) │
│     → 返回3个搜索结果                    │
│                                         │
│ 1.3 格式化搜索结果                       │
│     → researchContext = "1. **案例1**..." │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ 步骤2：变量准备与注入                    │
├─────────────────────────────────────────┤
│ ✅ revisionReason = "互动装置成本过高..." │
│ ✅ budget = 500000                       │
│ ✅ currency = "CNY"                      │
│ ✅ theme = "展示木兰陂..."               │
│ ✅ targetAudience = "历史爱好者..."      │
│ ✅ concept = "陂泽千年..."               │
│ ✅ narrative = "三重叙事..."             │
│ ✅ researchContext = "1. **案例1**..."   │
│ ✅ layout = "环形流线..."                │
│ ✅ visitorRoute = "入口→历史区→..."      │
│ ✅ zones = "历史区（150㎡，...）；..."    │
│ ❌ title = 未注入                        │
│ ❌ area = 未注入                         │
│ ❌ height = 未注入                       │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ 步骤3：Handlebars模板渲染                │
├─────────────────────────────────────────┤
│ promptManager.render(                   │
│   'interactive_tech',                   │
│   'generateInteractiveSolution',        │
│   {变量对象}                            │
│ )                                      │
│                                         │
│ → 替换模板中的 {{变量}}                 │
│ → 处理 {{#if 条件}}                    │
│ → 生成最终的 humanPrompt                │
└─────────────────────────────────────────┘
  ↓
最终用户提示词（humanPrompt）
  ↓
传递给LLM（ChatOpenAI.invoke）
  ↓
LLM生成互动技术方案
```

---

## 🎯 生成逻辑特点

### 1. **智能外部知识检索**
- 使用Tavily搜索引擎获取真实展览案例
- 根据策划概念的关键词智能构建搜索查询
- 调研结果作为参考资料提供给LLM

### 2. **多源数据融合**
- 用户原始需求（requirements）
- 策划方案（conceptPlan）
- 空间布局（spatialLayout）
- 外部调研（researchContext）
- 修订反馈（revisionReason，可选）

### 3. **条件渲染**
- 修订原因：有则显示修订要求
- 参考资料：有则显示调研结果

### 4. **完整性问题**
- **当前注入率**：78.6%（11/14变量）
- **缺失变量**：title, area, height
- **影响**：提示词不完整，LLM缺少关键信息

---

## 💡 修复建议

### 立即修复

在 `interactive-tech.ts:104-119` 添加3个缺失的变量：

```typescript
const rendered = promptManager.render(
  'interactive_tech',
  'generateInteractiveSolution',
  {
    revisionReason,
    // 展览基本信息
    title: requirements.title,  // ✅ 添加
    theme: requirements.theme,
    targetAudience: requirements.targetAudience,
    area: requirements.venueSpace.area,  // ✅ 添加
    height: requirements.venueSpace.height,  // ✅ 添加
    budget: requirements.budget.total,
    currency: requirements.budget.currency,
    // 策展方案
    concept: conceptPlan.concept,
    narrative: conceptPlan.narrative,
    // 外部调研
    researchContext,
    // 空间布局
    layout: spatialLayout?.layout || "",
    visitorRoute: spatialLayout?.visitorRoute.join(" → ") || "",
    zones: spatialLayout?.zones.map(z =>
      `${z.name}（${z.area}㎡，功能：${z.function}）`
    ).join("；") || ""
  }
);
```

**修复后注入率**：**100%（14/14变量）** ✅

---

**是否需要立即修复这个问题？**
