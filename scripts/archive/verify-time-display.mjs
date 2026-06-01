import data from '../data/items.json' with { type: 'json' };

console.log('检查活动时间显示情况...\n');

// 统计不同类型的时间格式
const timeStats = {
  withColon: 0,      // 包含冒号
  longText: 0,       // >30字符无冒号
  shortText: 0,      // 其他
  empty: 0           // 空
};

data.forEach(item => {
  const time = item.time || '';
  if (!time || time.trim() === '') {
    timeStats.empty++;
  } else if (time.includes(':')) {
    timeStats.withColon++;
  } else if (time.length > 30) {
    timeStats.longText++;
  } else {
    timeStats.shortText++;
  }
});

console.log('时间格式统计：');
console.log('  包含冒号（会显示时间）:', timeStats.withColon);
console.log('  长文本（不显示时间）:', timeStats.longText);
console.log('  短文本（不显示时间）:', timeStats.shortText);
console.log('  空值:', timeStats.empty);
console.log('');

// 显示前10个包含冒号的活动
console.log('应该显示时间的活动（前10个）：\n');
const withColon = data.filter(item => item.time && item.time.includes(':')).slice(0, 10);

withColon.forEach(item => {
  console.log('[' + item.activityNumber + '] ' + item.title);
  console.log('  ⏰ ' + item.time);
  console.log('  📅 ' + (Array.isArray(item.weekdays) ? item.weekdays.join(', ') : item.weekdays || ''));
  console.log('');
});
