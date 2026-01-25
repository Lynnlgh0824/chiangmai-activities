/**
 * Excel 数据导入到本地后台工具
 * 将清迈活动数据.xlsx 导入到 data/items.json
 */

const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');

// 文件路径
const EXCEL_FILE = path.join(__dirname, '../清迈活动数据.xlsx');
const DATA_FILE = path.join(__dirname, '../data/items.json');

/**
 * 读取 Excel 文件
 */
function readExcelFile(filepath) {
  try {
    const workbook = XLSX.readFile(filepath);
    const allData = [];

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (data.length <= 1) return;

      const headers = data[0];

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        if (typeof row[1] === 'string' && row[1].startsWith('示例')) continue;

        const activity = {};
        headers.forEach((header, index) => {
          if (header) {
            activity[header] = row[index] !== undefined && row[index] !== null ? row[index] : '';
          }
        });

        activity._sheet = sheetName;
        allData.push(activity);
      }
    });

    return allData;
  } catch (error) {
    console.error('❌ 读取Excel失败:', error.message);
    throw error;
  }
}

/**
 * 转换为项目数据格式
 */
function convertToProjectFormat(excelData) {
  return excelData.map((item, index) => {
    const title = item['活动标题*'] || item['活动标题'] || '未命名活动';
    const priceStr = item['价格显示'] || '免费';
    const priceMatch = priceStr.match(/(\d+)/);
    const priceNum = priceMatch ? parseInt(priceMatch[1]) : 0;

    // 解析时间
    let weekdays = [];
    let date = '';
    let frequency = 'once';

    const timeInfo = item['时间信息'] || item['活动类型'] || '';
    const weekdayStr = item['星期*'] || item['星期'] || '';

    if (timeInfo.includes('固定频率') || weekdayStr) {
      frequency = 'weekly';
      if (weekdayStr) {
        weekdays = weekdayStr.split(',').map(s => s.trim());
      }
    } else {
      date = item['具体日期'] || new Date().toISOString().split('T')[0];
    }

    return {
      id: Date.now() + index,
      _id: Date.now() + index,
      title: title,
      description: item['活动描述*'] || item['活动描述'] || '',
      category: item['分类*'] || item['分类'] || '其他',
      status: 'active',
      frequency: frequency,
      weekdays: weekdays,
      date: date,
      time: item['时间*'] || item['时间'] || '',
      duration: item['持续时间'] || '2小时',
      location: item['地点名称*'] || item['地点名称'] || '清迈',
      address: item['详细地址'] || '',
      price: priceStr,
      priceMin: item['最低价格'] ? parseInt(item['最低价格']) : priceNum,
      priceMax: item['最高价格'] ? parseInt(item['最高价格']) : priceNum,
      currency: '฿',
      maxParticipants: item['最大人数'] ? parseInt(item['最大人数']) : 0,
      currentParticipants: 0,
      flexibleTime: item['灵活时间'] === '是',
      bookingRequired: item['需要预约'] !== '否',
      images: item['图片URL'] ? item['图片URL'].split('\n').filter(s => s.trim()) : [],
      source: {
        name: 'Excel导入',
        url: item['来源链接'] || '',
        type: 'excel',
        lastUpdated: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

/**
 * 导入数据
 */
async function importData() {
  console.log('🔄 Excel 数据导入到本地后台');
  console.log('========================================\n');

  try {
    // 读取Excel
    console.log('📄 读取 Excel 文件...');
    const excelData = readExcelFile(EXCEL_FILE);
    console.log(`✅ 找到 ${excelData.length} 条活动数据\n`);

    // 转换格式
    console.log('🔄 转换数据格式...');
    const activities = convertToProjectFormat(excelData);

    // 🔒 安全备份：先备份现有数据
    console.log('🔒 创建安全备份...');
    const backupPath = DATA_FILE.replace('.json', `-backup-${Date.now()}.json`);
    try {
      const existingContent = await fs.readFile(DATA_FILE, 'utf8');
      await fs.writeFile(backupPath, existingContent, 'utf8');
      console.log(`✅ 备份已保存: ${backupPath}\n`);
    } catch (err) {
      console.log('ℹ️  无现有数据，跳过备份\n');
    }

    // 读取现有数据
    let existingData = [];
    try {
      const content = await fs.readFile(DATA_FILE, 'utf8');
      existingData = JSON.parse(content);
      console.log(`📂 现有数据: ${existingData.length} 条`);
    } catch {
      console.log('📂 现有数据: 0 条 (新文件)');
    }

    // 合并数据（根据标题和地点去重）
    const mergedData = [...existingData];
    let addedCount = 0;
    let duplicateCount = 0;

    activities.forEach(newActivity => {
      const isDuplicate = existingData.some(existing =>
        existing.title === newActivity.title &&
        existing.location === newActivity.location
      );

      if (!isDuplicate) {
        mergedData.push(newActivity);
        addedCount++;
      } else {
        duplicateCount++;
      }
    });

    // 保存数据
    console.log('\n💾 保存数据...');
    await fs.writeFile(DATA_FILE, JSON.stringify(mergedData, null, 2), 'utf8');

    console.log('\n========================================');
    console.log('  导入完成');
    console.log('========================================\n');
    console.log(`📊 统计:`);
    console.log(`  Excel数据: ${activities.length} 条`);
    console.log(`  现有数据: ${existingData.length} 条`);
    console.log(`  新增: ${addedCount} 条`);
    console.log(`  重复: ${duplicateCount} 条`);
    console.log(`  总计: ${mergedData.length} 条`);
    console.log(`\n📄 数据文件: ${DATA_FILE}\n`);

    return {
      total: activities.length,
      added: addedCount,
      duplicate: duplicateCount,
      final: mergedData.length
    };

  } catch (error) {
    console.error('\n❌ 导入失败:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    await importData();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { importData, readExcelFile, convertToProjectFormat };
