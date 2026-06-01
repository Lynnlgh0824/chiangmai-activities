#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const items = JSON.parse(fs.readFileSync(join(__dirname, '../data/items.json'), 'utf8'));

function normalizeText(text) {
  return text.toLowerCase().replace(/[，。、；：！？]/g, '').replace(/[,\.\;\:\!\?]/g, '').replace(/\s+/g, '').replace(/[⚠️👥✨📚🌐💰📞]/g, '').trim();
}

const issues = [];

items.forEach(item => {
  const desc = item.description || '';
  const lines = desc.split('\n').filter(l => l.trim());
  
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const norm1 = normalizeText(lines[i]);
      const norm2 = normalizeText(lines[j]);
      
      if (norm1 === norm2 && norm1.length > 5) {
        issues.push({
          id: item.activityNumber || item.id,
          title: item.title,
          line1: i + 1,
          line2: j + 1,
          content: lines[i]
        });
      }
    }
  }
});

console.log('🔍 内容重复检测报告\n');
console.log('='.repeat(80));

if (issues.length === 0) {
  console.log('✅ 未发现内容重复\n');
} else {
  console.log(`发现 ${issues.length} 个重复问题：\n`);
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.id} - ${issue.title}`);
    console.log(`   第${issue.line1}行 ↔ 第${issue.line2}行`);
    console.log(`   "${issue.content}"\n`);
  });
}
