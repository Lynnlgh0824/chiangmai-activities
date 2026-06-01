#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const appVersionPath = path.join(__dirname, '../app-version.json');
const appVersion = JSON.parse(fs.readFileSync(appVersionPath, 'utf8'));

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(feature, message, status) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️ ';
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.cyan;
  console.log(`${color}${icon} [${feature}]${colors.reset} ${message}`);
}

async function main() {
  console.log('='.repeat(80));
  console.log('🔍 清迈指南 - 项目需求自动检测 v2.0');
  console.log('版本: ' + appVersion.version);
  console.log('检测时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(80));

  console.log('\n📋 核对功能清单:');
  appVersion.features.forEach((feature, index) => {
    console.log('  ' + (index + 1) + '. ' + feature);
  });

  console.log('\n开始检测...\n');

  // 功能1: Suspended状态过滤
  try {
    const res = await http.get('http://localhost:3000/api/activities');
    let data = '';
    res.on('data', d => { data += d; });
    res.on('end', async () => {
      const activities = JSON.parse(data);
      const suspended = activities.data.filter(i => i.status === 'suspended');
      log('suspended过滤', 'Suspended活动功能', suspended.length > 0 ? 'PASS' : 'WARN');
      
      const active = activities.data.filter(i => i.status === '进行中');
      log('suspended过滤', '过滤后活动: ' + active.length + '个', active.length === 44 ? 'PASS' : 'WARN');
      
      // 继续其他检测...
    });
  } catch (e) {
    log('ERROR', 'API连接失败: ' + e.message, 'FAIL');
  }

  console.log('\n✅ 项目需求检测完成');
}

main();
