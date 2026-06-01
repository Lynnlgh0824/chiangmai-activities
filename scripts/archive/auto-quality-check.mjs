#!/usr/bin/env node

/**
 * 活动描述质量自动化检测
 * 检测项目：
 * 1. 符号冗余（单独成行的句号等）
 * 2. 表情符号重复
 * 3. 内容重复
 * 4. 格式规范
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const items = JSON.parse(fs.readFileSync(join(__dirname, '../data/items.json'), 'utf8'));

console.log('🔍 活动描述质量自动化检测\n');
console.log('='.repeat(80));

let totalIssues = 0;
const issues = [];

items.forEach(item => {
  const desc = item.description || '';
  const itemIssues = [];

  // 检测1：单独成行的符号
  if (/\n[。\s]+\n/.test(desc) || /^。\n/.test(desc) || /\n。\n/.test(desc)) {
    itemIssues.push({
      type: '符号冗余',
      severity: 'medium',
      description: '存在单独成行的句号'
    });
  }

  // 检测2：连续的⚠️
  if (/(⚠️\s*){2,}/.test(desc)) {
    itemIssues.push({
      type: '表情重复',
      severity: 'high',
      description: '存在连续的⚠️符号'
    });
  }

  // 检测3：内容重复
  const lines = desc.split('\n').filter(l => l.trim());
  const seen = new Set();
  lines.forEach((line, i) => {
    const normalized = line.toLowerCase().replace(/[，。、；：！？\s⚠️👥✨📚🌐💰📞]/g, '');
    if (normalized.length > 5 && seen.has(normalized)) {
      itemIssues.push({
        type: '内容重复',
        severity: 'high',
        description: `第${i + 1}行内容重复`,
        content: line.substring(0, 50)
      });
    }
    seen.add(normalized);
  });

  // 检测4：结尾标点
  if (/\n$/.test(desc)) {
    itemIssues.push({
      type: '格式问题',
      severity: 'low',
      description: '描述以换行符结尾'
    });
  }

  if (itemIssues.length > 0) {
    totalIssues += itemIssues.length;
    issues.push({
      id: item.activityNumber || item.id,
      title: item.title,
      problems: itemIssues
    });
  }
});

// 输出结果
console.log(`📊 检测统计：\n`);
console.log(`   总活动数：${items.length}`);
console.log(`   有问题活动：${issues.length}`);
console.log(`   问题总数：${totalIssues}\n`);

if (issues.length === 0) {
  console.log('='.repeat(80));
  console.log('\n✅ 所有活动描述质量检测通过！\n');
  console.log('检测项目：');
  console.log('  ✅ 无符号冗余');
  console.log('  ✅ 无表情符号重复');
  console.log('  ✅ 无内容重复');
  console.log('  ✅ 格式规范\n');
  process.exit(0);
} else {
  console.log('='.repeat(80));
  console.log(`\n⚠️  发现 ${issues.length} 个活动存在质量问题：\n`);

  issues.forEach((item, index) => {
    console.log(`${index + 1}. ${item.id} - ${item.title}`);
    item.problems.forEach(problem => {
      const icon = problem.severity === 'high' ? '🔴' : problem.severity === 'medium' ? '🟡' : '🟢';
      console.log(`   ${icon} ${problem.type}: ${problem.description}`);
      if (problem.content) console.log(`      "${problem.content}..."`);
    });
    console.log('');
  });

  console.log('='.repeat(80));
  console.log(`\n⚠️  质量检测未完全通过，请修复上述问题\n`);
  process.exit(1);
}
