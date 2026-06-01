#!/usr/bin/env node

/**
 * 检测描述中的表情符号重复问题
 * 包括：
 * 1. 同一行中多个相同的表情符号
 * 2. 同一行中多个相同的功能性标签（如"注意事项"）
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const items = JSON.parse(fs.readFileSync(join(__dirname, '../data/items.json'), 'utf8'));

console.log('🔍 表情符号重复检测报告\n');
console.log('='.repeat(80));

const issues = [];
const emojiList = [
  '⚠️', '👥', '✨', '📚', '🌐', '💰', '📞', '⏰', '📍', '💳'
];

items.forEach(item => {
  const desc = item.description || '';
  const lines = desc.split('\n');

  lines.forEach((line, lineIndex) => {
    // 检测1: 同一行中重复的表情符号
    emojiList.forEach(emoji => {
      const matches = line.split(emoji).length - 1;
      if (matches > 1) {
        issues.push({
          id: item.activityNumber || item.id,
          title: item.title,
          type: '表情符号重复',
          line: lineIndex + 1,
          content: line.trim(),
          emoji: emoji,
          count: matches,
          severity: 'high'
        });
      }
    });

    // 检测2: "注意事项"标签重复
    if (line.includes('⚠️')) {
      const warningCount = (line.match(/⚠️/g) || []).length;
      if (warningCount > 1) {
        issues.push({
          id: item.activityNumber || item.id,
          title: item.title,
          type: '⚠️符号重复',
          line: lineIndex + 1,
          content: line.trim(),
          count: warningCount,
          severity: 'high'
        });
      }
    }

    // 检测3: "注意事项"文字重复
    if (line.includes('注意事项')) {
      const noteCount = (line.match(/注意事项/g) || []).length;
      if (noteCount > 1) {
        issues.push({
          id: item.activityNumber || item.id,
          title: item.title,
          type: '注意事项文字重复',
          line: lineIndex + 1,
          content: line.trim(),
          count: noteCount,
          severity: 'high'
        });
      }
    }
  });

  // 检测4: 整个描述中是否有重复的⚠️ 注意事项行
  const warningLines = lines.filter(l => l.includes('⚠️') || l.includes('注意事项'));
  if (warningLines.length > 1) {
    // 检查是否真的是重复内容
    const normalizedWarningLines = warningLines.map(l =>
      l.replace(/[⚠️\s：:]/g, '').trim()
    );
    const uniqueWarnings = [...new Set(normalizedWarningLines)];

    if (uniqueWarnings.length < warningLines.length) {
      issues.push({
        id: item.activityNumber || item.id,
        title: item.title,
        type: '多处注意事项行',
        content: warningLines.join(' | '),
        count: warningLines.length,
        severity: 'medium'
      });
    }
  }
});

// 输出结果
if (issues.length === 0) {
  console.log('✅ 未发现表情符号重复问题！');
} else {
  console.log(`\n📊 检测结果：发现 ${issues.length} 个表情符号重复问题\n`);
  console.log('='.repeat(80));

  issues.forEach((issue, index) => {
    const severityIcon = issue.severity === 'high' ? '🔴' : '🟡';
    console.log(`\n${severityIcon} 【${index + 1}】${issue.id} - ${issue.title}`);
    console.log(`   类型：${issue.type}`);
    if (issue.line) console.log(`   行号：第${issue.line}行`);
    if (issue.emoji) console.log(`   表情：${issue.emoji}`);
    if (issue.count) console.log(`   次数：${issue.count}次`);
    console.log(`   内容：${issue.content.substring(0, 100)}${issue.content.length > 100 ? '...' : ''}`);
  });

  console.log('\n' + '='.repeat(80));
  const affectedItems = [...new Set(issues.map(i => i.id))];
  console.log(`\n📋 需要修复的活动数量：${affectedItems.length}个`);
  console.log('📝 问题总数：' + issues.length + '个');
  console.log('\n受影响的活动ID：', affectedItems.join(', '));
}
