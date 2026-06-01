#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SOURCE_FILE = path.join(__dirname, '../docs/data/chiangmai-activities-sources.md');

// 从 markdown 文件中提取所有 URL
function extractUrls(markdown) {
  const urlRegex = /https?:\/\/[^\s\)]+/g;
  const urls = markdown.match(urlRegex) || [];
  return [...new Set(urls.map(url => url.replace(/[,\)]/, '')))]; // 去重并清理
}

// 检查 URL 是否有效
function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = 5000; // 5秒超时

    const req = protocol.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        valid: res.statusCode >= 200 && res.statusCode < 400,
        redirected: res.statusCode >= 300 && res.statusCode < 400
      });
    });

    req.on('error', () => {
      resolve({ url, status: 'ERROR', valid: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ url, status: 'TIMEOUT', valid: false });
    });

    req.setTimeout(timeout);
  });
}

// 主函数
async function main() {
  console.log('📋 读取数据源文件...\n');

  const markdown = fs.readFileSync(SOURCE_FILE, 'utf8');
  const urls = extractUrls(markdown);

  console.log(`🔍 发现 ${urls.length} 个网站链接\n`);
  console.log('⏳ 开始验证...\n');

  const results = await Promise.all(urls.map(checkUrl));

  // 统计结果
  const valid = results.filter(r => r.valid).length;
  const invalid = results.filter(r => !r.valid).length;

  console.log('📊 验证结果统计:');
  console.log(`✅ 有效: ${valid} 个`);
  console.log(`❌ 无效: ${invalid} 个\n`);

  // 显示详细结果
  console.log('📝 详细结果:\n');

  results.forEach((result, index) => {
    const icon = result.valid ? '✅' : '❌';
    const status = typeof result.status === 'number' ? result.status : result.status;
    console.log(`${index + 1}. ${icon} ${status} - ${result.url}`);
  });

  // 保存无效链接列表
  const invalidUrls = results.filter(r => !r.valid).map(r => r.url);
  if (invalidUrls.length > 0) {
    const reportPath = path.join(__dirname, '../docs/data/invalid-urls.txt');
    fs.writeFileSync(reportPath, invalidUrls.join('\n'));
    console.log(`\n💾 无效链接已保存到: docs/data/invalid-urls.txt`);
  }
}

main().catch(console.error);
