#!/usr/bin/env node

import XLSX from 'xlsx';
import fs from 'fs';

console.log('正在读取Excel文件...');
const workbook = XLSX.readFile('./清迈活动数据.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`读取到 ${data.length} 条记录`);

// 为每条记录添加来源链接字段（如果不存在）
const updatedData = data.map(row => {
  if (!row.hasOwnProperty('来源链接')) {
    row['来源链接'] = '';
  }
  return row;
});

// 重新排列列顺序，确保来源链接在最后
const orderedData = updatedData.map(row => {
  const {
    来源链接,
    ...otherFields
  } = row;
  return {
    ...otherFields,
    '来源链接': 来源链接 || ''
  };
});

// 创建新工作表
const newWorksheet = XLSX.utils.json_to_sheet(orderedData);
const newWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);

// 备份原文件
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = `./backups/backup-before-source-link-${timestamp}.xlsx`;
fs.mkdirSync('./backups', { recursive: true });
fs.copyFileSync('./清迈活动数据.xlsx', backupFile);
console.log(`已备份到: ${backupFile}`);

// 写入新文件
XLSX.writeFile(newWorkbook, './清迈活动数据.xlsx');
console.log('✅ 已添加"来源链接"列到最后一列');

// 显示新的列结构
if (orderedData.length > 0) {
  const headers = Object.keys(orderedData[0]);
  console.log(`\n新列结构（共${headers.length}列）:`);
  headers.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));
}

console.log('\n💡 提示：现在可以在Excel中填写"来源链接"字段');
