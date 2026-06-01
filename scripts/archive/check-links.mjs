#!/usr/bin/env node

import data from '../data/items.json' with { type: 'json' };

console.log('📊 有链接的活动统计\n');

const withLinks = data.filter(item => {
    const url = item.url || item.source?.url || '';
    return url && url !== '#' && url.trim() !== '';
});

console.log('总数:', withLinks.length, '个\n');

// 按分类统计
const byCategory = {};
withLinks.forEach(item => {
    if (!byCategory[item.category]) {
        byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
});

Object.keys(byCategory).sort().forEach(cat => {
    console.log(`${cat}: ${byCategory[cat].length}个`);
});

console.log('\n示例（前5个）:\n');
withLinks.slice(0, 5).forEach(item => {
    console.log(`[${item.activityNumber}] ${item.title}`);
    console.log(`  分类: ${item.category}`);
    console.log(`  链接: ${item.url || item.source?.url || '无'}`);
    console.log('');
});
