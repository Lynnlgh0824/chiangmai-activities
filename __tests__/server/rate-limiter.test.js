/**
 * RateLimiter模块单元测试
 * 测试server.cjs中的RateLimiter类的速率限制功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { jest } from 'vitest';

// RateLimiter类实现（从server.cjs复制）
class RateLimiter {
  constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  check(ip) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let ipRequests = this.requests.get(ip);

    if (!ipRequests) {
      this.requests.set(ip, [{ timestamp: now, count: 1 }]);
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    ipRequests = ipRequests.filter(req => req.timestamp > windowStart);
    const totalCount = ipRequests.reduce((sum, req) => sum + req.count, 0);

    if (totalCount >= this.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

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

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [ip, requests] of this.requests.entries()) {
      const validRequests = requests.filter(req => req.timestamp > windowStart);

      if (validRequests.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, validRequests);
      }
    }
  }

  reset(ip) {
    this.requests.delete(ip);
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

describe('RateLimiter - 基本功能', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter(60000, 5); // 1分钟窗口，最多5次请求
  });

  afterEach(() => {
    if (limiter) {
      limiter.destroy();
    }
  });

  it('应该允许首次请求', () => {
    const result = limiter.check('192.168.1.1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('应该正确计数请求', () => {
    const ip = '192.168.1.1';

    for (let i = 0; i < 5; i++) {
      const result = limiter.check(ip);
      if (i < 4) {
        expect(result.allowed).toBe(true);
      }
    }

    const result = limiter.check(ip);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('应该为不同IP分别计数', () => {
    const ip1 = '192.168.1.1';
    const ip2 = '192.168.1.2';

    // IP1发送5次请求
    for (let i = 0; i < 5; i++) {
      limiter.check(ip1);
    }

    // IP1应该被限制
    expect(limiter.check(ip1).allowed).toBe(false);

    // IP2应该仍然允许
    expect(limiter.check(ip2).allowed).toBe(true);
  });

  it('应该正确计算剩余请求数', () => {
    const ip = '192.168.1.1';

    const result1 = limiter.check(ip);
    expect(result1.remaining).toBe(4);

    const result2 = limiter.check(ip);
    expect(result2.remaining).toBe(3);

    const result3 = limiter.check(ip);
    expect(result3.remaining).toBe(2);
  });
});

describe('RateLimiter - 时间窗口', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter(1000, 3); // 1秒窗口，最多3次请求
  });

  afterEach(() => {
    if (limiter) {
      limiter.destroy();
    }
  });

  it('应该在时间窗口外重置计数', async () => {
    const ip = '192.168.1.1';

    // 发送3次请求
    for (let i = 0; i < 3; i++) {
      const result = limiter.check(ip);
      expect(result.allowed).toBe(true);
    }

    // 第4次请求应该被拒绝
    const blockedResult = limiter.check(ip);
    expect(blockedResult.allowed).toBe(false);

    // 等待时间窗口过期
    await new Promise(resolve => setTimeout(resolve, 1100));

    // 现在应该再次允许
    const result = limiter.check(ip);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('应该正确处理跨时间窗口的请求', async () => {
    const ip = '192.168.1.1';

    // 发送2次请求
    limiter.check(ip);
    limiter.check(ip);

    // 等待窗口即将过期
    await new Promise(resolve => setTimeout(resolve, 900));

    // 发送第3次请求（在旧窗口末尾）
    const result1 = limiter.check(ip);
    expect(result1.allowed).toBe(true);

    // 等待新窗口
    await new Promise(resolve => setTimeout(resolve, 200));

    // 应该在新窗口中重置
    const result2 = limiter.check(ip);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(1);
  });
});

describe('RateLimiter - 清理功能', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter(1000, 5); // 1秒窗口
  });

  afterEach(() => {
    if (limiter) {
      limiter.destroy();
    }
  });

  it('应该清理过期的请求记录', async () => {
    const ip = '192.168.1.1';

    // 发送一些请求
    for (let i = 0; i < 3; i++) {
      limiter.check(ip);
    }

    expect(limiter.requests.size).toBe(1);

    // 等待时间窗口过期
    await new Promise(resolve => setTimeout(resolve, 1100));

    // 手动触发清理
    limiter.cleanup();

    // 过期记录应该被删除
    expect(limiter.requests.size).toBe(0);
  });

  it('应该保留时间窗口内的记录', () => {
    const ip = '192.168.1.1';

    // 发送请求
    limiter.check(ip);
    limiter.check(ip);

    // 清理（不应该删除有效记录）
    limiter.cleanup();

    expect(limiter.requests.size).toBe(1);
    const ipRequests = limiter.requests.get(ip);
    expect(ipRequests.length).toBeGreaterThan(0);
  });

  it('应该清理多个IP的过期记录', async () => {
    // 多个IP发送请求
    const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];

    ips.forEach(ip => {
      limiter.check(ip);
    });

    expect(limiter.requests.size).toBe(3);

    // 等待窗口过期
    await new Promise(resolve => setTimeout(resolve, 1100));

    limiter.cleanup();

    expect(limiter.requests.size).toBe(0);
  });
});

describe('RateLimiter - 重置功能', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter(60000, 3);
  });

  afterEach(() => {
    if (limiter) {
      limiter.destroy();
    }
  });

  it('应该重置指定IP的请求记录', () => {
    const ip = '192.168.1.1';

    // 发送3次请求，达到限制
    limiter.check(ip);
    limiter.check(ip);
    limiter.check(ip);

    expect(limiter.check(ip).allowed).toBe(false);

    // 重置该IP
    limiter.reset(ip);

    // 应该再次允许
    const result = limiter.check(ip);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('重置不应影响其他IP', () => {
    const ip1 = '192.168.1.1';
    const ip2 = '192.168.1.2';

    // IP1达到限制
    for (let i = 0; i < 3; i++) {
      limiter.check(ip1);
    }

    // IP2发送1次请求
    limiter.check(ip2);

    // 重置IP1
    limiter.reset(ip1);

    // IP1应该被重置
    expect(limiter.check(ip1).allowed).toBe(true);

    // IP2不受影响
    const result = limiter.check(ip2);
    expect(result.remaining).toBe(1);
  });

  it('应该能够重置不存在的IP', () => {
    expect(() => {
      limiter.reset('nonexistent.ip');
    }).not.toThrow();
  });
});

describe('RateLimiter - 边界情况', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter(60000, 10);
  });

  afterEach(() => {
    if (limiter) {
      limiter.destroy();
    }
  });

  it('应该处理零窗口限制', () => {
    const zeroLimiter = new RateLimiter(0, 10);
    const result = zeroLimiter.check('192.168.1.1');
    expect(result.allowed).toBe(true);
    zeroLimiter.destroy();
  });

  it('应该处理零最大请求数', () => {
    const zeroMaxLimiter = new RateLimiter(60000, 0);
    const result = zeroMaxLimiter.check('192.168.1.1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    zeroMaxLimiter.destroy();
  });

  it('应该处理大量并发请求', () => {
    const ip = '192.168.1.1';
    const concurrentRequests = 100;

    let blockedCount = 0;
    let allowedCount = 0;

    for (let i = 0; i < concurrentRequests; i++) {
      const result = limiter.check(ip);
      if (result.allowed) {
        allowedCount++;
      } else {
        blockedCount++;
      }
    }

    expect(allowedCount).toBe(10);
    expect(blockedCount).toBe(90);
  });

  it('应该正确处理IP地址格式', () => {
    const ipv4 = '192.168.1.1';
    const ipv6 = '::1';
    const localhost = '127.0.0.1';

    expect(limiter.check(ipv4).allowed).toBe(true);
    expect(limiter.check(ipv6).allowed).toBe(true);
    expect(limiter.check(localhost).allowed).toBe(true);
  });
});

describe('RateLimiter - 性能测试', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter(60000, 1000);
  });

  afterEach(() => {
    if (limiter) {
      limiter.destroy();
    }
  });

  it('应该在大量请求下保持性能', () => {
    const ips = [];
    for (let i = 0; i < 100; i++) {
      ips.push(`192.168.1.${i}`);
    }

    const startTime = Date.now();

    ips.forEach(ip => {
      for (let j = 0; j < 10; j++) {
        limiter.check(ip);
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 1000次检查应该在合理时间内完成（< 100ms）
    expect(duration).toBeLessThan(100);
  });

  it('应该高效处理清理操作', () => {
    // 添加1000个IP的记录
    for (let i = 0; i < 1000; i++) {
      limiter.check(`192.168.1.${i}`);
    }

    expect(limiter.requests.size).toBe(1000);

    const startTime = Date.now();
    limiter.cleanup();
    const endTime = Date.now();

    const duration = endTime - startTime;

    // 清理应该在合理时间内完成（< 50ms）
    expect(duration).toBeLessThan(50);
  });
});

describe('RateLimiter - 实际应用场景', () => {
  it('应该模拟通用限制器（15分钟100次）', () => {
    const generalLimiter = new RateLimiter(15 * 60 * 1000, 100);
    const ip = '192.168.1.1';

    let allowedCount = 0;
    for (let i = 0; i < 105; i++) {
      const result = generalLimiter.check(ip);
      if (result.allowed) allowedCount++;
    }

    expect(allowedCount).toBe(100);
    generalLimiter.destroy();
  });

  it('应该模拟写操作限制器（15分钟20次）', () => {
    const writeLimiter = new RateLimiter(15 * 60 * 1000, 20);
    const ip = '192.168.1.1';

    let allowedCount = 0;
    for (let i = 0; i < 25; i++) {
      const result = writeLimiter.check(ip);
      if (result.allowed) allowedCount++;
    }

    expect(allowedCount).toBe(20);
    writeLimiter.destroy();
  });

  it('应该模拟严格限制器（1分钟10次）', () => {
    const strictLimiter = new RateLimiter(60 * 1000, 10);
    const ip = '192.168.1.1';

    let allowedCount = 0;
    for (let i = 0; i < 15; i++) {
      const result = strictLimiter.check(ip);
      if (result.allowed) allowedCount++;
    }

    expect(allowedCount).toBe(10);
    strictLimiter.destroy();
  });
});
