import fs from 'fs';
const items = JSON.parse(fs.readFileSync('./data/items.json', 'utf-8'));

// 查找网球活动
const tennis = items.find(item => item.title.includes('网球'));

if (tennis) {
  console.log('🎾 网球活动详情:');
  console.log('ID:', tennis.id);
  console.log('标题:', tennis.title);
  console.log('分类:', tennis.category);
  console.log('时间:', tennis.time);
  console.log('地点:', tennis.location);
  console.log('价格:', tennis.price);
  console.log('描述:', tennis.description);
  console.log('');
  console.log('⚠️ 关键信息:');
  console.log('- 是否灵活时间:', tennis.flexibleTime);
  console.log('- 需要预约:', tennis.requireBooking);
  console.log('- 有来源信息:', !(tennis.source === null || tennis.source === undefined));
  if (tennis.source) {
    console.log('- source:', JSON.stringify(tennis.source, null, 2));
  }
} else {
  console.log('❌ 未找到网球活动');
}
