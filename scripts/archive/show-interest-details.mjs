import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('📅 兴趣班Tab 详细内容 (固定时间，排除市集和灵活时间)\n');

// 兴趣班筛选逻辑
const interestFixed = items.filter(item => {
    if (item.category === '市集') return false;
    if (item.flexibleTime === '是' || item.time === '灵活时间') return false;
    return true;
});

console.log(`✅ 兴趣班Tab显示 ${interestFixed.length} 个活动:\n`);

// 按分类统计
const byCategory = {};
interestFixed.forEach(item => {
    if (!byCategory[item.category]) {
        byCategory[item.category] = [];
    }
    byCategory[item.category].push(item.title);
});

Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length).forEach(([cat, titles]) => {
    console.log(`📌 ${cat} (${titles.length}个):`);
    titles.forEach(title => {
        console.log(`   - ${title}`);
    });
    console.log('');
});

// 对比：所有兴趣班类别的活动（包括灵活时间）
console.log('\n❌ 以下灵活时间活动不在兴趣班Tab中显示:');
const flexible = items.filter(item => item.flexibleTime === '是' || item.time === '灵活时间');
const flexibleInterest = flexible.filter(item => item.category !== '市集');

flexibleInterest.forEach(item => {
    console.log(`   - ${item.title} (${item.category}) - ${item.time}`);
});
