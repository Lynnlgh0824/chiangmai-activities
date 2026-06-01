#!/usr/bin/env node

/**
 * 验证0001活动（瑜伽）是否被正确过滤
 */

const http = require('http');

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
  console.log('🔍 0001瑜伽活动暂停状态过滤验证');
  console.log('验证时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(80) + colors.reset + '\n');

  try {
    // 1. 检查API返回的0001活动数据
    log('API', '正在获取0001活动数据...', 'INFO');
    const apiData = await httpGet('http://localhost:3000/api/activities');
    const activity0001 = apiData.data.find(item => item.activityNumber === '0001');

    if (!activity0001) {
      log('错误', '未找到0001活动', 'FAIL');
      process.exit(1);
    }

    // 2. 验证0001活动的status字段
    console.log('\n' + colors.cyan + '📋 0001活动数据' + colors.reset);
    console.log('='.repeat(80));
    console.log(`活动编号: ${activity0001.activityNumber}`);
    console.log(`活动标题: ${activity0001.title}`);
    console.log(`状态: ${activity0001.status}`);
    console.log(`暂停备注: ${activity0001.suspensionNote || '无'}`);

    // 3. 检查status是否为suspended
    if (activity0001.status === 'suspended') {
      log('状态', '0001活动状态为: suspended (暂停中) ✅', 'PASS');
    } else {
      log('状态', `0001活动状态为: ${activity0001.status} (错误！应为suspended) ❌`, 'FAIL');
    }

    // 4. 检查suspensionNote是否存在
    if (activity0001.suspensionNote && activity0001.suspensionNote.length > 0) {
      log('备注', '暂停备注存在 ✅', 'PASS');
    } else {
      log('备注', '缺少暂停备注 ⚠️', 'WARN');
    }

    // 5. 模拟前端过滤逻辑
    console.log('\n' + colors.cyan + '🔍 模拟前端过滤' + colors.reset);
    console.log('='.repeat(80));

    const totalActivities = apiData.data.length;
    const suspendedActivities = apiData.data.filter(a => a.status === 'suspended');
    const activeActivities = apiData.data.filter(a => a.status !== 'suspended');

    console.log(`总活动数: ${totalActivities}`);
    console.log(`暂停活动数: ${suspendedActivities.length}`);
    console.log(`进行中活动数: ${activeActivities.length}`);

    // 6. 验证0001是否被过滤
    const is0001Filtered = !activeActivities.find(a => a.activityNumber === '0001');

    console.log('\n' + colors.cyan + '✅ 过滤结果' + colors.reset);
    console.log('='.repeat(80));

    if (is0001Filtered) {
      log('过滤', '0001活动已被正确过滤 ✅', 'PASS');
      console.log('\n预期行为: 0001瑜伽活动不会在前端显示');
    } else {
      log('过滤', '0001活动仍然显示 ❌', 'FAIL');
      console.log('\n问题: 0001活动应该被过滤掉，但仍然显示！');
      console.log('原因: 前端缺少suspended状态过滤逻辑');
    }

    // 7. 检查前端代码
    console.log('\n' + colors.cyan + '📄 前端代码检查' + colors.reset);
    console.log('='.repeat(80));

    const fs = require('fs');
    const indexContent = fs.readFileSync('/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/index.html', 'utf8');

    const hasSuspendedFilter = indexContent.includes("filtered = filtered.filter(a => a.status !== 'suspended')");

    if (hasSuspendedFilter) {
      log('代码', '主index.html包含suspended过滤逻辑 ✅', 'PASS');
    } else {
      log('代码', '主index.html缺少suspended过滤逻辑 ❌', 'FAIL');
    }

    // 8. 总结
    console.log('\n' + colors.cyan + '='.repeat(80));
    console.log('📊 验证总结');
    console.log('='.repeat(80) + colors.reset);

    if (activity0001.status === 'suspended' && is0001Filtered && hasSuspendedFilter) {
      console.log(colors.green + '✅ 所有验证通过！0001活动已被正确过滤。' + colors.reset);
      console.log('');
      console.log('💡 下一步：');
      console.log('1. 强制刷新浏览器: Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)');
      console.log('2. 访问主页: http://localhost:3000/index.html');
      console.log('3. 确认0001瑜伽活动不再显示');
    } else {
      console.log(colors.red + '❌ 验证失败，请检查上述失败项。' + colors.reset);

      if (!hasSuspendedFilter) {
        console.log('');
        console.log('🔧 修复方法：');
        console.log('在index.html的filterActivities函数中添加：');
        console.log(`  // 过滤掉暂停的活动`);
        console.log(`  filtered = filtered.filter(a => a.status !== 'suspended');`);
      }
    }

  } catch (error) {
    console.log(colors.red + `❌ 验证失败: ${error.message}` + colors.reset);
    console.log('');
    console.log('💡 请确保：');
    console.log('1. 服务器正在运行: node server.cjs');
    console.log('2. API端点可访问: http://localhost:3000/api/activities');
    process.exit(1);
  }
}

main();
