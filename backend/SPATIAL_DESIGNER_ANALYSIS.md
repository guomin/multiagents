# spatial-designer.ts 逻辑梳理与问题分析

## 📋 脚本概览

**文件路径**：`backend/src/agents/spatial-designer.ts`
**类名**：`SpatialDesignerAgent`
**功能**：基于策划方案生成展览空间布局设计

---

## ✅ 当前逻辑流程

### 1. **类初始化**（line 13-24）

```typescript
constructor(modelName?: string, temperature: number = 0.5) {
  // 记录初始化日志
  this.logger.info('🏗️ 初始化空间设计智能体', { modelName, temperature });

  // 创建模型配置
  this.modelConfig = ModelConfigFactory.createModelConfig(undefined, modelName, temperature);

  // 初始化 LLM 客户端
  this.llm = new ChatOpenAI({
    modelName: this.modelConfig.modelName,
    temperature: this.modelConfig.temperature,
    openAIApiKey: this.modelConfig.apiKey,
    ...(this.modelConfig.baseURL && { configuration: { baseURL: this.modelConfig.baseURL } }),
    ...(this.modelConfig.organization && { openAIOrganization: this.modelConfig.organization })
  });
}
```

**❌ 问题**：缺少 try-catch 错误处理
- 如果 `ModelConfigFactory.createModelConfig()` 失败，会抛出未捕获的异常
- 如果 `new ChatOpenAI()` 失败，同样没有错误处理

**对比 curator.ts**：
```typescript
constructor(modelName?: string, temperature: number = 0.7) {
  try {
    this.modelConfig = ModelConfigFactory.createModelConfig(...);
    this.logger.info('模型配置创建成功', { ... });
    this.llm = new ChatOpenAI({ ... });
    this.logger.info('✅ LLM客户端初始化完成');
  } catch (error) {
    this.logger.error('❌ 初始化失败', error as Error, { ... });
    throw error;
  }
}
```

---

### 2. **主方法：generateSpatialLayout**（line 26-307）

#### 2.1 输入参数（line 26-30）

```typescript
async generateSpatialLayout(
  requirements: ExhibitionRequirement,  // 原始需求
  conceptPlan: ConceptPlan,             // 策划方案（来自策划智能体）
  revisionReason?: string               // 修订原因（可选）
): Promise<SpatialLayout>
```

**✅ 正确**：
- 参数类型明确
- 与工作流节点的调用方式匹配

**❌ 缺失**：
- 没有参数验证
  - 如果 `requirements` 为 null 或 undefined？
  - 如果 `conceptPlan` 为 null 或 undefined？
  - 如果 `conceptPlan.concept` 为空字符串？

**建议添加**：
```typescript
if (!requirements) {
  throw new Error("requirements 参数不能为空");
}
if (!conceptPlan) {
  throw new Error("conceptPlan 参数不能为空");
}
if (!conceptPlan.concept || conceptPlan.concept.trim().length === 0) {
  throw new Error("conceptPlan.concept 不能为空");
}
```

---

#### 2.2 日志记录（line 31-70）

```typescript
// 开始标记
this.logger.info('═══════════════════════════════════════════════════════════');
this.logger.info('🏗️ [空间设计智能体] 开始生成空间布局方案');

// 输入参数记录
this.logger.info('📥 [输入参数] 原始需求', { ... });
this.logger.info('📥 [输入参数] 策划方案（来自策划智能体）', { ... });
this.logger.info('📥 [输入详情] 完整需求对象', { ... });
this.logger.info('📥 [输入详情] 完整策划对象', { ... });
```

**✅ 优点**：
- 日志非常详细
- 记录了所有输入参数
- 方便调试和追踪

---

#### 2.3 提示词渲染（line 72-102）

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
    keyExhibits: conceptPlan.keyExhibits.join(", ")
  }
);
```

**✅ 正确**：
- 使用 PromptManager 统一管理提示词
- 正确注入了所有需要的变量
- 包括 revisionReason（如果有修订）

**❌ 缺失**：
- 没有 try-catch 包裹
- 如果 `promptManager.render()` 失败（提示词模板不存在），会抛出未捕获的异常

**建议添加**：
```typescript
try {
  const rendered = promptManager.render(...);
} catch (error) {
  this.logger.error('❌ [提示词渲染失败] PromptManager 渲染失败', error as Error);
  throw new Error(`提示词渲染失败: ${error.message}`);
}
```

---

#### 2.4 LLM 调用（line 104-133）

```typescript
const messages = [
  new SystemMessage(systemPrompt),
  new HumanMessage(humanPrompt)
];

this.logger.info('🤖 [LLM调用] 准备调用大模型', { ... });

const llmStart = Date.now();
const response = await this.llm.invoke(messages);
const llmDuration = Date.now() - llmStart;

this.logger.info('🤖 [LLM调用] 大模型响应完成', { ... });

const rawContent = response.content.toString();
```

**✅ 优点**：
- 正确构建了 LangChain 消息格式
- 记录了 LLM 调用的性能指标
- 记录了 Token 使用量

**❌ 缺失**：
- 没有 try-catch 包裹 LLM 调用
- 如果 LLM 调用失败（网络错误、API 错误、超时等），会抛出未捕获的异常

**对比 curator.ts**：
curator.ts 有外层的 try-catch（line 237-244）：
```typescript
} catch (error) {
  this.logger.error('概念策划生成失败', error as Error, {
    exhibitionTitle: requirements.title,
    theme: requirements.theme
  });
  throw error;
}
```

spatial-designer.ts **缺少这个外层错误处理**！

---

#### 2.5 JSON 解析（line 135-293）

```typescript
this.logger.info('🔧 [解析开始] 开始解析LLM响应');

try {
  // 清理 markdown 代码块
  let cleanedContent = rawContent.trim();
  if (cleanedContent.startsWith('```json')) {
    cleanedContent = cleanedContent.slice(7);
  } else if (cleanedContent.startsWith('```')) {
    cleanedContent = cleanedContent.slice(3);
  }
  if (cleanedContent.endsWith('```')) {
    cleanedContent = cleanedContent.slice(0, -3);
  }

  cleanedContent = cleanedContent.trim();

  if (cleanedContent.startsWith('{')) {
    // JSON 解析
    const parsed = JSON.parse(cleanedContent);
    spatialLayout = {
      layout: parsed.layout || rawContent,
      visitorRoute: parsed.visitorRoute || [...],
      zones: parsed.zones || [...],
      accessibility: parsed.accessibility || "..."
    };
  } else {
    // 非JSON，使用默认结构
    spatialLayout = { ... };
  }
} catch (parseError) {
  // 解析失败，使用默认结果
  this.logger.error('❌ [解析失败] 解析失败，使用默认结果', parseError as Error);
  spatialLayout = { ... };
}
```

**✅ 优点**：
- 正确处理了 markdown 代码块
- 提供了降级方案（默认值）
- 有详细的错误日志

**⚠️ 潜在问题**：

1. **数据验证不足**：
   - 没有验证 `parsed.zones` 是否为数组
   - 没有验证 `parsed.visitorRoute` 是否为数组
   - 没有验证 `zones` 中的每个对象是否包含 `name`, `area`, `function`
   - 没有验证 `area` 是否为正数
   - 没有验证 `zones` 的总面积是否合理（应该接近 `requirements.venueSpace.area`）

2. **默认 zones 面积可能不等于总面积**：
   ```typescript
   zones: [
     { name: "前厅接待区", area: Math.floor(requirements.venueSpace.area * 0.1) },
     { name: "主展区", area: Math.floor(requirements.venueSpace.area * 0.6) },
     { name: "互动体验区", area: Math.floor(requirements.venueSpace.area * 0.2) },
     { name: "服务区", area: Math.floor(requirements.venueSpace.area * 0.1) }
   ]
   ```
   - 使用 `Math.floor()` 会导致总面积小于原始面积
   - 例如：500㎡ → 50 + 300 + 100 + 50 = 500（恰好）
   - 但如果是 507㎡ → 50 + 304 + 101 + 50 = 505（少了 2㎡）

3. **重复的默认值代码**：
   - JSON 解析成功时的默认值（line 168-196）
   - 非JSON格式时的默认值（line 205-236）
   - 解析失败时的默认值（line 257-288）
   - 这三段代码完全相同，应该抽取为一个函数

---

#### 2.6 输出日志（line 239-252, 297-304）

```typescript
this.logger.info('📤 [最终输出] 空间布局方案', {
  layout: spatialLayout.layout,
  layoutLength: spatialLayout.layout.length,
  visitorRoute: spatialLayout.visitorRoute,
  routeCount: spatialLayout.visitorRoute.length,
  zones: spatialLayout.zones,
  zoneCount: spatialLayout.zones.length,
  totalArea: spatialLayout.zones.reduce((sum, zone) => sum + zone.area, 0),
  accessibility: spatialLayout.accessibility
});

this.logger.info('📤 [输出详情] 完整空间布局对象', {
  fullSpatialLayout: JSON.stringify(spatialLayout, null, 2)
});

const finalDuration = Date.now() - startTime;

this.logger.info('✅ [空间设计智能体] 空间布局生成完成', {
  success: true,
  totalDuration: `${finalDuration}ms`,
  llmDuration: `${llmDuration}ms`,
  parsingDuration: `${finalDuration - llmDuration}ms`
});
```

**✅ 优点**：
- 输出日志非常详细
- 包含性能指标
- 有清晰的成功标记

**⚠️ 问题**：
- 即使使用降级方案，也标记为 `success: true`
- 这可能误导调用者，以为生成成功，实际是默认值

---

## 🔴 主要问题汇总

### 1. **缺少构造函数错误处理** ❌

**当前代码**：
```typescript
constructor(modelName?: string, temperature: number = 0.5) {
  this.logger.info('🏗️ 初始化空间设计智能体', { modelName, temperature });
  this.modelConfig = ModelConfigFactory.createModelConfig(...);
  this.llm = new ChatOpenAI({ ... });
}
```

**问题**：
- 如果配置工厂失败，没有错误处理
- 如果 LLM 客户端初始化失败，没有错误处理

**建议**：
```typescript
constructor(modelName?: string, temperature: number = 0.5) {
  this.logger.info('🏗️ 初始化空间设计智能体', { modelName, temperature });

  try {
    this.modelConfig = ModelConfigFactory.createModelConfig(undefined, modelName, temperature);
    this.logger.info('模型配置创建成功', {
      provider: this.modelConfig.provider,
      modelName: this.modelConfig.modelName,
      temperature: this.modelConfig.temperature
    });

    this.llm = new ChatOpenAI({
      modelName: this.modelConfig.modelName,
      temperature: this.modelConfig.temperature,
      openAIApiKey: this.modelConfig.apiKey,
      ...(this.modelConfig.baseURL && { configuration: { baseURL: this.modelConfig.baseURL } }),
      ...(this.modelConfig.organization && { openAIOrganization: this.modelConfig.organization })
    });

    this.logger.info('✅ LLM客户端初始化完成');
  } catch (error) {
    this.logger.error('❌ 初始化失败', error as Error, { modelName, temperature });
    throw error;
  }
}
```

---

### 2. **缺少主方法外层错误处理** ❌❌❌

**当前代码**：
```typescript
async generateSpatialLayout(...) {
  const startTime = Date.now();

  // 日志记录
  this.logger.info('...');

  // 提示词渲染（没有 try-catch）
  const rendered = promptManager.render(...);

  // LLM 调用（没有 try-catch）
  const response = await this.llm.invoke(messages);

  // JSON 解析（有 try-catch，但只捕获解析错误）
  try {
    let spatialLayout = JSON.parse(...);
  } catch (parseError) {
    // 只处理解析错误
  }

  // 返回结果
  return spatialLayout;
  // ❌ 如果前面的任何步骤失败，异常会直接抛出，没有被捕获！
}
```

**问题**：
- `promptManager.render()` 可能失败（提示词模板不存在）
- `this.llm.invoke(messages)` 可能失败（网络错误、API 错误、超时）
- 这些失败没有被捕获，会直接导致工作流中断

**对比 curator.ts**：
```typescript
async generateConceptPlan(...) {
  try {
    // 提示词渲染
    const rendered = promptManager.render(...);
    // LLM 调用
    const response = await this.llm.invoke(messages);
    // JSON 解析
    try {
      let conceptPlan = JSON.parse(...);
    } catch (parseError) {
      // 解析失败处理
    }
    return conceptPlan;
  } catch (error) {
    // ✅ 外层错误捕获
    this.logger.error('概念策划生成失败', error as Error, {
      exhibitionTitle: requirements.title,
      theme: requirements.theme
    });
    throw error;
  }
}
```

**建议添加**：
```typescript
async generateSpatialLayout(...) {
  const startTime = Date.now();

  this.logger.info('═══════════════════════════════════════════════════════════');
  this.logger.info('🏗️ [空间设计智能体] 开始生成空间布局方案');
  this.logger.info('═══════════════════════════════════════════════════════════');

  try {
    // 📥 完整记录输入参数
    this.logger.info('📥 [输入参数] 原始需求', { ... });

    // 使用 PromptManager 渲染 prompt
    const rendered = promptManager.render(...);

    // ... 其他逻辑 ...

    // LLM 调用
    const response = await this.llm.invoke(messages);

    // JSON 解析
    try {
      let spatialLayout = JSON.parse(...);
    } catch (parseError) {
      // 解析失败处理
    }

    return spatialLayout;

  } catch (error) {
    // ✅ 外层错误捕获
    this.logger.error('❌ [空间设计智能体] 空间布局生成失败', error as Error, {
      exhibitionTitle: requirements.title,
      theme: requirements.theme,
      errorType: error.name,
      errorMessage: error.message
    });
    throw error;
  }
}
```

---

### 3. **缺少输入参数验证** ⚠️

**建议添加**：
```typescript
async generateSpatialLayout(
  requirements: ExhibitionRequirement,
  conceptPlan: ConceptPlan,
  revisionReason?: string
): Promise<SpatialLayout> {
  // 输入验证
  if (!requirements) {
    throw new Error("requirements 参数不能为空");
  }
  if (!conceptPlan) {
    throw new Error("conceptPlan 参数不能为空");
  }
  if (!conceptPlan.concept || conceptPlan.concept.trim().length === 0) {
    throw new Error("conceptPlan.concept 不能为空");
  }
  if (!conceptPlan.narrative || conceptPlan.narrative.trim().length === 0) {
    this.logger.warn('⚠️ [输入警告] conceptPlan.narrative 为空，可能影响生成质量');
  }
  if (!conceptPlan.keyExhibits || conceptPlan.keyExhibits.length === 0) {
    this.logger.warn('⚠️ [输入警告] conceptPlan.keyExhibits 为空，可能影响生成质量');
  }

  // ... 继续执行 ...
}
```

---

### 4. **数据验证不足** ⚠️

**当前代码**：
```typescript
const parsed = JSON.parse(cleanedContent);
spatialLayout = {
  layout: parsed.layout || rawContent,
  visitorRoute: parsed.visitorRoute || [...],
  zones: parsed.zones || [...],
  accessibility: parsed.accessibility || "..."
};
```

**问题**：
- 没有验证数据类型
- 没有验证数据完整性
- 没有验证数据合理性

**建议添加**：
```typescript
const parsed = JSON.parse(cleanedContent);

// 数据验证
if (parsed.zones && !Array.isArray(parsed.zones)) {
  this.logger.warn('⚠️ [数据验证] zones 不是数组，使用默认值');
  parsed.zones = undefined;
}

if (parsed.visitorRoute && !Array.isArray(parsed.visitorRoute)) {
  this.logger.warn('⚠️ [数据验证] visitorRoute 不是数组，使用默认值');
  parsed.visitorRoute = undefined;
}

if (parsed.zones) {
  const invalidZones = parsed.zones.filter((z: any) =>
    !z.name || typeof z.area !== 'number' || !z.function
  );
  if (invalidZones.length > 0) {
    this.logger.warn(`⚠️ [数据验证] 发现 ${invalidZones.length} 个无效的 zone，使用默认值`);
    parsed.zones = undefined;
  }
}

// 使用验证后的数据或默认值
spatialLayout = {
  layout: parsed.layout || rawContent,
  visitorRoute: parsed.visitorRoute || [...],
  zones: parsed.zones || [...],
  accessibility: parsed.accessibility || "..."
};
```

---

### 5. **重复的默认值代码** ⚠️

**当前代码**：
- 默认 zones 代码重复了 3 次（line 174-195, 213-234, 265-286）

**建议**：
```typescript
// 私有方法：生成默认的空间布局
private getDefaultSpatialLayout(requirements: ExhibitionRequirement, fallbackContent?: string): SpatialLayout {
  this.logger.info('🔧 [默认方案] 生成默认空间布局');

  return {
    layout: fallbackContent || "基于策划概念的空间布局方案",
    visitorRoute: [
      "入口大厅 - 主题介绍区",
      "主展区 - 按时间/主题顺序参观",
      "互动体验区 - 深度参与",
      "尾厅 - 总结与展望"
    ],
    zones: [
      {
        name: "前厅接待区",
        area: Math.floor(requirements.venueSpace.area * 0.1),
        function: "票务、咨询、安检"
      },
      {
        name: "主展区",
        area: Math.floor(requirements.venueSpace.area * 0.6),
        function: "核心展品展示"
      },
      {
        name: "互动体验区",
        area: Math.floor(requirements.venueSpace.area * 0.2),
        function: "多媒体互动和深度体验"
      },
      {
        name: "服务区",
        area: Math.floor(requirements.venueSpace.area * 0.1),
        function: "休息、文创商店"
      }
    ],
    accessibility: "设有无障碍通道、轮椅租借、盲文导览等无障碍设施"
  };
}

// 使用
spatialLayout = this.getDefaultSpatialLayout(requirements, rawContent);
```

---

### 6. **总面积计算不准确** ⚠️

**问题**：
```typescript
zones: [
  { name: "前厅接待区", area: Math.floor(500 * 0.1) },  // 50
  { name: "主展区", area: Math.floor(500 * 0.6) },       // 300
  { name: "互动体验区", area: Math.floor(500 * 0.2) },   // 100
  { name: "服务区", area: Math.floor(500 * 0.1) }        // 50
]
// 总计: 50 + 300 + 100 + 50 = 500 ✅

// 但如果场地面积是 507㎡
zones: [
  { area: Math.floor(507 * 0.1) },  // 50
  { area: Math.floor(507 * 0.6) },  // 304
  { area: Math.floor(507 * 0.2) },  // 101
  { area: Math.floor(507 * 0.1) }   // 50
]
// 总计: 50 + 304 + 101 + 50 = 505 ❌ (少了 2㎡)
```

**建议**：
```typescript
// 使用更精确的计算，并在最后一个区域调整
private getDefaultSpatialLayout(requirements: ExhibitionRequirement): SpatialLayout {
  const totalArea = requirements.venueSpace.area;
  const area10Percent = Math.floor(totalArea * 0.1);
  const area60Percent = Math.floor(totalArea * 0.6);
  const area20Percent = Math.floor(totalArea * 0.2);
  const remainder = totalArea - area10Percent - area60Percent - area20Percent - area10Percent;

  this.logger.info('🔧 [默认方案] 面积分配', {
    totalArea,
    area10Percent,
    area60Percent,
    area20Percent,
    remainder
  });

  return {
    layout: "基于策划概念的空间布局方案",
    visitorRoute: [
      "入口大厅 - 主题介绍区",
      "主展区 - 按时间/主题顺序参观",
      "互动体验区 - 深度参与",
      "尾厅 - 总结与展望"
    ],
    zones: [
      {
        name: "前厅接待区",
        area: area10Percent,
        function: "票务、咨询、安检"
      },
      {
        name: "主展区",
        area: area60Percent,
        function: "核心展品展示"
      },
      {
        name: "互动体验区",
        area: area20Percent,
        function: "多媒体互动和深度体验"
      },
      {
        name: "服务区",
        area: area10Percent + remainder,  // 将余数加到最后一个区域
        function: "休息、文创商店"
      }
    ],
    accessibility: "设有无障碍通道、轮椅租借、盲文导览等无障碍设施"
  };
}
```

---

### 7. **缺少 LLM 调用超时控制** ⚠️

**建议**：
```typescript
// 设置超时
const TIMEOUT_MS = 60000; // 60秒超时

const llmPromise = this.llm.invoke(messages);
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('LLM 调用超时')), TIMEOUT_MS)
);

try {
  const response = await Promise.race([llmPromise, timeoutPromise]);
  // ...
} catch (error) {
  if (error.message === 'LLM 调用超时') {
    this.logger.error('❌ [LLM调用超时] LLM 响应超时');
    throw new Error('空间设计生成超时，请稍后重试');
  }
  throw error;
}
```

---

## 📊 与 curator.ts 的对比

| 特性 | curator.ts | spatial-designer.ts | 评价 |
|------|-----------|---------------------|------|
| **构造函数错误处理** | ✅ 有 try-catch | ❌ 无 | spatial-designer 缺失 |
| **输入参数验证** | ❌ 无 | ❌ 无 | 两者都缺失 |
| **提示词渲染错误处理** | ❌ 无（但有外层 catch） | ❌ 无 | 两者都依赖外层 catch |
| **LLM 调用错误处理** | ✅ 有外层 catch | ❌ 无 | **spatial-designer 严重缺失** |
| **JSON 解析错误处理** | ✅ 有 try-catch | ✅ 有 try-catch | 两者都有 |
| **数据验证** | ❌ 无 | ❌ 无 | 两者都缺失 |
| **重复代码** | ❌ 有（默认值） | ❌ 有（默认值） | 两者都需要优化 |
| **详细日志** | ✅ 有 | ✅ 有 | 两者都有 |
| **性能指标** | ✅ 有 | ✅ 有 | 两者都有 |

---

## 🎯 修复优先级

### 🔴 **高优先级**（必须修复）

1. **添加主方法外层错误处理** ❌❌❌
   - 这是最严重的问题
   - 任何 LLM 调用失败都会导致工作流崩溃
   - 参考 curator.ts 的实现

2. **添加构造函数错误处理** ❌
   - 初始化失败应该被记录
   - 参考 curator.ts 的实现

### 🟡 **中优先级**（建议修复）

3. **添加输入参数验证** ⚠️
   - 防止空值导致的错误
   - 提前发现数据问题

4. **添加数据验证** ⚠️
   - 验证 LLM 返回的数据结构
   - 防止脏数据

5. **重构重复代码** ⚠️
   - 抽取 `getDefaultSpatialLayout()` 方法
   - 提高代码可维护性

### 🟢 **低优先级**（优化）

6. **优化面积计算** ⚠️
   - 处理 `Math.floor()` 导致的总面积误差
   - 在最后一个区域调整余数

7. **添加超时控制** ⚠️
   - 防止 LLM 调用无限等待
   - 提升用户体验

---

## 📝 修复后的完整代码结构

```typescript
export class SpatialDesignerAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;
  private logger = createLogger('SPATIAL-DESIGNER-AGENT');

  constructor(modelName?: string, temperature: number = 0.5) {
    this.logger.info('🏗️ 初始化空间设计智能体', { modelName, temperature });

    try {
      this.modelConfig = ModelConfigFactory.createModelConfig(...);
      this.logger.info('✅ 模型配置创建成功', { ... });

      this.llm = new ChatOpenAI({ ... });
      this.logger.info('✅ LLM客户端初始化完成');
    } catch (error) {
      this.logger.error('❌ 初始化失败', error as Error);
      throw error;
    }
  }

  async generateSpatialLayout(
    requirements: ExhibitionRequirement,
    conceptPlan: ConceptPlan,
    revisionReason?: string
  ): Promise<SpatialLayout> {
    const startTime = Date.now();

    this.logger.info('═══════════════════════════════════════════════════════════');
    this.logger.info('🏗️ [空间设计智能体] 开始生成空间布局方案');
    this.logger.info('═══════════════════════════════════════════════════════════');

    try {
      // ✅ 输入参数验证
      this.validateInputs(requirements, conceptPlan);

      // ✅ 完整记录输入参数
      this.logger.info('📥 [输入参数]', { ... });

      // ✅ 提示词渲染
      const rendered = promptManager.render(...);

      // ✅ LLM 调用
      const response = await this.llm.invoke(messages);

      // ✅ JSON 解析
      let spatialLayout = this.parseResponse(rawContent, requirements);

      // ✅ 数据验证
      this.validateSpatialLayout(spatialLayout, requirements);

      // ✅ 输出日志
      this.logger.info('📤 [最终输出]', { ... });

      return spatialLayout;

    } catch (error) {
      // ✅ 外层错误捕获
      this.logger.error('❌ [空间设计智能体] 空间布局生成失败', error as Error);
      throw error;
    }
  }

  // ✅ 私有方法：输入验证
  private validateInputs(requirements: ExhibitionRequirement, conceptPlan: ConceptPlan) {
    if (!requirements) {
      throw new Error("requirements 参数不能为空");
    }
    if (!conceptPlan) {
      throw new Error("conceptPlan 参数不能为空");
    }
    if (!conceptPlan.concept || conceptPlan.concept.trim().length === 0) {
      throw new Error("conceptPlan.concept 不能为空");
    }
  }

  // ✅ 私有方法：解析响应
  private parseResponse(rawContent: string, requirements: ExhibitionRequirement): SpatialLayout {
    try {
      // 清理 markdown 代码块
      let cleanedContent = this.cleanMarkdownBlock(rawContent);

      // 尝试 JSON 解析
      if (cleanedContent.startsWith('{')) {
        const parsed = JSON.parse(cleanedContent);
        return this.buildSpatialLayout(parsed, requirements);
      } else {
        // 非JSON格式
        return this.getDefaultSpatialLayout(requirements, rawContent);
      }
    } catch (parseError) {
      // 解析失败
      this.logger.error('❌ [解析失败]', parseError as Error);
      return this.getDefaultSpatialLayout(requirements, rawContent);
    }
  }

  // ✅ 私有方法：清理 markdown 代码块
  private cleanMarkdownBlock(content: string): string {
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    return cleaned.trim();
  }

  // ✅ 私有方法：构建空间布局
  private buildSpatialLayout(parsed: any, requirements: ExhibitionRequirement): SpatialLayout {
    // 数据验证
    if (parsed.zones && !Array.isArray(parsed.zones)) {
      this.logger.warn('⚠️ zones 不是数组，使用默认值');
      parsed.zones = undefined;
    }

    return {
      layout: parsed.layout || "基于策划概念的空间布局方案",
      visitorRoute: parsed.visitorRoute || this.getDefaultVisitorRoute(),
      zones: parsed.zones || this.getDefaultZones(requirements),
      accessibility: parsed.accessibility || "设有无障碍通道、轮椅租借、盲文导览等无障碍设施"
    };
  }

  // ✅ 私有方法：默认空间布局
  private getDefaultSpatialLayout(requirements: ExhibitionRequirement, fallbackContent?: string): SpatialLayout {
    this.logger.info('🔧 [默认方案] 生成默认空间布局');
    return {
      layout: fallbackContent || "基于策划概念的空间布局方案",
      visitorRoute: this.getDefaultVisitorRoute(),
      zones: this.getDefaultZones(requirements),
      accessibility: "设有无障碍通道、轮椅租借、盲文导览等无障碍设施"
    };
  }

  // ✅ 私有方法：默认参观路线
  private getDefaultVisitorRoute(): string[] {
    return [
      "入口大厅 - 主题介绍区",
      "主展区 - 按时间/主题顺序参观",
      "互动体验区 - 深度参与",
      "尾厅 - 总结与展望"
    ];
  }

  // ✅ 私有方法：默认功能区域
  private getDefaultZones(requirements: ExhibitionRequirement): Array<{name: string, area: number, function: string}> {
    const totalArea = requirements.venueSpace.area;
    const area10Percent = Math.floor(totalArea * 0.1);
    const area60Percent = Math.floor(totalArea * 0.6);
    const area20Percent = Math.floor(totalArea * 0.2);
    const remainder = totalArea - area10Percent - area60Percent - area20Percent - area10Percent;

    return [
      { name: "前厅接待区", area: area10Percent, function: "票务、咨询、安检" },
      { name: "主展区", area: area60Percent, function: "核心展品展示" },
      { name: "互动体验区", area: area20Percent, function: "多媒体互动和深度体验" },
      { name: "服务区", area: area10Percent + remainder, function: "休息、文创商店" }
    ];
  }

  // ✅ 私有方法：数据验证
  private validateSpatialLayout(layout: SpatialLayout, requirements: ExhibitionRequirement) {
    const totalZoneArea = layout.zones.reduce((sum, zone) => sum + zone.area, 0);
    const expectedArea = requirements.venueSpace.area;

    // 允许 5% 的误差
    if (Math.abs(totalZoneArea - expectedArea) / expectedArea > 0.05) {
      this.logger.warn('⚠️ [数据验证] zones 总面积与场地面积差异较大', {
        totalZoneArea,
        expectedArea,
        difference: Math.abs(totalZoneArea - expectedArea)
      });
    }
  }
}
```

---

## 🎯 总结

### ✅ 做得好的地方

1. **日志记录非常详细** - 方便调试和追踪
2. **Markdown 清理逻辑正确** - 修复了 JSON 解析问题
3. **提供了降级方案** - 解析失败时使用默认值
4. **性能指标记录** - 有助于性能监控

### ❌ 主要问题

1. **缺少外层错误处理** - 🔴 **最严重**，会导致工作流崩溃
2. **缺少构造函数错误处理** - 🔴 初始化失败没有被记录
3. **缺少输入参数验证** - 🟡 可能导致运行时错误
4. **缺少数据验证** - 🟡 可能使用脏数据
5. **代码重复** - 🟡 默认值代码重复 3 次

### 📋 建议的修复顺序

1. **立即修复**：添加外层错误处理（最重要）
2. **立即修复**：添加构造函数错误处理
3. **短期**：添加输入参数验证和数据验证
4. **中期**：重构重复代码，抽取私有方法
5. **长期**：优化面积计算，添加超时控制

---

**分析完成时间**：2026-01-06
**分析版本**：基于当前代码的完整逻辑梳理
