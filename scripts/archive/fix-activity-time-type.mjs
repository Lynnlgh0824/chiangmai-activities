#!/usr/bin/env node

/**
 * 修复活动的时间类型
 * - 将固定时间的活动标记为 flexibleTime: "否"
 * - 支持通过 ID 或活动编号精确修复
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('📊 开始修复活动时间类型...\n');

// 需要修复的活动列表（将 flexibleTime 改为 "否"）
const activitiesToFix = [
    '0061', // Riverside Bar & Restaurant - 固定音乐表演时间
    '0063', // Nap Gastrobar - 固定音乐表演时间
    // 可以添加更多：'0031', '0037', '0038'
];

let updateCount = 0;
const details = [];

items.forEach(item => {
    const id = item.id || item.activityNumber;

    if (activitiesToFix.includes(id)) {
        if (item.flexibleTime === '是') {
            const oldValue = item.flexibleTime;
            item.flexibleTime = '否';
            updateCount++;
            details.push({
                id: id,
                title: item.title,
                category: item.category,
                time: item.time,
                old: oldValue,
                new: '否'
            });
        }
    }
});

console.log('✅ 修复完成:\n');
console.log(`   修复数量: ${updateCount} 个活动\n`);

if (details.length > 0) {
    console.log('📝 修复详情:\n');
    details.forEach(detail => {
        console.log(`[${detail.id}] ${detail.title}`);
        console.log(`  分类: ${detail.category}`);
        console.log(`  时间: ${detail.time}`);
        console.log(`  灵活时间: ${detail.old} → ${detail.new}\n`);
    });
}

// 统计
const flexibleCount = items.filter(item => item.flexibleTime === '是').length;
console.log(`📊 最终统计:`);
console.log(`   总活动数: ${items.length}`);
console.log(`   灵活活动: ${flexibleCount}`);
console.log(`   固定时间活动: ${items.length - flexibleCount}`);

// 保存更新后的数据
fs.writeFileSync(itemsJsonPath, JSON.stringify(items, null, 2), 'utf-8');

console.log(`\n✅ 数据已保存到 items.json`);

// 自动导出 Excel
console.log(`\n📤 正在导出 Excel...`);
try {
    const { execSync } = require('child_process');
    execSync('npm run export-to-excel', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    console.log(`\n✅ Excel 已导出`);
} catch (error) {
    console.log(`\n⚠️ Excel 导出失败，请手动运行: npm run export-to-excel`);
}
