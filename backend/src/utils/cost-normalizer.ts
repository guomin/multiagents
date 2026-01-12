import { createLogger } from './logger'

const logger = createLogger('COST-NORMALIZER')

/**
 * 标准化 cost 字段
 * 处理各种格式：字符串、数字、区间值、中文单位
 *
 * @param cost - 需要标准化的成本值，可以是数字、字符串或任意类型
 * @param context - 上下文信息（可选），用于日志记录
 * @returns 标准化后的数字成本，如果无法解析则返回 0
 *
 * @example
 * normalizeCost(30000) // => 30000
 * normalizeCost("3-5万元") // => 40000 (平均值)
 * normalizeCost("约5万") // => 50000
 * normalizeCost("invalid") // => 0
 */
export function normalizeCost(cost: any, context?: string): number {
  // 如果已经是数字，直接返回
  if (typeof cost === 'number' && !isNaN(cost)) {
    return cost
  }

  // 如果是字符串，尝试提取和转换
  if (typeof cost === 'string') {
    logger.warn('⚠️ [数据格式] cost字段为字符串，尝试转换', {
      cost,
      context: context || 'unknown'
    })

    // 移除所有非数字字符（保留小数点和数字）
    let cleaned = cost
      .replace(/[万元千万]/g, '') // 移除中文单位
      .replace(/[-~～至到]\s*/g, ' ') // 处理区间值
      .trim()

    // 如果包含区间，取中间值或平均值
    const parts = cleaned.split(/\s+/).filter(p => p)
    if (parts.length >= 2) {
      const nums = parts.map(p => parseFloat(p)).filter(n => !isNaN(n))
      if (nums.length >= 2) {
        // 取平均值
        const avg = (nums[0] + nums[1]) / 2
        logger.info('✅ [区间转换] 使用平均值', {
          original: cost,
          range: nums,
          average: avg,
          context: context || 'unknown'
        })
        return avg
      }
    }

    // 提取第一个有效数字
    const match = cleaned.match(/(\d+(?:\.\d+)?)/)
    if (match) {
      let num = parseFloat(match[1])

      // 处理"万元"单位
      if (cost.includes('万')) {
        num *= 10000
      }

      logger.info('✅ [字符串转换] 成功转换为数字', {
        original: cost,
        converted: num,
        context: context || 'unknown'
      })

      return num
    }

    logger.error('❌ [转换失败] 无法从字符串提取有效数字', {
      cost,
      context: context || 'unknown'
    })
    return 0
  }

  // 其他情况返回0
  logger.warn('⚠️ [未知格式] cost字段格式未知，使用默认值0', {
    cost,
    type: typeof cost,
    context: context || 'unknown'
  })
  return 0
}

/**
 * 批量标准化成本数组
 *
 * @param costs - 成本值数组
 * @param context - 上下文信息（可选）
 * @returns 标准化后的数字数组
 */
export function normalizeCosts(costs: any[], context?: string): number[] {
  return costs.map((cost, index) =>
    normalizeCost(cost, `${context || 'unknown'}[${index}]`)
  )
}
