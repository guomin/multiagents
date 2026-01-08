import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import {
  ExhibitionRequirement,
  ExhibitionOutline,
  SpatialLayout,
  VisualDesign,
  InteractiveSolution,
  BudgetEstimate
} from "../types/exhibition";
import { ModelConfigFactory, ModelConfig } from "../config/model";
import { promptManager } from "../prompts";
import { createLogger } from "../utils/logger";

export class BudgetControllerAgent {
  private llm: ChatOpenAI;
  private modelConfig: ModelConfig;
  private logger = createLogger('BUDGET-CONTROLLER-AGENT');

  constructor(modelName?: string, temperature: number = 0.4) {
    this.logger.info('💰 初始化预算控制智能体', { modelName, temperature });

    try {
      // 使用智能体专属配置方法
      this.modelConfig = ModelConfigFactory.createModelConfigForAgent(
        'budget_controller',  // 指定智能体类型
        modelName,
        temperature
      );

      this.logger.info('✅ 模型配置创建成功', {
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
      this.logger.error('❌ LLM客户端初始化失败', error as Error, { modelName, temperature });
      throw error;
    }
  }

  async generateBudgetEstimate(
    requirements: ExhibitionRequirement,
    exhibitionOutline: ExhibitionOutline, // 修改：接收ExhibitionOutline
    spatialLayout: SpatialLayout,
    visualDesign: VisualDesign,
    interactiveSolution: InteractiveSolution,
    revisionReason?: string
  ): Promise<BudgetEstimate> {
    const startTime = Date.now();
    console.log('💰 [预算控制智能体] 开始生成预算估算...');

    this.logger.info('═══════════════════════════════════════════════════════════');
    this.logger.info('💰 [预算控制智能体] 开始生成预算估算');
    this.logger.info('═══════════════════════════════════════════════════════════');

    try {
      // ✅ 输入参数验证
      this.validateInputs(requirements, exhibitionOutline, spatialLayout, visualDesign, interactiveSolution);

      // 📥 完整记录输入参数
      this.logger.info('📥 [输入参数] 原始需求', {
        exhibitionTitle: requirements.title,
        theme: requirements.theme,
        targetAudience: requirements.targetAudience,
        totalBudget: requirements.budget.total,
        currency: requirements.budget.currency,
        area: requirements.venueSpace.area,
        height: requirements.venueSpace.height,
        startDate: requirements.duration.startDate,
        endDate: requirements.duration.endDate
      });

      this.logger.info('📥 [输入参数] 展览大纲（来自大纲细化智能体）', {
        concept: exhibitionOutline.conceptPlan.concept,
        keyExhibitsCount: exhibitionOutline.exhibits.length,
        zonesCount: exhibitionOutline.zones.length,
        budgetFramework: exhibitionOutline.budgetAllocation.total
      });

      this.logger.info('📥 [输入参数] 空间布局（来自空间智能体）', {
        layout: spatialLayout.layout,
        zonesCount: spatialLayout.zones.length,
        totalArea: spatialLayout.zones.reduce((sum, z) => sum + z.area, 0),
        zones: spatialLayout.zones
      });

      this.logger.info('📥 [输入参数] 视觉设计（来自视觉智能体）', {
        colorSchemeCount: visualDesign.colorScheme.length,
        brandElementsCount: visualDesign.brandElements.length,
        brandElements: visualDesign.brandElements
      });

      this.logger.info('📥 [输入参数] 互动技术方案（来自互动技术智能体）', {
        technologiesCount: interactiveSolution.technologies.length,
        interactivesCount: interactiveSolution.interactives.length,
        interactives: interactiveSolution.interactives,
        totalInteractiveCost: interactiveSolution.interactives.reduce((sum, item) => sum + (item.cost || 0), 0)
      });

      // ✅ 基于实际设计方案计算预算明细
      const breakdown = this.calculateBreakdown(
        requirements,
        exhibitionOutline,
        spatialLayout,
        visualDesign,
        interactiveSolution
      );

      const totalCost = breakdown.reduce((sum, item) => sum + item.amount, 0);
      const totalBudget = requirements.budget.total;

      // 📤 预算明细日志
      this.logger.info('📊 [预算明细] 基于实际设计方案计算', {
        breakdown: breakdown,
        totalCost,
        totalBudget,
        isOverBudget: totalCost > totalBudget,
        overBudgetAmount: totalCost > totalBudget ? totalCost - totalBudget : 0,
        overBudgetPercent: totalCost > totalBudget ? ((totalCost - totalBudget) / totalBudget * 100).toFixed(2) + '%' : '0%'
      });

      // 使用 PromptManager 渲染 prompt（用于生成优化建议）
      const rendered = promptManager.render(
        'budget_controller',
        'generateBudgetEstimate',
        {
          revisionReason,
          // 展览基本信息
          title: requirements.title,
          theme: requirements.theme,
          targetAudience: requirements.targetAudience,
          totalBudget,
          currency: requirements.budget.currency,
          area: requirements.venueSpace.area,
          height: requirements.venueSpace.height,
          startDate: requirements.duration.startDate,
          endDate: requirements.duration.endDate,
          // 大纲信息（用于生成针对性建议）
          concept: exhibitionOutline.conceptPlan.concept,
          keyExhibits: exhibitionOutline.exhibits.map(e => e.name).join("；"),
          zones: spatialLayout.zones.map(z =>
            `${z.name}（${z.area}㎡，功能：${z.function}）`
          ).join("；"),
          brandElements: visualDesign.brandElements.join("；"),
          interactives: interactiveSolution.interactives.map(i =>
            `${i.name}（${i.type}，成本：${i.cost || 0}）`
          ).join("；"),
          // 预算信息
          actualTotalCost: totalCost,
          isOverBudget: totalCost > totalBudget
        }
      );

      const systemPrompt = rendered.system;
      const humanPrompt = rendered.human;

      this.logger.info('📝 [提示词] Prompt 版本', {
        version: `${rendered.version.major}.${rendered.version.minor}.${rendered.version.patch}`,
        systemPromptLength: systemPrompt.length,
        humanPromptLength: humanPrompt.length
      });

      this.logger.info('📝 [提示词] 用户提示词', {
        content: humanPrompt
      });

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(humanPrompt)
      ];

      this.logger.info('🤖 [LLM调用] 准备调用大模型生成优化建议', {
        model: this.modelConfig.modelName,
        temperature: this.modelConfig.temperature
      });

      const llmStart = Date.now();
      const response = await this.llm.invoke(messages);
      const llmDuration = Date.now() - llmStart;

      this.logger.info('🤖 [LLM调用] 优化建议生成完成', {
        llmDuration: `${llmDuration}ms`
      });

      // 生成优化建议
      const recommendations = this.generateRecommendations(
        requirements,
        breakdown,
        totalCost,
        totalBudget,
        response.content.toString()
      );

      // 📤 最终输出日志
      this.logger.info('📤 [最终输出] 预算估算', {
        breakdown,
        totalCost,
        recommendations,
        recommendationsCount: recommendations.length
      });

      const budgetEstimate: BudgetEstimate = {
        breakdown,
        totalCost,
        recommendations
      };

      const finalDuration = Date.now() - startTime;

      this.logger.info('═══════════════════════════════════════════════════════════');
      this.logger.info('✅ [预算控制智能体] 预算估算生成完成', {
        success: true,
        totalDuration: `${finalDuration}ms`,
        llmDuration: `${llmDuration}ms`,
        calculationDuration: `${finalDuration - llmDuration}ms`
      });
      this.logger.info('═══════════════════════════════════════════════════════════');

      return budgetEstimate;

    } catch (error) {
      // ✅ 外层错误捕获
      this.logger.error('❌ [预算控制智能体] 预算估算生成失败', error as Error, {
        exhibitionTitle: requirements?.title || 'unknown',
        totalBudget: requirements?.budget?.total || 0,
        errorType: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * ✅ 输入参数验证
   */
  private validateInputs(
    requirements: ExhibitionRequirement,
    exhibitionOutline: ExhibitionOutline,
    spatialLayout: SpatialLayout,
    visualDesign: VisualDesign,
    interactiveSolution: InteractiveSolution
  ): void {
    if (!requirements) {
      throw new Error("requirements 参数不能为空");
    }

    if (!exhibitionOutline) {
      throw new Error("exhibitionOutline 参数不能为空");
    }

    if (!spatialLayout) {
      throw new Error("spatialLayout 参数不能为空");
    }

    if (!visualDesign) {
      throw new Error("visualDesign 参数不能为空");
    }

    if (!interactiveSolution) {
      throw new Error("interactiveSolution 参数不能为空");
    }

    // 验证关键字段
    if (!requirements.budget || typeof requirements.budget.total !== 'number') {
      throw new Error("requirements.budget.total 必须是数字");
    }

    if (!spatialLayout.zones || spatialLayout.zones.length === 0) {
      this.logger.warn('⚠️ [输入警告] spatialLayout.zones 为空，可能影响预算准确性');
    }

    if (!interactiveSolution.interactives || interactiveSolution.interactives.length === 0) {
      this.logger.warn('⚠️ [输入警告] interactiveSolution.interactives 为空，可能影响预算准确性');
    }
  }

  /**
   * ✅ 基于实际设计方案计算预算明细
   */
  private calculateBreakdown(
    requirements: ExhibitionRequirement,
    exhibitionOutline: ExhibitionOutline, // 修改：接收ExhibitionOutline
    spatialLayout: SpatialLayout,
    visualDesign: VisualDesign,
    interactiveSolution: InteractiveSolution
  ): Array<{category: string, amount: number, description: string}> {

    this.logger.info('💰 [预算计算] 开始基于实际设计方案计算预算');

    // 1. 互动技术设备（使用实际 cost）
    const interactiveCost = interactiveSolution.interactives.reduce(
      (sum, item) => sum + (item.cost || 0),
      0
    );

    this.logger.info('💰 [预算计算] 互动技术设备', {
      interactivesCount: interactiveSolution.interactives.length,
      actualCost: interactiveCost,
      items: interactiveSolution.interactives.map(i => ({
        name: i.name,
        cost: i.cost || 0
      }))
    });

    // 2. 空间设计与施工（基于 zones）
    const zonesCount = spatialLayout.zones.length;
    const totalArea = spatialLayout.zones.reduce((sum, z) => sum + z.area, 0);

    // 基础硬装：每平米800元
    const baseConstructionCost = Math.floor(totalArea * 800);

    // 展柜制作：每个区域基础展柜5000元 + 每平米展柜200元
    const showcaseCost = Math.floor(
      (zonesCount * 5000) + (totalArea * 200)
    );

    // 照明系统：每平米500元
    const lightingCost = Math.floor(totalArea * 500);

    const spaceCost = baseConstructionCost + showcaseCost + lightingCost;

    this.logger.info('💰 [预算计算] 空间设计与施工', {
      zonesCount,
      totalArea,
      baseConstructionCost,
      showcaseCost,
      lightingCost,
      totalSpaceCost: spaceCost
    });

    // 3. 视觉设计与物料（基于 brandElements）
    const brandElementsCount = visualDesign.brandElements.length;

    // 视觉设计费：品牌元素数量 × 3000
    const designFee = Math.floor(brandElementsCount * 3000);

    // 标识系统：品牌元素数量 × 2500
    const signageCost = Math.floor(brandElementsCount * 2500);

    // 印刷品：总面积 × 100（每平米印刷材料）
    const printCost = Math.floor(totalArea * 100);

    const visualCost = designFee + signageCost + printCost;

    this.logger.info('💰 [预算计算] 视觉设计与物料', {
      brandElementsCount,
      designFee,
      signageCost,
      printCost,
      totalVisualCost: visualCost
    });

    // 4. 展品运输与保险（基于展览大纲中的exhibits）
    // 使用大纲中每件展品的实际保险和运输费用
    const exhibitsCount = exhibitionOutline.exhibits.length;
    const exhibitCost = exhibitionOutline.exhibits.reduce(
      (sum, exhibit) => sum + exhibit.insurance + exhibit.transportCost,
      0
    );

    this.logger.info('💰 [预算计算] 展品运输与保险（基于大纲实际数据）', {
      exhibitsCount,
      cost: exhibitCost,
      exhibits: exhibitionOutline.exhibits.map(e => ({
        name: e.name,
        protectionLevel: e.protectionLevel,
        insurance: e.insurance,
        transportCost: e.transportCost
      }))
    });

    // 5. 人员费用（基于展期）
    const startDate = new Date(requirements.duration.startDate);
    const endDate = new Date(requirements.duration.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // 每天人员费用：3000元（策展人 + 技术支持 + 讲解员）
    const personnelCost = Math.floor(days * 3000);

    this.logger.info('💰 [预算计算] 人员费用', {
      startDate: requirements.duration.startDate,
      endDate: requirements.duration.endDate,
      days,
      dailyCost: 3000,
      totalPersonnelCost: personnelCost
    });

    // 6. 营销与推广（基于 targetAudience）
    const audience = requirements.targetAudience.toLowerCase();

    // 根据受众类型调整营销费用
    let marketingMultiplier = 1.0;
    if (audience.includes("商业") || audience.includes("品牌")) {
      marketingMultiplier = 1.5; // 商业类展需要更多营销
    } else if (audience.includes("学生") || audience.includes("教育")) {
      marketingMultiplier = 0.7; // 教育类展营销费用较低
    }

    const marketingCost = Math.floor(requirements.budget.total * 0.05 * marketingMultiplier);

    this.logger.info('💰 [预算计算] 营销与推广', {
      targetAudience: requirements.targetAudience,
      multiplier: marketingMultiplier,
      cost: marketingCost
    });

    // 组装预算明细
    const breakdown = [
      {
        category: "空间设计与施工",
        amount: spaceCost,
        description: `包含${zonesCount}个区域（总面积${totalArea}㎡）：${spatialLayout.zones.map(z => z.name).join("、")}。硬装施工（${baseConstructionCost}）、展柜制作（${showcaseCost}）、照明系统（${lightingCost}）`
      },
      {
        category: "视觉设计与物料",
        amount: visualCost,
        description: `包含${brandElementsCount}个品牌元素：${visualDesign.brandElements.join("、")}。视觉设计费（${designFee}）、标识系统（${signageCost}）、印刷品（${printCost}）`
      },
      {
        category: "互动技术设备",
        amount: interactiveCost,
        description: `包含${interactiveSolution.interactives.length}个互动装置：${interactiveSolution.interactives.map(i => i.name).join("、")}。${interactiveSolution.technicalRequirements}`
      },
      {
        category: "展品运输与保险",
        amount: exhibitCost,
        description: `包含${exhibitsCount}件展品：${exhibitionOutline.exhibits.map(e => e.name).join("、")}。专业运输、仓储、保险费用（基于大纲详细数据）`
      },
      {
        category: "人员费用",
        amount: personnelCost,
        description: `策展人员、技术支持、讲解员。展期：${requirements.duration.startDate} 至 ${requirements.duration.endDate}（共${days}天）`
      },
      {
        category: "营销与推广",
        amount: marketingCost,
        description: `宣传材料、广告投放、公关活动。目标受众：${requirements.targetAudience}`
      }
    ];

    this.logger.info('💰 [预算计算] 预算明细计算完成', {
      breakdown,
      calculatedTotal: breakdown.reduce((sum, item) => sum + item.amount, 0)
    });

    return breakdown;
  }

  /**
   * ✅ 生成优化建议
   */
  private generateRecommendations(
    requirements: ExhibitionRequirement,
    breakdown: Array<{category: string, amount: number, description: string}>,
    totalCost: number,
    totalBudget: number,
    llmResponse: string
  ): string[] {

    const recommendations: string[] = [];
    const isOverBudget = totalCost > totalBudget;
    const overBudgetAmount = isOverBudget ? totalCost - totalBudget : 0;
    const overBudgetPercent = isOverBudget ? ((totalCost - totalBudget) / totalBudget * 100) : 0;

    // 预算状态分析
    if (isOverBudget) {
      recommendations.push(`⚠️ 预算预警：总成本（${totalCost.toLocaleString()}）超出预算（${totalBudget.toLocaleString()}）${overBudgetPercent.toFixed(1)}%，超出金额：${overBudgetAmount.toLocaleString()}元`);
    } else {
      const underBudgetAmount = totalBudget - totalCost;
      const underBudgetPercent = (underBudgetAmount / totalBudget * 100);
      recommendations.push(`✅ 预算可控：总成本（${totalCost.toLocaleString()}）在预算（${totalBudget.toLocaleString()}）范围内，剩余预算：${underBudgetAmount.toLocaleString()}元（${underBudgetPercent.toFixed(1)}%）`);
    }

    // 找出成本最高的类别
    const highestCostCategory = breakdown.reduce((max, item) =>
      item.amount > max.amount ? item : max
    );
    recommendations.push(`💡 成本分析：最高费用类别为"${highestCostCategory.category}"（${highestCostCategory.amount.toLocaleString()}元，占${(highestCostCategory.amount / totalCost * 100).toFixed(1)}%）`);

    // 互动技术成本分析
    const interactiveItem = breakdown.find(item => item.category === "互动技术设备");
    if (interactiveItem) {
      const interactivePercent = (interactiveItem.amount / totalCost * 100);
      recommendations.push(`📊 互动技术占比：${interactivePercent.toFixed(1)}%（${interactiveItem.amount.toLocaleString()}元），${interactivePercent > 30 ? '占比偏高，可考虑简化部分装置或采用租赁方式' : '占比合理'}`);
    }

    // 空间设计成本分析
    const spaceItem = breakdown.find(item => item.category === "空间设计与施工");
    if (spaceItem) {
      const spacePercent = (spaceItem.amount / totalCost * 100);
      recommendations.push(`📊 空间设计占比：${spacePercent.toFixed(1)}%（${spaceItem.amount.toLocaleString()}元），${spacePercent > 40 ? '占比偏高，可考虑采用模块化设计降低成本' : '占比合理'}`);
    }

    // 添加 LLM 生成的建议
    if (llmResponse && llmResponse.trim().length > 0) {
      recommendations.push(`💡 LLM建议：${llmResponse}`);
    }

    // 通用优化建议
    if (isOverBudget) {
      recommendations.push("🔧 优化建议：优先保证核心展区质量，辅助区域可采用简化方案");

      if (interactiveItem && interactiveItem.amount > totalBudget * 0.25) {
        recommendations.push("🔧 优化建议：互动设备可考虑租赁而非购买，降低初期投入");
      }

      if (spaceItem && spaceItem.amount > totalBudget * 0.40) {
        recommendations.push("🔧 优化建议：空间设计可采用模块化展柜，便于拆卸和重复使用");
      }
    } else {
      recommendations.push("✅ 当前预算分配合理，建议预留5-10%应急费用以应对不可预见情况");
    }

    return recommendations;
  }
}
