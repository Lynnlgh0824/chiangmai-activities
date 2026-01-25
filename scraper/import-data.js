/**
 * 数据导入工具
 * 将爬取的数据导入到应用数据库
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

/**
 * 读取 JSON 文件
 */
async function readJsonFile(filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ 读取文件失败:', error.message);
    throw error;
  }
}

/**
 * 转换数据格式
 */
function transformData(scrapedData) {
  return scrapedData.map(item => ({
    title: item.title || '未命名活动',
    category: item.category || '其他',
    description: item.description || item.title || '',
    location: item.location || '清迈',
    price: item.price || '待询价',
    date: item.date || new Date().toISOString(),
    time: item.time || '灵活时间',
    flexibleTime: !item.time,
    duration: '2小时',
    images: item.images || [],
    source: {
      type: 'xiaohongshu',
      url: item.url || '',
    },
    status: 'active',
    currentParticipants: 0,
    maxParticipants: parseInt(item.capacity) || 0,
  }));
}

/**
 * 导入单个活动
 */
async function importActivity(activityData) {
  try {
    const response = await axios.post(`${API_BASE}/activities`, activityData);
    console.log(`   ✅ 导入成功: ${activityData.title}`);
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`   ⚠️  已存在: ${activityData.title}`);
      return { success: false, exists: true };
    }
    console.error(`   ❌ 导入失败: ${activityData.title}`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 批量导入
 */
async function batchImport(data) {
  console.log(`\n📦 开始导入 ${data.length} 条活动...\n`);

  const results = {
    total: data.length,
    success: 0,
    failed: 0,
    exists: 0,
  };

  for (let i = 0; i < data.length; i++) {
    const activity = data[i];
    process.stdout.write(`\r[${i + 1}/${data.length}] `);

    const result = await importActivity(activity);

    if (result.success) {
      results.success++;
    } else if (result.exists) {
      results.exists++;
    } else {
      results.failed++;
    }

    // 延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n========================================');
  console.log('  导入结果统计');
  console.log('========================================\n');
  console.log(`总计: ${results.total} 条`);
  console.log(`✅ 成功: ${results.success} 条`);
  console.log(`⚠️  已存在: ${results.exists} 条`);
  console.log(`❌ 失败: ${results.failed} 条`);

  return results;
}

/**
 * 列出可导入的文件
 */
async function listImportableFiles() {
  const dir = path.join(__dirname, '../data/scrapped');
  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f.includes('xiaohongshu'));

    console.log('\n📂 可导入的文件:\n');
    jsonFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });

    return jsonFiles;
  } catch (error) {
    console.error('❌ 读取目录失败:', error.message);
    return [];
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🔄 小红书数据导入工具');
  console.log('========================================\n');

  // 检查命令行参数
  const args = process.argv.slice(2);
  let targetFile;

  if (args.length > 0) {
    targetFile = args[0];
  } else {
    // 列出可选文件
    const files = await listImportableFiles();

    if (files.length === 0) {
      console.log('\n❌ 没有找到可导入的数据文件');
      console.log('💡 请先运行爬虫: npm start\n');
      return;
    }

    // 使用最新的文件
    targetFile = files[files.length - 1];
  }

  const filepath = path.join(__dirname, '../data/scrapped', targetFile);
  console.log(`📄 读取文件: ${targetFile}\n`);

  try {
    // 读取数据
    const scrapedData = await readJsonFile(filepath);
    console.log(`✅ 找到 ${scrapedData.length} 条活动数据\n`);

    // 转换数据格式
    const activities = transformData(scrapedData);

    // 显示预览
    console.log('📋 数据预览 (前3条):\n');
    activities.slice(0, 3).forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   分类: ${item.category} | 价格: ${item.price}`);
      console.log(`   地点: ${item.location}`);
      console.log('');
    });

    // 确认导入
    console.log('⚠️  即将导入到 API:', API_BASE);
    console.log('💡 按 Ctrl+C 取消，或按回车继续...\n');

    // 等待3秒
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 执行导入
    await batchImport(activities);

    console.log('\n✅ 导入完成！\n');

  } catch (error) {
    console.error('\n❌ 导入失败:', error.message);
    console.error(error.stack);
  }
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { transformData, batchImport };
