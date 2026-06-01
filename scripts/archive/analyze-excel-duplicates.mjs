#!/usr/bin/env node

import XLSX from 'xlsx';

console.log('🔍 深度分析Excel数据...\n');

const workbook = XLSX.readFile('清迈活动数据.xlsx');
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

// 1. 按活动标题分组
const byTitle = {};
data.forEach((row, index) => {
  const title = row['活动标题'];
  if (!byTitle[title]) {
    byTitle[title] = [];
  }
  byTitle[title].push({
    rowNum: index + 2,
    number: row['活动编号'],
    title: title,
    category: row['分类'],
    time: row['时间']
  });
});

// 找出重复的标题
const duplicateTitles = [];
Object.keys(byTitle).forEach(title => {
  if (byTitle[title].length > 1) {
    duplicateTitles.push({
      title: title,
      count: byTitle[title].length,
      details: byTitle[title]
    });
  }
});

if (duplicateTitles.length > 0) {
  console.log(`❌ 发现 ${duplicateTitles.length} 个重复的活动标题:\n`);
  duplicateTitles.forEach(d => {
    console.log(`📌 "${d.title}" 重复 ${d.count} 次:`);
    d.details.forEach((row, i) => {
      console.log(`   [${i+1}] 第${row.rowNum}行 | 编号:${row.number} | 分类:${row.category} | 时间:${row.time}`);
    });
    console.log();
  });
} else {
  console.log('✅ 没有发现重复的活动标题\n');
}

// 2. 检查连续相同分类的块
console.log('━'.repeat(80));
console.log('📊 按分类统计活动数量:\n');

const byCategory = {};
data.forEach(row => {
  const cat = row['分类'];
  if (!byCategory[cat]) byCategory[cat] = [];
  byCategory[cat].push({
    number: row['活动编号'],
    title: row['活动标题']
  });
});

Object.keys(byCategory).sort().forEach(cat => {
  const items = byCategory[cat];
  console.log(`${cat}: ${items.length}个`);
  if (items.length > 10) {
    console.log(`  ⚠️  数量较多，可能需要检查`);
  }
});

// 3. 检查编号连续性
console.log('\n━'.repeat(80));
console.log('🔢 编号连续性检查:\n');

const numbers = data.map(row => parseInt(row['活动编号'])).sort((a, b) => a - b);
const missing = [];
for (let i = numbers[0]; i <= numbers[numbers.length - 1]; i++) {
  if (!numbers.includes(i)) {
    missing.push(i);
  }
}

if (missing.length > 0) {
  console.log(`⚠️  发现 ${missing.length} 个缺失的编号:`);
  console.log(`   ${missing.map(n => n.toString().padStart(4, '0')).join(', ')}`);
} else {
  console.log('✅ 编号连续，无缺失');
}

console.log(`\n当前编号范围: ${numbers[0].toString().padStart(4, '0')} - ${numbers[numbers.length-1].toString().padStart(4, '0')}`);

// 4. 总体统计
console.log('\n━'.repeat(80));
console.log('📋 总体统计:');
console.log(`   总行数: ${data.length}`);
console.log(`   唯一标题: ${Object.keys(byTitle).length}`);
console.log(`   分类数: ${Object.keys(byCategory).length}`);
console.log(`   编号范围: ${numbers[0]}-${numbers[numbers.length-1]}`);
