/**
 * 生成攻略信息的详细层级结构（带树状图）
 */

import fs from 'fs';

const content = JSON.parse(fs.readFileSync('data/guide.json', 'utf8')).content;

// 提取所有标题并保留原始标签
const h1Matches = [...content.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
const h3Matches = [...content.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)];
const h4Matches = [...content.matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi)];

console.log('========================================');
console.log('📚 清迈旅行攻略 - 完整章节结构');
console.log('========================================\n');

// 清理标题文本
function cleanTitle(title) {
  return title.replace(/<\/?[a-z][a-z0-9]*[^>]*>|<[^>]+>|<\/?strong>/gi, '').trim();
}

// 构建层级树
let currentH1Index = -1;
const tree = [];

h1Matches.forEach((h1Match) => {
  currentH1Index++;
  const h1Title = cleanTitle(h1Match[1]);
  const h1Start = h1Match.index + h1Match[0].length;
  const h1End = currentH1Index < h1Matches.length - 1 ? h1Matches[currentH1Index + 1].index : content.length;

  // 查找这个h1下的所有h3和h4
  const section = {
    title: h1Title,
    level: 1,
    children: []
  };

  h3Matches.forEach((h3Match) => {
    const h3Pos = h3Match.index;
    if (h3Pos > h1Start && h3Pos < h1End) {
      const h3Title = cleanTitle(h3Match[1]);
      const h3Start = h3Match.index + h3Match[0].length;
      const h3Index = h3Matches.indexOf(h3Match);
      const h3End = h3Index < h3Matches.length - 1 ? h3Matches[h3Index + 1].index : h1End;

      const subsection = {
        title: h3Title,
        level: 3,
        children: []
      };

      // 查找这个h3下的所有h4
      h4Matches.forEach((h4Match) => {
        const h4Pos = h4Match.index;
        if (h4Pos > h3Start && h4Pos < h3End) {
          subsection.children.push({
            title: cleanTitle(h4Match[1]),
            level: 4
          });
        }
      });

      section.children.push(subsection);
    }
  });

  tree.push(section);
});

// 打印树状结构
tree.forEach((section, index) => {
  console.log(`\n📌 第${index + 1}章: ${section.title}`);
  console.log('─'.repeat(60));

  if (section.children.length === 0) {
    console.log('  (内容)');
  } else {
    section.children.forEach((subsection, subIndex) => {
      const hasChildren = subsection.children.length > 0;
      const prefix = hasChildren ? '├─' : '└─';
      console.log(`  ${prefix} ${subsection.title}`);

      if (hasChildren) {
        subsection.children.forEach((item, itemIndex) => {
          const isLast = itemIndex === subsection.children.length - 1;
          const itemPrefix = isLast ? '└─' : '├─';
          console.log(`  │  ${itemPrefix} ${item.title}`);
        });
      }
    });
  }
});

console.log('\n\n========================================');
console.log('📊 层级统计汇总');
console.log('========================================');
console.log(`📌 主要章节 (h1): ${h1Matches.length} 个`);
console.log(`📝 小节标题 (h3): ${h3Matches.length} 个`);
console.log(`📄 细节标题 (h4): ${h4Matches.length} 个`);
console.log(`\n📦 总标题数: ${h1Matches.length + h3Matches.length + h4Matches.length} 个`);
