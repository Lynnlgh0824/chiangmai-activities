#!/usr/bin/env node

import XLSX from 'xlsx';

const workbook = XLSX.readFile('./清迈活动数据.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('✅ Excel文件验证成功\n');
console.log(`总记录数: ${data.length}\n`);

// 显示前3条记录的关键信息
console.log('前3条记录:');
data.slice(0, 3).forEach((row, i) => {
  console.log(`${i + 1}. ${row['活动编号']} - ${row['活动标题']}`);
  console.log(`   分类: ${row['分类']}`);
  console.log(`   来源链接: ${row['来源链接'] || '(空)'}\n`);
});
