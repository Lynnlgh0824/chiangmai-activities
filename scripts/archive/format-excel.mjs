#!/usr/bin/env node

/**
 * 格式化Excel文件：调整列顺序，清理列名，确保数据完整性
 */

import XLSX from 'xlsx';
import fs from 'fs';
import { exec } from 'child_process';

const EXCEL_FILE = './清迈活动数据.xlsx';
const BACKUP_FILE = './清迈活动数据.backup.xlsx';

console.log('📋 开始格式化Excel文件...\n');

// 备份
if (fs.existsSync(EXCEL_FILE)) {
    fs.copyFileSync(EXCEL_FILE, BACKUP_FILE);
    console.log('💾 已备份原文件\n');
}

// 读取Excel
const workbook = XLSX.readFile(EXCEL_FILE);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 转换为JSON
const data = XLSX.utils.sheet_to_json(worksheet);
console.log(`📊 找到 ${data.length} 条记录\n`);

// 定义列名映射（去掉星号，中英文对照）
const columnMapping = {
    '活动编号': 'activityNumber',
    '活动标题*': 'title',
    '活动描述*': 'description',
    '分类*': 'category',
    '地点名称*': 'location',
    '价格显示': 'price',
    '时间*': 'time',
    '持续时间': 'duration',
    '时间信息': 'timeInfo',
    '星期*': 'weekdays',
    '序号': 'sortOrder',
    '最低价格': 'minPrice',
    '最高价格': 'maxPrice',
    '最大人数': 'maxParticipants',
    '灵活时间': 'flexibleTime',
    '状态': 'status',
    '需要预约': 'requireBooking'
};

// 重新组织数据，调整列顺序
const formattedData = data.map(row => {
    return {
        '活动编号': row['活动编号'] || row.activityNumber || '',
        '活动标题': row['活动标题*'] || row.title || row.活动名称 || row.title || '',
        '分类': row['分类*'] || row.category || '',
        '地点': row['地点名称*'] || row.location || '',
        '价格': row['价格显示'] || row.price || '',
        '时间': row['时间*'] || row.time || '',
        '持续时间': row['持续时间'] || row.duration || '',
        '时间信息': row['时间信息'] || row.timeInfo || '',
        '星期': row['星期*'] || row.weekdays || [],
        '序号': row['序号'] || row.sortOrder || 0,
        '最低价格': row['最低价格'] || row.minPrice || 0,
        '最高价格': row['最高价格'] || row.maxPrice || 0,
        '最大人数': row['最大人数'] || row.maxParticipants || 0,
        '描述': row['活动描述*'] || row.description || '',
        '灵活时间': row['灵活时间'] || row.flexibleTime || '否',
        '状态': row['状态'] || row.status || '草稿',
        '需要预约': row['需要预约'] || row.requireBooking || '是',
        'id': row.id || ''
    };
});

// 显示前几条数据
console.log('📝 格式化后的数据预览：');
formattedData.slice(0, 3).forEach((item, index) => {
    console.log(`\n${index + 1}. ${item['活动编号']} - ${item['活动标题']}`);
    console.log(`   分类: ${item['分类']}`);
    console.log(`   地点: ${item['地点']}`);
    console.log(`   时间: ${item['时间']}`);
});

console.log(`\n✅ 成功格式化 ${formattedData.length} 条记录\n`);

// 创建新的工作表，使用指定的列顺序
const columnOrder = [
    '活动编号',
    '活动标题',
    '分类',
    '地点',
    '价格',
    '时间',
    '持续时间',
    '时间信息',
    '星期',
    '序号',
    '最低价格',
    '最高价格',
    '最大人数',
    '描述',
    '灵活时间',
    '状态',
    '需要预约',
    'id'
];

const newWorksheet = XLSX.utils.json_to_sheet(formattedData, {
    header: columnOrder
});

// 设置列宽
const colWidths = [
    { wch: 12 }, // 活动编号
    { wch: 30 }, // 活动标题
    { wch: 12 }, // 分类
    { wch: 30 }, // 地点
    { wch: 18 }, // 价格
    { wch: 18 }, // 时间
    { wch: 15 }, // 持续时间
    { wch: 15 }, // 时间信息
    { wch: 20 }, // 星期
    { wch: 8 },  // 序号
    { wch: 12 }, // 最低价格
    { wch: 12 }, // 最高价格
    { wch: 12 }, // 最大人数
    { wch: 40 }, // 描述
    { wch: 12 }, // 灵活时间
    { wch: 12 }, // 状态
    { wch: 12 }, // 需要预约
    { wch: 18 }  // id
];
newWorksheet['!cols'] = colWidths;

// 替换工作表
workbook.Sheets[sheetName] = newWorksheet;

// 保存文件
XLSX.writeFile(workbook, EXCEL_FILE);
console.log(`✅ 文件已保存: ${EXCEL_FILE}\n`);

// 自动导出到JSON
console.log('📤 导出数据到JSON...');
exec('npm run export-data', (error, stdout, stderr) => {
    if (error) {
        console.error('❌ 导出失败:', error.message);
        return;
    }
    console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('\n✨ 格式化完成！');
    console.log('💡 提示: 原文件已备份为: 清迈活动数据.backup.xlsx');
});
