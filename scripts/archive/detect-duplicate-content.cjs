#!/usr/bin/env node

/**
 * 检测和修复活动描述中的重复内容
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/items.json');
const BACKUP_FILE = path.join(__dirname, '../data/items.json.backup-before-dedup');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(type, message, status = 'INFO') {
  const icons = {
    'PASS': '✅',
    'FAIL': '❌',
    'WARN': '⚠️ ',
    'INFO': 'ℹ️ ',
  };
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : status === 'WARN' ? colors.yellow : colors.cyan;
  console.log(`${color}${icons[status]} [${type}]${colors.reset} ${message}`);
}

// 检测单个描述中的重复内容
function detectDuplicates(description) {
  if (!description) return { hasDuplicates: false, duplicates: [] };

  const duplicates = [];
  const lines = description.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // 提取所有的短语（5-20个字符）
  const phrases = [];
  lines.forEach(line => {
    // 匹配中文短语（5-20个字符）
    const matches = line.match(/[\u4e00-\u9fa5]{5,20}/g);
    if (matches) {
      phrases.push(...matches);
    }
  });

  // 检测短语重复
  const phraseCount = {};
  phrases.forEach(phrase => {
    if (phrase.length >= 5) { // 至少5个字符
      phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
    }
  });

  // 找出重复的短语
  Object.entries(phraseCount).forEach(([phrase, count]) => {
    if (count >= 2) {
      duplicates.push({ phrase, count });
    }
  });

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
    originalLines: lines
  };
}

// 清理重复内容
function cleanDuplicates(description) {
  if (!description) return description;

  let cleaned = description;
  let modified = false;

  // 1. 检测并移除重复的短语
  const lines = cleaned.split('\n');
  const newLines = [];
  const seenPhrases = new Set();

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      newLines.push(line);
      return;
    }

    // 提取当前行的所有短语（5-20个字符）
    const phrases = trimmedLine.match(/[\u4e00-\u9fa5]{5,20}/g) || [];

    let shouldSkip = false;
    phrases.forEach(phrase => {
      if (seenPhrases.has(phrase)) {
        // 发现重复，标记跳过（除非是注意事项部分）
        if (!trimmedLine.includes('⚠️') && !trimmedLine.includes('注意事项')) {
          shouldSkip = true;
          modified = true;
        }
      }
    });

    // 如果不是注意事项，添加短语到已见集合
    if (!trimmedLine.includes('⚠️') && !trimmedLine.includes('注意事项')) {
      phrases.forEach(phrase => {
        if (phrase.length >= 5) {
          seenPhrases.add(phrase);
        }
      });
    }

    if (!shouldSkip) {
      newLines.push(line);
    }
  });

  cleaned = newLines.join('\n');

  // 2. 特殊处理：如果注意事项中重复了前面的内容，移除重复部分
  const noteSection = cleaned.match(/⚠️\s*注意事项[：:]\s*\n?([\s\S]+?)(?=\n|$)/);
  if (noteSection) {
    const noteContent = noteSection[1];
    const beforeNote = cleaned.replace(/⚠️\s*注意事项[：:]\s*[\s\S]+/, '').trim();

    // 检查注意事项内容是否重复了前面的内容
    const beforePhrases = beforeNote.match(/[\u4e00-\u9fa5]{5,20}/g) || [];
    let cleanedNote = noteContent;

    beforePhrases.forEach(phrase => {
      const regex = new RegExp(phrase + '[，、]?', 'g');
      const matches = cleanedNote.match(regex);
      if (matches && matches.length >= 2) {
        // 只保留第一次出现的
        cleanedNote = cleanedNote.replace(regex, '');
        modified = true;
      } else if (matches && matches.length === 1) {
        // 移除注意事项中与前面重复的短语
        cleanedNote = cleanedNote.replace(phrase + '，', '').replace(phrase, '');
        modified = true;
      }
    });

    cleaned = cleaned.replace(/⚠️\s*注意事项[：:]\s*\n?[\s\S]+/, `⚠️ 注意事项：\n${cleanedNote.trim()}`);
  }

  return { cleaned, modified };
}

async function main() {
  console.log(colors.cyan + '='.repeat(80));
  console.log('🔍 活动描述重复内容检测和修复');
  console.log('检测时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(80) + colors.reset + '\n');

  try {
    // 1. 读取数据
    log('读取', '正在读取 items.json...', 'INFO');
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    // 2. 备份原始数据
    log('备份', '创建备份文件...', 'INFO');
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2), 'utf8');
    log('备份', `备份已保存到: ${BACKUP_FILE}`, 'PASS');

    // 3. 检测重复内容
    console.log('\n' + colors.cyan + '开始检测重复内容...' + colors.reset + '\n');

    let totalDuplicates = 0;
    const duplicatedItems = [];

    data.forEach((item, index) => {
      const result = detectDuplicates(item.description);

      if (result.hasDuplicates) {
        totalDuplicates++;
        duplicatedItems.push({
          activityNumber: item.activityNumber,
          title: item.title,
          duplicates: result.duplicates,
          original: item.description
        });

        console.log(colors.yellow + `⚠️ [${item.activityNumber}] ${item.title}` + colors.reset);
        result.duplicates.forEach(dup => {
          console.log(`   重复 "${dup.phrase}" 出现 ${dup.count} 次`);
        });
      }
    });

    console.log('\n' + colors.cyan + '='.repeat(80));
    console.log(`📊 检测结果: 发现 ${totalDuplicates} 个活动包含重复内容`);
    console.log('='.repeat(80) + colors.reset + '\n');

    // 4. 修复重复内容
    if (totalDuplicates > 0) {
      console.log(colors.cyan + '开始修复重复内容...' + colors.reset + '\n');

      let fixedCount = 0;
      data.forEach((item) => {
        const { cleaned, modified } = cleanDuplicates(item.description);
        if (modified) {
          item.description = cleaned;
          fixedCount++;
          log('修复', `[${item.activityNumber}] ${item.title}`, 'PASS');
        }
      });

      // 5. 保存修复后的数据
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
      log('保存', `已修复 ${fixedCount} 个活动的描述`, 'PASS');

      // 6. 显示修复示例
      console.log('\n' + colors.cyan + '📋 修复示例' + colors.reset);
      console.log('='.repeat(80));

      const example = duplicatedItems[0];
      if (example) {
        console.log(`\n活动: [${example.activityNumber}] ${example.title}`);
        console.log('\n修复前:');
        console.log(example.original.substring(0, 200) + '...');

        const fixedItem = data.find(item => item.activityNumber === example.activityNumber);
        console.log('\n修复后:');
        console.log(fixedItem.description.substring(0, 200) + '...');
      }
    } else {
      log('结果', '未发现重复内容 ✅', 'PASS');
    }

    // 7. 总结
    console.log('\n' + colors.cyan + '='.repeat(80));
    console.log('📊 修复总结');
    console.log('='.repeat(80) + colors.reset);
    console.log(`总活动数: ${data.length}`);
    console.log(`发现重复: ${totalDuplicates}`);
    console.log(`修复数量: ${totalDuplicates}`);
    console.log(`备份文件: ${BACKUP_FILE}`);
    console.log('');

    if (totalDuplicates > 0) {
      console.log(colors.green + '✅ 修复完成！' + colors.reset);
      console.log('');
      console.log('💡 下一步：');
      console.log('1. 强制刷新浏览器: Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)');
      console.log('2. 访问主页验证: http://localhost:3000/index.html');
      console.log('3. 查看修复后的活动描述');
      console.log('4. 如果有问题，恢复备份: cp ' + BACKUP_FILE + ' ' + DATA_FILE);
    } else {
      console.log(colors.yellow + 'ℹ️  数据文件无重复内容' + colors.reset);
    }

  } catch (error) {
    console.log(colors.red + `❌ 处理失败: ${error.message}` + colors.reset);
    process.exit(1);
  }
}

main();
