#!/usr/bin/env node

const fs = require('fs');
const items = JSON.parse(fs.readFileSync('./data/items.json', 'utf8'));

console.log('🔍 检查duration和description之间的重复：\n');

const duplicates = [];

items.forEach(item => {
  const duration = item.duration || '';
  const desc = item.description || '';

  // 检测duration中的关键词是否在description中重复
  const keywords = [
    '不限时',
    '时间灵活',
    '无固定时长',
    '灵活时间',
    '需现金支付',
    '免费',
    '自愿捐赠',
    '随喜捐赠',
    '包含食宿',
    '无固定时间'
  ];

  const foundDuplicates = [];

  keywords.forEach(keyword => {
    if (duration.includes(keyword) && desc.includes(keyword)) {
      // 检查是否合理重复（如果是基本信息，在注意事项中提到是合理的）
      const parts = desc.split('⚠️ 注意事项：');
      const warningSection = parts.length > 1 ? parts[1] : '';

      const isInWarning = warningSection.includes(keyword);

      // 只有不在注意事项中的重复才记录
      if (!isInWarning) {
        foundDuplicates.push(keyword);
      }
    }
  });

  if (foundDuplicates.length > 0) {
    duplicates.push({
      id: item.activityNumber,
      title: item.title,
      duration: duration,
      description: desc.substring(0, 100),
      duplicates: foundDuplicates
    });
  }
});

console.log(`发现 ${duplicates.length} 个活动存在duration和description重复问题：\n`);

duplicates.forEach(item => {
  console.log(`【${item.id}】${item.title}`);
  console.log(`  duration: ${item.duration}`);
  console.log(`  重复关键词: ${item.duplicates.join(', ')}`);
  console.log(`  描述片段: ${item.description.substring(0, 80)}...`);
  console.log('');
});
