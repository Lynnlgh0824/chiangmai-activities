#!/usr/bin/env node

/**
 * 优化寺庙/禅修数据 - 补充缺失字段
 */

import XLSX from 'xlsx';
import fs from 'fs';

// Excel文件路径
const EXCEL_FILE = './清迈活动数据.xlsx';

console.log('🧘‍♀️  开始优化寺庙/禅修数据...\n');

// 读取Excel文件
console.log('📂 读取Excel文件:', EXCEL_FILE);
const workbook = XLSX.readFile(EXCEL_FILE);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 获取所有数据
const allData = XLSX.utils.sheet_to_json(worksheet);

console.log('✅ 当前总活动数:', allData.length);
console.log('');

// 找到寺庙/禅修活动
const templesData = allData.filter(item =>
  item['分类'] === '冥想' &&
  ['0056', '0057', '0058', '0059'].includes(item['活动编号'])
);

console.log('🏛️  找到', templesData.length, '个寺庙/禅修活动');
console.log('');

// 寺庙优化数据映射
const templesOptimization = {
  '0056': {
    title: 'Wat Tung Yu',
    weekdays: '周三,周六,周日',
    time: '09:00-11:00',
    duration: '2小时',
    description: `适合人群：初学者，希望灵活参与、无需预约的游客。
活动特点：小组冥想、佛法讲解、问答互动，氛围轻松。
由美国老师David带领。

语言：英语
官网：BuddhaDailyWisdom.com
Facebook小组：Chiang Mai Meditation & Buddhist Study Community`
  },
  '0057': {
    title: '乌蒙寺 (Wat Umong)',
    weekdays: '周一,周二,周三,周四,周五,周六,周日',
    duration: '3天起',
    minPrice: 150,
    description: `适合人群：希望进行数日沉浸式禅修，且日程要求相对宽松的体验者。
活动特点：日程相对宽松，可体验山林、洞穴冥想。课程周期3天起，可自选天数，一般不要求上交手机。
登记时间：建议早上8:30带行李直接前往登记

语言：英语/泰语
费用：约150泰铢/天（含食宿），需现金支付
预约：通常无需提前网络预约`
  },
  '0058': {
    title: '朗奔寺/兰蓬寺 (Wat Ram Poeng)',
    weekdays: '周一,周二,周三,周四,周五,周六,周日',
    duration: '7-45天',
    description: `适合人群：寻求严肃、深度、长期内观禅修的修行者。
活动特点：专注于内观禅修，课程体系严谨。有严格戒律（如禁用电子设备、禁语）。
课程周期：标准课程周期较长，一般为7-45天，需要提前预约

语言：英语（有会讲中文的居士提供翻译协助）
费用：免费（捐赠形式），课程费用包含食宿
官网：www.watrampoeng.net
联系方式：watrampoeng@hotmail.com`
  },
  '0059': {
    title: '国际内观禅修中心 (International Meditation Center Chom Tong)',
    weekdays: '周一,周二,周三,周四,周五,周六,周日',
    duration: '10-21天',
    description: `适合人群：追求传统、严格内观禅修，且时间充裕的修行者。
活动特点：泰国著名内观中心之一，注重个人冥想。
课程推荐：初学者参加21天课程，returning学员通常参加10天课程

语言：英语
费用：免费（捐赠形式）`
  }
};

// 优化统计
let updatedCount = 0;
const updates = [];

// 遍历并更新寺庙数据
templesData.forEach(item => {
  const number = item['活动编号'];
  const optimization = templesOptimization[number];

  if (!optimization) {
    console.log('⚠️  未找到优化配置:', number, item['活动标题']);
    return;
  }

  let hasChanges = false;
  const itemUpdates = [];

  // 1. 更新"星期"字段
  if (optimization.weekdays && (!item['星期'] || item['星期'] === '')) {
    const oldWeekdays = item['星期'];
    item['星期'] = optimization.weekdays;
    hasChanges = true;
    itemUpdates.push(`星期: "${oldWeekdays}" → "${optimization.weekdays}"`);
  }

  // 2. 更新"时间"字段（标准化格式）
  if (optimization.time && optimization.time !== item['时间']) {
    const oldTime = item['时间'];
    item['时间'] = optimization.time;
    hasChanges = true;
    itemUpdates.push(`时间: "${oldTime}" → "${optimization.time}"`);
  }

  // 3. 更新"持续时间"字段
  if (optimization.duration && (!item['持续时间'] || item['持续时间'] === '')) {
    const oldDuration = item['持续时间'];
    item['持续时间'] = optimization.duration;
    hasChanges = true;
    itemUpdates.push(`持续时间: "${oldDuration}" → "${optimization.duration}"`);
  }

  // 4. 更新"最低价格"字段
  if (optimization.minPrice !== undefined && (!item['最低价格'] || item['最低价格'] === 0)) {
    const oldPrice = item['最低价格'];
    item['最低价格'] = optimization.minPrice;
    hasChanges = true;
    itemUpdates.push(`最低价格: ${oldPrice} → ${optimization.minPrice}`);
  }

  // 5. 更新"描述"字段
  if (optimization.description && optimization.description !== item['描述']) {
    const oldDescLength = (item['描述'] || '').length;
    const newDescLength = optimization.description.length;

    if (newDescLength > oldDescLength) {
      item['描述'] = optimization.description;
      hasChanges = true;
      itemUpdates.push(`描述已优化 (${oldDescLength} → ${newDescLength} 字符)`);
    }
  }

  if (hasChanges) {
    updatedCount++;
    updates.push({
      number,
      title: item['活动标题'],
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

console.log('📋 更新详情:\n');
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
console.log('✨ 寺庙/禅修数据优化完成！');
console.log('');
console.log('📊 优化摘要:');
console.log('   ✅ 补充了"星期"字段');
console.log('   ✅ 添加了"持续时间"');
console.log('   ✅ 提取了"最低价格"');
console.log('   ✅ 完善了"描述"（包含语言、联系方式等）');
