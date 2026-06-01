import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('🔍 检查数据结构中的字段\n');

// 检查每个活动的关键字段
const issues = [];
items.forEach((item, index) => {
    const id = item.id || item._id;
    const title = item.title;
    const category = item.category;
    const flexibleTime = item.flexibleTime;
    const time = item.time;

    // 检查市集
    if (category === '市集') {
        if (flexibleTime === '是' || time === '灵活时间') {
            issues.push({
                index,
                id,
                title,
                issue: '市集活动是灵活时间（应该都是固定时间）',
                category,
                flexibleTime,
                time
            });
        }
    }

    // 检查是否有缺失字段
    if (!flexibleTime) {
        issues.push({
            index,
            id,
            title,
            issue: '缺少 flexibleTime 字段',
            category
        });
    }
});

if (issues.length > 0) {
    console.log('⚠️ 发现', issues.length, '个问题:\n');
    issues.forEach(issue => {
        console.log(`活动 ${issue.index + 1}: ${issue.title}`);
        console.log(`  ID: ${issue.id}`);
        console.log(`  问题: ${issue.issue}`);
        console.log(`  分类: ${issue.category}`);
        if (issue.flexibleTime !== undefined) console.log(`  flexibleTime: ${issue.flexibleTime}`);
        if (issue.time !== undefined) console.log(`  time: ${issue.time}`);
        console.log('');
    });
} else {
    console.log('✅ 所有活动数据结构正常！\n');
}

// 统计各分类的灵活时间活动
console.log('📊 灵活时间活动统计:');
const flexibleItems = items.filter(item => item.flexibleTime === '是' || item.time === '灵活时间');
const byCategory = {};
flexibleItems.forEach(item => {
    if (!byCategory[item.category]) {
        byCategory[item.category] = [];
    }
    byCategory[item.category].push(item.title);
});

Object.entries(byCategory).forEach(([cat, titles]) => {
    console.log(`\n${cat} (${titles.length}个):`);
    titles.forEach(title => console.log(`  - ${title}`));
});
