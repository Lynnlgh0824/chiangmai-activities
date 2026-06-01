#!/usr/bin/env node

/**
 * 详细描述内容重复检测
 * 检查：
 * 1. 重复的表情符号行
 * 2. 重复的标签文本
 * 3. 相同内容的重复段落
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const items = JSON.parse(fs.readFileSync(join(__dirname, '../data/items.json'), 'utf8'));

console.log('🔍 详细描述内容重复检测报告\n');
console.log('='.repeat(80));

const issues = [];

items.forEach(item => {
  const desc = item.description || '';
  if (!desc.trim()) return;

  const lines = desc.split('\n').map(l => l.trim()).filter(l => l);

  // 检测1: 完全重复的行
  const seenLines = new Map();
  lines.forEach((line, index) => {
    if (seenLines.has(line)) {
      issues.push({
        id: item.activityNumber || item.id,
        title: item.title,
        type: '完全重复的行',
        line1: seenLines.get(line) + 1,
        line2: index + 1,
        content: line,
        severity: 'high'
      });
    } else {
      seenLines.set(line, index);
    }
  });

  // 检测2: ⚠️ 标签的重复
  const warningLines = lines.filter(l => l.includes('⚠️'));
  if (warningLines.length > 1) {
    issues.push({
      id: item.activityNumber || item.id,
      title: item.title,
      type: '多个⚠️标签',
      count: warningLines.length,
      content: warningLines.join(' | '),
      severity: 'medium'
    });
  }

  // 检测3: "注意事项"的重复
  const noteLines = lines.filter(l => l.includes('注意事项'));
  if (noteLines.length > 1) {
    issues.push({
      id: item.activityNumber || item.id,
      title: item.title,
      type: '多处"注意事项"',
      count: noteLines.length,
      content: noteLines.join(' | '),
      severity: 'medium'
    });
  }

  // 检测4: 检查是否有连续的相同表情符号开头的行
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];

    // 提取行首的表情符号
    const currentEmoji = currentLine.match(/^[\p{Emoji}\u200d]+/u)?.[0];
    const nextEmoji = nextLine.match(/^[\p{Emoji}\u200d]+/u)?.[0];

    if (currentEmoji && nextEmoji && currentEmoji === nextEmoji) {
      issues.push({
        id: item.activityNumber || item.id,
        title: item.title,
        type: '连续相同表情开头',
        emoji: currentEmoji,
        line1: i + 1,
        line2: i + 2,
        content1: currentLine,
        content2: nextLine,
        severity: 'medium'
      });
    }
  }

  // 检测5: 检查是否在描述和前端渲染时会造成重复
  // 模拟前端formatDescription函数的行为
  const formatPatterns = [
    { pattern: /适合人群[：:]\s*/g, icon: '👥', label: '适合人群：' },
    { pattern: /活动特点[：:]\s*/g, icon: '✨', label: '活动特点：' },
    { pattern: /课程周期[：:]\s*/g, icon: '📚', label: '课程周期：' },
    { pattern: /标准课程周期[：:]\s*/g, icon: '📚', label: '课程周期：' },
    { pattern: /语言[：:]\s*/g, icon: '🌐', label: '语言：' },
    { pattern: /费用[：:]\s*/g, icon: '💰', label: '费用：' },
    { pattern: /官网[：:]\s*/g, icon: '🌐', label: '官网：' },
    { pattern: /联系方式[：:]\s*/g, icon: '📞', label: '联系方式：' },
    { pattern: /(⚠️\s*)?注意事项[：:]\s*/g, icon: '⚠️', label: '注意事项：' }
  ];

  // 模拟替换并检查是否有重复
  let formatted = desc;
  const replacements = [];

  formatPatterns.forEach(({ pattern, icon, label }) => {
    const matches = desc.match(pattern);
    if (matches) {
      matches.forEach(match => {
        replacements.push({ original: match, replacement: `${icon} ${label}` });
      });
    }
  });

  // 检查是否有会导致前端重复渲染的情况
  const emojiPattern = /^⚠️\s*注意事项[：:]/;
  if (emojiPattern.test(desc)) {
    // 检查描述中是否已有⚠️ 注意事项格式
    issues.push({
      id: item.activityNumber || item.id,
      title: item.title,
      type: '已有⚠️格式（前端可能重复）',
      content: desc.substring(0, 100),
      severity: 'low',
      note: '描述中已包含⚠️格式，前端formatDescription会再次添加标签'
    });
  }
});

// 输出结果
if (issues.length === 0) {
  console.log('✅ 未发现描述内容重复问题！\n');
  console.log('数据质量良好，无需修复。');
} else {
  console.log(`\n📊 检测结果：发现 ${issues.length} 个潜在问题\n`);
  console.log('='.repeat(80));

  // 按严重程度分组
  const bySeverity = { high: [], medium: [], low: [] };
  issues.forEach(issue => {
    bySeverity[issue.severity].push(issue);
  });

  if (bySeverity.high.length > 0) {
    console.log(`\n🔴 高严重度问题 (${bySeverity.high.length}个):`);
    bySeverity.high.forEach((issue, index) => {
      console.log(`\n  【${index + 1}】${issue.id} - ${issue.title}`);
      console.log(`  类型：${issue.type}`);
      if (issue.line1 && issue.line2) console.log(`  位置：第${issue.line1}行和第${issue.line2}行`);
      console.log(`  内容：${issue.content.substring(0, 80)}...`);
    });
  }

  if (bySeverity.medium.length > 0) {
    console.log(`\n🟡 中等严重度问题 (${bySeverity.medium.length}个):`);
    bySeverity.medium.forEach((issue, index) => {
      console.log(`\n  【${index + 1}】${issue.id} - ${issue.title}`);
      console.log(`  类型：${issue.type}`);
      if (issue.count) console.log(`  次数：${issue.count}次`);
      if (issue.emoji) console.log(`  表情：${issue.emoji}`);
      console.log(`  内容：${issue.content.substring(0, 80)}...`);
    });
  }

  if (bySeverity.low.length > 0) {
    console.log(`\n🟢 低严重度问题 (${bySeverity.low.length}个):`);
    bySeverity.low.forEach((issue, index) => {
      console.log(`\n  【${index + 1}】${issue.id} - ${issue.title}`);
      console.log(`  类型：${issue.type}`);
      console.log(`  说明：${issue.note}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  const affectedItems = [...new Set(issues.map(i => i.id))];
  console.log(`\n📋 总结：`);
  console.log(`  - 受影响活动：${affectedItems.length}个`);
  console.log(`  - 问题总数：${issues.length}个`);
  console.log(`  - 高严重度：${bySeverity.high.length}个`);
  console.log(`  - 中等严重度：${bySeverity.medium.length}个`);
  console.log(`  - 低严重度：${bySeverity.low.length}个`);
}
