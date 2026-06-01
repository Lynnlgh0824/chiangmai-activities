#!/usr/bin/env node

/**
 * 重复内容检测脚本 V2
 * 增强版：更智能地检测description中的重复内容
 */

const items = require('../data/items.json');

console.log('🔍 重复内容检测报告 V2\n');
console.log('='.repeat(80));

let duplicateCount = 0;
const issues = [];

items.forEach(item => {
  const desc = item.description || '';
  const lines = desc.split('\n').filter(line => line.trim());

  // 检测1: ⚠️ 注意事项前后的内容重复
  const warningIndex = lines.findIndex(line =>
    line.includes('⚠️') ||
    line.includes('注意事项') ||
    line.includes('注意：')
  );

  if (warningIndex > 0) {
    // 检查注意事项前的内容是否与注意事项后的内容重复
    const beforeWarning = lines.slice(0, warningIndex);
    const afterWarning = lines.slice(warningIndex + 1);

    beforeWarning.forEach(beforeLine => {
      afterWarning.forEach(afterLine => {
        if (isSimilar(beforeLine, afterLine)) {
          duplicateCount++;
          issues.push({
            id: item.activityNumber,
            title: item.title,
            type: '注意事项前后重复',
            content1: beforeLine,
            content2: afterLine,
            severity: 'high'
          });
        }
      });
    });
  }

  // 检测2: 检查description中是否有整行重复
  const seenLines = new Map();
  lines.forEach((line, index) => {
    const normalized = normalizeLine(line);
    if (seenLines.has(normalized)) {
      duplicateCount++;
      issues.push({
        id: item.activityNumber,
        title: item.title,
        type: '整行重复',
        content1: seenLines.get(normalized),
        content2: line,
        line1: seenLines.get(normalized + '_index'),
        line2: index,
        severity: 'high'
      });
    } else {
      seenLines.set(normalized, line);
      seenLines.set(normalized + '_index', index);
    }
  });

  // 检测3: 检查关键短语在描述中出现多次
  const keyPhrases = extractKeyPhrases(desc);
  keyPhrases.forEach(phrase => {
    const regex = new RegExp(escapeRegExp(phrase), 'gi');
    const matches = desc.match(regex);
    if (matches && matches.length > 1) {
      // 检查是否在注意事项前后都出现
      const warningParts = desc.split(/⚠️|注意事项|注意：/);
      if (warningParts.length > 1) {
        const inBefore = warningParts[0].includes(phrase);
        const inAfter = warningParts.slice(1).some(part => part.includes(phrase));

        if (inBefore && inAfter) {
          duplicateCount++;
          issues.push({
            id: item.activityNumber,
            title: item.title,
            type: '关键短语重复',
            content1: `"${phrase}" 在注意事项前后都出现`,
            content2: `共出现 ${matches.length} 次`,
            severity: 'medium'
          });
        }
      }
    }
  });
});

// 输出结果
if (issues.length === 0) {
  console.log('✅ 未发现重复内容！');
} else {
  console.log(`\n📊 检测结果：发现 ${issues.length} 个重复问题\n`);
  console.log('='.repeat(80));

  issues.forEach((issue, index) => {
    const severityIcon = issue.severity === 'high' ? '🔴' : '🟡';
    console.log(`\n${severityIcon} 【${index + 1}】${issue.id} - ${issue.title}`);
    console.log(`   类型：${issue.type}`);
    console.log(`   内容1：${issue.content1}`);
    console.log(`   内容2：${issue.content2}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n📋 需要修复的活动数量：${[...new Set(issues.map(i => i.id))].length}个`);
  console.log('📝 重复问题总数：' + issues.length + '个');
}

// 辅助函数

/**
 * 判断两行文本是否相似（去除格式化差异后比较）
 */
function isSimilar(line1, line2) {
  const normalized1 = normalizeLine(line1);
  const normalized2 = normalizeLine(line2);

  // 完全相同
  if (normalized1 === normalized2) return true;

  // 相似度超过80%
  const similarity = calculateSimilarity(normalized1, normalized2);
  return similarity > 0.8;
}

/**
 * 规范化文本行（去除格式化差异）
 */
function normalizeLine(line) {
  return line
    .toLowerCase()
    .replace(/[，。、；：！？]/g, '') // 去除中文标点
    .replace(/[,\.\;\:\!\?]/g, '')  // 去除英文标点
    .replace(/\s+/g, '')             // 去除空格
    .replace(/[（）()]/g, '')         // 去除括号
    .trim();
}

/**
 * 计算两段文本的相似度（Levenshtein距离）
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
 * 提取关键短语（长度4-20的短语）
 */
function extractKeyPhrases(text) {
  const phrases = [];
  const sentences = text.split(/[。\n]/);

  sentences.forEach(sentence => {
    // 提取包含重要信息的短语
    const importantPatterns = [
      /(?:需|需要|必须|建议)[\u4e00-\u9fa5]{2,15}/,
      /(?:泰铢|价格|费用)[\u4e00-\u9fa5]{0,10}/,
      /(?:时间|日期)[\u4e00-\u9fa5]{0,10}/,
      /(?:预约|预订|报名)[\u4e00-\u9fa5]{0,10}/
    ];

    importantPatterns.forEach(pattern => {
      const matches = sentence.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (match.length >= 4 && match.length <= 20) {
            phrases.push(match);
          }
        });
      }
    });
  });

  return [...new Set(phrases)]; // 去重
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
