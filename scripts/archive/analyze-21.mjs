import fs from 'fs';
const items = JSON.parse(fs.readFileSync('./data/items.json', 'utf-8'));

console.log('📅 兴趣班 (固定时间，排除市集和灵活时间) - 详细分析\n');

// 使用原来的正确逻辑：排除法
const interestFixed = items.filter(item => {
    if (item.category === '市集') return false;
    if (item.flexibleTime === '是' || item.time === '灵活时间') return false;
    return true;
});

console.log('总共:', interestFixed.length, '个\n');

// 按分类统计
const byCat = {};
interestFixed.forEach(item => {
    if (!byCat[item.category]) byCat[item.category] = [];
    byCat[item.category].push(item);
});

console.log('按分类统计:');
Object.entries(byCat).sort((a,b) => b[1].length - a[1].length).forEach(([cat, items]) => {
    console.log(`  ${cat}: ${items.length}个`);
    items.slice(0, 3).forEach(item => {
        console.log(`    - ${item.title}`);
    });
    if (items.length > 3) {
        console.log(`    ... 还有 ${items.length - 3} 个`);
    }
});

console.log('\n所有分类:', Object.keys(byCat).sort());

// 对比白名单方式
console.log('\n❓ 对比分析:');
const interestCategories = ['瑜伽', '冥想', '舞蹈', '泰拳', '音乐', '文化艺术', '健身'];
const whitelist = interestFixed.filter(item => interestCategories.includes(item.category));
const nonWhitelist = interestFixed.filter(item => !interestCategories.includes(item.category));

console.log(`白名单内的分类 (${interestCategories.join(', ')}): ${whitelist.length}个`);
if (nonWhitelist.length > 0) {
    console.log(`不在白名单但显示在兴趣班: ${nonWhitelist.length}个`);
    nonWhitelist.forEach(item => {
        console.log(`  - ${item.title} (${item.category})`);
    });
} else {
    console.log('✅ 所有兴趣班活动都在白名单内');
}
