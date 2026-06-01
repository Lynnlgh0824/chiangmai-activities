#!/usr/bin/env node

/**
 * 全面分析所有45个活动的描述格式问题
 */

const fs = require('fs');
const items = JSON.parse(fs.readFileSync('./data/items.json', 'utf8'));

console.log('🔍 开始全面分析所有活动描述格式...\n');
console.log('='.repeat(80));

const issues = [];
const issueTypes = {
  multipleWarning: [],      // 多个⚠️符号
  duplicateContent: [],      // 描述和注意事项内容重复
  duplicatePhrase: [],       // 重复的短语/词组
  formatIssues: [],          // 格式问题（空行、标点等）
  missingStructure: []       // 缺少标准结构
};

items.forEach(item => {
  const desc = item.description || '';
  const itemIssues = [];

  // 1. 检测多个⚠️符号
  const warningCount = (desc.match(/⚠️/g) || []).length;
  if (warningCount > 1) {
    itemIssues.push({
      type: 'multipleWarning',
      severity: 'high',
      message: `发现${warningCount}个⚠️符号（应该只有1个）`
    });
    issueTypes.multipleWarning.push(item.activityNumber);
  }

  // 2. 检测重复的常见短语
  const duplicatePhrases = [];

  // 检测"不限时"重复
  const buxianshiCount = (desc.match(/不限时/g) || []).length;
  if (buxianshiCount > 1) {
    duplicatePhrases.push('"不限时"重复' + buxianshiCount + '次');
  }

  // 检测"时间灵活"重复
  const timeFlexibleCount = (desc.match(/时间灵活/g) || []).length;
  if (timeFlexibleCount > 1) {
    duplicatePhrases.push('"时间灵活"重复' + timeFlexibleCount + '次');
  }

  // 检测"需要提前预约"重复
  const bookingCount = (desc.match(/需要提前预约|需提前预约|建议提前预约/g) || []).length;
  if (bookingCount > 1) {
    duplicatePhrases.push('"预约"相关重复' + bookingCount + '次');
  }

  if (duplicatePhrases.length > 0) {
    itemIssues.push({
      type: 'duplicatePhrase',
      severity: 'medium',
      message: duplicatePhrases.join('; ')
    });
    issueTypes.duplicatePhrase.push({
      id: item.activityNumber,
      title: item.title,
      phrases: duplicatePhrases
    });
  }

  // 3. 检测描述和注意事项内容重复
  if (desc.includes('⚠️ 注意事项：')) {
    const parts = desc.split('⚠️ 注意事项：');
    if (parts.length === 2) {
      const main = parts[0].trim();
      const note = parts[1].trim();

      // 检查是否有相同的句子
      const mainSentences = main.split(/[。！？\n]/).filter(s => s.trim().length > 8);
      const noteSentences = note.split(/[。！？\n]/).filter(s => s.trim().length > 8);

      let identicalCount = 0;
      const identicalSentences = [];

      mainSentences.forEach(ms => {
        noteSentences.forEach(ns => {
          if (ms.trim() === ns.trim() && ms.trim().length > 10) {
            identicalCount++;
            identicalSentences.push(ms.trim());
          }
        });
      });

      if (identicalCount > 0) {
        itemIssues.push({
          type: 'duplicateContent',
          severity: 'high',
          message: `描述和注意事项有${identicalCount}句完全相同的内容`
        });
        issueTypes.duplicateContent.push({
          id: item.activityNumber,
          title: item.title,
          count: identicalCount
        });
      }
    }
  }

  // 4. 检测格式问题
  const formatErrors = [];

  // 连续空行
  if (desc.includes('\n\n\n')) {
    formatErrors.push('连续空行(\\n\\n\\n)');
  }

  // 英文标点符号结尾
  if (/[,;:]$/.test(desc.trim())) {
    formatErrors.push('以英文标点结尾');
  }

  // 括号不匹配
  const openBrackets = (desc.match(/\(/g) || []).length;
  const closeBrackets = (desc.match(/\)/g) || []).length;
  if (openBrackets !== closeBrackets) {
    formatErrors.push(`括号不匹配(${openBrackets}个开括号 vs ${closeBrackets}个闭括号)`);
  }

  if (formatErrors.length > 0) {
    itemIssues.push({
      type: 'formatIssues',
      severity: 'low',
      message: formatErrors.join('; ')
    });
    issueTypes.formatIssues.push({
      id: item.activityNumber,
      title: item.title,
      errors: formatErrors
    });
  }

  // 5. 检测缺少标准结构
  const hasWarning = desc.includes('⚠️');
  const hasMainContent = desc.replace('⚠️ 注意事项：', '').trim().length > 20;

  if (!hasWarning && hasMainContent && desc.length > 50) {
    itemIssues.push({
      type: 'missingStructure',
      severity: 'low',
      message: '缺少"⚠️ 注意事项"部分，建议添加以提升可读性'
    });
    issueTypes.missingStructure.push({
      id: item.activityNumber,
      title: item.title
    });
  }

  if (itemIssues.length > 0) {
    issues.push({
      id: item.activityNumber,
      title: item.title,
      description: desc,
      issues: itemIssues
    });
  }
});

// 输出报告
console.log(`\n📊 统计结果：`);
console.log(`总活动数: ${items.length}`);
console.log(`有问题活动: ${issues.length} (${(issues.length/items.length*100).toFixed(1)}%)`);
console.log(`格式完美: ${items.length - issues.length} (${((items.length - issues.length)/items.length*100).toFixed(1)}%)`);

console.log(`\n🔴 问题分类统计：`);
console.log(`  1. 多个⚠️符号: ${issueTypes.multipleWarning.length}个`);
console.log(`  2. 描述和注意事项内容重复: ${issueTypes.duplicateContent.length}个`);
console.log(`  3. 重复短语/词组: ${issueTypes.duplicatePhrase.length}个`);
console.log(`  4. 格式问题: ${issueTypes.formatIssues.length}个`);
console.log(`  5. 缺少标准结构: ${issueTypes.missingStructure.length}个`);

console.log(`\n` + '='.repeat(80));
console.log(`📋 详细问题列表：\n`);

issues.forEach((item, index) => {
  console.log(`${index + 1}. 【${item.id}】${item.title}`);

  item.issues.forEach(issue => {
    const severityIcon = {
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    }[issue.severity];

    console.log(`   ${severityIcon} ${issue.message}`);
  });

  // 显示部分描述内容（前150字符）
  const preview = item.description.substring(0, 150).replace(/\n/g, ' ');
  console.log(`   📝 描述预览: ${preview}...`);
  console.log('');
});

// 输出重复短语的详细列表
if (issueTypes.duplicatePhrase.length > 0) {
  console.log('='.repeat(80));
  console.log(`\n🔄 重复短语详细列表：\n`);

  issueTypes.duplicatePhrase.forEach(item => {
    console.log(`【${item.id}】${item.title}`);
    item.phrases.forEach(phrase => {
      console.log(`  - ${phrase}`);
    });
    console.log('');
  });
}

// 输出格式问题的详细列表
if (issueTypes.formatIssues.length > 0) {
  console.log('='.repeat(80));
  console.log(`\n📐 格式问题详细列表：\n`);

  issueTypes.formatIssues.forEach(item => {
    console.log(`【${item.id}】${item.title}`);
    item.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
    console.log('');
  });
}

console.log('='.repeat(80));
console.log(`\n✅ 分析完成！发现问题总数: ${issues.length}个活动\n`);
