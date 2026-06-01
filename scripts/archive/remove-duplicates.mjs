#!/usr/bin/env node

import XLSX from 'xlsx';
import fs from 'fs';

console.log('🧹 清理Excel重复数据...\n');

// 1. 读取Excel
const workbook = XLSX.readFile('清迈活动数据.xlsx');
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`📊 原始数据: ${data.length} 行`);

// 2. 按活动标题分组
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
    data: row
  });
});

// 3. 找出重复的，并保留编号较小的
const toRemove = [];
const toKeep = [];

Object.keys(byTitle).forEach(title => {
  const items = byTitle[title];

  if (items.length > 1) {
    // 重复了！按编号排序，保留较小的
    items.sort((a, b) => parseInt(a.number) - parseInt(b.number));

    console.log(`\n📌 "${title}" 重复 ${items.length} 次:`);
    items.forEach((item, i) => {
      if (i === 0) {
        console.log(`   ✓ 保留: 第${item.rowNum}行 | 编号 ${item.number}`);
        toKeep.push(item.data);
      } else {
        console.log(`   ✗ 删除: 第${item.rowNum}行 | 编号 ${item.number}`);
        toRemove.push(item);
      }
    });
  } else {
    // 没重复
    toKeep.push(items[0].data);
  }
});

// 4. 汇总
console.log('\n━'.repeat(80));
console.log(`\n📋 清理统计:`);
console.log(`   原始行数: ${data.length}`);
console.log(`   重复活动: ${toRemove.length}`);
console.log(`   保留行数: ${toKeep.length}`);
console.log(`   减少行数: ${toRemove.length}`);

// 5. 创建备份
const backupName = `backup-before-cleanup-${Date.now()}.xlsx`;
console.log(`\n💾 创建备份: ${backupName}`);
XLSX.writeFile(workbook, backupName);

// 6. 写入清理后的数据
console.log(`\n✅ 写入清理后的数据...`);
const newSheet = XLSX.utils.json_to_sheet(toKeep);
workbook.Sheets[sheetName] = newSheet;
XLSX.writeFile(workbook, '清迈活动数据.xlsx');

console.log(`\n✨ 清理完成！`);
console.log(`\n💡 下一步: npm run import-excel:smart`);
