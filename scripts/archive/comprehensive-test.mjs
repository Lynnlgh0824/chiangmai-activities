import fs from 'fs';

console.log('========================================');
console.log('   全面测试前端Tab筛选逻辑');
console.log('========================================\n');

const items = JSON.parse(fs.readFileSync('./data/items.json', 'utf-8'));

console.log('📦 总数据:', items.length, '个活动\n');

// ============ Tab 0: 兴趣班（排除法） ============
console.log('📅 Tab 0: 兴趣班（排除市集+排除灵活时间）');
const tab0 = items.filter(item => {
    if (item.category === '市集') return false;
    if (item.flexibleTime === '是' || item.time === '灵活时间') return false;
    return true;
});
console.log('   筛选结果:', tab0.length, '个活动\n');

// 按分类统计
const byCat = {};
tab0.forEach(item => {
    byCat[item.category] = (byCat[item.category] || 0) + 1;
});
console.log('   详细分类:');
Object.entries(byCat).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`     ${cat}: ${count}个`);
});

// 检查咏春拳
const wingChun = tab0.find(item => item.title.includes('咏春'));
console.log('\n   ✅ 咏春拳:', wingChun ? `存在 (${wingChun.category}, ${wingChun.time})` : '❌ 缺失');

// ============ Tab 1: 市集 ============
console.log('\n📋 Tab 1: 市集');
const tab1 = items.filter(item => item.category === '市集');
console.log('   筛选结果:', tab1.length, '个活动');

// ============ Tab 2: 灵活时间 ============
console.log('\n⏰ Tab 2: 灵活时间活动');
const tab2 = items.filter(item => item.flexibleTime === '是' || item.time === '灵活时间');
console.log('   筛选结果:', tab2.length, '个活动');
const byCat2 = {};
tab2.forEach(item => {
    byCat2[item.category] = (byCat2[item.category] || 0) + 1;
});
console.log('   详细分类:');
Object.entries(byCat2).forEach(([cat, count]) => {
    console.log(`     ${cat}: ${count}个`);
});

// ============ Tab 3: 活动网站 ============
console.log('\n🏪 Tab 3: 活动网站');
const tab3 = items.filter(item => item.source && item.source.url && item.source.url.length > 0);
console.log('   筛选结果:', tab3.length, '个活动');
// 去重
const uniqueTab3 = new Set(tab3.map(i => i.id || i._id));
console.log('   去重后:', uniqueTab3.size, '个唯一活动');

// ============ 数据互斥检查 ============
console.log('\n========================================');
console.log('   数据互斥验证');
console.log('========================================\n');

const tab0Ids = new Set(tab0.map(i => i.id || i._id));
const tab1Ids = new Set(tab1.map(i => i.id || i._id));
const tab2Ids = new Set(tab2.map(i => i.id || i._id));

const overlap01 = [...tab0Ids].filter(id => tab1Ids.has(id));
const overlap02 = [...tab0Ids].filter(id => tab2Ids.has(id));
const overlap12 = [...tab1Ids].filter(id => tab2Ids.has(id));

console.log('   兴趣班 ∩ 市集:', overlap01.length, '个');
console.log('   兴趣班 ∩ 灵活时间:', overlap02.length, '个');
console.log('   市集 ∩ 灵活时间:', overlap12.length, '个');

if (overlap01.length === 0 && overlap02.length === 0 && overlap12.length === 0) {
    console.log('\n   ✅ 所有Tab完全互斥，数据隔离完美！');
} else {
    console.log('\n   ❌ 发现数据重叠！');
    if (overlap01.length > 0) console.log('      兴趣班与市集重叠:', overlap01);
    if (overlap02.length > 0) console.log('      兴趣班与灵活时间重叠:', overlap02);
    if (overlap12.length > 0) console.log('      市集与灵活时间重叠:', overlap12);
}

// ============ 总计验证 ============
console.log('\n========================================');
console.log('   总计验证');
console.log('========================================\n');
console.log('   Tab 0 兴趣班:', tab0.length, '个');
console.log('   Tab 1 市集:', tab1.length, '个');
console.log('   Tab 2 灵活时间:', tab2.length, '个');
console.log('   Tab 3 活动网站:', uniqueTab3.size, '个（去重后）');
console.log('   Tab 4 攻略信息: 1 页');
console.log('   ─────────────────────────────────');
console.log('   总数据:', items.length, '个');

if (tab0.length + tab1.length + tab2.length === items.length) {
    console.log('\n   ✅ Tab 0+1+2 = 总数据，验证通过！');
} else {
    console.log('\n   ❌ Tab 0+1+2 ≠ 总数据，有问题！');
    console.log('      差异:', Math.abs((tab0.length + tab1.length + tab2.length) - items.length), '个');
}

// ============ 前端代码检查 ============
console.log('\n========================================');
console.log('   前端代码检查');
console.log('========================================\n');

const indexHtml = fs.readFileSync('./index.html', 'utf-8');

console.log('   检查筛选逻辑...');
const hasExclusionLogic = indexHtml.includes('排除市集') && indexHtml.includes('排除灵活时间');
const hasCase0 = indexHtml.includes('case 0:') && indexHtml.includes('兴趣班');

console.log('   ✅ 包含排除法逻辑:', hasExclusionLogic ? '是' : '❌ 否');
console.log('   ✅ 包含Tab 0逻辑:', hasCase0 ? '是' : '❌ 否');

console.log('\n========================================');
console.log('   测试完成！');
console.log('========================================\n');
