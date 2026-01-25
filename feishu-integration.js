/**
 * 飞书多维表格集成方案
 *
 * 功能：监听飞书表格变化，自动同步到项目数据库
 */

// ==================== 方案1：Webhook接收端 ====================

// 在 server.js 中添加以下路由

const express = require('express');
const axios = require('axios');

/**
 * Webhook接收端 - 接收飞书多维表格的通知
 */
app.post('/api/sync-from-feishu', async (req, res) => {
  try {
    console.log('收到飞书同步请求:', req.body);

    // 1. 验证webhook签名（安全考虑）
    // const signature = req.headers['x-feishu-signature'];
    // if (!verifySignature(signature, req.body)) {
    //   return res.status(401).json({ success: false, message: '签名验证失败' });
    // }

    // 2. 调用飞书API获取最新数据
    const feishuData = await fetchFeishuData();

    // 3. 更新本地数据文件
    await updateLocalData(feishuData);

    // 4. 返回成功
    res.json({
      success: true,
      message: '数据同步成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('同步失败:', error);
    res.status(500).json({
      success: false,
      message: '同步失败: ' + error.message
    });
  }
});

/**
 * 从飞书API获取数据
 */
async function fetchFeishuData() {
  // 飞书API配置
  const FEISHU_CONFIG = {
    appId: process.env.FEISHU_APP_ID,
    appSecret: process.env.FEISHU_APP_SECRET,
    spreadsheetToken: process.env.FEISHU_SPREADSHEET_TOKEN,
    sheetId: process.env.FEISHU_SHEET_ID,
  };

  // 1. 获取tenant_access_token
  const tokenResponse = await axios.post(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    {
      app_id: FEISHU_CONFIG.appId,
      app_secret: FEISHU_CONFIG.appSecret
    }
  );

  const tenantAccessToken = tokenResponse.data.tenant_access_token;

  // 2. 读取表格数据
  const dataResponse = await axios.get(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_CONFIG.spreadsheetToken}/tables/${FEISHU_CONFIG.sheetId}/records`,
    {
      headers: {
        'Authorization': `Bearer ${tenantAccessToken}`
      }
    }
  );

  return dataResponse.data.data.items;
}

/**
 * 更新本地数据文件
 */
async function updateLocalData(feishuData) {
  const fs = require('fs').promises;
  const path = require('path');

  // 1. 转换飞书数据格式为项目格式
  const items = convertFeishuDataToProjectFormat(feishuData);

  // 2. 读取现有数据
  const dataPath = path.join(__dirname, 'data', 'items.json');
  const existingData = JSON.parse(await fs.readFile(dataPath, 'utf8'));

  // 3. 合并数据（根据ID更新或新增）
  const updatedData = mergeData(existingData, items);

  // 4. 保存到文件
  await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2), 'utf8');

  console.log(`✅ 数据已更新: ${items.length} 条记录`);
}

/**
 * 转换飞书数据格式为项目格式
 */
function convertFeishuDataToProjectFormat(feishuItems) {
  return feishuItems.map(item => {
    const fields = item.fields;

    return {
      id: fields['序号'] || generateId(),
      title: fields['活动标题'],
      category: fields['分类'],
      status: fields['状态'] || 'draft',
      description: fields['活动描述'],

      // 根据活动类型选择字段
      ...(fields['活动类型'] === '固定频率' ? {
        weekdays: parseWeekdays(fields['星期/日期']),
        time: fields['时间'],
        frequency: 'weekly'
      } : {
        date: fields['星期/日期'],
        time: fields['时间'],
        frequency: 'once'
      }),

      duration: fields['持续时间'],
      location: fields['地点名称'],
      address: fields['详细地址'],
      price: fields['价格显示'],
      priceMin: fields['最低价格'] ? parseInt(fields['最低价格']) : 0,
      priceMax: fields['最高价格'] ? parseInt(fields['最高价格']) : 0,
      maxParticipants: fields['最大人数'] ? parseInt(fields['最大人数']) : 0,
      flexibleTime: fields['灵活时间'] === '是',
      bookingRequired: fields['需要预约'] === '是',
      images: parseImages(fields['图片URL']),
      source: {
        name: '飞书表格录入',
        url: fields['来源链接'],
        type: 'feishu',
        lastUpdated: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
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

  // 支持换行符或逗号分隔
  return urlStr
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

  // 更新或新增
  newItems.forEach(item => {
    itemMap.set(item.id, {
      ...itemMap.get(item.id),
      ...item,
      updatedAt: new Date().toISOString()
    });
  });

  return Array.from(itemMap.values());
}

// ==================== 方案2：定时同步 ====================

/**
 * 定时从飞书拉取数据（备用方案）
 */
async function syncFromFeishuScheduled() {
  try {
    console.log('开始定时同步飞书数据...');
    const feishuData = await fetchFeishuData();
    await updateLocalData(feishuData);
    console.log('✅ 定时同步完成');
  } catch (error) {
    console.error('❌ 定时同步失败:', error);
  }
}

// 每小时同步一次
setInterval(syncFromFeishuScheduled, 60 * 60 * 1000);

// 启动时同步一次
syncFromFeishuScheduled();

// ==================== 方案3：手动同步接口 ====================

/**
 * 手动触发同步接口
 */
app.post('/api/sync-manual', async (req, res) => {
  try {
    await syncFromFeishuScheduled();
    res.json({
      success: true,
      message: '手动同步完成'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '同步失败: ' + error.message
    });
  }
});

// ==================== 前端代码 ====================

/**
 * 在前端添加"从飞书同步"按钮
 */
function addFeishuSyncButton() {
  // 在管理后台添加同步按钮
  const syncButtonHtml = `
    <button class="btn btn-info" onclick="syncFromFeishu()">
      🔄 从飞书同步
    </button>
  `;

  // 插入到管理后台的工具栏
  document.querySelector('.toolbar').insertAdjacentHTML('beforeend', syncButtonHtml);
}

/**
 * 前端同步函数
 */
async function syncFromFeishu() {
  const button = event.target;
  button.disabled = true;
  button.textContent = '⏳ 同步中...';

  try {
    const response = await fetch('/api/sync-manual', {
      method: 'POST'
    });

    const result = await response.json();

    if (result.success) {
      alert('✅ ' + result.message);
      location.reload(); // 刷新页面查看更新
    } else {
      alert('❌ ' + result.message);
    }
  } catch (error) {
    alert('❌ 同步失败: ' + error.message);
  } finally {
    button.disabled = false;
    button.textContent = '🔄 从飞书同步';
  }
}

module.exports = { fetchFeishuData, updateLocalData };
