#!/usr/bin/env node

/**
 * 清理描述中的重复内容 V2
 * 专门处理尊巴舞活动中的重复问题
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_FILE = join(__dirname, '../data/items.json');
const BACKUP_FILE = join(__dirname, '../data/items.json.backup.v2');

console.log('🔧 清理描述中的重复内容 V2\n');
console.log('='.repeat(80));

// 备份
if (fs.existsSync(DATA_FILE)) {
  fs.copyFileSync(DATA_FILE, BACKUP_FILE);
  console.log('💾 已备份原文件到 items.json.backup.v2\n');
}

const items = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

let fixedCount = 0;
const fixes = [];

/**
 * 清理单个描述中的重复内容
 */
function cleanDescription(desc) {
  if (!desc) return desc;

  let cleaned = desc;
  const original = desc;

  // 1. 清理连续的⚠️（如：⚠️ ⚠️ → ⚠️）
  cleaned = cleaned.replace(/(⚠️\s*){2,}/g, '⚠️ ');

  // 2. 清理⚠️后直接跟句号的情况（如：⚠️ 注意事项：。→ ⚠️ 注意事项：）
  cleaned = cleaned.replace(/(⚠️\s*注意事项[：:]\s*)。/g, '$1');

  // 3. 移除多余的句号
  cleaned = cleaned.replace(/。\n*。\n*/g, '。\n');

  // 4. 清理多余的空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 5. 清理行尾多余的句号
  cleaned = cleaned.replace(/。\n\n\./g, '。\n\n');

  // 6. 移除单独成行的句号
  cleaned = cleaned.replace(/\n。\n/g, '\n');

  return cleaned.trim();
}

// 处理每个活动
items.forEach((item, index) => {
  const originalDesc = item.description || '';
  const cleanedDesc = cleanDescription(originalDesc);

  if (originalDesc !== cleanedDesc) {
    fixedCount++;
    fixes.push({
      id: item.activityNumber || item.id,
      title: item.title,
      original: originalDesc,
      cleaned: cleanedDesc
    });

    // 更新描述
    item.description = cleanedDesc;

    console.log(`\n${fixedCount}. ${item.activityNumber} - ${item.title}`);
    console.log(`   原长度：${originalDesc.length}字符`);
    console.log(`   新长度：${cleanedDesc.length}字符`);
    console.log(`   减少：${originalDesc.length - cleanedDesc.length}字符`);
  }
});

// 保存修改后的数据
if (fixedCount > 0) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ 已修复 ${fixedCount} 个活动的描述`);
  console.log(`💾 已保存到 ${DATA_FILE}`);

  // 显示0060的详细修复信息
  const zumbaFix = fixes.find(f => f.id === '0060');
  if (zumbaFix) {
    console.log('\n📝 0060 尊巴舞（迪卡侬）修复详情：\n');
    console.log('原始描述：');
    console.log(zumbaFix.original);
    console.log('\n清理后：');
    console.log(zumbaFix.cleaned);
  }
} else {
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ 未发现需要修复的描述\n');
}

console.log('\n' + '='.repeat(80));
console.log('\n✨ 完成！\n');
