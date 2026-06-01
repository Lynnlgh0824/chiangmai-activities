#!/usr/bin/env node

/**
 * 测试灵活时间活动筛选逻辑
 */

console.log('🧪 测试灵活时间活动筛选逻辑\n');

// 模拟前端数据（包含多日活动展开后的记录）
const mockActivities = [
  { id: 1, title: '瑜伽 Nong Buak Haad', time: '08:30-09:45', category: '瑜伽', day: 1, location: '公园', price: '免费' },
  { id: 1, title: '瑜伽 Nong Buak Haad', time: '08:30-09:45', category: '瑜伽', day: 2, location: '公园', price: '免费' },
  { id: 1, title: '瑜伽 Nong Buak Haad', time: '08:30-09:45', category: '瑜伽', day: 3, location: '公园', price: '免费' },
  { id: 2, title: '徒步', time: '灵活时间', category: '徒步', day: 6, location: '山区', price: '免费' },
  { id: 2, title: '徒步', time: '灵活时间', category: '徒步', day: 0, location: '山区', price: '免费' },
  { id: 3, title: '泰拳体验课', time: '灵活时间', category: '泰拳', day: null, location: '体育馆', price: '200฿' },
  { id: 4, title: '孟买市场', time: '00:00-24:00', category: '市集', day: 1, location: '市场', price: '免费' },
  { id: 4, title: '孟买市场', time: '00:00-24:00', category: '市集', day: 2, location: '市场', price: '免费' },
  { id: 5, title: '禅修课程', time: '每天开放进行禅修登记', category: '冥想', day: 1, location: '寺庙', price: '免费' },
  { id: 6, title: '高尔夫', time: '', category: '户外运动', day: null, location: '球场', price: '1500฿' }
];

// 时间格式判断函数（与前端完全一致）
function isSpecificTimeFormat(time) {
  if (!time || typeof time !== 'string') return false;

  // 匹配格式：数字:数字-数字:数字
  const timePattern = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}/;
  return timePattern.test(time);
}

// 筛选灵活时间活动
const flexibleTimeActivities = mockActivities.filter(act => {
  const time = act.time || '';
  const isSpecific = isSpecificTimeFormat(time);
  const isFlexible = !isSpecific;

  console.log(`[${act.title}]`);
  console.log(`  时间: "${time}"`);
  console.log(`  具体时间: ${isSpecific}, 灵活时间: ${isFlexible}`);
  console.log('');

  return isFlexible;
});

console.log('═════════════════════════════');
console.log(`\n✅ 筛选出灵活时间活动: ${flexibleTimeActivities.length} 个\n`);

// 按活动ID去重
const uniqueActivities = [];
const seenIds = new Set();

flexibleTimeActivities.forEach(act => {
  if (!seenIds.has(act.id)) {
    seenIds.add(act.id);
    uniqueActivities.push(act);
  }
});

console.log(`✅ 去重后活动数: ${uniqueActivities.length} 个\n`);

console.log('灵活时间活动列表:');
uniqueActivities.forEach((act, index) => {
  console.log(`${index + 1}. ${act.title}`);
  console.log(`   时间: ${act.time || '空'}`);
  console.log(`   分类: ${act.category}`);
  console.log('');
});

console.log('═════════════════════════════');
console.log('✨ 测试完成！');
