#!/usr/bin/env node

/**
 * 清理重复活动并修正时间错误
 * 基于 MARKET_TIME_VERIFICATION_REPORT.md 的建议
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const itemsJsonPath = path.join(__dirname, '../data/items.json');
const backupPath = path.join(__dirname, '../data/items.json.backup-cleanup');

// 读取数据
const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log(`📊 原始数据: ${items.length} 个活动`);

// =====================================================
// 1. 删除重复活动
// =====================================================

const idsToDelete = [
  '0021', // 椰林集市（保留0028）
  '0047', // 艺术村集市（保留0030）
  '0048', // JING JAI 市集（保留0031）
  '0052', // 面包集市（保留0035）
  '0036', // 清迈跳蚤市集（nong ho flea market）（保留0053）
  '0055', // 瓦洛洛市场（保留0038）
];

const beforeDeleteCount = items.length;
const filteredItems = items.filter(item => !idsToDelete.includes(item.id));
const deletedCount = beforeDeleteCount - filteredItems.length;

console.log(`\n✅ 删除重复: ${deletedCount} 个活动`);
console.log(`   删除的ID: ${idsToDelete.join(', ')}`);

// =====================================================
// 2. 修正时间错误
// =====================================================

let timeFixCount = 0;

// 2.1 JJ市集周末版 (ID 0032): 06:30-22:00 → 06:00-14:00
const jjWeekend = filteredItems.find(item => item.id === '0032');
if (jjWeekend) {
  console.log(`\n⏰ 修正 JJ市集周末版 (ID 0032)`);
  console.log(`   时间: ${jjWeekend.time} → 06:00-14:00`);
  console.log(`   时长: ${jjWeekend.duration} → 8小时`);
  jjWeekend.time = '06:00-14:00';
  jjWeekend.duration = '8小时';
  timeFixCount++;
}

// 2.2 清迈大学前门夜市 (ID 0033): 10:00-23:00 → 17:00-23:00
const kadNaMor = filteredItems.find(item => item.id === '0033');
if (kadNaMor) {
  console.log(`\n⏰ 修正 清迈大学前门夜市 (ID 0033)`);
  console.log(`   时间: ${kadNaMor.time} → 17:00-23:00`);
  console.log(`   时长: ${kadNaMor.duration} → 6小时`);
  kadNaMor.time = '17:00-23:00';
  kadNaMor.duration = '6小时';
  timeFixCount++;
}

// 2.3 面包集市 (ID 0035): 07:00-16:00 → 07:00-11:00，周六日 → 仅周六
const breadMarket = filteredItems.find(item => item.id === '0035');
if (breadMarket) {
  console.log(`\n⏰ 修正 面包集市 (ID 0035)`);
  console.log(`   时间: ${breadMarket.time} → 07:00-11:00`);
  console.log(`   日期: ${breadMarket.weekdays.join(', ')} → 仅周六`);
  console.log(`   时长: ${breadMarket.duration} → 4小时`);
  console.log(`   描述: 添加"以法式面包闻名，必须尽早前往（售完即止）"`);
  breadMarket.time = '07:00-11:00';
  breadMarket.weekdays = ['周六'];
  breadMarket.duration = '4小时';
  breadMarket.description = '清迈Hang Dong区，Nana Jungle Cafe旁。以法式面包闻名，必须尽早前往（售完即止）';
  timeFixCount++;
}

// 2.4 瓦洛洛市场 (ID 0038): 08:00-17:00 → 06:00-19:00
const warorot = filteredItems.find(item => item.id === '0038');
if (warorot) {
  console.log(`\n⏰ 修正 瓦洛洛市场 (ID 0038)`);
  console.log(`   时间: ${warorot.time} → 06:00-19:00`);
  console.log(`   时长: ${warorot.duration} → 13小时`);
  warorot.time = '06:00-19:00';
  warorot.duration = '13小时';
  timeFixCount++;
}

console.log(`\n✅ 修正时间: ${timeFixCount} 个活动`);

// =====================================================
// 3. 重新排序 sortOrder
// =====================================================

console.log(`\n🔄 重新排序 sortOrder...`);
filteredItems.forEach((item, index) => {
  item.sortOrder = index + 1;
});

// =====================================================
// 4. 保存修改后的数据
// =====================================================

const outputPath = path.join(__dirname, '../data/items.json');
fs.writeFileSync(outputPath, JSON.stringify(filteredItems, null, 2), 'utf-8');

console.log(`\n✅ 数据已保存到 ${outputPath}`);
console.log(`\n📊 最终统计:`);
console.log(`   原始数量: ${beforeDeleteCount}`);
console.log(`   删除重复: -${deletedCount}`);
console.log(`   最终数量: ${filteredItems.length}`);
console.log(`   修正时间: ${timeFixCount} 个`);

console.log(`\n✅ 修改完成！`);
