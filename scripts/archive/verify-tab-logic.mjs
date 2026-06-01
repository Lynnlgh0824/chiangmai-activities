import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('📊 验证新筛选逻辑：\n');

// 新的兴趣班逻辑：排除市集、节庆活动、美食体验
const excludeCategories = ['市集', '节庆活动', '美食体验'];
const interestActivities = items.filter(item => !excludeCategories.includes(item.category));

console.log('✅ 兴趣班 (新逻辑):');
console.log('   排除分类:', excludeCategories.join(', '));
console.log('   活动数:', interestActivities.length);
console.log('   总活动数:', items.length);

// 具体分类统计
console.log('\n📋 兴趣班包含的分类:');
const catCount = {};
interestActivities.forEach(item => {
    catCount[item.category] = (catCount[item.category] || 0) + 1;
});
Object.entries(catCount).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`   - ${cat}: ${count}个`);
});

// 市集
const markets = items.filter(item => item.category === '市集');
console.log('\n📋 市集:', markets.length, '个');

// 灵活时间
const flexible = items.filter(item => item.flexibleTime === '是' || item.time === '灵活时间');
console.log('\n⏰ 灵活时间活动:', flexible.length, '个');

console.log('\n✅ 数据隔离验证:');
console.log('   总活动数:', items.length);
console.log('   兴趣班:', interestActivities.length);
console.log('   市集:', markets.length);
console.log('   灵活时间:', flexible.length);
console.log('   其他Tab: 0 (攻略)');
console.log('   合计:', interestActivities.length + markets.length + flexible.length);
