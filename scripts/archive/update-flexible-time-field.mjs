#!/usr/bin/env node

/**
 * 更新所有活动的灵活时间字段
 * - 如果time字段为空、undefined或"灵活时间"，则flexibleTime设为"是"
 * - 否则设为"否"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('📊 开始更新灵活时间字段...\n');
console.log(`原始数据: ${items.length} 个活动\n`);

let updateCount = 0;
const details = [];

items.forEach(item => {
    const originalFlexibleTime = item.flexibleTime;
    let newFlexibleTime;

    // 判断是否为灵活时间
    if (!item.time || item.time === '灵活时间' || item.time === '' || item.time.trim() === '') {
        newFlexibleTime = '是';
    } else if (item.time && item.time.includes('灵活')) {
        newFlexibleTime = '是';
    } else {
        newFlexibleTime = '否';
    }

    // 更新字段
    if (item.flexibleTime !== newFlexibleTime) {
        item.flexibleTime = newFlexibleTime;
        updateCount++;
        details.push({
            id: item.id || item.activityNumber,
            title: item.title,
            time: item.time || '未设置',
            old: originalFlexibleTime || '未设置',
            new: newFlexibleTime
        });
    }
});

console.log('✅ 更新完成:\n');
console.log(`   更新数量: ${updateCount} 个活动\n`);

if (details.length > 0) {
    console.log('📝 更新详情:\n');
    details.forEach(detail => {
        console.log(`[${detail.id}] ${detail.title}`);
        console.log(`  时间: ${detail.time}`);
        console.log(`  灵活时间: ${detail.old} → ${detail.new}\n`);
    });
}

// 统计
const flexibleCount = items.filter(item => item.flexibleTime === '是').length;
console.log(`📊 最终统计:`);
console.log(`   总活动数: ${items.length}`);
console.log(`   灵活时间活动: ${flexibleCount}`);
console.log(`   固定时间活动: ${items.length - flexibleCount}`);

// 保存更新后的数据
fs.writeFileSync(itemsJsonPath, JSON.stringify(items, null, 2), 'utf-8');

console.log(`\n✅ 数据已保存到 items.json`);
console.log(`\n💡 下一步: 运行以下命令导出Excel`);
console.log(`   npm run export-to-excel`);
