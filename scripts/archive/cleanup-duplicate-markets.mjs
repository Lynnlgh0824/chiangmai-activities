import fs from 'fs';

console.log('🧹 清理重复的市集数据...\n');

const data = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));

// 按活动标题分组
const titleMap = new Map();
data.forEach(item => {
  const title = item.title;
  if (!titleMap.has(title)) {
    titleMap.set(title, []);
  }
  titleMap.get(title).push(item);
});

// 找出重复的
const duplicates = [];
const toRemoveNumbers = new Set();

titleMap.forEach((items, title) => {
  if (items.length > 1) {
    // 按编号排序，保留最小的
    const sorted = items.sort((a, b) => parseInt(a.activityNumber) - parseInt(b.activityNumber));
    duplicates.push({ title, items });

    // 标记要删除的（保留第一个）
    sorted.slice(1).forEach(item => {
      toRemoveNumbers.add(item.activityNumber);
    });
  }
});

if (duplicates.length === 0) {
  console.log('✅ 没有发现重复数据');
  process.exit(0);
}

console.log(`发现 ${duplicates.length} 个重复活动:\n`);
duplicates.forEach(({title, items}) => {
  const sorted = items.sort((a, b) => parseInt(a.activityNumber) - parseInt(b.activityNumber));
  console.log(`  ${title}:`);
  console.log(`    保留: ${sorted[0].activityNumber}`);
  sorted.slice(1).forEach(item => {
    console.log(`    删除: ${item.activityNumber}`);
  });
});

// 过滤掉重复的
const cleaned = data.filter(item =>
  !toRemoveNumbers.has(item.activityNumber)
);

// 保存
fs.writeFileSync('data/items.json', JSON.stringify(cleaned, null, 2));

console.log(`\n✅ 清理完成！`);
console.log(`删除前: ${data.length} 个活动`);
console.log(`删除后: ${cleaned.length} 个活动`);
console.log(`删除了: ${toRemoveNumbers.size} 个重复活动\n`);
