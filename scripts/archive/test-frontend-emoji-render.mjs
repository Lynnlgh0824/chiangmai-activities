#!/usr/bin/env node

/**
 * 前端活动描述渲染自动化测试
 * 模拟前端formatDescription函数，检查⚠️等表情符号是否重复
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const items = JSON.parse(fs.readFileSync(join(__dirname, '../data/items.json'), 'utf8'));

/**
 * 完整模拟前端的formatDescription函数
 * 来自 index.html 的实际实现
 */
function formatDescription(description, activity = null) {
  if (!description) return '暂无描述';

  let formatted = description;

  // 如果有活动信息，过滤掉顶部已显示的字段
  if (activity) {
    // 过滤时间信息
    if (activity.time && activity.time !== '灵活时间') {
      formatted = formatted.replace(/[⏰]?\s*时间[：:]\s*[^\n]*/g, '');
    }

    // 过滤价格/费用信息
    if (activity.price) {
      formatted = formatted.replace(/[💰]?\s*费用[：:]\s*[^\n]*/g, '');
    }
  }

  // 定义字段和对应的图标（注意：避免重叠的模式）
  const fieldPatterns = [
    { pattern: /适合人群[：:]\s*/g, icon: '👥', label: '适合人群：' },
    { pattern: /活动特点[：:]\s*/g, icon: '✨', label: '活动特点：' },
    { pattern: /课程周期[：:]\s*/g, icon: '📚', label: '课程周期：' },
    { pattern: /标准课程周期[：:]\s*/g, icon: '📚', label: '课程周期：' },
    { pattern: /语言[：:]\s*/g, icon: '🌐', label: '语言：' },
    { pattern: /费用[：:]\s*/g, icon: '💰', label: '费用：' },
    { pattern: /官网[：:]\s*/g, icon: '🌐', label: '官网：' },
    { pattern: /联系方式[：:]\s*/g, icon: '📞', label: '联系方式：' },
    // 注意事项：合并两个模式，避免重复替换
    { pattern: /(⚠️\s*)?注意事项[：:]\s*/g, icon: '⚠️', label: '注意事项：' }
  ];

  // 替换所有匹配的字段
  fieldPatterns.forEach(({ pattern, icon, label }) => {
    formatted = formatted.replace(pattern, `\n<strong>${icon} ${label}</strong>`);
  });

  // 标准化换行：多个连续换行替换为单个换行
  formatted = formatted.replace(/\n\s*\n\s*/g, '\n');

  // 转义HTML，但保留我们添加的<strong>标签
  const lines = formatted.split('\n');
  return lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return ''; // 跳过空行

    // 如果是包含<strong>的行，保留原样
    if (trimmed.includes('<strong>')) {
      return trimmed;
    }
    // 普通文本行，转义HTML
    const escaped = trimmed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped;
  }).filter(line => line.length > 0).join('<br>');
}

console.log('🧪 前端活动描述渲染自动化测试\n');
console.log('='.repeat(80));

const testResults = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// 测试所有活动
items.forEach(item => {
  totalTests++;

  const original = item.description || '';
  const formatted = formatDescription(original, item);

  // 统计各种表情符号的数量
  const emojiCounts = {
    '⚠️': { original: 0, formatted: 0 },
    '👥': { original: 0, formatted: 0 },
    '✨': { original: 0, formatted: 0 },
    '📚': { original: 0, formatted: 0 },
    '🌐': { original: 0, formatted: 0 },
    '💰': { original: 0, formatted: 0 },
    '📞': { original: 0, formatted: 0 }
  };

  Object.keys(emojiCounts).forEach(emoji => {
    emojiCounts[emoji].original = (original.match(new RegExp(emoji, 'g')) || []).length;
    emojiCounts[emoji].formatted = (formatted.match(new RegExp(emoji, 'g')) || []).length;
  });

  // 检查是否有重复
  const duplicates = [];
  Object.entries(emojiCounts).forEach(([emoji, counts]) => {
    if (counts.formatted > counts.original) {
      duplicates.push({
        emoji,
        original: counts.original,
        formatted: counts.formatted,
        increase: counts.formatted - counts.original
      });
    }
  });

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
  console.log(`\n❌ 发现 ${failedTests} 个活动存在表情符号重复问题：\n`);

  testResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.id} - ${result.title}`);
    result.duplicates.forEach(dup => {
      console.log(`   ${dup.emoji}: ${dup.original} → ${dup.formatted} (增加${dup.increase}个)`);
    });
    console.log(`   格式化后内容：`);
    console.log(`   ${result.formatted.substring(0, 150)}...`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('\n⚠️  警告：发现前端渲染问题，需要修复！\n');
  process.exit(1);
} else {
  console.log(`\n` + '='.repeat(80));
  console.log(`\n✅ 所有测试通过！前端渲染不会造成表情符号重复。\n`);

  // 随机抽样展示几个正常的渲染结果
  const samples = items.slice(0, 3);
  console.log('📝 渲染示例（前3个活动）：\n');

  samples.forEach(item => {
    const formatted = formatDescription(item.description || '', item);
    const warningCount = (formatted.match(/⚠️/g) || []).length;

    console.log(`${item.activityNumber} - ${item.title}`);
    console.log(`⚠️ 数量：${warningCount}个`);
    console.log(`渲染结果：${formatted.substring(0, 120)}...`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('\n✅ 结论：前端formatDescription函数工作正常，无重复问题\n');
}
