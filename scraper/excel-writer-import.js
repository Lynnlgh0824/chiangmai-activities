/**
 * Excel 导入工具
 * 将 AI 解析导出的 JSON 文件写入到活动录入表格.xlsx
 */

const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');

// Excel 文件路径
const EXCEL_FILE = path.join(__dirname, '../清迈活动数据.xlsx');

/**
 * 从 JSON 文件读取数据
 */
async function readJsonFile(filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ 读取 JSON 文件失败:', error.message);
    throw error;
  }
}

/**
 * 检查活动是否已存在（去重）
 * @param {Object} existingData - 现有数据
 * @param {Object} activity - 新活动
 * @returns {boolean} - 是否重复
 */
function isDuplicateActivity(existingData, activity) {
  const title = activity.title || activity['活动标题*'];
  const location = activity.location || activity['地点名称*'];

  // 检查是否有相同标题和地点的活动
  return existingData.some(existing => {
    const existingTitle = existing['活动标题*'];
    const existingLocation = existing['地点名称*'];

    // 标题和地点都相同则认为是重复
    return existingTitle === title && existingLocation === location;
  });
}

/**
 * 将 AI 解析的数据转换为 Excel 行格式
 */
function transformToExcelRow(activity, index, activityType) {
  const row = {
    '序号': index,
    '活动标题*': activity.title || '未命名活动',
    '分类*': activity.category || '其他',
    '状态': '草稿',
    '活动描述*': activity.description || '',
    '时间信息': activityType,  // 固定频率活动 / 临时活动
    '持续时间': activity.duration || '2小时',
    '地点名称*': activity.location || '清迈',
    '详细地址': '',
    '价格显示': activity.price || '待询价',
    '最低价格': activity.priceMin || 0,
    '最高价格': activity.priceMax || 0,
    '最大人数': 0,
    '灵活时间': activity.flexibleTime ? '是' : '否',
    '需要预约': '是',
    '图片URL': (activity.images || [activity.image]).filter(Boolean).join('\n'),
    '来源链接': activity.url || '',
  };

  if (activityType === '固定频率活动') {
    row['星期*'] = (activity.weekdays || []).join(',');
    row['时间*'] = activity.time || '09:00-11:00';
  } else {
    row['星期*'] = '';
    row['时间*'] = activity.time || '14:00-17:00';
    row['具体日期'] = activity.date || new Date().toISOString().split('T')[0];
  }

  return row;
}

/**
 * 获取工作表的下一个空行
 */
function getNextEmptyRow(sheet) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  let nextRow = range.e.r + 1;

  if (nextRow < 5) {
    nextRow = 5;
  }

  return nextRow;
}

/**
 * 将数据写入 Excel
 */
async function writeToExcel(activities) {
  console.log('\n📊 准备写入 Excel 表格...');
  console.log(`📄 文件路径: ${EXCEL_FILE}`);

  try {
    // 读取现有 Excel 文件
    let workbook;
    let existingData = [];
    try {
      workbook = XLSX.readFile(EXCEL_FILE);
      const sheet = workbook.Sheets['全部活动'];
      if (sheet) {
        existingData = XLSX.utils.sheet_to_json(sheet);
        console.log(`\n📂 现有数据: ${existingData.length} 条`);
      }
    } catch (error) {
      console.error('❌ 无法读取 Excel 文件:', error.message);
      console.log('\n💡 请确保清迈活动数据.xlsx 在项目根目录');
      throw error;
    }

    // 按活动类型分组
    const regularActivities = [];
    const temporaryActivities = [];
    const duplicates = [];

    activities.forEach((activity, index) => {
      const activityType = activity.type === 'weekly' ? '固定频率活动' : '临时活动';
      const row = transformToExcelRow(activity, index + 1, activityType);

      // 检查是否重复
      if (isDuplicateActivity(existingData, activity)) {
        duplicates.push({
          title: activity.title,
          location: activity.location,
          reason: '标题和地点与现有数据重复'
        });
      } else {
        if (activityType === '固定频率活动') {
          regularActivities.push(row);
        } else {
          temporaryActivities.push(row);
        }
      }
    });

    console.log(`\n📋 数据分类:`);
    console.log(`  - 固定频率活动: ${regularActivities.length} 条`);
    console.log(`  - 临时活动: ${temporaryActivities.length} 条`);

    // 显示重复数据
    if (duplicates.length > 0) {
      console.log(`\n⚠️  发现 ${duplicates.length} 条重复数据（已跳过）:`);
      duplicates.forEach((dup, i) => {
        console.log(`   ${i + 1}. ${dup.title} - ${dup.location}`);
        console.log(`      原因: ${dup.reason}`);
      });
    }

    // 合并所有活动
    const allActivities = [...regularActivities, ...temporaryActivities];

    if (allActivities.length === 0) {
      console.log('\n⚠️  没有新数据需要导入');
      return {
        total: activities.length,
        duplicate: duplicates.length,
        imported: 0,
        regular: 0,
        temporary: 0
      };
    }

    // 数据确认
    console.log('\n📝 即将导入的数据预览:');
    console.log('─'.repeat(60));
    allActivities.slice(0, 5).forEach((row, i) => {
      console.log(`${i + 1}. ${row['活动标题*']}`);
      console.log(`   分类: ${row['分类*']} | 价格: ${row['价格显示']}`);
      console.log(`   类型: ${row['时间信息']}`);
      console.log(`   时间: ${row['星期*'] || row['具体日期'] || ''} ${row['时间*']}`);
      console.log(`   地点: ${row['地点名称*']}`);
      console.log('');
    });

    if (allActivities.length > 5) {
      console.log(`... 还有 ${allActivities.length - 5} 条数据\n`);
    }

    console.log('─'.repeat(60));
    console.log(`📊 统计:`);
    console.log(`   - 新导入: ${allActivities.length} 条`);
    console.log(`   - 重复跳过: ${duplicates.length} 条`);
    console.log(`   - 总计: ${activities.length} 条`);
    console.log('\n⚠️  即将写入到 Excel 表格');
    console.log('💡 按 Ctrl+C 取消，或等待5秒继续...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // 写入"全部活动"工作表
    const sheetName = '全部活动';
    const sheet = workbook.Sheets[sheetName];

    if (sheet) {
      // 获取当前工作表的起始行（跳过表头和示例数据）
      const range = XLSX.utils.decode_range(sheet['!ref']);
      let startRow = range.e.r + 1;

      // 跳过示例数据行（通常前几行是示例）
      const existingData = XLSX.utils.sheet_to_json(sheet);
      const exampleRowCount = 1; // 假设第2行是示例数据
      startRow = Math.max(startRow, exampleRowCount + existingData.length);

      console.log(`\n✍️  写入 "${sheetName}" 工作表（从第 ${startRow + 1} 行开始）`);

      allActivities.forEach((row, index) => {
        const rowIndex = startRow + index;

        // 按照Excel列顺序写入数据
        const columnOrder = [
          '序号', '活动标题*', '分类*', '状态', '活动描述*', '时间信息',
          '星期*', '时间*', '持续时间', '地点名称*', '详细地址', '价格显示',
          '最低价格', '最高价格', '最大人数', '灵活时间', '需要预约',
          '图片URL', '来源链接', '具体日期'
        ];

        columnOrder.forEach((key, colIndex) => {
          if (row.hasOwnProperty(key)) {
            const cellAddress = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
            const value = row[key];
            sheet[cellAddress] = {
              v: value,
              t: typeof value === 'number' ? 'n' : 's'
            };
          }
        });
      });

      // 更新工作表范围
      const newRange = XLSX.utils.decode_range(sheet['!ref']);
      newRange.e.r = startRow + allActivities.length - 1;
      sheet['!ref'] = XLSX.utils.encode_range(newRange);

      console.log(`✅ 已写入 ${allActivities.length} 条数据到 "${sheetName}" 工作表`);
    } else {
      console.error(`❌ 找不到工作表: ${sheetName}`);
      console.log('💡 可用的工作表:', workbook.SheetNames.join(', '));
      throw new Error(`工作表 "${sheetName}" 不存在`);
    }

    // 备份原文件
    const backupPath = EXCEL_FILE.replace('.xlsx', '-backup.xlsx');
    await fs.copyFile(EXCEL_FILE, backupPath);
    console.log(`\n📦 备份文件: ${path.basename(backupPath)}`);

    // 保存文件
    XLSX.writeFile(workbook, EXCEL_FILE);
    console.log(`\n✅ 数据已写入: ${path.basename(EXCEL_FILE)}`);

    console.log('\n✅ 所有数据写入完成！');

    return {
      total: activities.length,
      duplicate: duplicates.length,
      imported: allActivities.length,
      regular: regularActivities.length,
      temporary: temporaryActivities.length,
    };
  } catch (error) {
    console.error('\n❌ 写入 Excel 失败:', error.message);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🔄 AI 解析数据导入工具');
  console.log('========================================\n');

  // 获取命令行参数
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('❌ 错误: 请指定 JSON 文件路径');
    console.log('\n使用方法:');
    console.log('  node excel-writer-import.js <json文件路径>\n');
    console.log('示例:');
    console.log('  node excel-writer-import.js ../data/scrapped/ai-import-1234567890.json\n');
    process.exit(1);
  }

  const jsonFile = args[0];

  console.log(`📄 读取文件: ${jsonFile}\n`);

  try {
    // 读取 JSON 文件
    const activities = await readJsonFile(jsonFile);
    console.log(`✅ 找到 ${activities.length} 条活动数据\n`);

    // 显示预览
    console.log('📋 数据预览 (前3条):\n');
    activities.slice(0, 3).forEach((activity, index) => {
      const typeText = activity.type === 'weekly' ? '固定频率活动' : '临时活动';
      console.log(`${index + 1}. ${activity.title || '未命名活动'}`);
      console.log(`   类型: ${typeText}`);
      console.log(`   分类: ${activity.category} | 价格: ${activity.price}`);
      console.log(`   地点: ${activity.location}`);
      if (activity.type === 'weekly') {
        console.log(`   时间: ${(activity.weekdays || []).join(',')} ${activity.time}`);
      } else {
        console.log(`   时间: ${activity.date} ${activity.time}`);
      }
      console.log('');
    });

    // 确认导入
    console.log('⚠️  即将写入到 Excel 表格');
    console.log('💡 按 Ctrl+C 取消，或等待3秒继续...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 执行导入
    const result = await writeToExcel(activities);

    console.log('\n========================================');
    console.log('  导入结果统计');
    console.log('========================================\n');
    console.log(`📊 数据统计:`);
    console.log(`   总计: ${result.total} 条`);
    if (result.duplicate > 0) {
      console.log(`   ⚠️  重复跳过: ${result.duplicate} 条`);
    }
    console.log(`   ✅ 新导入: ${result.imported} 条`);
    console.log(`   └─ 固定频率活动: ${result.regular} 条`);
    console.log(`   └─ 临时活动: ${result.temporary} 条`);

    if (result.imported > 0) {
      console.log(`\n🎉 导入完成！新增 ${result.imported} 条活动数据\n`);
    } else {
      console.log(`\nℹ️  所有数据均已存在，无需导入\n`);
    }

  } catch (error) {
    console.error('\n❌ 导入失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { writeToExcel };
