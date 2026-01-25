require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data', 'items.json');

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
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    if (allowedTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件 (jpeg, jpg, png, gif, webp)'));
    }
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
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 直接访问 public 目录
app.use(express.static('public'));
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

  // 检查是否在允许列表中或为 Vercel 子域名
  if (allowedOrigins.includes(origin) || origin?.endsWith('.vercel.app')) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // 开发环境允许所有来源，生产环境应移除此行
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API 路由
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
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

  // 支持筛选参数
  const { category, search, priceMin, priceMax, status, page = 1, limit = 10, sortBy, sortOrder = 'asc' } = req.query;

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

  if (!title || !description) {
    return res.status(400).json({ success: false, message: '标题和描述不能为空' });
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

  res.json({ success: true, data: items });
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
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
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
