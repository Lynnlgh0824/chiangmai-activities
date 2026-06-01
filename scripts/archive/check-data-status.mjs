#!/usr/bin/env node

import fs from 'fs';
import XLSX from 'xlsx';

console.log('📊 检查数据状态...\n');

// 1. 检查数据库
try {
  const dbData = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));
  console.log(`✅ 数据库: ${dbData.length} 个活动`);

  // 显示前5个
  console.log('\n前5个活动:');
  dbData.slice(0, 5).forEach(item => {
    console.log(`  ${item.activityNumber} - ${item.title}`);
  });
} catch (error) {
  console.log('❌ 数据库读取失败:', error.message);
}

console.log('\n' + '━'.repeat(60));

// 2. 检查Excel
try {
  const workbook = XLSX.readFile('清迈活动数据.xlsx');
  const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  console.log(`\n✅ Excel: ${excelData.length} 行数据`);

  // 显示前5个
  console.log('\n前5行:');
  excelData.slice(0, 5).forEach(row => {
    console.log(`  ${row['活动编号']} - ${row['活动标题']}`);
  });
} catch (error) {
  console.log('❌ Excel读取失败:', error.message);
}

console.log('\n' + '━'.repeat(60));

// 3. 检查最新快照
const snapshotsDir = 'snapshots';
if (fs.existsSync(snapshotsDir)) {
  const snapshots = fs.readdirSync(snapshotsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  if (snapshots.length > 0) {
    const latestSnapshot = snapshots[0];
    console.log(`\n📸 最新快照: ${latestSnapshot}`);

    const snapshotData = JSON.parse(fs.readFileSync(`${snapshotsDir}/${latestSnapshot}`, 'utf8'));
    console.log(`   快照活动数: ${snapshotData.length}`);
  }
}

// 4. 检查备份
console.log('\n' + '━'.repeat(60));
const backupsDir = 'backups';
if (fs.existsSync(backupsDir)) {
  const backups = fs.readdirSync(backupsDir)
    .filter(f => f.endsWith('.xlsx'))
    .sort()
    .reverse()
    .slice(0, 5);

  if (backups.length > 0) {
    console.log('\n最近的Excel备份:');
    backups.forEach(backup => {
      console.log(`  - ${backup}`);
    });
  }
}
