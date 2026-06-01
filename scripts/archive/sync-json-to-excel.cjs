#!/usr/bin/env node

/**
 * JSON数据同步到Excel脚本
 * 功能：
 * 1. 读取items.json数据
 * 2. 导出到Excel
 * 3. 修改列名："描述" → "活动描述"
 * 4. 添加status和suspensionNote列
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 文件路径
const jsonPath = path.join(__dirname, '../data/items.json');
const excelPath = path.join(__dirname, '../清迈活动数据.xlsx');

// 读取JSON数据
console.log('📖 读取JSON数据...');
const items = require(jsonPath);
console.log(`✅ 已读取 ${items.length} 个活动数据`);

// 备份现有Excel文件
if (fs.existsSync(excelPath)) {
  const backupPath = path.join(__dirname, `../backups/backup-before-sync-${Date.now()}.xlsx`);
  fs.copyFileSync(excelPath, backupPath);
  console.log(`💾 已备份现有Excel到: ${path.basename(backupPath)}`);
}

// 定义Excel列（按顺序）
const columns = [
  { header: '活动编号', key: 'activityNumber', width: 12 },
  { header: '活动标题', key: 'title', width: 35 },
  { header: '活动描述', key: 'description', width: 50 },  // ← 修改列名
  { header: '分类', key: 'category', width: 12 },
  { header: '地点', key: 'location', width: 30 },
  { header: '价格', key: 'price', width: 25 },
  { header: '时间', key: 'time', width: 20 },
  { header: '时长', key: 'duration', width: 15 },
  { header: '时间信息', key: 'timeInfo', width: 15 },
  { header: '星期', key: 'weekdays', width: 20 },
  { header: '排序', key: 'sortOrder', width: 8 },
  { header: '最低价格', key: 'minPrice', width: 10 },
  { header: '最高价格', key: 'maxPrice', width: 10 },
  { header: '最大参与者', key: 'maxParticipants', width: 12 },
  { header: '灵活时间', key: 'flexibleTime', width: 10 },
  { header: '状态', key: 'status', width: 12 },              // ← 新增
  { header: '暂停备注', key: 'suspensionNote', width: 30 },    // ← 新增
  { header: '需要预约', key: 'requireBooking', width: 10 },
  { header: '来源链接', key: 'sourceLink', width: 40 },
  { header: 'ID', key: 'id', width: 10 }
];

// 转换数据格式
const excelData = items.map(item => ({
  活动编号: item.activityNumber,
  活动标题: item.title,
  活动描述: item.description,  // ← 新列名
  分类: item.category,
  地点: item.location,
  价格: item.price,
  时间: item.time,
  时长: item.duration,
  时间信息: item.timeInfo,
  星期: Array.isArray(item.weekdays) ? item.weekdays.join(', ') : '',
  排序: item.sortOrder,
  最低价格: item.minPrice,
  最高价格: item.maxPrice,
  最大参与者: item.maxParticipants,
  灵活时间: item.flexibleTime,
  状态: item.status || '进行中',                    // ← 新增
  暂停备注: item.suspensionNote || '',               // ← 新增
  需要预约: item.requireBooking,
  来源链接: item.sourceLink || '',
  ID: item.id
}));

// 创建工作簿和工作表
console.log('📊 创建Excel工作表...');
const worksheet = XLSX.utils.json_to_sheet(excelData, { header: columns.map(c => c.header) });

// 设置列宽
const colWidths = columns.map(c => ({ wch: c.width }));
worksheet['!cols'] = colWidths;

// 创建工作簿
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, '活动数据');

// 写入Excel文件
console.log('💾 写入Excel文件...');
XLSX.writeFile(workbook, excelPath);

console.log('✅ 同步完成！');
console.log(`📄 Excel文件: ${excelPath}`);
console.log(`📊 活动数量: ${items.length}个`);
console.log(`📋 列数: ${columns.length}列`);
console.log('\n列名更新：');
console.log('  - "描述" → "活动描述" ✅');
console.log('  - 新增 "状态" 列 ✅');
console.log('  - 新增 "暂停备注" 列 ✅');
