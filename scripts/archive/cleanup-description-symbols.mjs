#!/usr/bin/env node

/**
 * 清理描述中的符号问题
 * 1. 移除单独成行的句号
 * 2. 清理⚠️重复
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_FILE = join(__dirname, '../data/items.json');

console.log('🔧 清理描述中的符号问题\n');
console.log('='.repeat(80));

const items = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

let fixedCount = 0;

/**
 * 清理描述中的符号问题
 */
function cleanSymbols(desc) {
  if (!desc) return desc;

  let cleaned = desc;

  // 1. 移除单独成行的句号（包括前后有换行符的情况）
  cleaned = cleaned.replace(/\n[。\s]+\n/g, '\n');
  cleaned = cleaned.replace(/^[。\s]+\n/, '');
  cleaned = cleaned.replace(/\n[。\s]+$/, '\n');

  // 2. 清理连续的⚠️（保留一个）
  cleaned = cleaned.replace(/(⚠️\s*){2,}/g, '⚠️ ');

  // 3. 清理⚠️后多余的标点（如：⚠️ 注意事项：。→ ⚠️ 注意事项：）
  cleaned = cleaned.replace(/(⚠️\s*注意事项[：:]\s*)。/g, '$1');

  // 4. 移除行尾多余的句号
  cleaned = cleaned.replace(/。\n\n\./g, '。\n\n');

  // 5. 清理多余的空行（超过2个连续换行）
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 6. 清理句号后直接跟换行+句号的情况
  cleaned = cleaned.replace(/。\n。\n/g, '。\n');

  return cleaned.trim();
}

// 处理每个活动
items.forEach((item) => {
  const originalDesc = item.description || '';
  const cleanedDesc = cleanSymbols(originalDesc);

  if (originalDesc !== cleanedDesc) {
    fixedCount++;
    item.description = cleanedDesc;

    console.log(`${fixedCount}. ${item.activityNumber} - ${item.title}`);
    console.log(`   原长度：${originalDesc.length} → 新长度：${cleanedDesc.length} (${originalDesc.length - cleanedDesc.length > 0 ? '减少' : '增加'}${Math.abs(originalDesc.length - cleanedDesc.length)}字符)`);

    // 如果是0060，显示详细内容
    if (item.id === '0060') {
      console.log('   原始：');
      console.log('   ' + originalDesc.replace(/\n/g, '\\n'));
      console.log('   清理后：');
      console.log('   ' + cleanedDesc.replace(/\n/g, '\\n'));
    }
  }
});

// 保存修改后的数据
if (fixedCount > 0) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ 已修复 ${fixedCount} 个活动的描述`);
  console.log(`💾 已保存到 ${DATA_FILE}\n`);
} else {
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ 所有描述正常，无需修复\n');
}

console.log('='.repeat(80));
console.log('\n✨ 完成！\n');
