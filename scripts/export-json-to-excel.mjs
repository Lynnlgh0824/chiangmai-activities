#!/usr/bin/env node

/**
 * 从 JSON 导出数据到 Excel 文件
 * 用法: npm run export-to-excel
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const JSON_FILE = './data/items.json';
const EXCEL_FILE = './清迈活动数据-导出.xlsx';

console.log('📤 开始从 JSON 导出数据到 Excel...\n');

// 检查 JSON 文件
if (!fs.existsSync(JSON_FILE)) {
    console.error(`❌ 文件不存在: ${JSON_FILE}`);
    process.exit(1);
}

// 读取 JSON 数据
console.log('📖 读取 JSON 文件...');
const items = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
console.log(`✅ 找到 ${items.length} 条记录\n`);

// 按活动编号排序
items.sort((a, b) => {
    const numA = parseInt(a.activityNumber || a['活动编号'] || '0');
    const numB = parseInt(b.activityNumber || b['活动编号'] || '0');
    return numA - numB;
});

// 定义列顺序
const columnOrder = [
    '活动编号', '活动标题', '分类', '地点', '价格',
    '时间', '持续时间', '时间信息', '星期', '序号',
    '最低价格', '最高价格', '最大人数', '描述',
    '灵活时间', '状态', '需要预约', 'id'
];

// 转换为 Excel 格式
console.log('🔄 转换数据格式...');
const excelData = items.map(item => ({
    '活动编号': item.activityNumber || item['活动编号'] || '',
    '活动标题': item.title || '',
    '分类': item.category || '',
    '地点': item.location || '',
    '价格': item.price || '',
    '时间': item.time || '',
    '持续时间': item.duration || '',
    '时间信息': item.timeInfo || '',
    '星期': Array.isArray(item.weekdays) ? item.weekdays.join(', ') : '',
    '序号': item.sortOrder || 0,
    '最低价格': item.minPrice || 0,
    '最高价格': item.maxPrice || 0,
    '最大人数': item.maxParticipants || 0,
    '描述': item.description || '',
    '灵活时间': item.flexibleTime || '否',
    '状态': item.status || '草稿',
    '需要预约': item.requireBooking || '是',
    'id': String(item.id || '')
}));

// 创建工作表
console.log('📊 创建 Excel 工作表...');
const worksheet = XLSX.utils.json_to_sheet(excelData, {
    header: columnOrder
});

// 设置列宽
const colWidths = [
    { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 30 }, { wch: 18 },
    { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 8 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 18 }
];
worksheet['!cols'] = colWidths;

// 保存文件
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, '活动列表');
XLSX.writeFile(workbook, EXCEL_FILE);

console.log(`\n✅ 已导出 ${items.length} 条活动到 ${EXCEL_FILE}`);
console.log('\n📊 分类统计:');
const categories = {};
items.forEach(item => {
    const cat = item.category || '未分类';
    categories[cat] = (categories[cat] || 0) + 1;
});
Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} 个`);
    });

console.log('\n✨ 导出完成！');
