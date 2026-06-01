/**
 * 在主要章节之间添加分隔线
 */

import fs from 'fs';

const GUIDE_FILE = process.cwd() + '/data/guide.json';

const guideData = JSON.parse(fs.readFileSync(GUIDE_FILE, 'utf8'));
let content = guideData.content;

// 在每个h1标题（除了第一个）之前添加渐变分隔线
content = content.replace(
  /(<\/h1>)(?=\s*<h1>[一二三四五六七八九十]+)/gi,
  '</h1><hr style="margin: 30px 0; border: none; border-top: 2px solid #667eea; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 2px;">'
);

// 清理可能出现的连续分隔线
content = content.replace(/(<hr[^>]*>){2,}/gi, '<hr style="margin: 30px 0; border: none; border-top: 2px solid #667eea; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 2px;">');

// 更新数据
guideData.content = content;
guideData.lastUpdated = new Date().toISOString();
guideData.separatorsAddedAt = new Date().toISOString();

fs.writeFileSync(GUIDE_FILE, JSON.stringify(guideData, null, 2), 'utf8');

// 统计
const hrCount = (content.match(/<hr/gi) || []).length;
const h1Count = (content.match(/<h1>/gi) || []).length;

console.log('✅ 章节分隔线已添加！');
console.log(`h1章节: ${h1Count} 个`);
console.log(`分隔线: ${hrCount} 个`);
console.log('\n💡 章节之间现在有渐变紫色分隔线');
