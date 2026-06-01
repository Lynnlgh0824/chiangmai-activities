import fs from 'fs';
const items = JSON.parse(fs.readFileSync('./data/items.json', 'utf-8'));

console.log('✅ 验证修复后的效果\n');

// 使用排除法（原来的正确逻辑）
const tab0 = items.filter(item => {
    if (item.category === '市集') return false;
    if (item.flexibleTime === '是' || item.time === '灵活时间') return false;
    return true;
});

const tab1 = items.filter(item => item.category === '市集');
const tab2 = items.filter(item => item.flexibleTime === '是' || item.time === '灵活时间');

console.log('📊 Tab分布（修复后）:');
console.log('  📅 兴趣班（固定时间，排除市集）:', tab0.length, '个');
console.log('  📋 市集:', tab1.length, '个');
console.log('  ⏰ 灵活时间活动:', tab2.length, '个');
console.log('  合计:', tab0.length + tab1.length + tab2.length, '个');
console.log('  总数据:', items.length, '个');

// 详细分类
console.log('\n📅 兴趣班详细分类:');
const byCat = {};
tab0.forEach(item => {
    if (!byCat[item.category]) byCat[item.category] = [];
    byCat[item.category].push(item);
});
Object.entries(byCat).sort((a,b) => b[1].length - a[1].length).forEach(([cat, items]) => {
    console.log(`  ${cat}: ${items.length}个`);
    if (items.length <= 3) {
        items.forEach(item => console.log(`    - ${item.title}`));
    } else {
        items.slice(0, 2).forEach(item => console.log(`    - ${item.title}`));
        console.log(`    ... 还有 ${items.length - 2} 个`);
    }
});

// 检查咏春拳
const wingChun = tab0.find(item => item.title.includes('咏春'));
console.log('\n❓ 检查关键活动:');
console.log('  咏春拳:', wingChun ? `✅ 存在 (${wingChun.category}, ${wingChun.time})` : '❌ 缺失');

// 检查互斥
const tab0Ids = new Set(tab0.map(i => i.id || i._id));
const tab1Ids = new Set(tab1.map(i => i.id || i._id));
const overlap = [...tab0Ids].filter(id => tab1Ids.has(id));

console.log('\n❓ 数据互斥检查:');
console.log('  兴趣班 ∩ 市集:', overlap.length, '个');
console.log('  ', overlap.length === 0 ? '✅ 完全互斥' : '⚠️ 有重叠');

console.log('\n✅ 验证完成');
console.log('\n💡 现在请刷新浏览器（Ctrl+Shift+R）查看效果！');
