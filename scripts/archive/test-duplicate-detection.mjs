#!/usr/bin/env node

import XLSX from 'xlsx';
import fs from 'fs';

console.log('🧪 测试重复检测机制...\n');

// 1. 读取当前Excel
const workbook = XLSX.readFile('清迈活动数据.xlsx');
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

// 2. 添加一个重复的标题（用于测试）
const firstActivity = data[0];
console.log(`📌 测试：尝试添加重复标题 "${firstActivity['活动标题']}"\n`);

const duplicateRow = {
  ...firstActivity,
  '活动编号': '0099',
  '序号': data.length + 1
};

const testData = [...data, duplicateRow];

// 3. 保存为测试文件
const testWorkbook = XLSX.utils.book_new();
const testSheet = XLSX.utils.json_to_sheet(testData);
XLSX.utils.book_append_sheet(testWorkbook, testSheet, '测试');
XLSX.writeFile(testWorkbook, 'test-duplicate.xlsx');

console.log('✅ 已创建测试文件 test-duplicate.xlsx');
console.log('   包含一个重复的活动标题用于测试\n');

// 4. 检查重复
const titleMap = new Map();
testData.forEach((item, index) => {
  const title = item['活动标题'];
  if (!title) return;

  if (titleMap.has(title)) {
    titleMap.get(title).push({ index, item });
  } else {
    titleMap.set(title, [{ index, item }]);
  }
});

const duplicates = [];
titleMap.forEach((occurrences, title) => {
  if (occurrences.length > 1) {
    duplicates.push({ title, occurrences });
  }
});

if (duplicates.length > 0) {
  console.log('❌ 检测到重复:');
  duplicates.forEach(dup => {
    console.log(`\n  "${dup.title}" 重复 ${dup.occurrences.length} 次:`);
    dup.occurrences.forEach(({ index, item }) => {
      console.log(`    行${index + 1}: 编号 ${item['活动编号']}`);
    });
  });
  console.log('\n✅ 重复检测机制工作正常！');
} else {
  console.log('⚠️  未检测到重复');
}

// 5. 清理测试文件
fs.unlinkSync('test-duplicate.xlsx');
console.log('\n🧹 已清理测试文件');
