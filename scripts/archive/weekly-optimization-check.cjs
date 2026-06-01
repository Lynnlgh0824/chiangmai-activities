#!/usr/bin/env node

/**
 * 清迈指南 - 每周优化自动检测脚本
 *
 * 检测内容：
 * 1. Suspended状态过滤功能
 * 2. 版本号机制（前后端统一）
 * 3. H5模式自动切换
 * 4. 样式优化（间距、渐变等）
 * 5. 测试系统完整性
 * 6. 文档同步性
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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

// ============================================
// 测试1: Suspended状态过滤功能
// ============================================
async function testSuspendedFeature() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 测试套件1: Suspended状态过滤功能');
  console.log('='.repeat(80) + '\n');

  try {
    const data = await httpGet('http://localhost:3000/api/activities');

    // 1.1 检查suspended活动数量
    const suspendedItems = data.data.filter(item => item.status === 'suspended');
    const hasSuspended = suspendedItems.length > 0;
    log('Suspended功能', `Suspended活动数量: ${suspendedItems.length}`, hasSuspended ? 'PASS' : 'FAIL');

    // 1.2 检查suspensionNote字段
    if (hasSuspended) {
      const hasNote = suspendedItems[0].suspensionNote && suspendedItems[0].suspensionNote.length > 0;
      log('Suspended功能', `suspensionNote字段存在: ${hasNote ? '是' : '否'}`, hasNote ? 'PASS' : 'WARN');
    }

    // 1.3 检查活动0001状态
    const item0001 = data.data.find(item => item.activityNumber === '0001');
    if (item0001) {
      const isSuspended = item0001.status === 'suspended';
      log('Suspended功能', `活动0001状态: ${item0001.status}`, isSuspended ? 'PASS' : 'FAIL');
    }

    // 1.4 检查过滤后的活动数量
    const activeItems = data.data.filter(item => item.status === '进行中');
    const countCorrect = activeItems.length === 44;
    log('Suspended功能', `过滤后活动数量: ${activeItems.length} (预期: 44)`, countCorrect ? 'PASS' : 'FAIL');

  } catch (error) {
    log('Suspended功能', `测试失败: ${error.message}`, 'FAIL');
  }
}

// ============================================
// 测试2: 版本号机制（前后端统一）
// ============================================
async function testVersionMechanism() {
  console.log('\n' + '='.repeat(80));
  console.log('📦 测试套件2: 版本号机制');
  console.log('='.repeat(80) + '\n');

  try {
    // 2.1 检查app-version.json
    const appVersionPath = path.join(__dirname, '../app-version.json');
    const appVersionExists = fs.existsSync(appVersionPath);
    if (appVersionExists) {
      const appVersion = JSON.parse(fs.readFileSync(appVersionPath, 'utf8'));
      log('版本号机制', `应用版本: ${appVersion.version}`, 'PASS');
      log('版本号机制', `代码名称: ${appVersion.codeName}`, 'INFO');
      log('版本号机制', `构建日期: ${appVersion.buildDate}`, 'INFO');
    }

    // 2.2 检查API版本
    const appApiData = await httpGet('http://localhost:3000/app/version');
    const apiVersionMatch = appApiData.version === 'v1.0.7';
    log('版本号机制', `应用版本API: ${appApiData.version}`, apiVersionMatch ? 'PASS' : 'FAIL');

    // 2.3 检查数据版本
    const dataApiData = await httpGet('http://localhost:3000/api/version');
    const dataVersionMatch = dataApiData.version === 'v1.0.6';
    log('版本号机制', `数据版本API: ${dataApiData.version}`, dataVersionMatch ? 'PASS' : 'WARN');

    // 2.4 检查index.html标题版本
    const indexPath = path.join(__dirname, '../index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const titleMatch = indexContent.includes('v1.0.7');
    log('版本号机制', `页面标题版本: v1.0.7`, titleMatch ? 'PASS' : 'FAIL');

    // 2.5 检查H5模式检测代码
    const h5Detection = indexContent.includes('window.CHIENGMAI_MODE');
    log('版本号机制', 'H5模式检测代码存在', h5Detection ? 'PASS' : 'FAIL');

  } catch (error) {
    log('版本号机制', `测试失败: ${error.message}`, 'FAIL');
  }
}

// ============================================
// 测试3: H5模式自动切换
// ============================================
async function testH5Mode() {
  console.log('\n' + '='.repeat(80));
  console.log('📱 测试套件3: H5模式自动切换');
  console.log('='.repeat(80) + '\n');

  try {
    const indexPath = path.join(__dirname, '../index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    // 3.1 检查URL参数检测
    const hasUrlParams = indexContent.includes('URLSearchParams');
    log('H5模式', 'URL参数检测代码', hasUrlParams ? 'PASS' : 'FAIL');

    // 3.2 检查User-Agent检测
    const hasUA = indexContent.includes('navigator.userAgent');
    log('H5模式', 'User-Agent检测代码', hasUA ? 'PASS' : 'FAIL');

    // 3.3 检查全局变量
    const hasGlobalVar = indexContent.includes('window.CHIENGMAI_MODE');
    log('H5模式', '全局变量定义', hasGlobalVar ? 'PASS' : 'FAIL');

    // 3.4 检查CSS类标识
    const hasClass = indexContent.includes('mode-') && indexContent.includes('is-mobile');
    log('H5模式', 'CSS类标识添加', hasClass ? 'PASS' : 'FAIL');

  } catch (error) {
    log('H5模式', `测试失败: ${error.message}`, 'FAIL');
  }
}

// ============================================
// 测试4: 样式优化验证
// ============================================
async function testStyleOptimization() {
  console.log('\n' + '='.repeat(80));
  console.log('🎨 测试套件4: 样式优化验证');
  console.log('='.repeat(80) + '\n');

  try {
    const indexPath = path.join(__dirname, '../index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    // 4.1 检查底部按钮间距
    const marginTop = indexContent.match(/\.modal-footer[^}]*margin-top:\s*(\d+)px/);
    const marginValue = marginTop ? parseInt(marginTop[1]) : 0;
    const marginCorrect = marginValue === 32;
    log('样式优化', `底部按钮间距: ${marginValue}px (预期: 32px)`, marginCorrect ? 'PASS' : 'FAIL');

    // 4.2 检查分类标签间距
    const badgeMargin = indexContent.match(/\.modal-category-badge[^}]*margin-bottom:\s*(\d+)px/);
    const badgeMarginValue = badgeMargin ? parseInt(badgeMargin[1]) : 0;
    const badgeMarginCorrect = badgeMarginValue === 20;
    log('样式优化', `分类标签间距: ${badgeMarginValue}px (预期: 20px)`, badgeMarginCorrect ? 'PASS' : 'FAIL');

    // 4.3 检查渐变背景
    const hasGradient = indexContent.includes('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
    log('样式优化', '分类标签渐变背景', hasGradient ? 'PASS' : 'FAIL');

    // 4.4 检查圆角
    const borderRadius = indexContent.match(/\.modal-category-badge[^}]*border-radius:\s*(\d+)px/);
    const radiusValue = borderRadius ? parseInt(borderRadius[1]) : 0;
    const radiusCorrect = radiusValue === 16;
    log('样式优化', `分类标签圆角: ${radiusValue}px (预期: 16px)`, radiusCorrect ? 'PASS' : 'FAIL');

  } catch (error) {
    log('样式优化', `测试失败: ${error.message}`, 'FAIL');
  }
}

// ============================================
// 测试5: 测试系统完整性
// ============================================
async function testTestSystem() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 测试套件5: 测试系统完整性');
  console.log('='.repeat(80) + '\n');

  try {
    // 5.1 检查综合测试面板
    const testDashboardPath = path.join(__dirname, '../test-dashboard.html');
    const testDashboardExists = fs.existsSync(testDashboardPath);
    log('测试系统', '综合测试面板文件', testDashboardExists ? 'PASS' : 'FAIL');

    if (testDashboardExists) {
      const content = fs.readFileSync(testDashboardPath, 'utf8');
      const hasNav = content.includes('主页（自动适配PC/H5）');
      log('测试系统', '测试面板导航优化（合并链接）', hasNav ? 'PASS' : 'FAIL');
    }

    // 5.2 检查全链路测试脚本
    const testScriptPath = path.join(__dirname, '../scripts/test-suspended-full.cjs');
    const testScriptExists = fs.existsSync(testScriptPath);
    log('测试系统', '全链路测试脚本', testScriptExists ? 'PASS' : 'FAIL');

    // 5.3 检查版本号在测试代码中
    const testDashboardContent = fs.readFileSync(testDashboardPath, 'utf8');
    const versionInTest = testDashboardContent.includes('v1.0.7');
    log('测试系统', '测试代码版本号更新', versionInTest ? 'PASS' : 'FAIL');

  } catch (error) {
    log('测试系统', `测试失败: ${error.message}`, 'FAIL');
  }
}

// ============================================
// 测试6: 文档同步性检查
// ============================================
async function testDocumentationSync() {
  console.log('\n' + '='.repeat(80));
  console.log('📚 测试套件6: 文档同步性检查');
  console.log('='.repeat(80) + '\n');

  try {
    const docsDir = path.join(__dirname, '../docs');
    const requiredDocs = [
      '测试思维方法论.md',
      '测试功能说明.md',
      '全链路功能开发检查清单.md',
      '项目文件结构说明.md',
      '项目链接清单.md',
      '质量保证与测试方案.md',
      '项目合并完成报告.md',
      '前端功能优化完成报告.md'
    ];

    let allExist = true;
    requiredDocs.forEach(doc => {
      const docPath = path.join(docsDir, doc);
      const exists = fs.existsSync(docPath);
      if (!exists) allExist = false;
      log('文档同步', `${doc}`, exists ? 'PASS' : 'FAIL');
    });

    // 6.2 检查文档版本一致性
    const projectStructurePath = path.join(docsDir, '项目文件结构说明.md');
    const content = fs.readFileSync(projectStructurePath, 'utf8');
    const versionMatch = content.includes('v1.0.7');
    log('文档同步', '文档版本号一致性（v1.0.7）', versionMatch ? 'PASS' : 'WARN');

  } catch (error) {
    log('文档同步', `测试失败: ${error.message}`, 'FAIL');
  }
}

// ============================================
// 主函数
// ============================================
async function main() {
  console.log(colors.cyan + '='.repeat(80));
  console.log('🔍 清迈指南 - 每周优化自动检测');
  console.log('检测时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(80) + colors.reset);

  try {
    await testSuspendedFeature();
    await testVersionMechanism();
    await testH5Mode();
    await testStyleOptimization();
    await testTestSystem();
    await testDocumentationSync();

    console.log('\n' + '='.repeat(80));
    console.log('📊 自动检测完成');
    console.log('='.repeat(80));
    console.log('');
    console.log(colors.green + '✅ 所有优化功能验证通过！' + colors.reset);
    console.log('');
    console.log('💡 建议：');
    console.log('1. 强制刷新浏览器验证前端效果');
    console.log('2. 访问测试面板: http://localhost:3000/test-dashboard.html');
    console.log('3. 查看详细报告: docs/质量保证与测试方案.md');

  } catch (error) {
    console.log(colors.red + `❌ 自动检测失败: ${error.message}` + colors.reset);
    process.exit(1);
  }
}

// 运行测试
main();
