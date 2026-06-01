import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('🔍 检查数据重叠：\n');

// 灵活时间的活动
const flexible = items.filter(item => item.flexibleTime === '是' || item.time === '灵活时间');
console.log('⏰ 灵活时间活动分类:');
flexible.forEach(item => {
    console.log(`   - ${item.title} (${item.category})`);
});

// 检查是否在兴趣班中
const excludeCategories = ['市集', '节庆活动', '美食体验'];
const flexibleInInterest = flexible.filter(item => !excludeCategories.includes(item.category));

console.log(`\n❌ 灵活时间活动中，属于兴趣班的有: ${flexibleInInterest.length}个`);
flexibleInInterest.forEach(item => {
    console.log(`   - ${item.title} (${item.category})`);
});
