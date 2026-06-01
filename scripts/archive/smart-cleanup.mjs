import fs from 'fs';

// 读取数据
const data = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));

console.log('📊 开始智能清理重复数据...\n');
console.log(`清理前: ${data.length} 个活动\n`);

// 按标题分组，找出重复的
const titleGroups = new Map();

data.forEach(item => {
  const title = item.title || item.name || '';
  if (!titleGroups.has(title)) {
    titleGroups.set(title, []);
  }
  titleGroups.get(title).push(item);
});

// 找出重复的标题
const duplicates = [];
const unique = [];

titleGroups.forEach((items, title) => {
  if (items.length > 1) {
    duplicates.push({ title, items });
    // 只保留第一个（通常是有编号的）
    const sorted = items.sort((a, b) => {
      // 优先保留有编号的
      const aHasNum = !!a.activityNumber;
      const bHasNum = !!b.activityNumber;
      if (aHasNum && !bHasNum) return -1;
      if (!aHasNum && bHasNum) return 1;
      // 都有编号或都没编号，保留ID小的（较早创建的）
      return a.id - b.id;
    });
    unique.push(sorted[0]);
  } else {
    unique.push(items[0]);
  }
});

console.log(`✅ 发现 ${duplicates.length} 组重复标题`);
console.log(`去重后: ${unique.length} 个活动\n`);

// 显示将被删除的重复项
console.log('🗑️  将删除以下重复活动:\n');
let deleteCount = 0;
duplicates.forEach(({ title, items }) => {
  const sorted = items.sort((a, b) => {
    const aHasNum = !!a.activityNumber;
    const bHasNum = !!b.activityNumber;
    if (aHasNum && !bHasNum) return -1;
    if (!aHasNum && bHasNum) return 1;
    return a.id - b.id;
  });

  const keep = sorted[0];
  const remove = sorted.slice(1);

  console.log(`标题: ${title}`);
  console.log(`  ✅ 保留: #${keep.activityNumber || '无'} (ID: ${keep.id})`);

  remove.forEach(item => {
    deleteCount++;
    console.log(`  ❌ 删除: #${item.activityNumber || '无'} (ID: ${item.id})`);
  });
  console.log();
});

// 保存清理后的数据
fs.writeFileSync('data/items.json', JSON.stringify(unique, null, 2));

console.log('=' .repeat(60));
console.log('✅ 数据清理完成！');
console.log('=' .repeat(60));
console.log(`📊 统计:`);
console.log(`  删除前: ${data.length} 个活动`);
console.log(`  删除后: ${unique.length} 个活动`);
console.log(`  删除了: ${deleteCount} 个重复活动`);
console.log('\n📋 保留的活动列表:');
unique.forEach((item, i) => {
  const num = item.activityNumber || '无编号';
  console.log(`  ${i+1}. #${num} - ${item.title}`);
});
