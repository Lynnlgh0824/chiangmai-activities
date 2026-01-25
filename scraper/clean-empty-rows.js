const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');

const EXCEL_FILE = path.join(__dirname, '../清迈活动数据.xlsx');

async function cleanEmptyRows() {
  console.log('🔄 清理Excel空行...\n');

  // 读取Excel文件
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = '全部活动';
  const sheet = workbook.Sheets[sheetName];

  // 获取所有数据
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const data = [];

  // 读取表头（第1行）
  const header = [];
  for (let col = 0; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = sheet[cellAddress];
    header.push(cell ? cell.v : '');
  }

  console.log('表头:', header);

  // 读取所有行，跳过空行
  for (let row = 1; row <= range.e.r; row++) {
    const rowData = {};
    let hasData = false;

    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = sheet[cellAddress];

      if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
        rowData[header[col]] = cell.v;
        if (col === 1) hasData = true; // 检查活动标题列
      }
    }

    // 只保留有数据的行
    if (hasData && rowData['活动标题*']) {
      data.push(rowData);
    }
  }

  console.log(`\n✅ 找到 ${data.length} 条有效数据`);

  // 创建新的工作表
  const newSheet = XLSX.utils.json_to_sheet(data);

  // 更新工作簿
  workbook.Sheets[sheetName] = newSheet;

  // 备份原文件
  const backupPath = EXCEL_FILE.replace('.xlsx', '-before-clean.xlsx');
  await fs.copyFile(EXCEL_FILE, backupPath);
  console.log(`\n📦 备份文件: ${path.basename(backupPath)}`);

  // 保存清理后的文件
  XLSX.writeFile(workbook, EXCEL_FILE);
  console.log(`\n✅ 已清理空行并保存: ${path.basename(EXCEL_FILE)}`);

  console.log(`\n📊 清理结果:`);
  console.log(`   - 原始行数: ${range.e.r + 1}`);
  console.log(`   - 有效数据: ${data.length} 条`);
  console.log(`   - 删除空行: ${range.e.r + 1 - data.length} 行`);
}

cleanEmptyRows().catch(console.error);
