#!/usr/bin/env node

import XLSX from 'xlsx';

console.log('💃 添加尊巴舞活动到Excel...\n');

// 读取Excel
const workbook = XLSX.readFile('清迈活动数据.xlsx');
const sheetName = workbook.SheetNames[0];
const existingData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`✅ 当前Excel有 ${existingData.length} 行数据`);

// 尊巴舞活动数据
const zumbaActivity = {
  name: '尊巴舞（迪卡侬）',
  description: '氛围轻松，适合零基础参与者。',
  time: '每周二、四、六 18:00-19:00',
  location: '清迈迪卡侬（尚泰购物中心附近最大的门店）',
  price: '免费',
  category: '舞蹈',
  booking: '网上预约，填写姓名和邮箱'
};

// 检查标题是否已存在
console.log('🔍 检查活动标题是否已存在...\n');

const existingTitles = new Set(
  existingData.map(d => (d['活动标题'] || '').trim()).filter(Boolean)
);

if (existingTitles.has(zumbaActivity.name.trim())) {
  console.log(`❌ 活动标题 "${zumbaActivity.name}" 已存在于Excel中`);
  console.log('⚠️  如需更新现有活动，请手动编辑Excel');
  process.exit(1);
}

console.log('✅ 标题检查通过：无重复\n');

// 计算编号
const maxNumber = Math.max(...existingData.map(d => parseInt(d['活动编号']) || 0));

// 构建描述
let description = zumbaActivity.description;
description += `\n参与方式：${zumbaActivity.booking}`;

// 创建新行
const newRow = {
  '序号': existingData.length + 1,
  '活动编号': (maxNumber + 1).toString().padStart(4, '0'),
  '活动标题': zumbaActivity.name,
  '分类': zumbaActivity.category,
  '地点': zumbaActivity.location,
  '价格': zumbaActivity.price,
  '需要预约': '是',
  '时间': zumbaActivity.time,
  '持续时间': '',
  '时间信息': '固定频率活动',
  '星期': '周二,周四,周六',
  '最低价格': 0,
  '最高价格': 0,
  '最大人数': '不限',
  '描述': description,
  '灵活时间': '否',
  '状态': '进行中'
};

console.log(`📝 准备添加活动:\n`);
console.log(`  编号: ${newRow['活动编号']}`);
console.log(`  标题: ${newRow['活动标题']}`);
console.log(`  分类: ${newRow['分类']}`);
console.log(`  地点: ${newRow['地点']}`);
console.log(`  价格: ${newRow['价格']}`);
console.log(`  时间: ${newRow['时间']}`);
console.log(`  星期: ${newRow['星期']}`);
console.log(`  预约: ${newRow['需要预约']}`);

// 合并数据
const allData = [...existingData, newRow];

// 保存Excel
workbook.Sheets[sheetName] = XLSX.utils.json_to_sheet(allData);
XLSX.writeFile(workbook, '清迈活动数据.xlsx');

console.log(`\n✅ 已成功添加尊巴舞活动到Excel`);
console.log(`📊 Excel总行数: ${allData.length}`);
console.log(`📋 新活动编号: ${newRow['活动编号']}`);
console.log('\n💡 下一步: npm run import-excel:smart');
