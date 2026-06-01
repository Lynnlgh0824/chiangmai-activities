import fs from 'fs';
const items = JSON.parse(fs.readFileSync('./data/items.json', 'utf-8'));

console.log('🔍 验证修复后的Tab逻辑\n');

// 兴趣班白名单
const interestCategories = ['瑜伽', '冥想', '舞蹈', '泰拳', '音乐', '文化艺术', '健身'];

// Tab 0: 兴趣班（白名单 + 固定时间）
const tab0 = items.filter(item => {
    if (!interestCategories.includes(item.category)) return false;
    if (item.flexibleTime === '是' || item.time === '灵活时间') return false;
    return true;
});

// Tab 1: 市集
const tab1 = items.filter(item => item.category === '市集');

// Tab 2: 灵活时间
const tab2 = items.filter(item => item.flexibleTime === '是' || item.time === '灵活时间');

console.log('📅 Tab 0 兴趣班（固定时间）:', tab0.length, '个');
console.log('📋 Tab 1 市集:', tab1.length, '个');
console.log('⏰ Tab 2 灵活时间活动:', tab2.length, '个');

// 详细分类
console.log('\n📅 兴趣班详细分类:');
const byCat = {};
tab0.forEach(item => {
    if (!byCat[item.category]) byCat[item.category] = [];
    byCat[item.category].push(item);
});
Object.entries(byCat).sort((a,b) => b[1].length - a[1].length).forEach(([cat, items]) => {
    console.log(`  ${cat}: ${items.length}个`);
});

// 检查互斥
const tab0Ids = new Set(tab0.map(i => i.id || i._id));
const tab1Ids = new Set(tab1.map(i => i.id || i._id));
const overlap01 = [...tab0Ids].filter(id => tab1Ids.has(id));

console.log('\n❓ 数据互斥检查:');
console.log('  兴趣班 ∩ 市集:', overlap01.length, '个');
console.log('  ', overlap01.length === 0 ? '✅ 完全互斥' : '⚠️ 有重叠');

console.log('\n✅ 验证完成');
