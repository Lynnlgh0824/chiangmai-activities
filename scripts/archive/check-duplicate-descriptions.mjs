import data from '../data/items.json' with { type: 'json' };

console.log('🔍 检查活动描述中的重复文案...\n');

const activitiesWithDupes = [];

data.forEach(item => {
  if (!item.description) return;

  const desc = item.description;

  // 检查是否有重复的段落
  const paragraphs = desc.split('\n').filter(p => p.trim());
  const uniqueParagraphs = [...new Set(paragraphs)];

  if (paragraphs.length !== uniqueParagraphs.length) {
    const duplicates = paragraphs.filter((p, i) =>
      paragraphs.indexOf(p) !== i
    );

    activitiesWithDupes.push({
      number: item.activityNumber,
      title: item.title,
      originalLength: desc.length,
      duplicateCount: paragraphs.length - uniqueParagraphs.length,
      duplicates: duplicates
    });
  }
});

console.log(`发现 ${activitiesWithDupes.length} 个活动有重复描述\n`);

if (activitiesWithDupes.length > 0) {
  activitiesWithDupes.slice(0, 10).forEach(item => {
    console.log(`[${item.number}] ${item.title}`);
    console.log(`  重复段落数: ${item.duplicateCount}`);
    console.log(`  原始长度: ${item.originalLength} 字符`);
    console.log(`  重复内容预览:`, item.duplicates[0].substring(0, 50) + '...');
    console.log('');
  });
}
