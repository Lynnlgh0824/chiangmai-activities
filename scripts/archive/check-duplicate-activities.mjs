#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const data = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('🔍 查找重复的活动...\n');

// 检查完全重复的活动（标题+分类+地点+时间都相同）
const duplicates = [];
const seen = new Map();

data.forEach(item => {
    const key = `${item.title}|${item.category}|${item.location}|${item.time}`;

    if (seen.has(key)) {
        duplicates.push({
            id: item.id || item.activityNumber,
            title: item.title,
            category: item.category,
            location: item.location,
            time: item.time,
            weekdays: item.weekdays
        });
    } else {
        seen.set(key, item);
    }
});

if (duplicates.length > 0) {
    console.log(`⚠️ 发现 ${duplicates.length} 个重复活动:\n`);
    duplicates.forEach(dup => {
        console.log(`[${dup.id}] ${dup.title}`);
        console.log(`  分类: ${dup.category}`);
        console.log(`  地点: ${dup.location}`);
        console.log(`  时间: ${dup.time}`);
        console.log(`  星期: ${Array.isArray(dup.weekdays) ? dup.weekdays.join(', ') : dup.weekdays}\n`);
    });
} else {
    console.log('✅ 未发现完全重复的活动');
}

// 检查是否有相似的活动（相同标题和时间）
console.log('\n📊 检查相似活动（相同标题）:\n');
const titleMap = new Map();

data.forEach(item => {
    if (!titleMap.has(item.title)) {
        titleMap.set(item.title, []);
    }
    titleMap.get(item.title).push(item);
});

let similarCount = 0;
titleMap.forEach((items, title) => {
    if (items.length > 1) {
        similarCount++;
        console.log(`${title} (${items.length}个):`);
        items.forEach(item => {
            const weekdays = Array.isArray(item.weekdays) ? item.weekdays.join(', ') : item.weekdays;
            console.log(`  [${item.id || item.activityNumber}] ${item.time} - ${weekdays}`);
        });
        console.log('');
    }
});

if (similarCount === 0) {
    console.log('✅ 未发现相似活动');
} else {
    console.log(`⚠️ 发现 ${similarCount} 组相似活动`);
}
