#!/usr/bin/env node

/**
 * 检测并修复描述中的内容重复
 * 专门处理句子级别的重复问题
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_FILE = join(__dirname, '../data/items.json');
const BACKUP_FILE = join(__dirname, '../data/items.json.backup.content-dup');

console.log('🔍 检测并修复描述中的内容重复\n');
console.log('='.repeat(80));

// 备份
if (fs.existsSync(DATA_FILE)) {
  fs.copyFileSync(DATA_FILE, BACKUP_FILE);
  console.log('💾 已备份原文件到 items.json.backup.content-dup\n');
}

const items = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

/**
 * 计算两个字符串的相似度（Levenshtein距离）
 */
function calculateSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - matrix[len1][len2] / maxLen;
}

/**
 * 规范化文本（去除格式差异）
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[，。、；：！？]/g, '')
    .replace(/[,\.\;\:\!\?]/g, '')
    .replace(/\s+/g, '')
    .replace(/[⚠️👥✨📚🌐💰📞]/g, '')
    .trim();
}

/**
 * 检测描述中的重复内容
 */
function detectContentDuplicates(desc) {
  if (!desc) return { hasDuplicates: false, duplicates: [] };

  const lines = desc.split('\n').filter(l => l.trim());
  const duplicates = [];

  // 检测每一行与其他行的相似度
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const line1 = lines[i];
      const line2 = lines[j];

      // 规范化后比较
      const norm1 = normalizeText(line1);
      const norm2 = normalizeText(line2);

      if (norm1 === norm2 && norm1.length > 5) {
        // 完全相同
        duplicates.push({
          type: '完全重复',
          line1: i + 1,
          line2: j + 1,
          content1: line1,
          content2: line2,
          similarity: 100
        });
      } else {
        // 计算相似度
        const similarity = calculateSimilarity(norm1, norm2);
        if (similarity > 0.7 && norm1.length > 5 && norm2.length > 5) {
          duplicates.push({
            type: '高度相似',
            line1: i + 1,
            line2: j + 1,
            content1: line1,
            content2: line2,
            similarity: Math.round(similarity * 100)
          });
        }
      }
    }
  }

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates
  };
}

/**
 * 修复描述中的重复内容
 */
function fixContentDuplicates(desc) {
  if (!desc) return desc;

  let cleaned = desc;
  const lines = cleaned.split('\n');
  const seenHashes = new Set();
  const uniqueLines = [];

  lines.forEach(line => {
    const normalized = normalizeText(line);

    // 如果太短（少于5个字符），保留
    if (normalized.length < 5) {
      uniqueLines.push(line);
      return;
    }

    // 如果已经见过相同的内容，跳过
    if (!seenHashes.has(normalized)) {
      seenHashes.add(normalized);
      uniqueLines.push(line);
    } else {
      console.log(`      跳过重复：${line.substring(0, 40)}...`);
    }
  });

  return uniqueLines.join('\n').trim();
}

// 先检测所有活动
console.log('📊 第1步：检测重复内容\n');
console.log('─'.repeat(80));

const issues = [];
items.forEach(item => {
  const result = detectContentDuplicates(item.description);

  if (result.hasDuplicates) {
    issues.push({
      id: item.activityNumber || item.id,
      title: item.title,
      duplicates: result.duplicates
    });
  }
});

if (issues.length === 0) {
  console.log('✅ 未发现内容重复问题\n');
  process.exit(0);
}

console.log(`发现 ${issues.length} 个活动存在内容重复：\n`);
issues.forEach((issue, index) => {
  console.log(`${index + 1}. ${issue.id} - ${issue.title}`);
  issue.duplicates.forEach(dup => {
    console.log(`   [${dup.type}] 第${dup.line1}行 ↔ 第${dup.line2}行 (${dup.similarity}%相似)`);
    console.log(`   "${dup.content1.substring(0, 50)}..."`);
  });
  console.log('');
});

// 修复重复内容
console.log('\n📊 第2步：修复重复内容\n');
console.log('─'.repeat(80));

let fixedCount = 0;

items.forEach(item => {
  const originalDesc = item.description || '';
  const fixedDesc = fixContentDuplicates(originalDesc);

  if (originalDesc !== fixedDesc) {
    fixedCount++;
    item.description = fixedDesc;

    console.log(`${fixedCount}. ${item.activityNumber} - ${item.title}`);
    console.log(`   长度：${originalDesc.length} → ${fixedDesc.length} (${originalDesc.length - fixedDesc.length}字符)`);

    // 如果是0060，显示详细内容
    if (item.id === '0060') {
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('   修复前：');
      console.log('   ' + originalDesc.replace(/\n/g, ' ↵ '));
      console.log('\n   修复后：');
      console.log('   ' + fixedDesc.replace(/\n/g, ' ↵ '));
    }
    console.log('');
  }
});

// 保存修改
if (fixedCount > 0) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
  console.log('='.repeat(80));
  console.log(`\n✅ 已修复 ${fixedCount} 个活动的描述`);
  console.log(`💾 已保存到 ${DATA_FILE}\n`);
} else {
  console.log('='.repeat(80));
  console.log('\n⚠️  检测到重复但无法自动修复，请手动处理\n');
}

console.log('='.repeat(80));
console.log('\n✨ 完成！\n');
