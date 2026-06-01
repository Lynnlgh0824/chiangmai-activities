#!/usr/bin/env node

/**
 * 自我验证：双感叹号问题优化
 *
 * 验证项目：
 * 1. 前端代码是否包含清理逻辑
 * 2. 本地数据是否干净
 * 3. API返回数据是否正确
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/items.json');
const INDEX_FILE = path.join(__dirname, '../index.html');

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

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log(colors.cyan + '='.repeat(80));
  console.log('🔍 双感叹号问题优化 - 自我验证');
  console.log('验证时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(80) + colors.reset + '\n');

  let totalTests = 0;
  let passedTests = 0;

  // ============================================
  // 验证1：前端代码是否包含清理逻辑
  // ============================================
  console.log(colors.cyan + '📋 验证1: 前端代码清理逻辑' + colors.reset);
  console.log('='.repeat(80) + '\n');

  try {
    const indexContent = fs.readFileSync(INDEX_FILE, 'utf8');

    // 1.1 检查是否包含清理双感叹号的代码
    totalTests++;
    const hasDoubleExclamationCleanup = indexContent.includes('清理双感叹号');
    if (hasDoubleExclamationCleanup) {
      log('前端代码', '包含双感叹号清理逻辑', 'PASS');
      passedTests++;
    } else {
      log('前端代码', '缺少双感叹号清理逻辑', 'FAIL');
    }

    // 1.2 检查是否包含清理重复⚠️的代码
    totalTests++;
    const hasMultipleWarningCleanup = indexContent.includes('清理重复的警告符号');
    if (hasMultipleWarningCleanup) {
      log('前端代码', '包含重复⚠️清理逻辑', 'PASS');
      passedTests++;
    } else {
      log('前端代码', '缺少重复⚠️清理逻辑', 'FAIL');
    }

    // 1.3 检查是否包含清理重复标点的代码
    totalTests++;
    const hasPunctuationCleanup = indexContent.includes('清理重复的标点符号');
    if (hasPunctuationCleanup) {
      log('前端代码', '包含重复标点清理逻辑', 'PASS');
      passedTests++;
    } else {
      log('前端代码', '缺少重复标点清理逻辑', 'FAIL');
    }

    // 1.4 检查formatDescription函数位置（应该在3263行附近）
    totalTests++;
    const hasFormatDescription = indexContent.includes('function formatDescription');
    if (hasFormatDescription) {
      log('前端代码', 'formatDescription函数存在', 'PASS');
      passedTests++;
    } else {
      log('前端代码', 'formatDescription函数不存在', 'FAIL');
    }

  } catch (error) {
    log('前端代码', `检查失败: ${error.message}`, 'FAIL');
  }

  // ============================================
  // 验证2：本地数据是否干净
  // ============================================
  console.log('\n' + colors.cyan + '📋 验证2: 本地数据文件' + colors.reset);
  console.log('='.repeat(80) + '\n');

  try {
    const dataContent = fs.readFileSync(DATA_FILE, 'utf8');

    // 2.1 检查双感叹号 "!!"
    totalTests++;
    const hasDoubleExclamation = dataContent.includes('!!');
    if (!hasDoubleExclamation) {
      log('本地数据', '无双感叹号 "!!" ✅', 'PASS');
      passedTests++;
    } else {
      const count = (dataContent.match(/!!/g) || []).length;
      log('本地数据', `发现 ${count} 个双感叹号 "!!" ❌`, 'FAIL');
    }

    // 2.2 检查重复的⚠️
    totalTests++;
    const hasMultipleWarning = /⚠️.*⚠️/.test(dataContent);
    if (!hasMultipleWarning) {
      log('本地数据', '无重复⚠️符号 ✅', 'PASS');
      passedTests++;
    } else {
      log('本地数据', '发现重复⚠️符号 ❌', 'FAIL');
    }

    // 2.3 检查重复句号
    totalTests++;
    const hasMultiplePeriod = dataContent.includes('。。');
    if (!hasMultiplePeriod) {
      log('本地数据', '无重复句号 ✅', 'PASS');
      passedTests++;
    } else {
      const count = (dataContent.match(/。。/g) || []).length;
      log('本地数据', `发现 ${count} 个重复句号 ❌`, 'FAIL');
    }

    // 2.4 检查重复逗号
    totalTests++;
    const hasMultipleComma = dataContent.includes('，，');
    if (!hasMultipleComma) {
      log('本地数据', '无重复逗号 ✅', 'PASS');
      passedTests++;
    } else {
      const count = (dataContent.match(/，，/g) || []).length;
      log('本地数据', `发现 ${count} 个重复逗号 ❌`, 'FAIL');
    }

  } catch (error) {
    log('本地数据', `检查失败: ${error.message}`, 'FAIL');
  }

  // ============================================
  // 验证3：API返回数据
  // ============================================
  console.log('\n' + colors.cyan + '📋 验证3: API端点数据' + colors.reset);
  console.log('='.repeat(80) + '\n');

  try {
    const apiData = await httpGet('http://localhost:3000/api/activities');

    // 3.1 检查API是否正常返回
    totalTests++;
    if (apiData && apiData.data && Array.isArray(apiData.data)) {
      log('API端点', `正常返回数据 (${apiData.data.length}个活动)`, 'PASS');
      passedTests++;
    } else {
      log('API端点', 'API返回格式错误', 'FAIL');
    }

    // 3.2 检查JING JAI 市集（周末版）
    totalTests++;
    const jingJai = apiData.data.find(item => item.activityNumber === '0032');
    if (jingJai) {
      const hasDoubleExclamation = jingJai.description && jingJai.description.includes('!!');
      if (!hasDoubleExclamation) {
        log('API数据', 'JING JAI 市集（周末版）无"!!" ✅', 'PASS');
        passedTests++;
      } else {
        log('API数据', 'JING JAI 市集（周末版）仍包含"!!" ❌', 'FAIL');
      }
    } else {
      log('API数据', '未找到JING JAI 市集（周末版）', 'WARN');
    }

    // 3.3 检查孟买市场
    totalTests++;
    const mengmai = apiData.data.find(item => item.activityNumber === '0037');
    if (mengmai) {
      const hasDoubleExclamation = mengmai.description && mengmai.description.includes('!!');
      if (!hasDoubleExclamation) {
        log('API数据', '孟买市场无"!!" ✅', 'PASS');
        passedTests++;
      } else {
        log('API数据', '孟买市场仍包含"!!" ❌', 'FAIL');
      }
    } else {
      log('API数据', '未找到孟买市场', 'WARN');
    }

    // 3.4 检查所有活动描述中是否有双感叹号
    totalTests++;
    const activitiesWithDoubleExclamation = apiData.data.filter(item =>
      item.description && item.description.includes('!!')
    );
    if (activitiesWithDoubleExclamation.length === 0) {
      log('API数据', '所有活动描述均无"!!" ✅', 'PASS');
      passedTests++;
    } else {
      log('API数据', `${activitiesWithDoubleExclamation.length}个活动仍包含"!!" ❌`, 'FAIL');
      activitiesWithDoubleExclamation.forEach(item => {
        console.log(`  - [${item.activityNumber}] ${item.title}`);
      });
    }

  } catch (error) {
    log('API端点', `检查失败: ${error.message} (请确保服务器正在运行)`, 'WARN');
  }

  // ============================================
  // 验证总结
  // ============================================
  console.log('\n' + colors.cyan + '='.repeat(80));
  console.log('📊 验证总结');
  console.log('='.repeat(80) + colors.reset);
  console.log(`总测试项: ${totalTests}`);
  console.log(`通过数量: ${passedTests}`);
  console.log(`失败数量: ${totalTests - passedTests}`);
  console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('');

  if (passedTests === totalTests) {
    console.log(colors.green + '✅ 所有验证通过！优化已成功完成。' + colors.reset);
    console.log('');
    console.log('💡 下一步：');
    console.log('1. 强制刷新浏览器: Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)');
    console.log('2. 访问主页验证: http://localhost:3000/index.html');
    console.log('3. 点击活动卡片查看详情弹窗');
    console.log('4. 确认无"!!"双感叹号、无重复⚠️、无重复标点');
  } else {
    console.log(colors.red + `❌ ${totalTests - passedTests} 项验证失败，请检查上述失败项。` + colors.reset);
  }

  console.log('');

  // 返回退出码
  process.exit(passedTests === totalTests ? 0 : 1);
}

// 运行验证
main();
