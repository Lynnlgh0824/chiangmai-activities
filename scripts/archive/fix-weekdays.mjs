#!/usr/bin/env node

/**
 * 修复Excel中的星期字段
 * 将"无固定时间"改为空字符串
 */

import XLSX from 'xlsx';
import fs from 'fs';

console.log('🔧 开始修复星期字段...\n');

// 读取Excel
const workbook = XLSX.readFile('清迈活动数据.xlsx');
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log('✅ 当前总活动数:', data.length);

// 找到并修复星期字段
const fixedItems = [];

data.forEach((item, index) => {
  const weekdays = item['星期'];

  if (weekdays === '无固定时间' || weekdays === '-') {
    item['星期'] = '';  // 改为空字符串
    fixedItems.push({
      number: item['活动编号'],
      title: item['活动标题'],
      oldValue: weekdays,
      newValue: ''
    });
  }
});

console.log('🔧 修复了', fixedItems.length, '个活动\n');

if (fixedItems.length > 0) {
  console.log('修复详情:\n');
  fixedItems.forEach(item => {
    console.log(`  [${item.number}] ${item.title}`);
    console.log(`    星期: "${item.oldValue}" → "${item.newValue}"`);
    console.log('');
  });

  // 备份原文件
  const backupFile = '清迈活动数据.backup.xlsx';
  if (fs.existsSync(backupFile)) {
    fs.unlinkSync(backupFile);
  }
  fs.copyFileSync('清迈活动数据.xlsx', backupFile);
  console.log('💾 已备份原文件到:', backupFile);

  // 写入修复后的数据
  const newWorksheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets[sheetName] = newWorksheet;
  XLSX.writeFile(workbook, '清迈活动数据.xlsx');

  console.log('✅ 已保存修复后的文件: 清迈活动数据.xlsx');
} else {
  console.log('ℹ️  没有需要修复的数据');
}

console.log('\n✨ 修复完成！');
