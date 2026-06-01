#!/usr/bin/env node

import data from '../data/items.json' with { type: 'json' };

// 时间格式判断函数
function isSpecificTimeFormat(time) {
    if (!time || typeof time !== 'string') return false;
    const timePattern = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}/;
    return timePattern.test(time);
}

const flexibleActivities = data.filter(item => {
    const time = item.time || '';
    return !isSpecificTimeFormat(time);
});

console.log('🔍 灵活时间活动统计\n');
console.log('总计:', flexibleActivities.length, '个活动\n');

flexibleActivities.slice(0, 15).forEach(item => {
    console.log('[' + item.activityNumber + '] ' + item.title);
    console.log('  分类：' + item.category);
    console.log('  时间：' + (item.time || '空'));
    console.log('');
});
