import { ExhibitionDesignGraph } from "../graph/exhibition-graph";
import { ExhibitionRequirement } from "../types/exhibition";

// 简单的展览需求示例
const basicRequirement: ExhibitionRequirement = {
  title: "科技与生活",
  theme: "展示现代科技如何改变日常生活",
  targetAudience: "普通大众、家庭观众",
  venueSpace: {
    area: 500,
    height: 3.5,
    layout: "矩形空间，长20米宽25米"
  },
  budget: {
    total: 200000,
    currency: "CNY"
  },
  duration: {
    startDate: "2025-05-01",
    endDate: "2025-07-31"
  },
  specialRequirements: [
    "适合儿童参观",
    "包含互动体验",
    "预算控制在20万以内"
  ]
};

async function runBasicExample() {
  console.log("🧪 运行基础示例...");

  try {
    const system = new ExhibitionDesignGraph();
    const result = await system.runExhibition(basicRequirement);

    console.log("\n🎉 基础示例运行成功！");
    console.log("你可以修改 basic-example.ts 中的需求来测试不同的展览项目。");

  } catch (error) {
    console.error("❌ 基础示例运行失败:", error);
  }
}

runBasicExample();