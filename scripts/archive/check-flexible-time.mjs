#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const data = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

// 检查灵活时间的活动
const flexibleActivities = data.filter(item =>
  item.time === '灵活时间' || item.flexibleTime === '是' || !item.time
);

console.log('📊 当前灵活时间活动统计:');
console.log(`总数: ${flexibleActivities.length} 个\n`);

if (flexibleActivities.length > 0) {
  console.log('前10个灵活时间活动:\n');
  flexibleActivities.slice(0, 10).forEach(item => {
    console.log(`[${item.id || item.activityNumber}] ${item.title}`);
    console.log(`  时间: ${item.time || '未设置'}`);
    console.log(`  灵活时间: ${item.flexibleTime || '未设置'}`);
    console.log(`  分类: ${item.category || '未设置'}\n`);
  });
}

// 统计有多少活动缺少flexibleTime字段
const missingField = data.filter(item => !item.flexibleTime);
console.log(`\n📋 统计:`);
console.log(`  总活动数: ${data.length}`);
console.log(`  灵活时间活动: ${flexibleActivities.length}`);
console.log(`  缺少flexibleTime字段: ${missingField.length}`);
