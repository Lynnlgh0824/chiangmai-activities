#!/usr/bin/env node

/**
 * 清理活动描述中的冗余符号和格式问题
 *
 * 清理内容：
 * 1. 双感叹号文本符号 "!!" → 单个 "!"
 * 2. 多重感叹号emoji ‼️ → ⚠️
 * 3. 重复的⚠️符号
 * 4. 重复的标点符号
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/items.json');
const BACKUP_FILE = path.join(__dirname, '../data/items.json.backup-before-cleanup');

// 颜色输出
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

// 清理单个描述文本
function cleanDescription(description) {
  if (!description) return description;

  let cleaned = description;

  // 1. 清理双感叹号文本符号 "!!"
  const beforeDoubleExclamation = cleaned;
  cleaned = cleaned.replace(/!!+/g, '!');
  if (beforeDoubleExclamation !== cleaned) {
    log('清理', `发现双感叹号 "!!" → 已替换为单感叹号`, 'WARN');
  }

  // 2. 清理多重感叹号emoji（如 ‼️ ❗❗）
  if (cleaned.includes('‼️') || cleaned.includes('❗❗')) {
    log('清理', `发现多重感叹号emoji → 已替换为⚠️`, 'WARN');
    cleaned = cleaned.replace(/‼️+/g, '⚠️');
    cleaned = cleaned.replace(/❗❗+/g, '⚠️');
    cleaned = cleaned.replace(/❗+/g, '⚠️');
  }

  // 3. 清理重复的警告符号（多个⚠️连在一起）
  if (/(⚠️\s*){2,}/.test(cleaned)) {
    log('清理', `发现重复⚠️符号 → 已合并`, 'WARN');
    cleaned = cleaned.replace(/(⚠️\s*){2,}/g, '⚠️ ');
  }

  // 4. 清理重复的标点符号
  if (/。+|：+|，+/.test(cleaned)) {
    log('清理', `发现重复标点符号 → 已标准化`, 'WARN');
    cleaned = cleaned.replace(/。+/g, '。');
    cleaned = cleaned.replace(/：+/g, '：');
    cleaned = cleaned.replace(/，+/g, '，');
  }

  // 5. 清理行首行尾多余空格
  cleaned = cleaned.replace(/^\s+|\s+$/gm, '');

  return cleaned;
}

// 主函数
function main() {
  console.log(colors.cyan + '='.repeat(80));
  console.log('🧹 清理活动描述中的冗余符号');
  console.log('='.repeat(80) + colors.reset);

  try {
    // 1. 读取数据
    log('读取', '正在读取 items.json...', 'INFO');
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    // 2. 备份原始数据
    log('备份', '创建备份文件...', 'INFO');
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2), 'utf8');
    log('备份', `备份已保存到: ${BACKUP_FILE}`, 'PASS');

    // 3. 统计信息
    let totalCleaned = 0;
    let modifiedItems = [];

    // 4. 清理每个活动的描述
    console.log('\n' + colors.cyan + '开始清理...' + colors.reset + '\n');

    data.forEach((item, index) => {
      const originalDesc = item.description;

      if (originalDesc) {
        const cleanedDesc = cleanDescription(originalDesc);

        if (originalDesc !== cleanedDesc) {
          totalCleaned++;
          modifiedItems.push({
            activityNumber: item.activityNumber,
            title: item.title,
            original: originalDesc.substring(0, 100) + '...',
          });

          // 更新描述
          item.description = cleanedDesc;
        }
      }
    });

    // 5. 保存清理后的数据
    if (totalCleaned > 0) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
      log('保存', `已更新 ${totalCleaned} 个活动的描述`, 'PASS');
    } else {
      log('结果', '未发现需要清理的内容', 'PASS');
    }

    // 6. 显示修改详情
    if (modifiedItems.length > 0) {
      console.log('\n' + colors.cyan + '='.repeat(80));
      console.log(`📋 修改的活动列表 (${modifiedItems.length}个)`);
      console.log('='.repeat(80) + colors.reset + '\n');

      modifiedItems.slice(0, 10).forEach((item, idx) => {
        console.log(`${idx + 1}. [${item.activityNumber}] ${item.title}`);
        console.log(`   原始: ${item.original}\n`);
      });

      if (modifiedItems.length > 10) {
        console.log(`... 还有 ${modifiedItems.length - 10} 个活动\n`);
      }
    }

    // 7. 总结
    console.log('\n' + colors.cyan + '='.repeat(80));
    console.log('📊 清理总结');
    console.log('='.repeat(80) + colors.reset);
    console.log(`总活动数: ${data.length}`);
    console.log(`修改数量: ${totalCleaned}`);
    console.log(`备份文件: ${BACKUP_FILE}`);
    console.log('');

    if (totalCleaned > 0) {
      console.log(colors.green + '✅ 清理完成！' + colors.reset);
      console.log('');
      console.log('💡 下一步：');
      console.log('1. 强制刷新浏览器: Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)');
      console.log('2. 访问主页验证效果: http://localhost:3000/index.html');
      console.log('3. 如果有问题，恢复备份: cp ' + BACKUP_FILE + ' ' + DATA_FILE);
    } else {
      console.log(colors.yellow + 'ℹ️  数据文件已经是干净的，无需清理' + colors.reset);
    }

  } catch (error) {
    console.log(colors.red + `❌ 清理失败: ${error.message}` + colors.reset);
    process.exit(1);
  }
}

// 运行脚本
main();
