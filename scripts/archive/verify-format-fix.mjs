#!/usr/bin/env node

/**
 * 验证formatDescription修复效果
 * 模拟前端渲染，检查是否会重复⚠️标签
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const items = JSON.parse(fs.readFileSync(join(__dirname, '../data/items.json'), 'utf8'));

// 模拟修复后的formatDescription函数
function formatDescription(description) {
  if (!description) return '暂无描述';

  let formatted = description;

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

  return formatted;
}

// 测试受影响的4个活动
const testIds = ['0001', '0004', '0018', '0020'];

console.log('🔍 验证修复后的formatDescription函数\n');
console.log('='.repeat(80));

let allPass = true;

testIds.forEach(id => {
  const item = items.find(i => i.id === id);
  if (item) {
    const original = item.description;
    const formatted = formatDescription(original);

    // 统计⚠️出现的次数
    const originalCount = (original.match(/⚠️/g) || []).length;
    const formattedCount = (formatted.match(/⚠️/g) || []).length;

    console.log(`\n活动 ${item.activityNumber} - ${item.title}`);
    console.log(`原始⚠️数量: ${originalCount}`);
    console.log(`格式化后⚠️数量: ${formattedCount}`);

    if (formattedCount > originalCount) {
      console.log('⚠️  警告：数量增加了，可能有重复！');
      console.log('格式化后的内容（前200字符）：');
      console.log(formatted.substring(0, 200));
      allPass = false;
    } else {
      console.log('✅ 正常：数量未增加');
    }
  }
});

console.log('\n' + '='.repeat(80));

if (allPass) {
  console.log('\n✅ 验证通过：修复后的前端代码不会造成⚠️标签重复\n');
  console.log('说明：');
  console.log('- 数据中的⚠️已包含在描述中');
  console.log('- 前端的formatDescription函数已修复，使用合并后的模式');
  console.log('- 模式 /(⚠️\\s*)?注意事项[：:]\\s*/g 会匹配一次并替换');
  console.log('- 不会造成重复显示');
} else {
  console.log('\n❌ 验证失败：仍有重复问题需要修复\n');
}
