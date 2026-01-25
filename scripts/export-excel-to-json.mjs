#!/usr/bin/env node

/**
 * 从 Excel 导出数据到 JSON
 * 确保 ID 字段正确映射
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const EXCEL_FILE = './清迈活动数据.xlsx';
const OUTPUT_FILE = './data/items.json';

console.log('📤 开始从 Excel 导出数据到 JSON...\n');

// 检查 Excel 文件是否存在
if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`❌ 文件不存在: ${EXCEL_FILE}`);
    console.log('\n💡 提示: 请先运行 npm run add-ids 生成 ID');
    process.exit(1);
}

// 读取 Excel 文件
console.log('📖 读取 Excel 文件...');
const workbook = XLSX.readFile(EXCEL_FILE);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 转换为 JSON
const rawData = XLSX.utils.sheet_to_json(worksheet);
console.log(`✅ 找到 ${rawData.length} 条记录\n`);

// 字段映射配置（支持新旧两种列名）
const fieldMapping = {
    'id': 'id',
    '活动标题': 'title',
    '活动标题*': 'title',
    '分类': 'category',
    '分类*': 'category',
    '地点': 'location',
    '地点名称': 'location',
    '地点名称*': 'location',
    '时间': 'time',
    '时间*': 'time',
    '星期': 'weekdays',
    '星期*': 'weekdays',
    '价格': 'price',
    '价格显示': 'price',
    '描述': 'description',
    '活动描述': 'description',
    '活动描述*': 'description',
    '状态': 'status',
    '需要预约': 'requireBooking',
    '灵活时间': 'flexibleTime',
    '持续时间': 'duration',
    '最低价格': 'minPrice',
    '最高价格': 'maxPrice',
    '最大人数': 'maxParticipants',
    '时间信息': 'timeInfo',
    '序号': 'sortOrder',
    '活动编号': 'activityNumber'
};

// 映射数据
const mappedData = rawData.map((row, index) => {
    const item = { id: row.id };

    // 映射所有字段
    Object.keys(row).forEach(key => {
        if (key === 'id') return;

        // 使用映射配置或保留原名
        const mappedKey = fieldMapping[key] || key;
        item[mappedKey] = row[key];
    });

    // 确保 ID 存在
    if (!item.id) {
        console.warn(`⚠️  第 ${index + 1} 条记录缺少 ID，跳过`);
        return null;
    }

    // 处理星期字段（转换为数组）
    if (item.weekdays && typeof item.weekdays === 'string') {
        item.weekdays = item.weekdays.split(',').map(s => s.trim());
    }

    return item;
}).filter(item => item !== null);

console.log(`✅ 成功映射 ${mappedData.length} 条记录\n`);

// 确保输出目录存在
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 保存为 JSON
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mappedData, null, 2), 'utf8');
console.log(`💾 已保存到: ${OUTPUT_FILE}\n`);

// 显示统计信息
const categories = {};
mappedData.forEach(item => {
    const cat = item.category || '未分类';
    categories[cat] = (categories[cat] || 0) + 1;
});

console.log('📊 分类统计:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} 个`);
    });
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('✨ 导出完成！');
console.log(`\n💡 提示: 现在可以启动服务器查看数据`);
console.log(`   npm run dev`);
