require('dotenv').config();

// =====================================================
// 日志工具（生产环境自动禁用调试日志）
// =====================================================

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

/**
 * 日志工具对象
 * 在生产环境中禁用调试日志，仅保留错误和警告
 */
const logger = {
  /**
   * 调试日志 - 仅开发环境
   */
  debug: function(...args) {
    if (!isProduction) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * 信息日志 - 始终记录
   */
  info: function(...args) {
    console.log('[INFO]', ...args);
  },

  /**
   * 警告日志 - 始终记录
   */
  warn: function(...args) {
    console.warn('[WARN]', ...args);
  },

  /**
   * 错误日志 - 始终记录
   */
  error: function(...args) {
    console.error('[ERROR]', ...args);
  },

  /**
   * 成功日志 - 仅开发环境
   */
  success: function(...args) {
    if (!isProduction) {
      console.log('✅', ...args);
    }
  }
};

// 记录启动环境
if (isProduction) {
  console.log('🚀 生产环境模式 - 调试日志已禁用');
} else {
  console.log('🛠️  开发环境模式 - 所有日志已启用');
}

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 4000;

const DATA_FILE = path.join(__dirname, 'data', 'items.json');
const GUIDE_FILE = path.join(__dirname, 'data', 'guide.json');
const VERSION_FILE = path.join(__dirname, 'data', 'version.json');
const APP_VERSION_FILE = path.join(__dirname, 'app-version.json');
const REQUIREMENTS_LOG_FILE = path.join(__dirname, 'data', 'requirements-log.json');

// =====================================================
// 输入验证模块（防止恶意数据注入）
// =====================================================

/**
 * 验证器对象 - 提供各种数据验证函数
 */
const validator = {
  /**
   * 验证必填字段
   */
  required: (value, fieldName = '字段') => {
    if (value === null || value === undefined || value === '') {
      return { valid: false, error: `${fieldName}不能为空` };
    }
    return { valid: true };
  },

  /**
   * 验证字符串长度
   */
  length: (value, min, max, fieldName = '字段') => {
    if (value === null || value === undefined) return { valid: true }; // 可选字段
    const len = value.length;
    if (len < min || len > max) {
      return { valid: false, error: `${fieldName}长度必须在${min}-${max}个字符之间` };
    }
    return { valid: true };
  },

  /**
   * 验证是否为有效字符串
   */
  isString: (value, fieldName = '字段') => {
    if (value === null || value === undefined) return { valid: true }; // 可选
    if (typeof value !== 'string') {
      return { valid: false, error: `${fieldName}必须是字符串` };
    }
    return { valid: true };
  },

  /**
   * 验证是否为数字
   */
  isNumber: (value, fieldName = '字段') => {
    if (value === null || value === undefined) return { valid: true }; // 可选
    if (typeof value !== 'number' || isNaN(value)) {
      return { valid: false, error: `${fieldName}必须是数字` };
    }
    return { valid: true };
  },

  /**
   * 验证是否为布尔值
   */
  isBoolean: (value, fieldName = '字段') => {
    if (value === null || value === undefined) return { valid: true }; // 可选
    if (typeof value !== 'boolean') {
      return { valid: false, error: `${fieldName}必须是布尔值` };
    }
    return { valid: true };
  },

  /**
   * 验证是否为数组
   */
  isArray: (value, fieldName = '字段') => {
    if (value === null || value === undefined) return { valid: true }; // 可选
    if (!Array.isArray(value)) {
      return { valid: false, error: `${fieldName}必须是数组` };
    }
    return { valid: true };
  },

  /**
   * 验证URL格式
   */
  isURL: (value, fieldName = '字段') => {
    if (!value || value === '') return { valid: true }; // 可选
    try {
      new URL(value);
      // 拒绝危险协议
      if (value.toLowerCase().startsWith('javascript:')) {
        return { valid: false, error: `${fieldName}不能使用javascript协议` };
      }
      return { valid: true };
    } catch (e) {
      return { valid: false, error: `${fieldName}必须是有效的URL` };
    }
  },

  /**
   * 验证经纬度
   */
  isCoordinate: (value, fieldName = '坐标') => {
    if (value === null || value === undefined || value === '') return { valid: true }; // 可选
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, error: `${fieldName}必须是数字` };
    }
    return { valid: true };
  },

  /**
   * 验证分类是否在允许列表中
   */
  isCategory: (value) => {
    if (!value) return { valid: true }; // 可选
    const allowedCategories = [
      '瑜伽', '冥想', '舞蹈', '泰拳', '音乐', '文化艺术', '健身',
      '市集', '灵活时间活动', '活动网站', '攻略信息', '其他'
    ];
    if (!allowedCategories.includes(value)) {
      return { valid: false, error: `分类必须是以下之一：${allowedCategories.join(', ')}` };
    }
    return { valid: true };
  },

  /**
   * 验证价格格式
   */
  isPrice: (value, fieldName = '价格') => {
    if (!value || value === '') return { valid: true }; // 可选
    // 允许的格式：数字、货币符号+数字、"免费"、数字范围等
    const pricePattern = /^[\d\s¥￥$€£฿.,+-]+|免费|待定|灵活时间$/;
    if (!pricePattern.test(value)) {
      return { valid: false, error: `${fieldName}格式无效` };
    }
    return { valid: true };
  },

  /**
   * 验证时间格式
   */
  isTime: (value, fieldName = '时间') => {
    if (!value || value === '') return { valid: true }; // 可选
    // 允许的格式：HH:MM、灵活时间、多时段等
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]|灵活时间|待定$/;
    if (!timePattern.test(value.trim())) {
      return { valid: false, error: `${fieldName}格式无效，应为HH:MM或"灵活时间"` };
    }
    return { valid: true };
  },

  /**
   * 净化字符串（移除危险字符）
   */
  sanitize: (value) => {
    if (typeof value !== 'string') return value;
    // 移除控制字符（除了换行、制表符、回车）
    return value.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  },

  /**
   * 验证并清理活动数据
   */
  validateActivity: (data) => {
    const errors = [];

    // 验证标题
    let result = validator.required(data.title, '标题');
    if (!result.valid) errors.push(result.error);
    result = validator.length(data.title, 1, 200, '标题');
    if (!result.valid) errors.push(result.error);
    result = validator.isString(data.title, '标题');
    if (!result.valid) errors.push(result.error);

    // 验证描述
    result = validator.required(data.description, '描述');
    if (!result.valid) errors.push(result.error);
    result = validator.length(data.description, 1, 5000, '描述');
    if (!result.valid) errors.push(result.error);
    result = validator.isString(data.description, '描述');
    if (!result.valid) errors.push(result.error);

    // 验证分类（可选但必须在允许列表中）
    if (data.category) {
      result = validator.isCategory(data.category);
      if (!result.valid) errors.push(result.error);
    }

    // 验证地点
    if (data.location) {
      result = validator.length(data.location, 0, 200, '地点');
      if (!result.valid) errors.push(result.error);
      result = validator.isString(data.location, '地点');
      if (!result.valid) errors.push(result.error);
    }

    // 验证时间
    if (data.time) {
      result = validator.isTime(data.time, '时间');
      if (!result.valid) errors.push(result.error);
    }

    // 验证价格
    if (data.price) {
      result = validator.isPrice(data.price, '价格');
      if (!result.valid) errors.push(result.error);
    }

    // 验证坐标
    if (data.latitude !== undefined && data.latitude !== null) {
      result = validator.isCoordinate(data.latitude, '纬度');
      if (!result.valid) errors.push(result.error);
      const lat = parseFloat(data.latitude);
      if (lat < -90 || lat > 90) {
        errors.push('纬度必须在-90到90之间');
      }
    }

    if (data.longitude !== undefined && data.longitude !== null) {
      result = validator.isCoordinate(data.longitude, '经度');
      if (!result.valid) errors.push(result.error);
      const lon = parseFloat(data.longitude);
      if (lon < -180 || lon > 180) {
        errors.push('经度必须在-180到180之间');
      }
    }

    // 验证URL
    if (data.source && data.source.url) {
      result = validator.isURL(data.source.url, '来源URL');
      if (!result.valid) errors.push(result.error);
    }

    // 验证人数限制
    if (data.maxParticipants !== undefined) {
      result = validator.isNumber(data.maxParticipants, '最大人数');
      if (!result.valid) errors.push(result.error);
      if (data.maxParticipants < 0) {
        errors.push('最大人数不能为负数');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * 验证并清理攻略内容
   */
  validateGuide: (data) => {
    const errors = [];

    if (data.content !== undefined) {
      let result = validator.required(data.content, '内容');
      if (!result.valid) errors.push(result.error);
      result = validator.isString(data.content, '内容');
      if (!result.valid) errors.push(result.error);
      // 限制内容长度，防止DoS
      result = validator.length(data.content, 1, 100000, '内容'); // 100KB限制
      if (!result.valid) errors.push(result.error);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// =====================================================
// 统一错误处理中间件（防止敏感信息泄露）
// =====================================================

/**
 * 安全的错误响应函数
 * 在生产环境中隐藏敏感的内部信息
 */
function sendErrorResponse(res, error, statusCode = 500) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 记录完整错误到服务器日志
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // 返回给客户端的错误信息（根据环境）
  const response = {
    success: false,
    message: isDevelopment ? error.message : '请求处理失败，请稍后重试'
  };

  // 仅在开发环境返回详细错误信息
  if (isDevelopment) {
    response.stack = error.stack;
    response.details = error.toString();
  }

  res.status(statusCode).json(response);
}

/**
 * 全局错误处理中间件
 * 捕获所有未处理的错误
 */
function globalErrorHandler(err, req, res, next) {
  // Multer文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendErrorResponse(res, new Error('文件大小超过限制（最大2MB）'), 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return sendErrorResponse(res, new Error('文件数量超过限制'), 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return sendErrorResponse(res, new Error('意外的文件字段'), 400);
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return sendErrorResponse(res, err, 400);
  }

  // JSON解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendErrorResponse(res, new Error('JSON格式错误'), 400);
  }

  // 其他未预期错误
  sendErrorResponse(res, err, err.status || 500);
}

/**
 * 包装异步路由处理器的辅助函数
 * 自动捕获async/await错误
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Try-catch包装器
 * 用于同步函数的错误处理
 */
function tryCatch(res, operationName, fn) {
  try {
    fn();
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
}

// =====================================================
// 认证授权中间件
// =====================================================

/**
 * 从环境变量或使用默认API密钥
 * 生产环境必须设置ADMIN_API_KEY环境变量
 */
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-api-key-change-in-production';

/**
 * API密钥认证中间件
 * 验证请求头中的X-API-Key
 */
function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  // 检查API密钥是否存在
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: '缺少API密钥，请在请求头中提供 X-API-Key'
    });
  }

  // 验证API密钥
  if (apiKey !== ADMIN_API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'API密钥无效'
    });
  }

  // 认证成功，记录日志并继续
  console.log(`✅ API认证成功: ${req.method} ${req.url}`);
  next();
}

/**
 * 可选的API密钥认证
 * 如果提供了密钥则验证，否则继续
 * 用于某些需要区分用户和匿名请求的场景
 */
function optionalApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (apiKey && apiKey !== ADMIN_API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'API密钥无效'
    });
  }

  next();
}

// 启动时检查API密钥配置
if (ADMIN_API_KEY === 'dev-api-key-change-in-production' && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  警告: 使用默认API密钥！请在生产环境设置 ADMIN_API_KEY 环境变量');
} else {
  console.log('🔐 API认证已启用');
}

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

// 配置 multer 文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 降低到2MB，防止DoS攻击
    files: 1 // 限制单次只能上传1个文件
  },
  fileFilter: function (req, file, cb) {
    // 安全性增强：多重验证

    // 1. 检查文件扩展名
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!allowedExts.includes(ext)) {
      return cb(new Error(`不支持的文件扩展名: ${ext}。仅支持: ${allowedExts.join(', ')}`));
    }

    // 2. 验证MIME类型
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`不支持的MIME类型: ${file.mimetype}`));
    }

    // 3. 文件名安全检查（防止路径遍历攻击）
    const originalname = file.originalname;
    if (originalname.includes('..') || originalname.includes('/') || originalname.includes('\\')) {
      return cb(new Error('文件名包含非法字符'));
    }

    // 4. 检查文件名长度
    if (originalname.length > 255) {
      return cb(new Error('文件名过长'));
    }

    // 所有检查通过
    cb(null, true);
  }
});

// 读取数据（同步版本 - 保持向后兼容）
const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// 读取数据（异步版本 - 推荐用于新代码）
const readDataAsync = async () => {
  try {
    const data = await fs.promises.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// 写入数据（同步版本 - 保持向后兼容）
const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  // 更新数据版本号 - 使用应用版本号
  try {
    const appVersion = JSON.parse(fs.readFileSync(APP_VERSION_FILE, 'utf8'));
    const version = {
      version: appVersion.version,
      timestamp: new Date().toISOString(),
      count: data.length
    };
    fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2));
  } catch (error) {
    // 如果读取应用版本失败，使用时间戳
    const version = {
      version: Date.now(),
      timestamp: new Date().toISOString(),
      count: data.length
    };
    fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2));
  }
};

// 写入数据（异步版本 - 推荐用于新代码，性能更好）
const writeDataAsync = async (data) => {
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2));

  // 更新数据版本号 - 使用应用版本号
  try {
    const appVersion = await fs.promises.readFile(APP_VERSION_FILE, 'utf8');
    const version = {
      version: JSON.parse(appVersion).version,
      timestamp: new Date().toISOString(),
      count: data.length
    };
    await fs.promises.writeFile(VERSION_FILE, JSON.stringify(version, null, 2));
  } catch (error) {
    // 如果读取应用版本失败，使用时间戳
    const version = {
      version: Date.now(),
      timestamp: new Date().toISOString(),
      count: data.length
    };
    await fs.promises.writeFile(VERSION_FILE, JSON.stringify(version, null, 2));
  }
};

// 获取数据版本
const getDataVersion = () => {
  try {
    const data = fs.readFileSync(VERSION_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // 如果版本文件不存在，创建一个初始版本
    try {
      const appVersion = JSON.parse(fs.readFileSync(APP_VERSION_FILE, 'utf8'));
      const version = {
        version: appVersion.version,
        timestamp: new Date().toISOString(),
        count: readData().length
      };
      fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2));
      return version;
    } catch (appError) {
      // 如果读取应用版本失败，使用默认版本
      const version = {
        version: 'v1.0.0',
        timestamp: new Date().toISOString(),
        count: readData().length
      };
      fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2));
      return version;
    }
  }
};

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 直接访问 public 目录
app.use(express.static('public'));
app.use(express.static(__dirname)); // 添加项目根目录的静态文件服务
app.use('/uploads', express.static('uploads'));

// 允许 CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // 允许的源：本地开发环境 + 所有 Vercel 部署
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4000',
    'https://chiangmai-guide.vercel.app'
  ];

  // 安全性：仅允许列表中的来源或Vercel子域名
  // 移除了危险的通配符 '*' 回退选项
  if (origin && (allowedOrigins.includes(origin) || origin?.endsWith('.vercel.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    // 同源请求（无origin头），允许继续但不设置CORS头
    // 这种情况发生在直接从同域访问API时
  } else {
    // 不允许的跨域请求返回403错误
    console.warn(`Blocked CORS request from: ${origin}`);
    return res.status(403).json({
      success: false,
      error: 'Origin not allowed',
      message: '此来源不允许访问API'
    });
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 应用通用速率限制到所有API路由
app.use('/api/', rateLimit);

// =====================================================
// 请求日志和监控中间件
// =====================================================

/**
 * 请求日志中间件
 * 记录所有API请求的详细信息
 */
app.use('/api/', (req, res, next) => {
  const startTime = Date.now();

  // 记录请求开始
  logger.debug(`${req.method} ${req.url}`);

  // 监听响应完成事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, url, ip } = req;
    const { statusCode } = res;

    // 记录请求完成
    const logData = {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ip: ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };

    // 仅在开发环境记录详细信息
    if (isDevelopment) {
      logger.debug(JSON.stringify(logData));
    }

    // 记录慢请求（超过1秒）
    if (duration > 1000) {
      logger.warn(`慢请求检测: ${method} ${url} - ${duration}ms`);
    }

    // 记录错误请求（4xx, 5xx）
    if (statusCode >= 400) {
      logger.warn(`错误请求: ${method} ${url} - ${statusCode}`);
    }
  });

  next();
});

// API 路由
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// GET /api/version - 获取数据版本号
app.get('/api/version', (req, res) => {
  // 禁用缓存
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  const version = getDataVersion();
  res.json({ success: true, version: version.version, timestamp: version.timestamp, count: version.count });
});

// GET /app/version - 获取应用版本号（简洁版本）
app.get('/app/version', (req, res) => {
  // 禁用缓存
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  try {
    const appVersion = JSON.parse(fs.readFileSync(APP_VERSION_FILE, 'utf8'));
    res.json({
      success: true,
      version: appVersion.version,
      fullVersion: appVersion.fullVersion,
      codeName: appVersion.codeName,
      buildDate: appVersion.buildDate,
      features: appVersion.features,
      changelog: appVersion.changelog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '无法读取应用版本信息',
      error: error.message
    });
  }
});

// ========== 前端活动 API (/api/activities) ==========

// GET /api/activities - 获取活动列表（兼容前端）
app.get('/api/activities', (req, res) => {
  const rawItems = readData();

  // 字段映射：将中文字段名转换为英文字段名
  const items = rawItems.map(item => {
    // 处理星期字段：将字符串转换为数组
    const weekdaysStr = item['星期*'] || item.weekdays;
    const weekdaysArray = weekdaysStr && typeof weekdaysStr === 'string'
      ? weekdaysStr.split(',').map(s => s.trim())
      : (Array.isArray(weekdaysStr) ? weekdaysStr : []);

    return {
      id: item.id,
      activityNumber: (item['活动编号'] || item.activityNumber || '').replace('#', ''),
      title: item['活动标题*'] || item.title,
      category: item['分类*'] || item.category,
      location: item['地点名称*'] || item.location,
      time: item['时间*'] || item.time,
      weekdays: weekdaysArray,
      price: item['价格显示'] || item.price,
      description: item['活动描述*'] || item.description,
      status: item['状态'] || item.status || '草稿',
      suspensionNote: item['暂停备注'] || item.suspensionNote || null,
      requireBooking: item['需要预约'] || item.requireBooking,
      flexibleTime: item['灵活时间'] || item.flexibleTime,
      duration: item['持续时间'] || item.duration,
      minPrice: item['最低价格'] || item.minPrice,
      maxPrice: item['最高价格'] || item.maxPrice,
      maxParticipants: item['最大人数'] || item.maxParticipants,
      timeInfo: item['时间信息'] || item.timeInfo,
      sortOrder: item['序号'] || item.sortOrder,
      source: item.source || null
    };
  });

  // 支持筛选参数
  const { category, search, priceMin, priceMax, status, page = 1, limit = 1000, sortBy, sortOrder = 'asc' } = req.query;

  let filteredItems = [...items];

  // 状态筛选
  if (status) {
    filteredItems = filteredItems.filter(item => item.status === status);
  }

  // 分类筛选
  if (category && category !== '全部') {
    filteredItems = filteredItems.filter(item => item.category === category);
  }

  // 搜索筛选
  if (search) {
    const searchLower = search.toLowerCase();
    filteredItems = filteredItems.filter(item =>
      item.title?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.location?.toLowerCase().includes(searchLower)
    );
  }

  // 价格筛选
  if (priceMin !== undefined) {
    filteredItems = filteredItems.filter(item => {
      const price = item.priceMin || 0;
      return price >= parseInt(priceMin);
    });
  }

  if (priceMax !== undefined) {
    filteredItems = filteredItems.filter(item => {
      const price = item.priceMax || 0;
      return price <= parseInt(priceMax);
    });
  }

  // 排序
  if (sortBy) {
    filteredItems.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.date || 0) - new Date(b.date || 0);
      } else if (sortBy === 'price') {
        comparison = (a.priceMin || 0) - (b.priceMin || 0);
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  // 分页
  const totalItems = filteredItems.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedItems,
    pagination: {
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit),
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  });
});

// GET /api/activities/:id - 获取单个活动
app.get('/api/activities/:id', (req, res) => {
  const items = readData();
  const item = items.find(i => i.id === req.params.id || i._id === req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  res.json({ success: true, data: item });
});

// POST /api/activities - 创建新活动
app.post('/api/activities', requireApiKey, (req, res) => {
  const {
    title, description, category,
    date, time, duration,
    location, address, latitude, longitude,
    price, priceMin, priceMax, currency,
    maxParticipants, currentParticipants,
    images, source,
    flexibleTime, bookingRequired,
    subCategory, language, tags
  } = req.body;

  // 安全性：输入验证
  const validation = validator.validateActivity(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: validation.errors
    });
  }

  const items = readData();
  const newItem = {
    id: Date.now().toString(),
    _id: Date.now().toString(), // MongoDB 兼容
    title,
    description,
    category: category || '其他',
    subCategory: subCategory || '',
    date: date || new Date().toISOString().split('T')[0],
    time: time || '',
    duration: duration || '',
    location: location || '',
    address: address || '',
    latitude: latitude || null,
    longitude: longitude || null,
    price: price || '',
    priceMin: priceMin || 0,
    priceMax: priceMax || 0,
    currency: currency || '฿',
    maxParticipants: maxParticipants || 0,
    currentParticipants: currentParticipants || 0,
    images: images || [],
    source: source || { name: '手动添加', url: '', type: 'manual', lastUpdated: new Date() },
    flexibleTime: flexibleTime || false,
    bookingRequired: bookingRequired !== undefined ? bookingRequired : true,
    language: language || 'Both',
    tags: tags || [],
    status: '草稿',
    rating: { average: 0, count: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  items.push(newItem);
  writeData(items);

  res.json({ success: true, data: newItem, message: '创建成功' });
});

// PUT /api/activities/:id - 更新活动
app.put('/api/activities/:id', requireApiKey, (req, res) => {
  const items = readData();
  const index = items.findIndex(i => i.id === req.params.id || i._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  // 安全性：输入验证
  const validation = validator.validateActivity(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: validation.errors
    });
  }

  // 允许部分更新
  const updateData = { ...req.body };
  delete updateData.id;
  delete updateData._id;
  delete updateData.createdAt;

  items[index] = {
    ...items[index],
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  writeData(items);

  res.json({ success: true, data: items[index], message: '更新成功' });
});

// DELETE /api/activities/:id - 删除活动
app.delete('/api/activities/:id', requireApiKey, (req, res) => {
  const items = readData();
  const index = items.findIndex(i => i.id === req.params.id || i._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: '活动不存在' });
  }

  items.splice(index, 1);
  writeData(items);

  res.json({ success: true, message: '删除成功' });
});

// GET /api/activities/stats/categories - 分类统计
app.get('/api/activities/stats/categories', (req, res) => {
  const items = readData();
  // 统计非草稿的活动（包括：待开始、进行中、已过期）
  const activeItems = items.filter(item => item.status !== '草稿');

  const stats = activeItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  res.json({ success: true, data: stats });
});

// ========== 后台管理 API (/api/items) - 保持兼容 ==========

// GET /api/items - 获取所有数据
app.get('/api/items', (req, res) => {
  // 禁用缓存，确保始终获取最新数据
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  const rawItems = readData();

  // 字段映射：将中文字段名转换为英文字段名
  const items = rawItems.map(item => {
    // 处理星期字段：将字符串转换为数组
    const weekdaysStr = item['星期*'] || item.weekdays;
    const weekdaysArray = weekdaysStr && typeof weekdaysStr === 'string'
      ? weekdaysStr.split(',').map(s => s.trim())
      : (Array.isArray(weekdaysStr) ? weekdaysStr : []);

    return {
      id: item.id,
      activityNumber: (item['活动编号'] || item.activityNumber || '').replace('#', ''),
      title: item['活动标题*'] || item.title,
      category: item['分类*'] || item.category,
      location: item['地点名称*'] || item.location,
      time: item['时间*'] || item.time,
      weekdays: weekdaysArray,
      price: item['价格显示'] || item.price,
      description: item['活动描述*'] || item.description,
      status: item['状态'] || item.status || '草稿',
      suspensionNote: item['暂停备注'] || item.suspensionNote || null,
      requireBooking: item['需要预约'] || item.requireBooking,
      flexibleTime: item['灵活时间'] || item.flexibleTime,
      duration: item['持续时间'] || item.duration,
      minPrice: item['最低价格'] || item.minPrice,
      maxPrice: item['最高价格'] || item.maxPrice,
      maxParticipants: item['最大人数'] || item.maxParticipants,
      timeInfo: item['时间信息'] || item.timeInfo,
      sortOrder: item['序号'] || item.sortOrder
    };
  });

  const version = getDataVersion();
  res.json({ success: true, data: items, version: version.version });
});

// GET /api/items/:id - 获取单条数据
app.get('/api/items/:id', (req, res) => {
  const items = readData();
  const item = items.find(i => i.id === req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, message: '数据不存在' });
  }

  res.json({ success: true, data: item });
});

// POST /api/items - 创建新数据
app.post('/api/items', requireApiKey, (req, res) => {
  const data = req.body;

  if (!data.title || !data.description) {
    return res.status(400).json({ success: false, message: '标题和描述不能为空' });
  }

  const items = readData();
  const newItem = {
    id: Date.now().toString(),
    _id: Date.now().toString(),
    ...data,
    status: '草稿',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  items.push(newItem);
  writeData(items);

  res.json({ success: true, data: newItem, message: '创建成功' });
});

// PUT /api/items/:id - 更新数据
app.put('/api/items/:id', requireApiKey, (req, res) => {
  const items = readData();
  const index = items.findIndex(i => i.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: '数据不存在' });
  }

  const updateData = { ...req.body };
  delete updateData.id;
  delete updateData._id;
  delete updateData.createdAt;

  items[index] = {
    ...items[index],
    ...updateData,
    updatedAt: new Date().toISOString()
  };

  writeData(items);

  res.json({ success: true, data: items[index], message: '更新成功' });
});

// DELETE /api/items/:id - 删除数据
app.delete('/api/items/:id', requireApiKey, (req, res) => {
  const items = readData();
  const index = items.findIndex(i => i.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: '数据不存在' });
  }

  items.splice(index, 1);
  writeData(items);

  res.json({ success: true, message: '删除成功' });
});

// ========== 文件上传 API ==========

// POST /api/upload - 上传单个图片
app.post('/api/upload', requireApiKey, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有上传文件' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: '上传成功',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('上传失败:', error);
    sendErrorResponse(res, error, 500);
  }
});

// DELETE /api/upload/:filename - 删除上传的图片
app.delete('/api/upload/:filename', requireApiKey, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    // 检查文件是否存在
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: '删除成功' });
    } else {
      res.status(404).json({ success: false, message: '文件不存在' });
    }
  } catch (error) {
    console.error('删除失败:', error);
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

// 根路由 - 项目信息
app.get('/', (req, res) => {
  res.json({
    name: 'Chiang Mai Guide',
    version: '2.0.0',
    description: '清迈活动管理平台 - 整合版',
    links: {
      frontend: 'http://localhost:5173',
      admin: 'http://localhost:3000/admin',
      api: 'http://localhost:3000/api'
    }
  });
});

// ========== Excel导入导出 API ==========

const XLSX = require('xlsx');
const { exec } = require('child_process');

/**
 * 从Excel导入数据到后台
 */
app.post('/api/import-excel', requireApiKey, async (req, res) => {
  try {
    console.log('📥 开始从Excel导入数据...');

    // 使用增强的导入脚本
    const importScript = exec('node scripts/import-excel-enhanced.mjs', {
      cwd: __dirname,
      timeout: 30000
    });

    let output = '';
    let error = '';

    importScript.stdout.on('data', (data) => {
      output += data.toString();
    });

    importScript.stderr.on('data', (data) => {
      error += data.toString();
    });

    importScript.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Excel导入成功');
        res.json({
          success: true,
          message: '导入成功',
          details: output
        });
      } else {
        console.error('❌ Excel导入失败:', error);
        res.status(500).json({
          success: false,
          message: '导入失败: ' + error,
          details: output
        });
      }
    });

  } catch (error) {
    console.error('❌ 导入API错误:', error);
    res.status(500).json({
      success: false,
      message: '导入失败: ' + error.message
    });
  }
});

/**
 * 导出后台数据到Excel
 */
app.post('/api/export-excel', requireApiKey, async (req, res) => {
  try {
    console.log('📤 开始导出数据到Excel...');

    // 使用导出脚本
    const exportScript = exec('node scripts/export-json-to-excel.mjs', {
      cwd: __dirname,
      timeout: 30000
    });

    let output = '';
    let error = '';

    exportScript.stdout.on('data', (data) => {
      output += data.toString();
    });

    exportScript.stderr.on('data', (data) => {
      error += data.toString();
    });

    exportScript.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Excel导出成功');

        // 读取生成的Excel文件并发送
        const excelFile = path.join(__dirname, '清迈活动数据-导出.xlsx');

        if (fs.existsSync(excelFile)) {
          res.download(excelFile, `清迈活动数据-导出-${new Date().toISOString().slice(0, 10)}.xlsx`);
        } else {
          res.status(500).json({
            success: false,
            message: 'Excel文件生成失败'
          });
        }
      } else {
        console.error('❌ Excel导出失败:', error);
        res.status(500).json({
          success: false,
          message: '导出失败: ' + error
        });
      }
    });

  } catch (error) {
    console.error('❌ 导出API错误:', error);
    res.status(500).json({
      success: false,
      message: '导出失败: ' + error.message
    });
  }
});

// ========== 攻略信息 API ==========

// 读取攻略数据
const readGuideData = () => {
  try {
    if (fs.existsSync(GUIDE_FILE)) {
      const data = fs.readFileSync(GUIDE_FILE, 'utf8');
      return JSON.parse(data);
    }
    // 如果文件不存在，返回默认空内容
    return {
      content: '',
      updatedAt: null,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('读取攻略数据失败:', error);
    return {
      content: '',
      updatedAt: null,
      createdAt: new Date().toISOString()
    };
  }
};

// 写入攻略数据
const writeGuideData = (data) => {
  try {
    // 确保data目录存在
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const jsonString = JSON.stringify(data, null, 2);
    console.log('📝 保存攻略内容，长度:', data.content?.length || 0);
    console.log('包含表情符号:', /[\u{1F300}-\u{1F9FF}]/u.test(data.content || ''));

    fs.writeFileSync(GUIDE_FILE, jsonString, 'utf8');
    return true;
  } catch (error) {
    console.error('写入攻略数据失败:', error);
    return false;
  }
};

/**
 * GET /api/guide - 获取攻略信息
 */
app.get('/api/guide', (req, res) => {
  try {
    const guideData = readGuideData();
    res.json({
      success: true,
      data: guideData
    });
  } catch (error) {
    console.error('获取攻略信息失败:', error);
    sendErrorResponse(res, error, 500);
  }
});

/**
 * POST /api/guide - 保存攻略信息
 */
app.post('/api/guide', requireApiKey, (req, res) => {
  try {
    const { content } = req.body;

    console.log('📥 收到攻略保存请求，内容长度:', content?.length || 0);

    // 安全性：输入验证
    const validation = validator.validateGuide(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: validation.errors
      });
    }

    // 读取现有数据
    const existingData = readGuideData();

    // 更新数据
    const updatedData = {
      content: content,
      createdAt: existingData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 保存到文件
    const success = writeGuideData(updatedData);

    if (success) {
      console.log('✅ 攻略信息已更新');
      res.json({
        success: true,
        message: '保存成功',
        data: updatedData
      });
    } else {
      res.status(500).json({
        success: false,
        message: '保存失败'
      });
    }
  } catch (error) {
    console.error('保存攻略信息失败:', error);
    res.status(500).json({
      success: false,
      message: '保存失败: ' + error.message
    });
  }
});

// ========== 需求日志管理 API ==========

/**
 * 读取需求日志数据
 */
const readRequirementsLog = () => {
  try {
    if (fs.existsSync(REQUIREMENTS_LOG_FILE)) {
      const data = fs.readFileSync(REQUIREMENTS_LOG_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('读取需求日志失败:', error);
    return [];
  }
};

/**
 * 写入需求日志数据
 */
const writeRequirementsLog = (logs) => {
  try {
    fs.writeFileSync(REQUIREMENTS_LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('写入需求日志失败:', error);
    return false;
  }
};

/**
 * GET /api/requirements-log - 获取所有需求日志
 */
app.get('/api/requirements-log', (req, res) => {
  try {
    const logs = readRequirementsLog();
    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('获取需求日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取需求日志失败: ' + error.message
    });
  }
});

/**
 * GET /api/requirements-log/recent - 获取最近的需求日志
 */
app.get('/api/requirements-log/recent', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const logs = readRequirementsLog();
    const recentLogs = logs.slice(0, limit);
    res.json({
      success: true,
      data: recentLogs,
      count: recentLogs.length
    });
  } catch (error) {
    console.error('获取最近需求日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取最近需求日志失败: ' + error.message
    });
  }
});

/**
 * POST /api/requirements-log - 添加新的需求日志
 */
app.post('/api/requirements-log', requireApiKey, (req, res) => {
  try {
    const { type, category, title, description, details, impact, relatedFiles } = req.body;

    // 验证必填字段
    if (!type || !category || !title || !description) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段: type, category, title, description'
      });
    }

    // 读取现有日志
    const logs = readRequirementsLog();

    // 生成新日志ID
    const date = new Date().toISOString().split('T')[0];
    const count = logs.filter(log => log.date === date).length + 1;
    const id = `log-${date}-${String(count).padStart(3, '0')}`;

    // 创建新日志
    const newLog = {
      id,
      date,
      timestamp: new Date().toISOString(),
      type, // 类型: 新增功能, 功能完善, Bug修复, 优化改进, 文档更新
      category, // 分类: 需求文档, 前端功能, 后端API, 数据管理, 其他
      title,
      description,
      details: details || [],
      impact: impact || '中', // 影响: 高, 中, 低
      status: '已完成',
      author: 'System',
      relatedFiles: relatedFiles || []
    };

    // 添加到日志列表开头（最新的在前）
    logs.unshift(newLog);

    // 保存到文件
    const success = writeRequirementsLog(logs);

    if (success) {
      console.log('✅ 需求日志已添加:', id);
      res.json({
        success: true,
        message: '需求日志添加成功',
        data: newLog
      });
    } else {
      res.status(500).json({
        success: false,
        message: '保存需求日志失败'
      });
    }
  } catch (error) {
    console.error('添加需求日志失败:', error);
    res.status(500).json({
      success: false,
      message: '添加需求日志失败: ' + error.message
    });
  }
});

/**
 * PUT /api/requirements-log/:id - 更新需求日志
 */
app.put('/api/requirements-log/:id', requireApiKey, (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 读取现有日志
    const logs = readRequirementsLog();
    const logIndex = logs.findIndex(log => log.id === id);

    if (logIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '需求日志不存在'
      });
    }

    // 更新日志
    logs[logIndex] = {
      ...logs[logIndex],
      ...updateData,
      id, // 确保ID不被修改
      date: logs[logIndex].date, // 确保日期不被修改
      timestamp: new Date().toISOString() // 更新时间戳
    };

    // 保存到文件
    const success = writeRequirementsLog(logs);

    if (success) {
      console.log('✅ 需求日志已更新:', id);
      res.json({
        success: true,
        message: '需求日志更新成功',
        data: logs[logIndex]
      });
    } else {
      res.status(500).json({
        success: false,
        message: '更新需求日志失败'
      });
    }
  } catch (error) {
    console.error('更新需求日志失败:', error);
    res.status(500).json({
      success: false,
      message: '更新需求日志失败: ' + error.message
    });
  }
});

/**
 * DELETE /api/requirements-log/:id - 删除需求日志
 */
app.delete('/api/requirements-log/:id', requireApiKey, (req, res) => {
  try {
    const { id } = req.params;

    // 读取现有日志
    const logs = readRequirementsLog();
    const logIndex = logs.findIndex(log => log.id === id);

    if (logIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '需求日志不存在'
      });
    }

    // 删除日志
    logs.splice(logIndex, 1);

    // 保存到文件
    const success = writeRequirementsLog(logs);

    if (success) {
      console.log('✅ 需求日志已删除:', id);
      res.json({
        success: true,
        message: '需求日志删除成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '删除需求日志失败'
      });
    }
  } catch (error) {
    console.error('删除需求日志失败:', error);
    res.status(500).json({
      success: false,
      message: '删除需求日志失败: ' + error.message
    });
  }
});

/**
 * GET /api/requirements-log/stats - 获取需求日志统计
 */
app.get('/api/requirements-log/stats', (req, res) => {
  try {
    const logs = readRequirementsLog();

    // 按类型统计
    const typeStats = {};
    // 按分类统计
    const categoryStats = {};
    // 按日期统计
    const dateStats = {};
    // 按影响级别统计
    const impactStats = { 高: 0, 中: 0, 低: 0 };

    logs.forEach(log => {
      // 类型统计
      typeStats[log.type] = (typeStats[log.type] || 0) + 1;
      // 分类统计
      categoryStats[log.category] = (categoryStats[log.category] || 0) + 1;
      // 日期统计
      dateStats[log.date] = (dateStats[log.date] || 0) + 1;
      // 影响级别统计
      if (impactStats[log.impact] !== undefined) {
        impactStats[log.impact]++;
      }
    });

    // 最近7天的日志
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLogs = logs.filter(log => new Date(log.date) >= sevenDaysAgo);

    res.json({
      success: true,
      data: {
        total: logs.length,
        recent7Days: recentLogs.length,
        byType: typeStats,
        byCategory: categoryStats,
        byDate: dateStats,
        byImpact: impactStats,
        lastUpdate: logs[0]?.timestamp || null
      }
    });
  } catch (error) {
    console.error('获取需求日志统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取需求日志统计失败: ' + error.message
    });
  }
});

// ==================== 飞书集成 ====================

/**
 * 从飞书API获取数据
 */
async function fetchFeishuData() {
  try {
    // 1. 获取tenant_access_token
    const tokenResponse = await axios.post(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        app_id: process.env.FEISHU_APP_ID,
        app_secret: process.env.FEISHU_APP_SECRET
      }
    );

    if (tokenResponse.data.code !== 0) {
      throw new Error('获取飞书token失败: ' + JSON.stringify(tokenResponse.data));
    }

    const tenantAccessToken = tokenResponse.data.tenant_access_token;

    // 2. 读取表格数据
    const dataResponse = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.FEISHU_SPREADSHEET_TOKEN}/tables/${process.env.FEISHU_SHEET_ID}/records`,
      {
        headers: {
          'Authorization': `Bearer ${tenantAccessToken}`
        }
      }
    );

    if (dataResponse.data.code !== 0) {
      throw new Error('读取飞书表格失败: ' + JSON.stringify(dataResponse.data));
    }

    return dataResponse.data.data.items;
  } catch (error) {
    console.error('飞书API调用失败:', error.message);
    throw error;
  }
}

/**
 * 转换飞书数据格式为项目格式
 */
function convertFeishuDataToProjectFormat(feishuItems) {
  return feishuItems.map(item => {
    const fields = item.fields;

    // 解析星期字符串为数组
    let weekdays = [];
    let date = fields['星期/日期'];

    if (fields['活动类型'] === '固定频率') {
      weekdays = parseWeekdays(fields['星期/日期']);
      date = undefined;
    }

    return {
      id: fields['序号'] || item.record_id,
      _id: fields['序号'] || item.record_id,
      title: fields['活动标题'] || '',
      category: fields['分类'] || '其他',
      status: mapStatus(fields['状态']),
      description: fields['活动描述'] || '',
      ...(fields['活动类型'] === '固定频率' ? {
        weekdays: weekdays,
        frequency: 'weekly'
      } : {
        date: fields['星期/日期'],
        frequency: 'once'
      }),
      time: fields['时间'] || '',
      duration: fields['持续时间'] || '',
      location: fields['地点名称'] || '',
      address: fields['详细地址'] || '',
      price: fields['价格显示'] || '',
      priceMin: fields['最低价格'] ? parseInt(fields['最低价格']) : 0,
      priceMax: fields['最高价格'] ? parseInt(fields['最高价格']) : 0,
      currency: '฿',
      maxParticipants: fields['最大人数'] ? parseInt(fields['最大人数']) : 0,
      flexibleTime: fields['灵活时间'] === '是',
      bookingRequired: fields['需要预约'] === '是',
      images: parseImages(fields['图片URL']),
      source: {
        name: '飞书表格录入',
        url: fields['来源链接'] || '',
        type: 'feishu',
        lastUpdated: new Date().toISOString()
      },
      createdAt: new Date(item.created_time || Date.now()).toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

/**
 * 映射状态字段
 */
function mapStatus(status) {
  const statusMap = {
    '草稿': '草稿',
    '待开始': '待开始',
    '进行中': '进行中',
    '已暂停': '已暂停',
    '已过期': '已过期'
  };
  return statusMap[status] || '进行中';
}

/**
 * 解析星期字符串为数组
 */
function parseWeekdays(weekdayStr) {
  const weekdayMap = {
    '周一': 1, '周二': 2, '周三': 3, '周四': 4,
    '周五': 5, '周六': 6, '周日': 0
  };

  if (!weekdayStr) return [];

  return weekdayStr.split(',')
    .map(s => s.trim())
    .filter(s => weekdayMap[s] !== undefined)
    .map(s => weekdayMap[s]);
}

/**
 * 解析图片URL字符串
 */
function parseImages(urlStr) {
  if (!urlStr) return [];

  return urlStr
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * 更新本地数据文件
 */
async function updateLocalData(feishuData) {
  // 1. 转换飞书数据格式为项目格式
  const items = convertFeishuDataToProjectFormat(feishuData);

  // 2. 读取现有数据
  const existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  // 3. 合并数据（根据ID更新或新增）
  const updatedData = mergeData(existingData, items);

  // 4. 保存到文件
  fs.writeFileSync(DATA_FILE, JSON.stringify(updatedData, null, 2), 'utf8');

  console.log(`✅ 飞书数据已同步: ${items.length} 条记录`);
}

/**
 * 合并数据
 */
function mergeData(existingData, newItems) {
  const itemMap = new Map();

  // 先放入现有数据
  existingData.forEach(item => {
    itemMap.set(item.id || item._id, item);
  });

  // 更新或新增飞书数据
  newItems.forEach(item => {
    const key = item.id || item._id;
    itemMap.set(key, {
      ...itemMap.get(key),
      ...item,
      updatedAt: new Date().toISOString()
    });
  });

  return Array.from(itemMap.values());
}

/**
 * Webhook接收端 - 接收飞书多维表格的通知
 */
app.post('/api/sync-from-feishu', requireApiKey, async (req, res) => {
  try {
    console.log('📬 收到飞书同步请求:', new Date().toISOString());

    // 调用飞书API获取最新数据
    const feishuData = await fetchFeishuData();

    // 更新本地数据文件
    await updateLocalData(feishuData);

    // 返回成功
    res.json({
      success: true,
      message: '数据同步成功',
      recordCount: feishuData.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 同步失败:', error);
    res.status(500).json({
      success: false,
      message: '同步失败: ' + error.message
    });
  }
});

/**
 * 手动触发同步接口
 */
app.post('/api/sync-manual', requireApiKey, async (req, res) => {
  try {
    console.log('🔄 开始手动同步飞书数据...');

    const feishuData = await fetchFeishuData();
    await updateLocalData(feishuData);

    res.json({
      success: true,
      message: `同步完成，共 ${feishuData.length} 条记录`,
      recordCount: feishuData.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 手动同步失败:', error);
    res.status(500).json({
      success: false,
      message: '同步失败: ' + error.message
    });
  }
});

/**
 * 自动修复API - 修复缺失的status字段
 */
app.post('/api/fix-missing-status', requireApiKey, (req, res) => {
  try {
    console.log('🔧 开始修复缺失的status字段...');
    const data = readData();
    const { activityNumbers } = req.body;

    let fixedCount = 0;
    data.forEach(item => {
      // 如果指定了活动编号，只修复这些
      if (activityNumbers && activityNumbers.length > 0) {
        if (activityNumbers.includes(item.activityNumber)) {
          if (!item.status || item.status === '') {
            item.status = '进行中'; // 默认状态
            fixedCount++;
          }
        }
      } else {
        // 修复所有缺失status的活动
        if (!item.status || item.status === '') {
          item.status = '进行中';
          fixedCount++;
        }
      }
    });

    writeData(data);

    res.json({
      success: true,
      message: `已修复 ${fixedCount} 个活动的status字段`,
      fixedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 修复status字段失败:', error);
    res.status(500).json({
      success: false,
      message: '修复失败: ' + error.message
    });
  }
});

/**
 * 自动修复API - 修复缺失的suspensionNote字段
 */
app.post('/api/fix-suspension-notes', requireApiKey, (req, res) => {
  try {
    console.log('🔧 开始修复缺失的suspensionNote字段...');
    const data = readData();
    const { items } = req.body;

    let fixedCount = 0;
    data.forEach(item => {
      // 只修复已暂停状态的活动
      if (item.status === '已暂停' && (!item.suspensionNote || item.suspensionNote === '')) {
        // 如果提供了具体修复项
        if (items && items.length > 0) {
          const fixItem = items.find(f => f.activityNumber === item.activityNumber);
          if (fixItem) {
            item.suspensionNote = fixItem.defaultNote || '此活动暂时停用';
            fixedCount++;
          }
        } else {
          // 使用默认说明
          item.suspensionNote = '此活动暂时停用，详情请咨询客服';
          fixedCount++;
        }
      }
    });

    writeData(data);

    res.json({
      success: true,
      message: `已修复 ${fixedCount} 个活动的suspensionNote字段`,
      fixedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 修复suspensionNote字段失败:', error);
    res.status(500).json({
      success: false,
      message: '修复失败: ' + error.message
    });
  }
});

/**
 * 自动修复API - 更新版本号
 */
app.post('/api/update-version', requireApiKey, (req, res) => {
  try {
    console.log('🔧 更新版本信息...');
    const data = readData();

    try {
      const appVersion = JSON.parse(fs.readFileSync(APP_VERSION_FILE, 'utf8'));
      const version = {
        version: appVersion.version,
        timestamp: new Date().toISOString(),
        count: data.length
      };
      fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2));

      res.json({
        success: true,
        message: '版本信息已更新',
        version,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // 如果读取应用版本失败，使用时间戳
      const version = {
        version: Date.now(),
        timestamp: new Date().toISOString(),
        count: data.length
      };
      fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2));

      res.json({
        success: true,
        message: '版本信息已更新',
        version,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ 更新版本失败:', error);
    res.status(500).json({
      success: false,
      message: '更新失败: ' + error.message
    });
  }
});

/**
 * 自动修复API - 综合修复（一键修复所有问题）
 */
app.post('/api/auto-fix-all', requireApiKey, async (req, res) => {
  try {
    console.log('🔧 开始自动修复所有问题...');
    const results = [];

    // 1. 修复缺失的status字段
    const data = readData();
    let statusFixed = 0;
    data.forEach(item => {
      if (!item.status || item.status === '') {
        item.status = '进行中';
        statusFixed++;
      }
    });
    if (statusFixed > 0) {
      writeData(data);
      results.push({ action: '修复status字段', count: statusFixed });
    }

    // 2. 修复缺失的suspensionNote
    let noteFixed = 0;
    data.forEach(item => {
      if (item.status === '已暂停' && (!item.suspensionNote || item.suspensionNote === '')) {
        item.suspensionNote = '此活动暂时停用，详情请咨询客服';
        noteFixed++;
      }
    });
    if (noteFixed > 0) {
      writeData(data);
      results.push({ action: '修复suspensionNote', count: noteFixed });
    }

    // 3. 更新版本信息
    try {
      const appVersion = JSON.parse(fs.readFileSync(APP_VERSION_FILE, 'utf8'));
      const version = {
        version: appVersion.version,
        timestamp: new Date().toISOString(),
        count: data.length
      };
      fs.writeFileSync(VERSION_FILE, JSON.stringify(version, null, 2));
      results.push({ action: '更新版本信息', count: 1 });
    } catch (error) {
      results.push({ action: '更新版本信息', count: 0, error: error.message });
    }

    res.json({
      success: true,
      message: `自动修复完成，共执行 ${results.length} 项操作`,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 自动修复失败:', error);
    res.status(500).json({
      success: false,
      message: '自动修复失败: ' + error.message
    });
  }
});

// =====================================================
// 单元测试API - 运行Vitest单元测试
// =====================================================
/**
 * GET /api/unit-tests/status
 * 获取单元测试状态信息
 */
app.get('/api/unit-tests/status', (req, res) => {
  try {
    const { execSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');

    // 检查单元测试文件是否存在
    const testDir = path.join(__dirname, '__tests__');
    const hasTests = fs.existsSync(testDir);

    if (!hasTests) {
      return res.json({
        success: true,
        hasTests: false,
        message: '暂无单元测试文件',
        testFiles: []
      });
    }

    // 列出所有测试文件
    const testFiles = [];
    const findTestFiles = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          findTestFiles(fullPath);
        } else if (file.endsWith('.test.js') || file.endsWith('.spec.js')) {
          testFiles.push(fullPath.replace(__dirname + '/', ''));
        }
      });
    };

    findTestFiles(testDir);

    res.json({
      success: true,
      hasTests: true,
      testFileCount: testFiles.length,
      testFiles,
      message: `找到 ${testFiles.length} 个单元测试文件`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取测试状态失败: ' + error.message
    });
  }
});

/**
 * POST /api/unit-tests/run
 * 运行Vitest单元测试并返回结果
 */
app.post('/api/unit-tests/run', requireApiKey, async (req, res) => {
  try {
    const { execSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');

    console.log('🧪 开始运行单元测试...');

    // 检查是否存在测试文件
    const testDir = path.join(__dirname, '__tests__');
    if (!fs.existsSync(testDir)) {
      return res.json({
        success: false,
        message: '暂无单元测试文件',
        results: []
      });
    }

    // 运行Vitest并获取JSON输出
    // 使用--reporter=verbose获取详细输出
    const testOutput = execSync('npx vitest run --reporter=verbose 2>&1', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    // 解析测试输出
    const lines = testOutput.split('\n');
    const testResults = [];
    let currentSuite = null;
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    lines.forEach(line => {
      // 解析测试套件
      const suiteMatch = line.match(/^(.*?)\s+>\s+(.*?)$/);
      if (suiteMatch) {
        currentSuite = {
          name: suiteMatch[2].trim(),
          tests: [],
          status: 'pending'
        };
        testResults.push(currentSuite);
      }

      // 解析测试用例
      if (line.includes('✓') || line.includes('✗')) {
        const testPassed = line.includes('✓');
        const testName = line.replace(/[✓✗]/, '').trim();

        if (currentSuite) {
          currentSuite.tests.push({
            name: testName,
            passed: testPassed,
            duration: 0
          });

          if (testPassed) {
            passedTests++;
            currentSuite.status = 'pass';
          } else {
            failedTests++;
            currentSuite.status = 'fail';
          }
          totalTests++;
        }
      }
    });

    console.log(`✅ 单元测试完成: ${passedTests}/${totalTests} 通过`);

    res.json({
      success: true,
      message: `单元测试运行完成: ${passedTests}/${totalTests} 通过`,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
      },
      results: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // 测试失败时，error.stdout包含测试输出
    const output = error.stdout || '';
    const lines = output.split('\n');

    const testResults = [];
    let currentSuite = null;
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    lines.forEach(line => {
      const suiteMatch = line.match(/^(.*?)\s+>\s+(.*?)$/);
      if (suiteMatch) {
        currentSuite = {
          name: suiteMatch[2].trim(),
          tests: [],
          status: 'pending'
        };
        testResults.push(currentSuite);
      }

      if (line.includes('✓') || line.includes('✗')) {
        const testPassed = line.includes('✓');
        const testName = line.replace(/[✓✗]/, '').trim();

        if (currentSuite) {
          currentSuite.tests.push({
            name: testName,
            passed: testPassed,
            duration: 0
          });

          if (testPassed) {
            passedTests++;
          } else {
            failedTests++;
          }
          totalTests++;
        }
      }
    });

    console.log(`⚠️  单元测试完成（有失败）: ${passedTests}/${totalTests} 通过`);

    res.json({
      success: true,
      message: `单元测试运行完成: ${passedTests}/${totalTests} 通过 (${failedTests} 失败)`,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
      },
      results: testResults,
      timestamp: new Date().toISOString()
    });
  }
});

// =====================================================
// 测试需求自动更新API
// =====================================================

/**
 * POST /api/test-update - 扫描实际代码并生成测试更新建议
 */
app.post('/api/test-update', requireApiKey, async (req, res) => {
  try {
    logger.info('开始扫描测试需求...');

    const { execSync } = require('child_process');
    const path = require('path');

    // 运行扫描脚本
    const scriptPath = path.join(__dirname, 'scripts', 'update-test-requirements.cjs');

    try {
      const output = execSync(`node "${scriptPath}"`, {
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: __dirname
      });

      // 读取生成的报告
      const reportPath = path.join(__dirname, 'docs', 'TEST-UPDATE-REPORT.json');
      const report = require(reportPath);

      logger.info('测试需求扫描完成');

      res.json({
        success: true,
        message: '测试需求扫描完成',
        report: report,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // 脚本执行错误
      logger.error('测试需求扫描失败:', error.message);

      res.status(500).json({
        success: false,
        message: '测试需求扫描失败: ' + error.message,
        error: error.stdout || error.stderr
      });
    }
  } catch (error) {
    logger.error('测试需求更新API错误:', error);
    res.status(500).json({
      success: false,
      message: '测试需求更新失败: ' + error.message
    });
  }
});

/**
 * GET /api/test-update/status - 获取测试更新状态
 */
app.get('/api/test-update/status', (req, res) => {
  try {
    const path = require('path');
    const reportPath = path.join(__dirname, 'docs', 'TEST-UPDATE-REPORT.json');

    // 检查报告是否存在
    const fs = require('fs');
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

      res.json({
        success: true,
        hasReport: true,
        lastUpdate: report.timestamp,
        summary: report.summary,
        suggestions: report.suggestions
      });
    } else {
      res.json({
        success: true,
        hasReport: false,
        message: '暂无测试更新报告，请先运行扫描'
      });
    }
  } catch (error) {
    logger.error('获取测试更新状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取测试更新状态失败: ' + error.message
    });
  }
});

// =====================================================
// 全局错误处理（必须在所有路由之后）
// =====================================================
app.use(globalErrorHandler);

// =====================================================
// 启动时同步 data/ → public/data/（确保静态数据一致）
// =====================================================
function syncDataToPublic() {
  const publicDataDir = path.join(__dirname, 'public', 'data');
  const filesToSync = ['items.json', 'guide.json'];
  try {
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }
    for (const file of filesToSync) {
      const src = path.join(__dirname, 'data', file);
      const dest = path.join(publicDataDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    }
    logger.info('📁 data/ → public/data/ 同步完成');
  } catch (err) {
    logger.warn('数据同步失败（非致命）:', err.message);
  }
}
syncDataToPublic();

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   🏝️ Chiang Mai Guide Platform v2.0                  ║
╠════════════════════════════════════════════════════════════╣
║   🚀 Server: http://localhost:${PORT}                          ║
║   🎨 Frontend (React): http://localhost:5173               ║
║   ⚙️  Admin Panel: http://localhost:${PORT}/admin              ║
║   🔌 API: http://localhost:${PORT}/api                       ║
╚════════════════════════════════════════════════════════════╝
  `);
});
