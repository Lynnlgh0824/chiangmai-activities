#!/usr/bin/env node

/**
 * 清理描述中的符号问题 - 最终版
 * 规则：换行前后的句号都应该移除
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_FILE = join(__dirname, '../data/items.json');
const BACKUP_FILE = join(__dirname, '../data/items.json.backup.final');

console.log('🔧 清理描述中的符号问题 - 最终版\n');
console.log('='.repeat(80));

// 备份
if (fs.existsSync(DATA_FILE)) {
  fs.copyFileSync(DATA_FILE, BACKUP_FILE);
  console.log('💾 已备份原文件到 items.json.backup.final\n');
}

const items = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

let fixedCount = 0;

/**
 * 清理描述中的符号问题
 */
function cleanSymbols(desc) {
  if (!desc) return desc;

  let cleaned = desc;

  // 1. 移除单独成行的句号
  cleaned = cleaned.replace(/\n[。\s]+\n/g, '\n');

  // 2. 移除换行前的句号（如："内容1。\n\n内容2" → "内容1\n\n内容2"）
  cleaned = cleaned.replace(/。\n\n/g, '\n\n');

  // 3. 移除换行后的句号
  cleaned = cleaned.replace(/\n\n。/g, '\n\n');

  // 4. 清理连续的⚠️（保留一个）
  cleaned = cleaned.replace(/(⚠️\s*){2,}/g, '⚠️ ');

  // 5. 清理⚠️后多余的标点
  cleaned = cleaned.replace(/(⚠️\s*注意事项[：:]\s*)。/g, '$1');

  // 6. 清理多余的空行（超过2个连续换行）
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 7. 清理句号后直接跟换行+句号的情况
  cleaned = cleaned.replace(/。\n。\n/g, '\n');

  // 8. 移除开头的句号
  cleaned = cleaned.replace(/^。/, '');

  // 9. 移除结尾的句号
  cleaned = cleaned.replace(/。$/, '');

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
    console.log(`   长度变化：${originalDesc.length} → ${cleanedDesc.length} (${originalDesc.length > cleanedDesc.length ? '✅ 减少' : '⚠️ 增加'}${Math.abs(originalDesc.length - cleanedDesc.length)}字符)`);

    // 如果是0060，显示详细内容
    if (item.id === '0060') {
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('   原始描述：');
      console.log('   ' + originalDesc.replace(/\n/g, ' ↵ '));
      console.log('\n   清理后：');
      console.log('   ' + cleanedDesc.replace(/\n/g, ' ↵ '));
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

// 验证0060
const zumba = items.find(i => i.id === '0060');
if (zumba) {
  console.log('='.repeat(80));
  console.log('\n📝 0060 尊巴舞（迪卡侬）最终验证：\n');
  console.log(zumba.description);
  console.log('\n' + '='.repeat(80));
}
