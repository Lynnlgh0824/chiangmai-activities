#!/usr/bin/env node

const items = require('../data/items.json');

console.log('✅ 验证修改结果：\n');

['0016', '0030', '0032'].forEach(id => {
  const item = items.find(i => i.activityNumber === id);
  console.log(`【${id}】${item.title}`);
  console.log(`\n完整描述：\n${item.description}\n`);

  // 检查是否还有重复
  const parts = item.description.split('⚠️ 注意事项：');
  if (parts.length === 2) {
    const main = parts[0];
    const note = parts[1];

    // 简单的重复检查
    const mainWords = main.split(/[，。！？、\n]/).filter(w => w.trim().length > 4);
    const noteWords = note.split(/[，。！？、\n]/).filter(w => w.trim().length > 4);

    let duplicateCount = 0;
    mainWords.forEach(w => {
      if (noteWords.includes(w) && w.length > 5) {
        duplicateCount++;
      }
    });

    console.log(`重复检查: ${duplicateCount === 0 ? '✓ 无重复' : '✗ 仍有 ' + duplicateCount + ' 处重复'}\n`);
  } else {
    console.log('无注意事项部分\n');
  }
});
