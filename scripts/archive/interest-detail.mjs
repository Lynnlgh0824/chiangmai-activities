import fs from 'fs';
const items = JSON.parse(fs.readFileSync('./data/items.json', 'utf-8'));

const interestCategories = ['瑜伽', '冥想', '舞蹈', '泰拳', '音乐', '文化艺术', '健身'];
const interest = items.filter(item => interestCategories.includes(item.category));

console.log('📅 兴趣班白名单 - 详细分类:');
const byCat = {};
interest.forEach(item => {
  if (!byCat[item.category]) byCat[item.category] = [];
  byCat[item.category].push(item);
});

Object.entries(byCat).forEach(([cat, items]) => {
  const flexible = items.filter(i => i.flexibleTime === '是' || i.time === '灵活时间').length;
  const fixed = items.length - flexible;
  console.log(`  ${cat}: ${items.length}个 (固定:${fixed}, 灵活:${flexible})`);
});

console.log('\n总计:', interest.length, '个');
