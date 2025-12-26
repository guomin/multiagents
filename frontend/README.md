# 展陈设计多智能体系统 - 前端界面

基于 Vue3 + TypeScript + Element Plus 的现代化可视化界面，用于展示展陈设计多智能体系统的工作流程和结果。

## 🎯 功能特性

### 核心功能
- 🎨 **智能体工作流可视化** - 实时展示6个专业智能体的协作过程
- 📊 **项目管理** - 创建、监控和管理展览设计项目
- 💡 **结果展示** - 多维度展示设计方案和预算分析
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🔄 **实时更新** - WebSocket 支持的实时状态更新

### 技术亮点
- Vue 3 Composition API
- TypeScript 完整类型支持
- Pinia 状态管理
- Element Plus UI 组件
- ECharts 数据可视化
- Tailwind CSS 样式系统
- Vite 快速构建

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 📁 项目结构

```
frontend/
├── src/
│   ├── api/                 # API 服务
│   │   └── exhibition.ts    # 展览相关 API
│   ├── components/          # 通用组件
│   ├── router/              # 路由配置
│   │   └── index.ts
│   ├── stores/              # Pinia 状态管理
│   │   └── exhibition.ts    # 展览状态管理
│   ├── types/               # TypeScript 类型
│   │   └── exhibition.ts    # 展览相关类型
│   ├── views/               # 页面组件
│   │   ├── Dashboard.vue    # 控制台
│   │   ├── ExhibitionForm.vue  # 创建展览表单
│   │   ├── AgentWorkflow.vue   # 智能体工作流
│   │   └── Results.vue     # 结果展示
│   ├── App.vue              # 根组件
│   ├── main.ts              # 应用入口
│   └── style.css            # 全局样式
├── public/                  # 静态资源
├── index.html               # HTML 模板
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目配置
```

## 🎨 页面说明

### 1. 控制台 (Dashboard)
- 📊 项目统计概览
- 🤖 智能体状态监控
- 📁 最近项目列表
- ⚙️ 模型配置显示

### 2. 创建展览 (ExhibitionForm)
- 📝 完整的展览需求表单
- ✅ 智能表单验证
- 🎯 目标受众选择
- 💰 预算和展期设置
- 🔧 特殊需求配置

### 3. 智能体工作流 (AgentWorkflow)
- ⏱️ 实时进度跟踪
- 🔄 工作流程可视化
- 📝 实时执行日志
- 🎯 智能体状态管理
- ⏸️ 流程控制功能

### 4. 结果展示 (Results)
- 📋 完整设计方案展示
- 🎨 概念策划和视觉设计
- 🏗️ 空间布局设计
- 💻 互动技术方案
- 💰 预算分析图表
- 📊 工作过程回顾

## 🤖 智能体协作流程

1. **策划智能体** (绿色) - 概念策划、展品选择
2. **空间设计智能体** (橙色) - 空间布局、参观动线
3. **视觉设计智能体** (紫色) - 色彩搭配、品牌元素
4. **互动技术智能体** (红色) - 多媒体方案、互动装置
5. **预算控制智能体** (青色) - 成本估算、资源分配
6. **协调主管智能体** (靛蓝) - 统筹协调、质量把控

## 🔧 配置说明

### 环境变量

创建 `.env.local` 文件：

```bash
# API 基础地址
VITE_API_BASE_URL=http://localhost:3001/api

# 其他配置...
```

### API 配置

系统支持两种模式：
- **开发模式**: 使用模拟数据进行演示
- **生产模式**: 连接真实的后端 API

### 主题定制

修改 `tailwind.config.js` 中的颜色配置：

```javascript
theme: {
  extend: {
    colors: {
      agent: {
        curator: '#10b981',      // 策划智能体
        spatial: '#f59e0b',      // 空间设计智能体
        visual: '#8b5cf6',       // 视觉设计智能体
        interactive: '#ef4444',  // 互动技术智能体
        budget: '#06b6d4',       // 预算控制智能体
        supervisor: '#6366f1',   // 协调主管智能体
      }
    }
  }
}
```

## 🎯 使用指南

### 创建第一个展览项目

1. 启动前端应用
2. 点击 "创建新展览" 按钮
3. 填写展览需求表单
4. 点击 "启动多智能体设计"
5. 观察智能体协作过程
6. 查看完整设计方案

### 监控工作流程

- 实时查看各智能体的执行状态
- 观察进度条和状态变化
- 查看详细的执行日志
- 支持暂停和重新启动

### 导出设计报告

- 支持 PDF、Word、Markdown 格式
- 包含完整的设计方案
- 可用于项目汇报和存档

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License