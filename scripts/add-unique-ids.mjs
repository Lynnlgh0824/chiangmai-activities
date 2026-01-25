#!/usr/bin/env node

/**
 * 为清迈活动数据 Excel 文件添加唯一 ID
 * 解决数据修改时未及时更新或重复的问题
 */

import XLSX from 'xlsx';
import fs from 'fs';
import crypto from 'crypto';

const EXCEL_FILE = './清迈活动数据.xlsx';
const BACKUP_FILE = './清迈活动数据.backup.xlsx';
const OUTPUT_FILE = './清迈活动数据.xlsx';

console.log('📋 开始为清迈活动数据添加唯一 ID...\n');

// 1. 读取 Excel 文件
console.log('📖 读取 Excel 文件...');
if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`❌ 文件不存在: ${EXCEL_FILE}`);
    process.exit(1);
}

// 备份原文件
console.log('💾 备份原文件...');
fs.copyFileSync(EXCEL_FILE, BACKUP_FILE);
console.log(`✅ 备份完成: ${BACKUP_FILE}\n`);

// 读取工作簿
const workbook = XLSX.readFile(EXCEL_FILE);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 转换为 JSON
const data = XLSX.utils.sheet_to_json(worksheet);
console.log(`📊 找到 ${data.length} 条活动记录\n`);

// 检查是否已经有 ID 列
const firstRow = data[0];
const hasIdColumn = 'id' in firstRow || 'ID' in firstRow || '编号' in firstRow;

if (hasIdColumn) {
    console.log('⚠️  数据中已存在 ID 列');
    console.log('🔄 将更新所有 ID...\n');
}

// 2. 为每条记录生成唯一 ID
console.log('🔑 生成唯一 ID...');
let updatedCount = 0;

data.forEach((row, index) => {
    // 检查是否已有 ID
    const existingId = row.id || row.ID || row.编号;

    if (existingId) {
        // 保留原有 ID（如果格式正确）
        if (typeof existingId === 'number' && existingId > 1000000000000) {
            console.log(`  ✓ 第 ${index + 1} 条: ID ${existingId} (保留)`);
            row.id = existingId;
            return;
        }
    }

    // 生成新的唯一 ID（基于时间戳 + 随机数）
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const newId = timestamp * 10000 + random;

    row.id = newId;
    updatedCount++;

    const title = row.title || row.活动名称 || row.名称 || '未命名';
    console.log(`  ${updatedCount}. 第 ${index + 1} 条: "${title}" → ID: ${newId}`);
});

console.log(`\n✅ 成功生成/更新 ${updatedCount} 个唯一 ID\n`);

// 3. 清理重复的 ID 列（如果有的话）
data.forEach(row => {
    // 保留 id 列，删除其他可能的 ID 列
    if (row.ID && row.ID !== row.id) {
        delete row.ID;
    }
    if (row.编号 && row.编号 !== row.id) {
        delete row.编号;
    }
});

// 4. 将 ID 列移到第一列
const orderedData = data.map(row => {
    const newRow = {};
    const id = row.id;

    // 先添加 id
    newRow.id = id;

    // 然后添加其他字段（按字母顺序）
    Object.keys(row)
        .filter(key => key !== 'id')
        .sort()
        .forEach(key => {
            newRow[key] = row[key];
        });

    return newRow;
});

// 5. 写回 Excel 文件
console.log('💾 保存到 Excel 文件...');
const newWorksheet = XLSX.utils.json_to_sheet(orderedData, {
    header: ['id', ...Object.keys(orderedData[0]).filter(k => k !== 'id')],
});

// 设置列宽
const colWidths = [
    { wch: 18 }, // id 列宽
    { wch: 30 }, // 其他列宽
];
newWorksheet['!cols'] = colWidths;

// 替换工作表
workbook.Sheets[sheetName] = newWorksheet;

// 保存文件
XLSX.writeFile(workbook, OUTPUT_FILE);
console.log(`✅ 文件已保存: ${OUTPUT_FILE}\n`);

// 6. 生成统计报告
console.log('📊 统计报告:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`总记录数: ${data.length}`);
console.log(`新增 ID: ${updatedCount}`);
console.log(`保留 ID: ${data.length - updatedCount}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 7. 导出为 JSON（用于备份和查看）
const jsonFile = './data/items-with-ids.json';
fs.writeFileSync(jsonFile, JSON.stringify(orderedData, null, 2), 'utf8');
console.log(`📄 JSON 备份已保存: ${jsonFile}\n`);

console.log('✨ 完成！所有活动现在都有唯一 ID 了！');
console.log('💡 提示: 原文件已备份为: 清迈活动数据.backup.xlsx');
