#!/usr/bin/env node

/**
 * 最终代码更新验证脚本
 *
 * 验证所有文件的最新代码状态
 * 确保所有优化都已同步
 */

const fs = require('fs');
const path = require('path');

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

const projectRoot = path.join(__dirname, '..');

// 需要检查的文件列表
const filesToCheck = [
  {
    name: '主文件',
    path: path.join(projectRoot, 'index.html'),
    required: [
      { name: '双感叹号清理', pattern: /清理双感叹号/ },
      { name: '分类标签优化', pattern: /letter-spacing:\s*0\.5px/ },
      { name: 'text-shadow优化', pattern: /text-shadow:\s*0\s+1px\s+2px/ },
    ]
  },
  {
    name: 'Public主文件',
    path: path.join(projectRoot, 'public/index.html'),
    required: [
      { name: '双感叹号清理', pattern: /清理双感叹号/ },
      { name: '分类标签优化', pattern: /letter-spacing:\s*0\.5px/ },
      { name: 'text-shadow优化', pattern: /text-shadow:\s*0\s+1px\s+2px/ },
    ]
  },
  {
    name: 'Prototype Tabs V2',
    path: path.join(projectRoot, 'public/prototype-tabs-v2.html'),
    required: [
      { name: '分类标签优化', pattern: /letter-spacing:\s*0\.5px/ },
    ]
  },
];

function main() {
  console.log(colors.cyan + '='.repeat(80));
  console.log('🔍 最终代码更新验证');
  console.log('验证时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(80) + colors.reset + '\n');

  let totalTests = 0;
  let passedTests = 0;
  const results = [];

  filesToCheck.forEach(file => {
    console.log(colors.cyan + `📄 ${file.name}` + colors.reset);
    console.log('='.repeat(80));

    if (!fs.existsSync(file.path)) {
      log('文件', '文件不存在', 'WARN');
      results.push({ file: file.name, status: 'SKIP' });
      console.log('');
      return;
    }

    const content = fs.readFileSync(file.path, 'utf8');
    let filePassed = true;

    file.required.forEach(check => {
      totalTests++;
      if (check.pattern.test(content)) {
        log('检查', `${check.name} - 存在`, 'PASS');
        passedTests++;
      } else {
        log('检查', `${check.name} - 缺少`, 'FAIL');
        filePassed = false;
      }
    });

    results.push({ file: file.name, status: filePassed ? 'PASS' : 'FAIL' });
    console.log('');
  });

  // 额外检查：数据文件
  console.log(colors.cyan + '📊 数据文件验证' + colors.reset);
  console.log('='.repeat(80));

  const dataFile = path.join(projectRoot, 'data/items.json');
  const dataContent = fs.readFileSync(dataFile, 'utf8');

  totalTests++;
  if (!dataContent.includes('!!')) {
    log('数据文件', '无双感叹号 "!!" ✅', 'PASS');
    passedTests++;
  } else {
    const count = (dataContent.match(/!!/g) || []).length;
    log('数据文件', `发现 ${count} 个双感叹号 "!!" ❌`, 'FAIL');
  }

  totalTests++;
  if (!/⚠️.*⚠️/.test(dataContent)) {
    log('数据文件', '无重复⚠️符号 ✅', 'PASS');
    passedTests++;
  } else {
    log('数据文件', '发现重复⚠️符号 ❌', 'FAIL');
  }

  console.log('\n' + colors.cyan + '='.repeat(80));
  console.log('📊 验证总结');
  console.log('='.repeat(80) + colors.reset);
  console.log(`总测试项: ${totalTests}`);
  console.log(`通过数量: ${passedTests}`);
  console.log(`失败数量: ${totalTests - passedTests}`);
  console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('');

  // 文件状态汇总
  console.log(colors.cyan + '📋 文件状态汇总' + colors.reset);
  console.log('='.repeat(80));
  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️ ';
    const statusText = result.status === 'PASS' ? '已更新' : result.status === 'FAIL' ? '需要更新' : '跳过';
    console.log(`${status} ${result.file}: ${statusText}`);
  });

  console.log('');
  console.log(colors.cyan + '='.repeat(80));

  if (passedTests === totalTests) {
    console.log(colors.green + '✅ 所有代码已是最新版本！' + colors.reset);
    console.log('');
    console.log('💡 下一步：');
    console.log('1. 强制刷新浏览器: Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)');
    console.log('2. 访问主页: http://localhost:3000/index.html');
    console.log('3. 验证所有优化功能正常工作');
  } else {
    console.log(colors.red + `❌ ${totalTests - passedTests} 项检查未通过，请更新相关文件。` + colors.reset);
  }

  console.log('');

  process.exit(passedTests === totalTests ? 0 : 1);
}

main();
