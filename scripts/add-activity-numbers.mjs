#!/usr/bin/env node

/**
 * 为清迈活动数据 Excel 添加活动编号列
 * 活动编号：简短易记的编号（如 #001, #002）
 * 唯一 ID：保持原有的数字ID（用于系统内部）
 */

import XLSX from 'xlsx';
import fs from 'fs';

const EXCEL_FILE = './清迈活动数据.xlsx';
const BACKUP_FILE = './清迈活动数据.backup.xlsx';

console.log('📋 为清迈活动数据添加活动编号...\n');

// 备份
if (fs.existsSync(EXCEL_FILE)) {
    fs.copyFileSync(EXCEL_FILE, BACKUP_FILE);
    console.log('💾 已备份原文件');
}

// 读取 Excel
const workbook = XLSX.readFile(EXCEL_FILE);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 转换为 JSON
const data = XLSX.utils.sheet_to_json(worksheet);
console.log(`📊 找到 ${data.length} 条活动记录\n`);

// 为每条记录生成活动编号
let counter = 1;
data.forEach((row, index) => {
    // 生成活动编号（#001, #002...）
    const activityNumber = `#${String(counter).padStart(3, '0')}`;

    // 添加活动编号列（放在第一列）
    row['活动编号'] = activityNumber;

    const title = row['活动标题*'] || row.title || '未命名';
    console.log(`  ${counter}. ${activityNumber} - ${title}`);

    counter++;
});

console.log(`\n✅ 成功添加 ${data.length} 个活动编号\n`);

// 重新排序列：活动编号、id、其他字段
const orderedData = data.map(row => {
    const newRow = {};

    // 按顺序添加字段
    Object.keys(row).forEach(key => {
        newRow[key] = row[key];
    });

    return newRow;
});

// 写回 Excel
const newWorksheet = XLSX.utils.json_to_sheet(orderedData);
workbook.Sheets[sheetName] = newWorksheet;
XLSX.writeFile(workbook, EXCEL_FILE);

console.log(`✅ 文件已更新: ${EXCEL_FILE}\n`);
console.log('📊 列说明:');
console.log('  - 活动编号: #001, #002... （人工识别）');
console.log('  - id: 17693677202621728... （系统使用）');
console.log('\n✨ 完成！');
