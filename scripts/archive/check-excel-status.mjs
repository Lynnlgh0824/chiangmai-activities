#!/usr/bin/env node

import XLSX from 'xlsx';

console.log('📊 当前Excel数据统计:\n');

const workbook = XLSX.readFile('清迈活动数据.xlsx');
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

console.log(`总行数: ${data.length}`);

// 按分类统计
const byCategory = {};
data.forEach(row => {
  const cat = row['分类'];
  byCategory[cat] = (byCategory[cat] || 0) + 1;
});

console.log('\n分类分布:');
Object.entries(byCategory)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}个`);
  });

// 检查是否还有重复
const titles = data.map(r => r['活动标题']);
const uniqueTitles = new Set(titles);
console.log('\n标题统计:');
console.log(`  总标题数: ${titles.length}`);
console.log(`  唯一标题: ${uniqueTitles.size}`);
console.log(`  重复标题: ${titles.length - uniqueTitles.size}`);

// 显示编号范围
const numbers = data.map(r => parseInt(r['活动编号'])).sort((a, b) => a - b);
console.log(`\n编号范围: ${numbers[0]} - ${numbers[numbers.length-1]}`);

// 如果还有重复，显示出来
if (titles.length !== uniqueTitles.size) {
  const titleCount = {};
  titles.forEach(t => {
    titleCount[t] = (titleCount[t] || 0) + 1;
  });

  console.log('\n⚠️  仍然存在重复的标题:');
  Object.entries(titleCount)
    .filter(([title, count]) => count > 1)
    .forEach(([title, count]) => {
      console.log(`  "${title}" - ${count}次`);
    });
} else {
  console.log('\n✅ 没有重复的活动标题');
}
