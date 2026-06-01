// =====================================================
// 速率限制中间件（防止DDoS攻击）
// =====================================================

/**
 * 简单的内存速率限制器
 * 使用IP地址作为标识符
 */
class RateLimiter {
  constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    this.windowMs = windowMs; // 时间窗口（毫秒）
    this.maxRequests = maxRequests; // 最大请求数
    this.requests = new Map(); // 存储请求记录 { IP: [{timestamp, count}] }
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000); // 每分钟清理一次过期记录
  }

  /**
   * 检查是否超过速率限制
   * @param {string} ip - 客户端IP地址
   * @returns {Object} - {allowed: boolean, remaining: number}
   */
  check(ip) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // 获取该IP的请求记录
    let ipRequests = this.requests.get(ip);

    if (!ipRequests) {
      // 首次请求
      this.requests.set(ip, [{ timestamp: now, count: 1 }]);
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    // 过滤掉时间窗口外的旧请求
    ipRequests = ipRequests.filter(req => req.timestamp > windowStart);

    // 计算当前窗口内的总请求数
    const totalCount = ipRequests.reduce((sum, req) => sum + req.count, 0);

    if (totalCount >= this.maxRequests) {
      // 超过限制
      return { allowed: false, remaining: 0 };
    }

    // 未超过限制，记录此次请求
    // 如果最后一秒内有请求，增加计数；否则添加新记录
    const lastSecond = Math.floor(now / 1000);
    const lastReq = ipRequests[ipRequests.length - 1];
    const lastReqSecond = lastReq ? Math.floor(lastReq.timestamp / 1000) : -1;

    if (lastReqSecond === lastSecond) {
      lastReq.count++;
    } else {
      ipRequests.push({ timestamp: now, count: 1 });
    }

    this.requests.set(ip, ipRequests);
    return { allowed: true, remaining: this.maxRequests - totalCount - 1 };
  }

  /**
   * 清理过期的请求记录
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [ip, requests] of this.requests.entries()) {
      const validRequests = requests.filter(req => req.timestamp > windowStart);

      if (validRequests.length === 0) {
        // 没有有效请求，删除该IP的记录
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, validRequests);
      }
    }
  }

  /**
   * 重置指定IP的速率限制
   */
  reset(ip) {
    this.requests.delete(ip);
  }

  /**
   * 停止清理定时器
   */
  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// 创建速率限制器实例
const generalLimiter = new RateLimiter(15 * 60 * 1000, 100); // 15分钟100次请求
const writeLimiter = new RateLimiter(15 * 60 * 1000, 20); // 15分钟20次写操作
const strictLimiter = new RateLimiter(60 * 1000, 10); // 1分钟10次请求（用于敏感操作）

/**
 * 通用速率限制中间件
 */
function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const result = generalLimiter.check(ip);

  // 设置速率限制响应头
  res.setHeader('X-RateLimit-Limit', generalLimiter.maxRequests);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', Date.now() + generalLimiter.windowMs);

  if (!result.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil(generalLimiter.windowMs / 1000)
    });
  }

  next();
}

/**
 * 写操作速率限制中间件
 */
function writeRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const result = writeLimiter.check(ip);

  if (!result.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: '写操作过于频繁，请稍后再试',
      retryAfter: Math.ceil(writeLimiter.windowMs / 1000)
    });
  }

  next();
}

/**
 * 严格速率限制中间件（用于敏感操作）
 */
function strictRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const result = strictLimiter.check(ip);

  if (!result.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: '操作过于频繁，请稍后再试',
      retryAfter: Math.ceil(strictLimiter.windowMs / 1000)
    });
  }

  next();
}

console.log('🚦 速率限制已启用:');
console.log('  - 通用限制: 100次/15分钟');
console.log('  - 写操作限制: 20次/15分钟');
console.log('  - 严格限制: 10次/分钟');

module.exports = {
  RateLimiter,
  generalLimiter,
  writeLimiter,
  strictLimiter,
  rateLimit,
  writeRateLimit,
  strictRateLimit
};
