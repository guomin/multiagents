import { ExhibitionDesignGraph } from "../graph/exhibition-graph";
import { ExhibitionRequirement } from "../types/exhibition";
import { ModelConfigFactory, ModelProvider } from "../config/model";

// DeepSeek 特化的展览需求示例
const deepseekExhibitionRequirement: ExhibitionRequirement = {
  title: "AI艺术创作展",
  theme: "人工智能赋能艺术创作的新时代",
  targetAudience: "科技艺术爱好者、创意工作者、程序员、设计师",
  venueSpace: {
    area: 600,
    height: 4,
    layout: "现代化美术馆空间，带有环形走廊"
  },
  budget: {
    total: 300000,
    currency: "CNY"
  },
  duration: {
    startDate: "2025-07-01",
    endDate: "2025-10-31"
  },
  specialRequirements: [
    "需要展示AI生成的艺术作品",
    "包含观众实时AI创作体验区",
    "考虑代码展示和技术解析",
    "预算控制在30万以内"
  ]
};

async function runDeepSeekExample() {
  console.log("🤖 运行 DeepSeek 模型示例...");

  try {
    // 验证配置
    const configValidation = ModelConfigFactory.validateConfig();
    if (!configValidation.isValid) {
      console.error("❌ 配置验证失败:", configValidation.error);
      return;
    }

    console.log("✅ 配置验证通过");

    // 显示当前使用的模型配置
    const config = ModelConfigFactory.createModelConfig();
    console.log(`📊 使用模型: ${config.provider} - ${config.modelName}`);
    console.log(`🌡️  温度设置: ${config.temperature}`);
    if (config.baseURL) {
      console.log(`🔗 API 端点: ${config.baseURL}`);
    }

    // 创建系统实例
    const system = new ExhibitionDesignGraph();

    console.log("\n🎯 开始处理 AI 艺术创作展览设计...\n");

    const result = await system.runExhibition(deepseekExhibitionRequirement);

    console.log("\n🎉 DeepSeek 模型示例运行成功！");
    console.log("📈 处理步骤数:", result.messages.length);
    console.log("🏁 最终状态:", result.currentStep);

    // 显示模型使用统计
    console.log("\n📊 模型使用统计:");
    console.log(`- 模型提供商: ${config.provider}`);
    console.log(`- 使用的模型: ${config.modelName}`);
    console.log(`- 温度参数: ${config.temperature}`);

  } catch (error) {
    console.error("❌ DeepSeek 示例运行失败:", error);

    // 提供配置帮助信息
    if (error instanceof Error && error.message.includes("DEEPSEEK_API_KEY")) {
      console.log("\n💡 配置提示:");
      console.log("1. 请确保在 .env 文件中设置了 DEEPSEEK_API_KEY");
      console.log("2. 设置 MODEL_PROVIDER=deepseek");
      console.log("3. 设置 DEFAULT_MODEL=deepseek-chat 或 deepseek-coder");
    }
  }
}

// 运行配置检查的辅助函数
function checkConfiguration() {
  console.log("🔍 检查 DeepSeek 配置...\n");

  // 显示可用的模型
  const openaiModels = ModelConfigFactory.getAvailableModels("openai");
  const deepseekModels = ModelConfigFactory.getAvailableModels("deepseek");

  console.log("📋 可用模型:");
  console.log("OpenAI 模型:", openaiModels.join(", "));
  console.log("DeepSeek 模型:", deepseekModels.join(", "));

  // 验证当前配置
  const validation = ModelConfigFactory.validateConfig();
  console.log("\n✅ 配置验证:", validation.isValid);
  if (!validation.isValid) {
    console.log("❌ 错误:", validation.error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  console.log("🤖 DeepSeek 展陈设计多智能体系统\n");
  checkConfiguration();
  console.log("\n" + "=".repeat(50) + "\n");
  runDeepSeekExample();
}

export { runDeepSeekExample, checkConfiguration };