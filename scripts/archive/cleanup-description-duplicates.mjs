#!/usr/bin/env node

/**
 * 清理描述中的重复内容
 * 检测并修复：
 * 1. 段落内容重复
 * 2. 句子内容重复
 * 3. 表情符号重复
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_FILE = join(__dirname, '../data/items.json');
const BACKUP_FILE = join(__dirname, '../data/items.json.backup');

console.log('🔧 清理描述中的重复内容\n');
console.log('='.repeat(80));

// 备份
if (fs.existsSync(DATA_FILE)) {
  fs.copyFileSync(DATA_FILE, BACKUP_FILE);
  console.log('💾 已备份原文件到 items.json.backup\n');
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

  // 1. 清理段落级别的重复
  const paragraphs = cleaned.split(/\n\n+/);
  const uniqueParagraphs = [];

  paragraphs.forEach(para => {
    // 检查是否与之前的段落重复
    const normalized = para.replace(/[⚠️\s，。、；：！？]/g, '').toLowerCase();
    const isDuplicate = uniqueParagraphs.some(p => {
      const existingNormalized = p.replace(/[⚠️\s，。、；：！？]/g, '').toLowerCase();
      return existingNormalized === normalized;
    });

    if (!isDuplicate) {
      uniqueParagraphs.push(para);
    }
  });

  cleaned = uniqueParagraphs.join('\n\n');

  // 2. 清理句子级别的重复（简单版本）
  const sentences = cleaned.split(/[。\n]/);
  const seenSentences = new Set();
  const uniqueSentences = [];

  sentences.forEach(sentence => {
    const normalized = sentence.trim().replace(/[⚠️\s，、；：！？]/g, '').toLowerCase();

    // 如果句子太短（少于5个字符），不进行去重
    if (sentence.length < 5) {
      uniqueSentences.push(sentence);
      return;
    }

    if (!seenSentences.has(normalized)) {
      seenSentences.add(normalized);
      uniqueSentences.push(sentence);
    }
  });

  cleaned = uniqueSentences.join('。\n').replace(/。+/g, '。').trim();

  // 3. 清理连续的⚠️
  cleaned = cleaned.replace(/(⚠️\s*){2,}/g, '⚠️ ');

  // 4. 清理多余的空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned;
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

  // 显示详细修复信息
  if (fixes.length > 0 && fixes.length <= 10) {
    console.log('\n📝 修复详情：\n');
    fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.id} - ${fix.title}`);
      console.log('   原始：');
      console.log(`   ${fix.original.substring(0, 100)}...`);
      console.log('   清理后：');
      console.log(`   ${fix.cleaned.substring(0, 100)}...`);
      console.log('');
    });
  }
} else {
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ 未发现需要修复的描述\n');
}

console.log('='.repeat(80));
console.log('\n✨ 完成！\n');
