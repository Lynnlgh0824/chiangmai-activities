#!/usr/bin/env node

/**
 * 更新灵活时间字段 - 版本2
 * 判断标准：
 * 1. time为空或"灵活时间" → 灵活活动
 * 2. 时间跨度≥12小时 → 灵活活动（如06:00-22:00）
 * 3. 时间跨度≥10小时且覆盖全天 → 灵活活动（如08:00-20:00）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('📊 开始更新灵活时间字段 (v2)...\n');
console.log(`原始数据: ${items.length} 个活动\n`);

// 判断时间跨度（小时）
function getTimeSpan(timeStr) {
    if (!timeStr || !timeStr.includes('-')) return 0;

    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*[-~—至到]\s*(\d{1,2}):(\d{2})/);
    if (!match) return 0;

    const [, startHour, startMin, endHour, endMin] = match;
    const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
    let endMinutes = parseInt(endHour) * 60 + parseInt(endMin);

    // 处理跨天的情况（如23:00-02:00）
    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60; // 加一天
    }

    return (endMinutes - startMinutes) / 60; // 返回小时数
}

let updateCount = 0;
const details = [];

items.forEach(item => {
    const originalFlexibleTime = item.flexibleTime;
    let newFlexibleTime;
    let reason = '';

    // 判断是否为灵活时间
    if (!item.time || item.time === '灵活时间' || item.time === '' || item.time.trim() === '') {
        newFlexibleTime = '是';
        reason = '时间字段为空';
    } else if (item.time && item.time.includes('灵活')) {
        newFlexibleTime = '是';
        reason = '时间字段包含"灵活"';
    } else {
        // 检查时间跨度
        const timeSpan = getTimeSpan(item.time);
        if (timeSpan >= 12) {
            newFlexibleTime = '是';
            reason = `时间跨度≥12小时 (${timeSpan.toFixed(1)}小时)`;
        } else if (timeSpan >= 10) {
            newFlexibleTime = '是';
            reason = `时间跨度≥10小时 (${timeSpan.toFixed(1)}小时)`;
        } else {
            newFlexibleTime = '否';
            reason = `固定时间 (${timeSpan.toFixed(1)}小时)`;
        }
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
            new: newFlexibleTime,
            reason: reason
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
        console.log(`  灵活时间: ${detail.old} → ${detail.new}`);
        console.log(`  原因: ${detail.reason}\n`);
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
console.log(`\n💡 下一步: 运行以下命令导出Excel`);
console.log(`   npm run export-to-excel`);
