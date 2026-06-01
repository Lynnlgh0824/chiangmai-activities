import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('📋 市集检查\n');

const markets = items.filter(item => item.category === '市集');
console.log(`市集总数: ${markets.length}个\n`);

console.log('检查市集中的灵活时间活动:');
markets.forEach(m => {
    const isFlexible = m.flexibleTime === '是' || m.time === '灵活时间';
    if (isFlexible) {
        console.log(`   ⚠️ ${m.title} - ${m.time} (灵活时间)`);
    }
});

console.log('\n✅ 结论:');
console.log('   市集中有灵活时间活动:', markets.filter(m => m.flexibleTime === '是' || m.time === '灵活时间').length);
console.log('   所有市集都是固定时间:', markets.filter(m => m.flexibleTime === '否' && m.time !== '灵活时间').length === markets.length);
