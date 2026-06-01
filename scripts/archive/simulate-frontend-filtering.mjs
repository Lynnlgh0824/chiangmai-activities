import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('🔍 模拟完整的前端筛选流程\n');
console.log('Step 1: API返回原始数据', items.length, '个活动\n');

// 模拟前端数据展开过程（为每个星期创建副本）
function parseDaysFromWeekdays(weekdays) {
    if (!weekdays || !Array.isArray(weekdays)) return [];
    return weekdays.filter(w => w.day !== null && w.day !== undefined).map(w => w.day);
}

let allActivities = [];
items.forEach(item => {
    const days = parseDaysFromWeekdays(item.weekdays);

    if (days && days.length > 0) {
        days.forEach(day => {
            allActivities.push({
                id: item.id || item._id,
                originalId: item.id || item._id,
                title: item.title,
                category: item.category,
                price: item.price,
                location: item.location,
                time: item.time,
                description: item.description,
                day: day,
                frequency: item.frequency || 'weekly',
                source: item.source || null,
                flexibleTime: item.flexibleTime || '否'
            });
        });
    } else {
        allActivities.push({
            id: item.id || item._id,
            originalId: item.id || item._id,
            title: item.title,
            category: item.category,
            price: item.price,
            location: item.location,
            time: item.time,
            description: item.description,
            day: null,
            frequency: 'once',
            source: item.source || null,
            flexibleTime: item.flexibleTime || '否'
        });
    }
});

console.log('Step 2: 数据展开后（为多个星期创建副本）', allActivities.length, '个活动记录\n');

// 模拟 Tab 0: 兴趣班（排除市集和灵活时间）
const tab0Filtered = allActivities.filter(a => {
    if (a.category === '市集') return false;
    if (a.flexibleTime === '是' || a.time === '灵活时间') return false;
    return true;
});

// 模拟 Tab 1: 市集
const tab1Filtered = allActivities.filter(a => a.category === '市集');

console.log('Step 3: Tab筛选结果:');
console.log('  📅 Tab 0 兴趣班（固定时间）:', tab0Filtered.length, '个活动记录');
console.log('  📋 Tab 1 市集:', tab1Filtered.length, '个活动记录');

// 去重统计（按 originalId）
const uniqueTab0 = new Set(tab0Filtered.map(a => a.originalId));
const uniqueTab1 = new Set(tab1Filtered.map(a => a.originalId));

console.log('\nStep 4: 去重后的唯一活动数:');
console.log('  📅 Tab 0 兴趣班唯一活动:', uniqueTab0.size, '个');
console.log('  📋 Tab 1 市集唯一活动:', uniqueTab1.size, '个');

// 检查重叠
const overlap = [...uniqueTab0].filter(id => uniqueTab1.has(id));
console.log('\nStep 5: 互斥检查:');
console.log('  兴趣班和市集的重叠活动:', overlap.length, '个');
if (overlap.length > 0) {
    console.log('  ⚠️ 发现重叠:', overlap);
} else {
    console.log('  ✅ 完全互斥！');
}

// 检查是否在兴趣班中发现了市集活动
const marketsInTab0 = tab0Filtered.filter(a => a.category === '市集');
console.log('\nStep 6: 兴趣班Tab中包含市集活动:', marketsInTab0.length, '个');
if (marketsInTab0.length > 0) {
    console.log('  ⚠️ 错误！发现市集活动:');
    marketsInTab0.forEach(m => console.log('    -', m.title));
} else {
    console.log('  ✅ 正确！没有市集活动');
}

// 检查灵活时间活动
const flexibleInTab0 = tab0Filtered.filter(a => a.flexibleTime === '是' || a.time === '灵活时间');
console.log('\nStep 7: 兴趣班Tab中包含灵活时间活动:', flexibleInTab0.length, '个');
if (flexibleInTab0.length > 0) {
    console.log('  ⚠️ 错误！发现灵活时间活动:');
    flexibleInTab0.forEach(f => console.log('    -', f.title, '(', f.category, ')'));
} else {
    console.log('  ✅ 正确！没有灵活时间活动');
}

console.log('\n✅ 前端筛选模拟完成');
