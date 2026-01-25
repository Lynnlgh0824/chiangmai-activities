/**
 * Excel 数据导入到飞书多维表格工具
 * 将清迈活动数据.xlsx 导入到飞书后台
 */

const XLSX = require('xlsx');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Excel 文件路径
const EXCEL_FILE = path.join(__dirname, '../清迈活动数据.xlsx');

// 飞书配置
const FEISHU_CONFIG = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  spreadsheetToken: process.env.FEISHU_SPREADSHEET_TOKEN,
  sheetId: process.env.FEISHU_SHEET_ID,
};

/**
 * 获取飞书 tenant_access_token
 */
async function getFeishuToken() {
  try {
    const response = await axios.post(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        app_id: FEISHU_CONFIG.appId,
        app_secret: FEISHU_CONFIG.appSecret
      }
    );

    if (response.data.code !== 0) {
      throw new Error(`获取token失败: ${JSON.stringify(response.data)}`);
    }

    return response.data.tenant_access_token;
  } catch (error) {
    console.error('❌ 获取飞书token失败:', error.message);
    throw error;
  }
}

/**
 * 读取 Excel 文件
 */
function readExcelFile(filepath) {
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

      // 从第2行开始是数据
      for (let i = 1; i < data.length; i++) {
        const row = data[i];

        // 跳过空行
        if (!row || row.length === 0) continue;

        // 跳过示例行
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
    console.error(`❌ 读取Excel失败:`, error.message);
    throw error;
  }
}

/**
 * 转换 Excel 数据为飞书字段格式
 */
function convertToFeishuFields(excelData) {
  const fields = {};

  // 字段映射表
  const fieldMapping = {
    '活动标题*': '活动标题',
    '活动标题': '活动标题',
    '分类*': '分类',
    '分类': '分类',
    '状态': '状态',
    '活动描述*': '活动描述',
    '活动描述': '活动描述',
    '时间信息': '活动类型',
    '活动类型': '活动类型',
    '星期*': '星期/日期',
    '星期': '星期/日期',
    '具体日期': '星期/日期',
    '时间*': '时间',
    '时间': '时间',
    '持续时间': '持续时间',
    '地点名称*': '地点名称',
    '地点名称': '地点名称',
    '详细地址': '详细地址',
    '价格显示': '价格显示',
    '最低价格': '最低价格',
    '最高价格': '最高价格',
    '最大人数': '最大人数',
    '灵活时间': '灵活时间',
    '需要预约': '需要预约',
    '图片URL': '图片URL',
    '来源链接': '来源链接',
  };

  // 遍历映射表，转换字段
  for (const [excelField, feishuField] of Object.entries(fieldMapping)) {
    if (excelData.hasOwnProperty(excelField)) {
      let value = excelData[excelField];

      // 处理特殊字段
      if (feishuField === '最低价格' || feishuField === '最高价格' || feishuField === '最大人数') {
        // 数字字段
        value = parseInt(value) || 0;
      } else if (feishuField === '灵活时间' || feishuField === '需要预约') {
        // 布尔字段：是/否 转 true/false
        value = value === '是';
      } else if (typeof value === 'string') {
        value = value.trim();
      }

      if (value !== '' && value !== null && value !== undefined) {
        fields[feishuField] = value;
      }
    }
  }

  return fields;
}

/**
 * 写入单条记录到飞书
 */
async function writeRecordToFeishu(token, fields) {
  try {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_CONFIG.spreadsheetToken}/tables/${FEISHU_CONFIG.sheetId}/records`;

    const response = await axios.post(url, {
      fields: fields
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.code !== 0) {
      throw new Error(`写入失败: ${JSON.stringify(response.data)}`);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * 批量导入数据到飞书
 */
async function importToFeishu(data) {
  console.log(`\n📦 开始导入 ${data.length} 条活动到飞书...\n`);

  // 获取token
  console.log('🔑 正在获取飞书访问令牌...');
  const token = await getFeishuToken();
  console.log('✅ 令牌获取成功\n');

  const results = {
    total: data.length,
    success: 0,
    failed: 0,
    errors: []
  };

  // 逐条导入（飞书API不支持真正的批量导入）
  for (let i = 0; i < data.length; i++) {
    const excelRow = data[i];
    process.stdout.write(`\r[${i + 1}/${data.length}] `);

    try {
      // 转换为飞书格式
      const fields = convertToFeishuFields(excelRow);

      // 检查必要字段
      if (!fields['活动标题']) {
        console.log(`\n   ⚠️  跳过: 缺少活动标题`);
        results.failed++;
        continue;
      }

      // 写入飞书
      await writeRecordToFeishu(token, fields);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        title: excelRow['活动标题*'] || excelRow['活动标题'] || '(无标题)',
        error: error.message
      });
      console.error(`\n   ❌ 导入失败: ${excelRow['活动标题*'] || excelRow['活动标题'] || '(无标题)'} - ${error.message}`);
    }

    // 延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n\n========================================');
  console.log('  导入结果统计');
  console.log('========================================\n');
  console.log(`总计: ${results.total} 条`);
  console.log(`✅ 成功: ${results.success} 条`);
  console.log(`❌ 失败: ${results.failed} 条`);

  if (results.errors.length > 0) {
    console.log('\n❌ 失败详情 (前10条):');
    results.errors.slice(0, 10).forEach((err, index) => {
      console.log(`${index + 1}. ${err.title}`);
      console.log(`   错误: ${err.error}\n`);
    });
  }

  return results;
}

/**
 * 主函数
 */
async function main() {
  console.log('🔄 Excel 数据导入到飞书工具');
  console.log('========================================\n');

  console.log('📄 读取 Excel 文件...');
  console.log(`   文件: ${EXCEL_FILE}\n`);

  try {
    // 读取 Excel
    const data = readExcelFile(EXCEL_FILE);
    console.log(`✅ 找到 ${data.length} 条活动数据\n`);

    // 显示预览
    console.log('📋 数据预览 (前3条):\n');
    data.slice(0, 3).forEach((item, index) => {
      const title = item['活动标题*'] || item['活动标题'];
      console.log(`${index + 1}. ${title || '(无标题)'}`);
      console.log(`   工作表: ${item._sheet}`);
      console.log(`   分类: ${item['分类*'] || item['分类'] || '未分类'}`);
      console.log(`   价格: ${item['价格显示'] || '未设置'}`);
      console.log('');
    });

    // 确认导入
    console.log('⚠️  即将导入到飞书多维表格');
    console.log('   表格Token:', FEISHU_CONFIG.spreadsheetToken);
    console.log('   工作表ID:', FEISHU_CONFIG.sheetId);
    console.log('\n💡 按 Ctrl+C 取消，或等待5秒继续...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // 执行导入
    await importToFeishu(data);

    console.log('\n✅ 导入完成！\n');
    console.log('💡 提示: 请到飞书多维表格查看导入的数据\n');

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

module.exports = { readExcelFile, convertToFeishuFields, importToFeishu };
