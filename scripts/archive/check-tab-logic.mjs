import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('📊 当前数据检查：\n');

// 兴趣班筛选逻辑
const interestCategories = ['瑜伽', '冥想', '舞蹈', '泰拳', '音乐', '文化艺术', '健身'];
const interestActivities = items.filter(item =>
    interestCategories.includes(item.category)
);

console.log('📅 兴趣班筛选 (当前逻辑):');
console.log('   包含分类:', interestCategories.join(', '));
console.log('   活动数:', interestActivities.length);

console.log('\n❓ 未包含在兴趣班的分类:');
const allCategories = [...new Set(items.map(item => item.category))];
allCategories.forEach(cat => {
    if (!interestCategories.includes(cat)) {
        const count = items.filter(item => item.category === cat).length;
        console.log('   -', cat, ':', count, '个');
    }
});

// 市集
const markets = items.filter(item => item.category === '市集');
console.log('\n📋 市集:', markets.length, '个');

// 灵活时间
const flexible = items.filter(item => item.flexibleTime === '是' || item.time === '灵活时间');
console.log('\n⏰ 灵活时间活动:', flexible.length, '个');
