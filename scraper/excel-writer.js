/**
 * Excel 写入模块
 * 将爬取的数据写入到活动录入表格.xlsx
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;

// Excel 文件路径
const EXCEL_FILE = path.join(__dirname, '../清迈活动数据.xlsx');

/**
 * 判断活动类型（固定频率 or 临时活动）
 */
function determineActivityType(activity) {
  // 检查是否包含"每天"、"每周"等固定频率关键词
  const regularKeywords = [
    '每天', '每周', '定期', '例行',
    '周一', '周二', '周三', '周四', '周五', '周六', '周日',
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
    '毎日', '毎週',
  ];

  const content = `${activity.title} ${activity.description} ${activity.time}`.toLowerCase();

  // 如果包含固定频率关键词，归类为固定频率活动
  const isRegular = regularKeywords.some(keyword =>
    content.includes(keyword.toLowerCase())
  );

  return isRegular ? '固定频率活动' : '临时活动';
}

/**
 * 解析时间信息
 */
function parseTimeInfo(activity, activityType) {
  const result = {
    weekdays: [],
    date: '',
    time: '',
    duration: '',
  };

  // 提取时间
  const timeMatch = activity.time?.match(/(\d{1,2}:\d{2})\s*[-~至to]*\s*(\d{1,2}:\d{2})/i);
  if (timeMatch) {
    result.time = `${timeMatch[1]}-${timeMatch[2]}`;
  }

  // 提取星期（固定频率活动）
  if (activityType === '固定频率活动') {
    const weekdayMap = {
      '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 7,
      'Mon': '周一', 'Tue': '周二', 'Wed': '周三', 'Thu': '周四', 'Fri': '周五', 'Sat': '周六', 'Sun': '周日',
      '1': '周一', '2': '周二', '3': '周三', '4': '周四', '5': '周五', '6': '周六', '7': '周日',
    };

    const content = `${activity.title} ${activity.description} ${activity.time}`;

    // 查找所有星期
    Object.keys(weekdayMap).forEach(key => {
      if (content.includes(key)) {
        const day = weekdayMap[key];
        if (!result.weekdays.includes(day) && typeof day === 'string') {
          result.weekdays.push(day);
        }
      }
    });

    // 如果没找到，尝试从描述中提取
    if (result.weekdays.length === 0) {
      const weekdayMatches = content.match(/(周[一二三四五六七])/g);
      if (weekdayMatches) {
        result.weekdays = [...new Set(weekdayMatches)];
      }
    }
  }

  // 提取日期（临时活动）
  if (activityType === '临时活动') {
    // 尝试从 activity.date 提取
    if (activity.date) {
      const dateMatch = activity.date.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (dateMatch) {
        result.date = `${dateMatch[1]}-${String(dateMatch[2]).padStart(2, '0')}-${String(dateMatch[3]).padStart(2, '0')}`;
      }
    }

    // 如果没有日期，尝试从描述中提取
    if (!result.date) {
      const dateMatch = content => {
        const patterns = [
          /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})/,
          /(\d{1,2})[月/-](\d{1,2})/,
        ];

        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match) {
            if (match[1].length === 4) {
              return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
            } else {
              const year = new Date().getFullYear();
              return `${year}-${String(match[1]).padStart(2, '0')}-${String(match[2]).padStart(2, '0')}`;
            }
          }
        }
        return '';
      };

      result.date = dateMatch(`${activity.title} ${activity.description}`);
    }

    // 默认今天
    if (!result.date) {
      const today = new Date();
      result.date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
  }

  // 提取持续时间
  const durationPatterns = [
    /(\d+(\.\d+)?)\s*[个小时小时]/,
    /(\d+(\.\d+)?)\s*h/i,
  ];

  for (const pattern of durationPatterns) {
    const match = activity.description?.match(pattern);
    if (match) {
      result.duration = `${match[1]}小时`;
      break;
    }
  }

  if (!result.duration && result.time) {
    // 尝试从时间计算持续时间
    const timeMatch = result.time.match(/(\d{1,2}):(\d{2})\s*[-~至to]*\s*(\d{1,2}):(\d{2})/i);
    if (timeMatch) {
      const startHour = parseInt(timeMatch[1]);
      const startMin = parseInt(timeMatch[2]);
      const endHour = parseInt(timeMatch[3]);
      const endMin = parseInt(timeMatch[4]);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const durationMinutes = endMinutes - startMinutes;

      if (durationMinutes > 0) {
        const durationHours = (durationMinutes / 60).toFixed(1);
        result.duration = `${durationHours}小时`;
      }
    }
  }

  return result;
}

/**
 * 解析价格信息
 */
function parsePriceInfo(activity) {
  const result = {
    display: activity.price || '待询价',
    min: 0,
    max: 0,
  };

  // 提取价格数字
  const pricePatterns = [
    /(\d+)\s*฿/,
    /(\d+)\s*泰铢/,
    /(\d+)\s*THB/i,
    /(\d+)\s*บาท/,
  ];

  for (const pattern of pricePatterns) {
    const match = activity.price?.match(pattern);
    if (match) {
      const price = parseInt(match[1]);
      result.min = price;
      result.max = price;
      break;
    }
  }

  // 检查是否免费
  if (/免费|Free/i.test(activity.price)) {
    result.display = '免费';
    result.min = 0;
    result.max = 0;
  }

  return result;
}

/**
 * 转换爬取数据为 Excel 行数据
 */
function transformToExcelRow(activity, index) {
  const activityType = determineActivityType(activity);
  const timeInfo = parseTimeInfo(activity, activityType);
  const priceInfo = parsePriceInfo(activity);

  // 基础字段
  const row = {
    '序号': index,
    '活动标题': activity.title || '未命名活动',
    '分类': activity.category || '其他',
    '状态': '草稿',
    '活动描述': activity.description || activity.title || '',
    '持续时间': timeInfo.duration || '2小时',
    '地点名称': activity.location || '清迈',
    '详细地址': '',
    '价格显示': priceInfo.display,
    '最低价格': priceInfo.min,
    '最高价格': priceInfo.max,
    '最大人数': 0,
    '灵活时间': '否',
    '需要预约': '是',
    '图片URL': (activity.images || []).join('\n'),
    '来源链接': activity.url || '',
  };

  // 根据活动类型添加特定字段
  if (activityType === '固定频率活动') {
    row['星期'] = timeInfo.weekdays.length > 0 ? timeInfo.weekdays.join(',') : '周一';
    row['时间'] = timeInfo.time || '09:00-11:00';
  } else {
    row['具体日期'] = timeInfo.date || new Date().toISOString().split('T')[0];
    row['时间'] = timeInfo.time || '14:00-17:00';
  }

  return { row, activityType };
}

/**
 * 读取 Excel 文件
 */
async function readExcelFile() {
  try {
    // 检查文件是否存在
    await fs.access(EXCEL_FILE);

    const workbook = XLSX.readFile(EXCEL_FILE);
    return workbook;
  } catch (error) {
    console.error('❌ 读取 Excel 文件失败:', error.message);
    throw new Error(`无法读取文件: ${EXCEL_FILE}`);
  }
}

/**
 * 写入 Excel 文件
 */
async function writeExcelFile(workbook) {
  try {
    // 备份原文件
    const backupPath = EXCEL_FILE.replace('.xlsx', '-backup.xlsx');
    await fs.copyFile(EXCEL_FILE, backupPath);

    // 写入新文件
    XLSX.writeFile(workbook, EXCEL_FILE);

    console.log(`\n✅ 数据已写入: ${EXCEL_FILE}`);
    console.log(`📦 备份文件: ${backupPath}`);
  } catch (error) {
    console.error('❌ 写入 Excel 文件失败:', error.message);
    throw error;
  }
}

/**
 * 获取工作表的下一个空行
 */
function getNextEmptyRow(sheet) {
  const range = XLSX.utils.decode_range(sheet['!ref']);
  let nextRow = range.e.r + 1; // 从最后一行+1开始

  // 跳过示例数据行（前4行是表头和示例）
  if (nextRow < 5) {
    nextRow = 5;
  }

  return nextRow;
}

/**
 * 将活动数据写入 Excel
 */
async function writeToExcel(activities) {
  console.log('\n📊 准备写入 Excel 表格...');
  console.log(`📄 文件路径: ${EXCEL_FILE}`);

  try {
    // 读取现有 Excel 文件
    const workbook = await readExcelFile();

    // 按活动类型分组
    const regularActivities = [];
    const temporaryActivities = [];

    activities.forEach((activity, index) => {
      const { row, activityType } = transformToExcelRow(activity, index + 1);

      if (activityType === '固定频率活动') {
        regularActivities.push(row);
      } else {
        temporaryActivities.push(row);
      }
    });

    console.log(`\n📋 数据分类:`);
    console.log(`  - 固定频率活动: ${regularActivities.length} 条`);
    console.log(`  - 临时活动: ${temporaryActivities.length} 条`);

    // 写入固定频率活动表
    if (regularActivities.length > 0) {
      const sheetName = '固定频率活动';
      const sheet = workbook.Sheets[sheetName];

      if (sheet) {
        const startRow = getNextEmptyRow(sheet);

        console.log(`\n✍️  写入 "${sheetName}" 工作表（从第 ${startRow + 1} 行开始）`);

        regularActivities.forEach((row, index) => {
          const rowIndex = startRow + index;

          // 写入每一列
          Object.keys(row).forEach(key => {
            const cellAddress = `${String.fromCharCode(65 + Object.keys(row).indexOf(key))}${rowIndex + 1}`;
            sheet[cellAddress] = { v: row[key], t: 's' };
          });
        });

        // 更新工作表范围
        const newRange = XLSX.utils.decode_range(sheet['!ref']);
        newRange.e.r = startRow + regularActivities.length - 1;
        sheet['!ref'] = XLSX.utils.encode_range(newRange);
      }
    }

    // 写入临时活动表
    if (temporaryActivities.length > 0) {
      const sheetName = '临时活动';
      const sheet = workbook.Sheets[sheetName];

      if (sheet) {
        const startRow = getNextEmptyRow(sheet);

        console.log(`\n✍️  写入 "${sheetName}" 工作表（从第 ${startRow + 1} 行开始）`);

        temporaryActivities.forEach((row, index) => {
          const rowIndex = startRow + index;

          // 写入每一列
          Object.keys(row).forEach(key => {
            const cellAddress = `${String.fromCharCode(65 + Object.keys(row).indexOf(key))}${rowIndex + 1}`;
            sheet[cellAddress] = { v: row[key], t: 's' };
          });
        });

        // 更新工作表范围
        const newRange = XLSX.utils.decode_range(sheet['!ref']);
        newRange.e.r = startRow + temporaryActivities.length - 1;
        sheet['!ref'] = XLSX.utils.encode_range(newRange);
      }
    }

    // 保存文件
    await writeExcelFile(workbook);

    console.log('\n✅ 所有数据写入完成！');

    return {
      total: activities.length,
      regular: regularActivities.length,
      temporary: temporaryActivities.length,
    };
  } catch (error) {
    console.error('\n❌ 写入 Excel 失败:', error.message);
    throw error;
  }
}

/**
 * 显示写入预览
 */
function showPreview(activities) {
  console.log('\n📋 数据预览 (前3条):\n');

  activities.slice(0, 3).forEach((activity, index) => {
    const { row, activityType } = transformToExcelRow(activity, index + 1);

    console.log(`${index + 1}. ${row['活动标题']}`);
    console.log(`   类型: ${activityType}`);
    console.log(`   分类: ${row['分类']} | 价格: ${row['价格显示']}`);
    console.log(`   地点: ${row['地点名称']}`);

    if (activityType === '固定频率活动') {
      console.log(`   时间: ${row['星期']} ${row['时间']}`);
    } else {
      console.log(`   时间: ${row['具体日期']} ${row['时间']}`);
    }

    console.log('');
  });
}

module.exports = {
  writeToExcel,
  transformToExcelRow,
  determineActivityType,
  showPreview,
};
