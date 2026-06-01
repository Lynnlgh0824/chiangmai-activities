#!/usr/bin/env node

import XLSX from 'xlsx';

console.log('🔍 分析Excel重复数据...\n');

const workbook = XLSX.readFile('清迈活动数据.xlsx');
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

// 按活动编号分组
const byNumber = {};
data.forEach((row, index) => {
  const num = row['活动编号'];
  if (!byNumber[num]) {
    byNumber[num] = [];
  }
  byNumber[num].push({
    index: index + 2, // Excel行号（从1开始，加上标题行）
    title: row['活动标题'],
    category: row['分类'],
    location: row['地点'],
    time: row['时间']
  });
});

// 找出重复的编号
const duplicates = [];
Object.keys(byNumber).forEach(num => {
  if (byNumber[num].length > 1) {
    duplicates.push({
      number: num,
      count: byNumber[num].length,
      details: byNumber[num]
    });
  }
});

if (duplicates.length > 0) {
  console.log(`❌ 发现 ${duplicates.length} 个重复的活动编号:\n`);
  console.log('━'.repeat(80));

  duplicates.forEach(d => {
    console.log(`\n📍 活动编号 "${d.number}" 重复 ${d.count} 次:`);
    d.details.forEach((row, i) => {
      console.log(`   [${i + 1}] 第${row.index}行: ${row.title}`);
      console.log(`       分类: ${row.category} | 地点: ${row.location}`);
      console.log(`       时间: ${row.time}`);
      console.log();
    });
  });

  console.log('━'.repeat(80));
  console.log(`\n⚠️  问题总结:`);
  console.log(`   - 重复编号数量: ${duplicates.length}`);
  console.log(`   - 涉及行数: ${duplicates.reduce((sum, d) => sum + d.count, 0)}`);
  console.log(`   - 应该保留行数: ${duplicates.length}`);

  console.log(`\n💡 建议:`);
  console.log(`   1. 手动检查Excel中的重复行`);
  console.log(`   2. 删除重复的行，只保留一条记录`);
  console.log(`   3. 确保每个活动编号只出现一次`);

} else {
  console.log('✅ 没有发现重复的活动编号');
}

// 显示总体统计
console.log(`\n\n📊 数据统计:`);
console.log(`   总行数: ${data.length}`);
console.log(`   唯一活动编号: ${Object.keys(byNumber).length}`);
console.log(`   重复编号数: ${duplicates.length}`);

if (duplicates.length > 0) {
  console.log(`\n   重复编号列表:`);
  duplicates.forEach(d => {
    console.log(`     - ${d.number} (${d.count}次)`);
  });
}
