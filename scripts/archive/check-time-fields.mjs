const data = require('./data/items.json');

// 查找时间字段包含长文本的活动
const longTimeActivities = data.filter(item => {
  const time = item.time || '';
  return time.length > 20 && !time.includes(':');
});

console.log('时间字段为描述性文本的活动：');
console.log('总数:', longTimeActivities.length);
console.log('');

longTimeActivities.forEach(item => {
  console.log('[' + item.activityNumber + '] ' + item.title);
  console.log('  时间:', item.time);
  console.log('  时间长度:', item.time.length, '字符');
  console.log('');
});
