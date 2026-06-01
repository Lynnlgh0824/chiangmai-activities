#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const data = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('🔍 检查星期选择是否有重复...\n');

let duplicates = 0;
const toFix = [];

data.forEach(item => {
    if (!item.weekdays) return;

    const weekdays = Array.isArray(item.weekdays) ? item.weekdays : [item.weekdays];

    // 检查是否有重复的星期
    const uniqueWeekdays = [...new Set(weekdays)];

    if (weekdays.length !== uniqueWeekdays.length) {
        duplicates++;
        toFix.push({
            id: item.id || item.activityNumber,
            title: item.title,
            original: weekdays,
            fixed: uniqueWeekdays
        });
    }
});

if (toFix.length > 0) {
    console.log(`⚠️ 发现 ${toFix.length} 个活动有重复的星期选择:\n`);

    toFix.forEach(item => {
        console.log(`[${item.id}] ${item.title}`);
        console.log(`  原始: ${item.original.join(', ')}`);
        console.log(`  去重: ${item.fixed.join(', ')}\n`);
    });

    // 自动修复
    console.log('🔧 正在自动修复...\n');

    let fixCount = 0;
    data.forEach(item => {
        if (!item.weekdays) return;

        const weekdays = Array.isArray(item.weekdays) ? item.weekdays : [item.weekdays];
        const uniqueWeekdays = [...new Set(weekdays)];

        if (weekdays.length !== uniqueWeekdays.length) {
            item.weekdays = uniqueWeekdays;
            fixCount++;
        }
    });

    fs.writeFileSync(itemsJsonPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ 已修复 ${fixCount} 个活动`);
    console.log(`✅ 数据已保存到 items.json`);

} else {
    console.log('✅ 未发现重复的星期选择');
}
