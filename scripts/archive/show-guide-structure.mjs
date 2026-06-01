/**
 * 显示攻略信息的完整标题层级结构
 */

import fs from 'fs';

const content = JSON.parse(fs.readFileSync('data/guide.json', 'utf8')).content;

// 使用更宽松的正则表达式
const h1Titles = content.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || [];
const h2Titles = content.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi) || [];
const h3Titles = content.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi) || [];
const h4Titles = content.match(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi) || [];

console.log('========================================');
console.log('📚 攻略信息完整层级结构');
console.log('========================================\n');

console.log('【一级标题 h1】主要章节 (共' + h1Titles.length + '个)');
console.log('─────────────────────────────────────');
h1Titles.forEach((title, i) => {
  const cleanTitle = title.replace(/<\/?h1[^>]*>|<\/?strong>|<[^>]+>/gi, '').trim();
  console.log(`${i + 1}. ${cleanTitle}`);
});

if (h3Titles.length > 0) {
  console.log('\n\n【三级标题 h3】小节示例 (前15个，共' + h3Titles.length + '个)');
  console.log('─────────────────────────────────────');
  h3Titles.slice(0, 15).forEach((title, i) => {
    const cleanTitle = title.replace(/<\/?h3[^>]*>|<\/?strong>|<[^>]+>/gi, '').trim();
    // 只显示前50个字符
    const displayTitle = cleanTitle.length > 50 ? cleanTitle.substring(0, 50) + '...' : cleanTitle;
    console.log(`${i + 1}. ${displayTitle}`);
  });
  if (h3Titles.length > 15) {
    console.log(`... 还有 ${h3Titles.length - 15} 个三级标题`);
  }
}

if (h4Titles.length > 0) {
  console.log('\n\n【四级标题 h4】子小节 (共' + h4Titles.length + '个)');
  console.log('─────────────────────────────────────');
  h4Titles.forEach((title, i) => {
    const cleanTitle = title.replace(/<\/?h4[^>]*>|<\/?strong>|<[^>]+>/gi, '').trim();
    console.log(`${i + 1}. ${cleanTitle}`);
  });
}

console.log('\n\n========================================');
console.log('📊 层级统计');
console.log('========================================');
console.log(`一级标题 (h1): ${h1Titles.length} 个 - 主要章节`);
console.log(`二级标题 (h2): ${h2Titles.length} 个 - 子章节`);
console.log(`三级标题 (h3): ${h3Titles.length} 个 - 小节标题`);
console.log(`四级标题 (h4): ${h4Titles.length} 个 - 子小节标题`);
console.log(`\n总计: ${h1Titles.length + h2Titles.length + h3Titles.length + h4Titles.length} 个标题`);
