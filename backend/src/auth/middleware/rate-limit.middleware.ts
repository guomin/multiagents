import { Request, Response, NextFunction } from 'express'

// 简单的内存存储（生产环境应使用 Redis）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * 速率限制中间件
 * @param maxRequests 最大请求次数
 * @param windowSeconds 时间窗口（秒）
 */
export function rateLimiter(maxRequests: number, windowSeconds: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown' // 使用 IP 作为标识
    const now = Date.now()
    const windowMs = windowSeconds * 1000

    // 获取或初始化计数器
    let record = rateLimitStore.get(key)

    if (!record || now > record.resetTime) {
      // 新窗口
      record = {
        count: 1,
        resetTime: now + windowMs
      }
      rateLimitStore.set(key, record)
    } else {
      // 增加计数
      record.count++
    }

    // 检查是否超过限制
    if (record.count > maxRequests) {
      const resetInSeconds = Math.ceil((record.resetTime - now) / 1000)
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `请求过于频繁，请在 ${resetInSeconds} 秒后重试`,
        retryAfter: resetInSeconds
      })
    }

    // 设置响应头
    res.setHeader('X-RateLimit-Limit', maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString())
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString())

    next()
  }
}

/**
 * 清理过期的速率限制记录（定期调用）
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// 每小时清理一次
setInterval(cleanupRateLimitStore, 60 * 60 * 1000)
