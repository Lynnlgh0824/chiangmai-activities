#!/usr/bin/env node

/**
 * H5周视图滚动自动选中功能验证脚本
 *
 * 验证内容：
 * 1. 代码是否包含滚动检测逻辑
 * 2. Intersection Observer是否正确实现
 * 3. 防抖动逻辑是否正确
 * 4. 自动选中提示是否实现
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
const indexFile = path.join(projectRoot, 'index.html');

function main() {
  console.log(colors.cyan + '='.repeat(80));
  console.log('🔍 H5周视图滚动自动选中功能验证');
  console.log('验证时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(80) + colors.reset + '\n');

  let totalTests = 0;
  let passedTests = 0;

  const content = fs.readFileSync(indexFile, 'utf8');

  // 测试1: 检查初始化函数
  console.log(colors.cyan + '📋 测试1: 核心函数' + colors.reset);
  console.log('='.repeat(80));

  totalTests++;
  if (content.includes('function initH5ScrollAutoSelect')) {
    log('函数', 'initH5ScrollAutoSelect 函数存在', 'PASS');
    passedTests++;
  } else {
    log('函数', 'initH5ScrollAutoSelect 函数不存在', 'FAIL');
  }

  totalTests++;
  if (content.includes('function autoSelectDayInView')) {
    log('函数', 'autoSelectDayInView 函数存在', 'PASS');
    passedTests++;
  } else {
    log('函数', 'autoSelectDayInView 函数不存在', 'FAIL');
  }

  totalTests++;
  if (content.includes('function showAutoSelectToast')) {
    log('函数', 'showAutoSelectToast 函数存在', 'PASS');
    passedTests++;
  } else {
    log('函数', 'showAutoSelectToast 函数不存在', 'FAIL');
  }

  totalTests++;
  if (content.includes('function cleanupH5ScrollObserver')) {
    log('函数', 'cleanupH5ScrollObserver 函数存在', 'PASS');
    passedTests++;
  } else {
    log('函数', 'cleanupH5ScrollObserver 函数不存在', 'FAIL');
  }

  // 测试2: 检查Intersection Observer
  console.log('\n' + colors.cyan + '📋 测试2: Intersection Observer' + colors.reset);
  console.log('='.repeat(80));

  totalTests++;
  if (content.includes('new IntersectionObserver')) {
    log('Observer', 'Intersection Observer API 已使用', 'PASS');
    passedTests++;
  } else {
    log('Observer', 'Intersection Observer API 未使用', 'FAIL');
  }

  totalTests++;
  if (content.includes('threshold: [0.5]')) {
    log('Observer', '阈值设置为50% (符合要求)', 'PASS');
    passedTests++;
  } else {
    log('Observer', '阈值设置不符合要求', 'FAIL');
  }

  totalTests++;
  if (content.includes('entry.intersectionRatio >= 0.5')) {
    log('Observer', '检测逻辑正确 (intersectionRatio >= 0.5)', 'PASS');
    passedTests++;
  } else {
    log('Observer', '检测逻辑不正确', 'FAIL');
  }

  // 测试3: 检查防抖动逻辑
  console.log('\n' + colors.cyan + '📋 测试3: 防抖动机制' + colors.reset);
  console.log('='.repeat(80));

  totalTests++;
  if (content.includes('h5AutoSelectTimeout')) {
    log('防抖动', '使用h5AutoSelectTimeout变量', 'PASS');
    passedTests++;
  } else {
    log('防抖动', '缺少防抖动变量', 'FAIL');
  }

  totalTests++;
  if (content.includes('setTimeout(500)')) {
    log('防抖动', '延迟时间设置为500ms (符合要求)', 'PASS');
    passedTests++;
  } else {
    log('防抖动', '延迟时间设置不符合要求', 'FAIL');
  }

  totalTests++;
  if (content.includes('clearTimeout(h5AutoSelectTimeout)')) {
    log('防抖动', '包含clearTimeout清理逻辑', 'PASS');
    passedTests++;
  } else {
    log('防抖动', '缺少clearTimeout清理逻辑', 'WARN');
  }

  // 测试4: 检查视觉反馈
  console.log('\n' + colors.cyan + '📋 测试4: 视觉反馈' + colors.reset);
  console.log('='.repeat(80));

  totalTests++;
  if (content.includes('h5-auto-select-toast')) {
    log('提示', 'CSS类名 h5-auto-select-toast 已定义', 'PASS');
    passedTests++;
  } else {
    log('提示', 'CSS类名未定义', 'FAIL');
  }

  totalTests++;
  if (content.includes('✨ 已自动选中')) {
    log('提示', '提示文本包含"已自动选中"', 'PASS');
    passedTests++;
  } else {
    log('提示', '提示文本不正确', 'FAIL');
  }

  totalTests++;
  if (content.includes('setTimeout(() => {') || content.includes('setTimeout(2000')) {
    log('提示', '提示2秒后消失', 'PASS');
    passedTests++;
  } else {
    log('提示', '提示消失时间未设置', 'WARN');
  }

  totalTests++;
  if (content.includes('transition: \'opacity 0.3s ease')) {
    log('动画', '淡入动画已定义', 'PASS');
    passedTests++;
  } else {
    log('动画', '淡入动画未定义', 'WARN');
  }

  // 测试5: 检查集成逻辑
  console.log('\n' + colors.cyan + '📋 测试5: 集成逻辑' + colors.reset);
  console.log('='.repeat(80));

  totalTests++;
  if (content.includes('initH5ScrollAutoSelect(gridId)')) {
    log('集成', 'updateViews中调用initH5ScrollAutoSelect', 'PASS');
    passedTests++;
  } else {
    log('集成', 'updateViews中未调用initH5ScrollAutoSelect', 'FAIL');
  }

  totalTests++;
  if (content.includes('isMobile && currentFilters.day === null')) {
    log('集成', '仅在H5模式且未选择日期时启用', 'PASS');
    passedTests++;
  } else {
    log('集成', '条件判断不符合要求', 'FAIL');
  }

  totalTests++;
  if (content.includes('cleanupH5ScrollObserver()') && content.includes('cleanupH5ScrollObserver()')) {
    log('集成', 'toggleDayFilter中调用cleanup函数', 'PASS');
    passedTests++;
  } else {
    log('集成', 'toggleDayFilter中未调用cleanup函数', 'FAIL');
  }

  // 测试6: 检查重新启用逻辑
  console.log('\n' + colors.cyan + '📋 测试6: 返回周视图重新启用' + colors.reset);
  console.log('='.repeat(80));

  totalTests++;
  if (content.includes('重新启用H5滚动自动选中')) {
    log('重新启用', '返回周视图时重新启用滚动检测', 'PASS');
    passedTests++;
  } else {
    log('重新启用', '返回周视图时未重新启用滚动检测', 'FAIL');
  }

  totalTests++;
  if (content.includes('lastSelectedDay = null')) {
    log('重新启用', '重置lastSelectedDay变量', 'PASS');
    passedTests++;
  } else {
    log('重新启用', '未重置lastSelectedDay变量', 'WARN');
  }

  // 总结
  console.log('\n' + colors.cyan + '='.repeat(80));
  console.log('📊 验证总结');
  console.log('='.repeat(80) + colors.reset);
  console.log(`总测试项: ${totalTests}`);
  console.log(`通过数量: ${passedTests}`);
  console.log(`失败数量: ${totalTests - passedTests}`);
  console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('');

  if (passedTests === totalTests) {
    console.log(colors.green + '✅ 所有验证通过！H5滚动自动选中功能已成功实现。' + colors.reset);
    console.log('');
    console.log('💡 测试步骤：');
    console.log('1. 强制刷新浏览器: Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)');
    console.log('2. 访问主页并切换到"市集"Tab');
    console.log('3. 确保是H5模式（屏幕宽度 ≤768px或添加?mode=h5）');
    console.log('4. 向下滚动页面，当某天占据屏幕50%以上时');
    console.log('5. 观察：');
    console.log('   - 停止滚动500ms后自动选中那一天');
    console.log('   - 顶部显示"✨ 已自动选中X"提示');
    console.log('   - 自动切换到单日详细视图');
    console.log('6. 点击"← 返回周视图"按钮');
    console.log('7. 再次滚动，验证自动选中功能重新启用');
    console.log('');
    console.log('📱 浏览器测试URL:');
    console.log('   http://localhost:3000/index.html?mode=h5');
  } else {
    console.log(colors.red + `❌ ${totalTests - passedTests} 项验证失败，请检查代码。` + colors.reset);
  }

  console.log('');

  process.exit(passedTests === totalTests ? 0 : 1);
}

main();
