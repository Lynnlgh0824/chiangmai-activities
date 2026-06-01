#!/usr/bin/env node

/**
 * 优化清吧数据 - 补充缺失字段
 */

import XLSX from 'xlsx';
import fs from 'fs';

// Excel文件路径
const EXCEL_FILE = './清迈活动数据.xlsx';

console.log('📋 开始优化清吧数据...\n');

// 读取Excel文件
console.log('📂 读取Excel文件:', EXCEL_FILE);
const workbook = XLSX.readFile(EXCEL_FILE);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 获取所有数据
const allData = XLSX.utils.sheet_to_json(worksheet);

console.log('✅ 当前总活动数:', allData.length);
console.log('');

// 找到清吧活动
const barsData = allData.filter(item => item['分类'] === '音乐' && item['活动编号'] >= '0061');

console.log('🎵 找到', barsData.length, '个清吧活动');
console.log('');

// 清吧优化数据映射
const barsOptimization = {
  'Riverside Bar & Restaurant': {
    weekdays: '周一,周二,周三,周四,周五,周六,周日',
    requireBooking: '否',
    description: '河边木结构老房子，傍晚：舒缓钢琴曲、吉他曲、民谣；深夜：本地及西方摇滚乐队轮演，氛围从静谧到热烈渐变。白天以餐食为主，傍晚开始有音乐演出，深夜达到氛围顶峰。'
  },
  'North Gate Jazz Co-Op（北门爵士清吧）': {
    weekdays: '周一,周二,周三,周四,周五,周六,周日',
    requireBooking: '是', // 周末建议提前占位
    description: '清迈北门老牌网红清吧，主打爵士乐，现场爵士乐队演出，氛围纯粹无多余商业化装饰，深受本地人和外国乐迷喜爱。19:00后开始正式音乐演出，每晚座无虚席，**周末建议提前占位**。'
  },
  'Nap Gastrobar': {
    weekdays: '周一,周二,周三,周四,周五,周六,周日',
    requireBooking: '否',
    description: '宁曼路核心商圈，工业风装修，轻摇滚、民谣现场演出，氛围随性放松，适合年轻人聚集。全天营业，18:00后开始有音乐演出，持续至深夜，性价比偏高。'
  },
  'Your Bar': {
    weekdays: '周一,周二,周三,周四,周五,周六,周日',
    requireBooking: '否',
    minPrice: 300,
    maxPrice: 500,
    description: '玛雅购物中心6楼，与其他顶楼清吧相邻，可俯瞰部分城区景色。现场乐队+国际DJ驻场，音乐风格多样（流行、轻电子、民谣），氛围活跃有层次。小吃搭配酒水可享套餐优惠，人均300-500泰铢。'
  },
  'Good View Bar and Restaurant': {
    weekdays: '周一,周二,周三,周四,周五,周六,周日',
    requireBooking: '是', // 河边景观位需提前占位
    description: '清迈河边区域人气较高，现场乐队演出，音乐风格偏舒缓流行、泰式民谣，适配河边休闲氛围，可边用餐边听音乐。傍晚开始营业，晚餐时段同步有音乐演出，**河边景观位需提前前往占位**。'
  },
  'Crossroad Chiang Mai（北门跨界清吧）': {
    weekdays: '周一,周二,周三,周四,周五,周六,周日',
    requireBooking: '否',
    description: '清迈古城北门附近小巷内，多元化现场音乐，涵盖吉他弹唱、民谣、轻摇滚，氛围自由惬意，可容纳乐迷现场交流互动。19:00后开启音乐演出，无固定乐队，每日演出风格略有差异，性价比高，适合久坐听乐。'
  }
};

// 优化统计
let updatedCount = 0;
const updates = [];

// 遍历并更新清吧数据
barsData.forEach(item => {
  const title = item['活动标题'];
  const optimization = barsOptimization[title];

  if (!optimization) {
    console.log('⚠️  未找到优化配置:', title);
    return;
  }

  let hasChanges = false;
  const itemUpdates = [];

  // 1. 更新"星期"字段
  if (!item['星期'] || item['星期'] === '') {
    item['星期'] = optimization.weekdays;
    hasChanges = true;
    itemUpdates.push('星期');
  }

  // 2. 更新"需要预约"字段
  if (item['需要预约'] !== optimization.requireBooking) {
    const oldBooking = item['需要预约'];
    item['需要预约'] = optimization.requireBooking;
    hasChanges = true;
    itemUpdates.push(`需要预约: "${oldBooking}" → "${optimization.requireBooking}"`);
  }

  // 3. 更新"最低价格"和"最高价格"字段
  if (optimization.minPrice !== undefined) {
    if (!item['最低价格'] || item['最低价格'] === 0) {
      item['最低价格'] = optimization.minPrice;
      hasChanges = true;
      itemUpdates.push(`最低价格: ${optimization.minPrice}`);
    }
  }

  if (optimization.maxPrice !== undefined) {
    if (!item['最高价格'] || item['最高价格'] === 0) {
      item['最高价格'] = optimization.maxPrice;
      hasChanges = true;
      itemUpdates.push(`最高价格: ${optimization.maxPrice}`);
    }
  }

  // 4. 更新"描述"字段（如果更详细）
  if (optimization.description && optimization.description.length > (item['描述'] || '').length) {
    const oldDesc = item['描述'];
    item['描述'] = optimization.description;
    hasChanges = true;
    itemUpdates.push('描述已优化');
  }

  if (hasChanges) {
    updatedCount++;
    updates.push({
      title,
      number: item['活动编号'],
      changes: itemUpdates
    });
  }
});

if (updatedCount === 0) {
  console.log('ℹ️  没有需要更新的数据');
  process.exit(0);
}

console.log('📝 优化统计:');
console.log('   更新活动数:', updatedCount);
console.log('');

console.log('📋 更新详情:');
updates.forEach(update => {
  console.log(`   [${update.number}] ${update.title}`);
  update.changes.forEach(change => {
    console.log(`      - ${change}`);
  });
  console.log('');
});

// 备份原文件
const backupFile = EXCEL_FILE.replace('.xlsx', '.backup.xlsx');
if (fs.existsSync(backupFile)) {
  fs.unlinkSync(backupFile);
}
fs.copyFileSync(EXCEL_FILE, backupFile);
console.log('💾 已备份原文件到:', backupFile);

// 写入更新后的数据
const newWorksheet = XLSX.utils.json_to_sheet(allData);
workbook.Sheets[sheetName] = newWorksheet;
XLSX.writeFile(workbook, EXCEL_FILE);

console.log('✅ 已保存优化后的文件:', EXCEL_FILE);
console.log('');
console.log('✨ 优化完成！');
