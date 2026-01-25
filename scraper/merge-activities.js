/**
 * 活动数据整合与去重工具
 * 将多个活动数据文件整合到一个文件，并去除重复数据
 */

const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');

// 主文件路径
const MAIN_FILE = path.join(__dirname, '../清迈活动数据.xlsx');
const BACKUP_FILE = path.join(__dirname, '../清迈活动数据-backup.xlsx');
const BEFORE_CLEAN_FILE = path.join(__dirname, '../清迈活动数据-before-clean.xlsx');

/**
 * 读取 Excel 文件中的所有工作表数据
 */
function readExcelData(filepath) {
  try {
    const workbook = XLSX.readFile(filepath);
    const allData = [];

    // 遍历所有工作表
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // 跳过空表
      if (data.length <= 1) return;

      // 获取表头（第1行）
      const headers = data[0];

      // 从第2行开始是数据（跳过示例行）
      for (let i = 1; i < data.length; i++) {
        const row = data[i];

        // 跳过空行或示例行
        if (!row || row.length === 0) continue;

        // 跳过示例行（如果第一列是"示例1"等）
        if (typeof row[1] === 'string' && row[1].startsWith('示例')) continue;

        const activity = {};
        headers.forEach((header, index) => {
          if (header) {
            activity[header] = row[index] !== undefined && row[index] !== null ? row[index] : '';
          }
        });

        activity._sheet = sheetName; // 标记来源工作表
        activity._sourceFile = path.basename(filepath); // 标记来源文件
        allData.push(activity);
      }
    });

    return allData;
  } catch (error) {
    console.error(`❌ 读取文件失败: ${filepath}`, error.message);
    return [];
  }
}

/**
 * 生成活动的唯一标识
 * 用于判断是否重复
 */
function getActivityKey(activity) {
  const title = (activity['活动标题*'] || activity['活动标题'] || '').toString().trim().toLowerCase();
  const location = (activity['地点名称*'] || activity['地点名称'] || '').toString().trim().toLowerCase();
  const time = (activity['时间*'] || activity['时间'] || '').toString().trim().toLowerCase();

  // 组合标题、地点、时间作为唯一标识
  return `${title}_${location}_${time}`.replace(/\s+/g, '');
}

/**
 * 判断两个活动是否重复
 */
function isDuplicate(activity1, activity2) {
  const key1 = getActivityKey(activity1);
  const key2 = getActivityKey(activity2);

  // 如果唯一标识相同且不为空，认为是重复
  if (key1 !== '' && key1 === key2) {
    return true;
  }

  // 标题和地点相同，也认为是重复
  const title1 = (activity1['活动标题*'] || activity1['活动标题'] || '').toString().trim();
  const title2 = (activity2['活动标题*'] || activity2['活动标题'] || '').toString().trim();
  const loc1 = (activity1['地点名称*'] || activity1['地点名称'] || '').toString().trim();
  const loc2 = (activity2['地点名称*'] || activity2['地点名称'] || '').toString().trim();

  if (title1 !== '' && title1 === title2 && loc1 === loc2) {
    return true;
  }

  return false;
}

/**
 * 去重活动数据
 */
function deduplicateActivities(activities) {
  const uniqueActivities = [];
  const duplicateInfo = [];

  activities.forEach(activity => {
    let isDup = false;

    // 检查是否与已有数据重复
    for (const existing of uniqueActivities) {
      if (isDuplicate(activity, existing)) {
        isDup = true;
        duplicateInfo.push({
          title: activity['活动标题'],
          source: activity._sourceFile,
          sheet: activity._sheet,
          duplicateOf: existing._sourceFile
        });
        break;
      }
    }

    if (!isDup) {
      uniqueActivities.push(activity);
    }
  });

  return { uniqueActivities, duplicateInfo };
}

/**
 * 将数据写入 Excel
 */
function writeExcelData(activities, filepath) {
  // 读取现有文件以获取模板结构
  let workbook;
  try {
    workbook = XLSX.readFile(filepath);
  } catch {
    // 如果文件不存在，创建新的
    workbook = XLSX.utils.book_new();
  }

  // 准备数据，移除内部字段
  const cleanActivities = activities.map(activity => {
    const clean = { ...activity };
    delete clean._sheet;
    delete clean._sourceFile;
    return clean;
  });

  // 写入"全部活动"工作表
  const sheet = XLSX.utils.json_to_sheet(cleanActivities);

  // 如果工作簿中已有"全部活动"表，替换它；否则添加新表
  if (workbook.SheetNames.includes('全部活动')) {
    workbook.Sheets['全部活动'] = sheet;
  } else {
    XLSX.utils.book_append_sheet(workbook, sheet, '全部活动');
  }

  // 写入文件
  XLSX.writeFile(workbook, filepath);

  return {
    total: cleanActivities.length
  };
}

/**
 * 主函数
 */
async function main() {
  console.log('🔄 活动数据整合与去重工具');
  console.log('========================================\n');

  // 1. 读取所有文件的数据
  console.log('📂 正在读取所有活动数据文件...\n');

  const mainData = readExcelData(MAIN_FILE);
  console.log(`  ✅ 主文件: ${path.basename(MAIN_FILE)} - ${mainData.length} 条数据`);

  const backupData = readExcelData(BACKUP_FILE);
  console.log(`  ✅ 备份文件: ${path.basename(BACKUP_FILE)} - ${backupData.length} 条数据`);

  const beforeCleanData = readExcelData(BEFORE_CLEAN_FILE);
  console.log(`  ✅ 清理前文件: ${path.basename(BEFORE_CLEAN_FILE)} - ${beforeCleanData.length} 条数据`);

  // 2. 合并所有数据
  console.log('\n📦 正在合并所有数据...\n');
  const allData = [...mainData, ...backupData, ...beforeCleanData];
  console.log(`  合并后总计: ${allData.length} 条数据`);

  // 3. 去重
  console.log('\n🔍 正在识别并去除重复数据...\n');
  const { uniqueActivities, duplicateInfo } = deduplicateActivities(allData);

  console.log(`  ✅ 去重后: ${uniqueActivities.length} 条数据`);
  console.log(`  ❌ 发现重复: ${duplicateInfo.length} 条`);

  if (duplicateInfo.length > 0) {
    console.log('\n  重复数据列表 (前10条):');
    duplicateInfo.slice(0, 10).forEach((info, index) => {
      console.log(`    ${index + 1}. "${info.title || '(无标题)'}"`);
      console.log(`       来源: ${info.source} (${info.sheet})`);
      console.log(`       与 ${info.duplicateOf} 中的数据重复`);
    });
  }

  // 4. 备份当前主文件
  console.log('\n💾 正在备份当前主文件...\n');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = MAIN_FILE.replace('.xlsx', `-before-merge-${timestamp}.xlsx`);
  await fs.copyFile(MAIN_FILE, backupPath);
  console.log(`  ✅ 备份完成: ${path.basename(backupPath)}`);

  // 5. 写入整合后的数据
  console.log('\n📥 正在写入整合后的数据...\n');
  const result = writeExcelData(uniqueActivities, MAIN_FILE);

  console.log(`  ✅ 总计活动: ${result.total} 条`);
  console.log(`  📄 文件路径: ${MAIN_FILE}`);

  // 6. 删除冗余的备份文件（可选）
  console.log('\n🗑️  清理冗余备份文件...\n');
  console.log('  以下文件可以手动删除:');
  console.log(`    - ${BACKUP_FILE}`);
  console.log(`    - ${BEFORE_CLEAN_FILE}`);
  console.log('\n  提示: 保留备份文件更安全，您可以稍后手动删除');

  // 完成
  console.log('\n========================================');
  console.log('  整合完成！');
  console.log('========================================\n');
  console.log(`📊 数据统计:`);
  console.log(`  原始数据: ${allData.length} 条`);
  console.log(`  去重后: ${uniqueActivities.length} 条`);
  console.log(`  去除重复: ${duplicateInfo.length} 条`);
  console.log(`\n✅ 主文件已更新: ${MAIN_FILE}`);
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { readExcelData, deduplicateActivities, getActivityKey };
