require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

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

// 读取数据
const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// 写入数据
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
    'http://localhost:3000',
    'https://chiengmai-activities.vercel.app'
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
app.post('/api/activities', (req, res) => {
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
    status: 'active',
    rating: { average: 0, count: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  items.push(newItem);
  writeData(items);

  res.json({ success: true, data: newItem, message: '创建成功' });
});

// PUT /api/activities/:id - 更新活动
app.put('/api/activities/:id', (req, res) => {
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
app.delete('/api/activities/:id', (req, res) => {
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
  const activeItems = items.filter(item => item.status !== 'draft');

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
app.post('/api/items', (req, res) => {
  const data = req.body;

  if (!data.title || !data.description) {
    return res.status(400).json({ success: false, message: '标题和描述不能为空' });
  }

  const items = readData();
  const newItem = {
    id: Date.now().toString(),
    _id: Date.now().toString(),
    ...data,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  items.push(newItem);
  writeData(items);

  res.json({ success: true, data: newItem, message: '创建成功' });
});

// PUT /api/items/:id - 更新数据
app.put('/api/items/:id', (req, res) => {
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
app.delete('/api/items/:id', (req, res) => {
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
app.post('/api/upload', upload.single('image'), (req, res) => {
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
app.delete('/api/upload/:filename', (req, res) => {
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
    name: 'Chiengmai Activities',
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
app.post('/api/import-excel', async (req, res) => {
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
app.post('/api/export-excel', async (req, res) => {
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
app.post('/api/guide', (req, res) => {
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
app.post('/api/requirements-log', (req, res) => {
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
app.put('/api/requirements-log/:id', (req, res) => {
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
app.delete('/api/requirements-log/:id', (req, res) => {
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
    '草稿': 'draft',
    '待开始': 'upcoming',
    '进行中': 'ongoing',
    '已过期': 'expired'
  };
  return statusMap[status] || 'active';
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
app.post('/api/sync-from-feishu', async (req, res) => {
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
app.post('/api/sync-manual', async (req, res) => {
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
app.post('/api/fix-missing-status', (req, res) => {
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
app.post('/api/fix-suspension-notes', (req, res) => {
  try {
    console.log('🔧 开始修复缺失的suspensionNote字段...');
    const data = readData();
    const { items } = req.body;

    let fixedCount = 0;
    data.forEach(item => {
      // 只修复suspended状态的活动
      if (item.status === 'suspended' && (!item.suspensionNote || item.suspensionNote === '')) {
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
app.post('/api/update-version', (req, res) => {
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
app.post('/api/auto-fix-all', async (req, res) => {
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
      if (item.status === 'suspended' && (!item.suspensionNote || item.suspensionNote === '')) {
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
// 全局错误处理（必须在所有路由之后）
// =====================================================
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   🏝️ Chiengmai Activities Platform v2.0                  ║
╠════════════════════════════════════════════════════════════╣
║   🚀 Server: http://localhost:${PORT}                          ║
║   🎨 Frontend (React): http://localhost:5173               ║
║   ⚙️  Admin Panel: http://localhost:${PORT}/admin              ║
║   🔌 API: http://localhost:${PORT}/api                       ║
╚════════════════════════════════════════════════════════════╝
  `);
});
