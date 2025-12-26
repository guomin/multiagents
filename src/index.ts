import { ExhibitionDesignGraph } from "./graph/exhibition-graph";
import { ExhibitionRequirement, ExhibitionState } from "./types/exhibition";

// 示例展览需求
const sampleExhibitionRequirement: ExhibitionRequirement = {
  title: "数字艺术的未来",
  theme: "探索人工智能与数字艺术的融合创新",
  targetAudience: "艺术爱好者、科技从业者、大学生",
  venueSpace: {
    area: 800,
    height: 4.5,
    layout: "开放式大空间，有一个中央天井"
  },
  budget: {
    total: 500000,
    currency: "CNY"
  },
  duration: {
    startDate: "2025-06-01",
    endDate: "2025-08-31"
  },
  specialRequirements: [
    "需要包含互动体验区",
    "考虑无障碍设计",
    "支持社交媒体分享",
    "设置文创产品销售区"
  ]
};

async function main() {
  try {
    // 加载环境变量
    if (process.env.NODE_ENV !== "production") {
      require("dotenv").config();
    }

    // 验证模型配置
    const { ModelConfigFactory } = require("./config/model");
    const configValidation = ModelConfigFactory.validateConfig();

    if (!configValidation.isValid) {
      console.error("❌ 模型配置验证失败:", configValidation.error);
      console.log("\n💡 配置提示:");
      console.log("1. 复制 .env.example 到 .env");
      console.log("2. 选择模型提供商: MODEL_PROVIDER=openai 或 MODEL_PROVIDER=deepseek");
      console.log("3. 设置对应的API密钥: OPENAI_API_KEY 或 DEEPSEEK_API_KEY");
      process.exit(1);
    }

    // 显示当前配置
    const config = ModelConfigFactory.createModelConfig();
    console.log("🔧 初始化展陈设计多智能体系统...");
    console.log(`📊 使用模型: ${config.provider} - ${config.modelName}`);
    if (config.baseURL) {
      console.log(`🔗 API 端点: ${config.baseURL}`);
    }

    const exhibitionSystem = new ExhibitionDesignGraph();

    console.log("\n🎯 开始处理展览设计需求...\n");
    console.log(`📋 项目: ${sampleExhibitionRequirement.title}`);
    console.log(`🎯 主题: ${sampleExhibitionRequirement.theme}`);
    console.log(`💰 预算: ${sampleExhibitionRequirement.budget.total} ${sampleExhibitionRequirement.budget.currency}\n`);

    const result = await exhibitionSystem.runExhibition(sampleExhibitionRequirement);

    console.log("\n✅ 系统执行完成!");
    console.log(`📈 处理步骤数: ${result.messages.length}`);
    console.log(`🏁 最终状态: ${result.currentStep}`);

    // 可选：保存结果到文件
    if (process.env.NODE_ENV === "development") {
      const fs = require("fs");
      const report = await exhibitionSystem["supervisor"].generateFinalReport(result);
      const fileName = `exhibition-report-${config.provider}-${Date.now()}.md`;
      fs.writeFileSync(fileName, report, "utf8");
      console.log(`📄 详细报告已保存到 ${fileName}`);
    }

  } catch (error) {
    console.error("❌ 系统执行出错:", error);
    if (error instanceof Error) {
      console.error("错误详情:", error.message);
    }
    process.exit(1);
  }
}

// 如果直接运行此文件，执行主函数
if (require.main === module) {
  main().catch(console.error);
}

export { ExhibitionDesignGraph, ExhibitionRequirement };
export type { ExhibitionState };