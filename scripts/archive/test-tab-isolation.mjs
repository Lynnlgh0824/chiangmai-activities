import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('🔍 模拟前端筛选逻辑（兴趣班 vs 市集）\n');
console.log('原始数据总数:', items.length);

// 模拟 Tab 0: 兴趣班（排除市集和灵活时间）
const tab0 = items.filter(item => {
    if (item.category === '市集') return false;
    if (item.flexibleTime === '是' || item.time === '灵活时间') return false;
    return true;
});

// 模拟 Tab 1: 市集
const tab1 = items.filter(item => item.category === '市集');

console.log('\n📅 Tab 0 兴趣班（固定时间，排除市集）:', tab0.length, '个');
console.log('📋 Tab 1 市集:', tab1.length, '个');

// 检查重叠
const tab0Ids = new Set(tab0.map(i => i.id || i._id));
const tab1Ids = new Set(tab1.map(i => i.id || i._id));

const overlap = [...tab0Ids].filter(id => tab1Ids.has(id));
console.log('\n❓ 数据互斥检查:');
console.log('   兴趣班和市集的重叠活动数:', overlap.length);

if (overlap.length > 0) {
    console.log('   ⚠️ 发现重叠活动ID:', overlap);
} else {
    console.log('   ✅ 完全互斥，没有重叠');
}

// 检查市集是否被正确排除在兴趣班之外
const marketsInInterest = tab0.filter(item => item.category === '市集');
console.log('\n❓ 兴趣班Tab中包含市集活动:', marketsInInterest.length, '个');
if (marketsInInterest.length > 0) {
    console.log('   ⚠️ 错误！兴趣班中发现了市集活动:');
    marketsInInterest.forEach(m => console.log('      -', m.title));
} else {
    console.log('   ✅ 正确！兴趣班中没有市集活动');
}

// 检查灵活时间活动是否被正确排除
const flexibleInInterest = tab0.filter(item => item.flexibleTime === '是' || item.time === '灵活时间');
console.log('\n❓ 兴趣班Tab中包含灵活时间活动:', flexibleInInterest.length, '个');
if (flexibleInInterest.length > 0) {
    console.log('   ⚠️ 错误！兴趣班中发现了灵活时间活动:');
    flexibleInInterest.forEach(f => console.log('      -', f.title, '(', f.category, ')'));
} else {
    console.log('   ✅ 正确！兴趣班中没有灵活时间活动');
}

// 详细列表
console.log('\n📅 兴趣班Tab活动列表（前10个）:');
tab0.slice(0, 10).forEach(item => {
    console.log(`   - ${item.title} (${item.category}) - ${item.time}`);
});

console.log('\n📋 市集Tab活动列表:');
tab1.forEach(item => {
    console.log(`   - ${item.title} - ${item.time}`);
});

console.log('\n✅ 验证完成');
