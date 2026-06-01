'use strict';

const fs = require('fs');
const { DATA_FILE, GUIDE_FILE, VERSION_FILE, APP_VERSION_FILE } = require('../config');

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

// 字段映射：将中文字段名转换为英文字段名（合并自 /api/activities 和 /api/items 的重复逻辑）
const mapFields = (item) => {
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
};

module.exports = {
  readData,
  readDataAsync,
  writeData,
  writeDataAsync,
  getDataVersion,
  mapFields
};
