#!/usr/bin/env node

/**
 * 前端活动描述渲染自动化测试 V2
 * 区分"正常添加表情符号"和"真正重复问题"
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const items = JSON.parse(fs.readFileSync(join(__dirname, '../data/items.json'), 'utf8'));

/**
 * 完整模拟前端的formatDescription函数
 */
function formatDescription(description, activity = null) {
  if (!description) return '暂无描述';

  let formatted = description;

  if (activity) {
    if (activity.time && activity.time !== '灵活时间') {
      formatted = formatted.replace(/[⏰]?\s*时间[：:]\s*[^\n]*/g, '');
    }
    if (activity.price) {
      formatted = formatted.replace(/[💰]?\s*费用[：:]\s*[^\n]*/g, '');
    }
  }

  const fieldPatterns = [
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

  fieldPatterns.forEach(({ pattern, icon, label }) => {
    formatted = formatted.replace(pattern, `\n<strong>${icon} ${label}</strong>`);
  });

  formatted = formatted.replace(/\n\s*\n\s*/g, '\n');

  const lines = formatted.split('\n');
  return lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.includes('<strong>')) {
      return trimmed;
    }
    const escaped = trimmed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped;
  }).filter(line => line.length > 0).join('<br>');
}

console.log('🧪 前端活动描述渲染自动化测试 V2\n');
console.log('='.repeat(80));

const testResults = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

items.forEach(item => {
  totalTests++;

  const original = item.description || '';
  const formatted = formatDescription(original, item);

  // 检测真正的重复问题：同一表情符号在同一行出现多次
  const lines = formatted.split('<br>');
  const duplicates = [];

  lines.forEach(line => {
    const emojiList = ['⚠️', '👥', '✨', '📚', '🌐', '💰', '📞'];
    emojiList.forEach(emoji => {
      const count = (line.split(emoji).length - 1);
      if (count > 1) {
        duplicates.push({
          emoji,
          line: line.substring(0, 80),
          count
        });
      }
    });
  });

  // 检测：⚠️ 注意事项是否在同一行重复出现
  const warningPattern = /⚠️\s*注意事项[^<strong>]*/g;
  const warningMatches = formatted.match(warningPattern);
  if (warningMatches && warningMatches.length > 1) {
    duplicates.push({
      emoji: '⚠️',
      type: '注意事项标签重复',
      count: warningMatches.length
    });
  }

  const passed = duplicates.length === 0;
  if (passed) {
    passedTests++;
  } else {
    failedTests++;
    testResults.push({
      id: item.activityNumber || item.id,
      title: item.title,
      passed: false,
      duplicates,
      formatted
    });
  }
});

// 输出测试结果
console.log(`\n📊 测试统计：`);
console.log(`   总测试数：${totalTests}`);
console.log(`   通过：${passedTests} ✅`);
console.log(`   失败：${failedTests} ❌`);
console.log(`   通过率：${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests > 0) {
  console.log(`\n` + '='.repeat(80));
  console.log(`\n❌ 发现 ${failedTests} 个活动存在真正的表情符号重复问题：\n`);

  testResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.id} - ${result.title}`);
    result.duplicates.forEach(dup => {
      console.log(`   ${dup.emoji}: ${dup.type || `数量${dup.count}`} - ${dup.line || ''}`);
    });
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('\n⚠️  警告：发现真正的重复问题，需要修复！\n');
  process.exit(1);
} else {
  console.log(`\n` + '='.repeat(80));
  console.log(`\n✅ 所有测试通过！前端渲染不会造成表情符号重复。\n`);

  // 说明formatDescription的行为
  console.log('📝 formatDescription功能说明：\n');
  console.log('该函数会给描述中的字段标签添加对应的表情符号：');
  console.log('  "适合人群：" → "👥 适合人群："');
  console.log('  "活动特点：" → "✨ 活动特点："');
  console.log('  "语言："      → "🌐 语言："');
  console.log('  "费用："      → "💰 费用："');
  console.log('  "⚠️ 注意事项：" → "⚠️ 注意事项："（保持不变）');
  console.log('\n这是正常的格式化行为，不是重复问题。\n');

  // 展示示例
  const sample = items.find(i => i.id === '0057');
  if (sample) {
    console.log('示例 - 0057 乌蒙寺禅修：\n');
    console.log('原始描述：');
    console.log((sample.description || '').substring(0, 150) + '...\n');
    console.log('格式化后：');
    console.log(formatDescription(sample.description || '', sample).substring(0, 200) + '...\n');
  }

  console.log('='.repeat(80));
  console.log('\n✅ 结论：前端formatDescription函数工作正常，无真正的重复问题\n');
}
