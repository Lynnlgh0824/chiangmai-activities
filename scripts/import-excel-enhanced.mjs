#!/usr/bin/env node

/**
 * 增强的Excel导入脚本
 * 功能：自动导入Excel到后台，包含备份、验证、日志
 * 用法: npm run import-excel
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXCEL_FILE = path.join(__dirname, '../清迈活动数据.xlsx');
const BACKUP_DIR = path.join(__dirname, '../backups');
const JSON_FILE = path.join(__dirname, '../data/items.json');
const LOG_DIR = path.join(__dirname, '../logs');

console.log('📥 开始从Excel导入数据到后台...\n');

// 创建必要的目录
[BACKUP_DIR, LOG_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
});

// 生成时间戳
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.xlsx`);
const logFile = path.join(LOG_DIR, `import-${timestamp}.log`);

// 日志函数
const logs = [];
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    logs.push(logEntry);
    console.log(logEntry);
}

// 步骤1: 检查Excel文件
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('步骤1: 检查Excel文件');

if (!fs.existsSync(EXCEL_FILE)) {
    log('❌ Excel文件不存在，请检查文件路径', 'error');
    process.exit(1);
}

const stats = fs.statSync(EXCEL_FILE);
log(`✅ 找到Excel文件: ${EXCEL_FILE}`);
log(`   文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
log(`   修改时间: ${stats.mtime.toLocaleString('zh-CN')}`);

// 步骤2: 备份Excel文件
log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('步骤2: 备份Excel文件');

try {
    fs.copyFileSync(EXCEL_FILE, backupFile);
    log(`✅ 备份完成: ${path.basename(backupFile)}`);
} catch (error) {
    log(`❌ 备份失败: ${error.message}`, 'error');
    process.exit(1);
}

// 步骤3: 读取Excel数据
log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('步骤3: 读取Excel数据');

try {
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    log(`✅ 成功读取 ${rawData.length} 条记录`);

    // 显示前几条预览
    log('\n📋 数据预览:');
    rawData.slice(0, 3).forEach((row, i) => {
        const num = row['活动编号'] || row.activityNumber || 'N/A';
        const title = row['活动标题'] || row.title || '未命名';
        log(`   ${i + 1}. ${num} - ${title}`);
    });

    // 步骤4: 字段映射和数据转换
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('步骤4: 字段映射和数据转换');

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

    // 读取旧数据用于对比
    let oldData = [];
    if (fs.existsSync(JSON_FILE)) {
        try {
            oldData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
            log(`✅ 读取到旧数据: ${oldData.length} 条记录`);
        } catch (error) {
            log(`⚠️  无法读取旧数据: ${error.message}`, 'warn');
        }
    }

    // 映射和转换数据
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    const mappedData = rawData.map((row, index) => {
        const item = { id: row.id };

        // 映射所有字段
        Object.keys(row).forEach(key => {
            if (key === 'id') return;

            const mappedKey = fieldMapping[key] || key;
            item[mappedKey] = row[key];
        });

        // 确保 ID 存在
        if (!item.id) {
            log(`⚠️  第 ${index + 1} 行缺少 ID，跳过`, 'warn');
            skipCount++;
            return null;
        }

        // 处理星期字段（转换为数组）
        if (item.weekdays && typeof item.weekdays === 'string') {
            item.weekdays = item.weekdays.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
        }

        successCount++;
        return item;
    }).filter(item => item !== null);

    log(`✅ 数据映射完成:`);
    log(`   成功: ${successCount} 条`);
    log(`   跳过: ${skipCount} 条`);
    log(`   错误: ${errorCount} 条`);

    // 步骤5: 数据验证
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('步骤5: 数据验证');

    let validationErrors = 0;
    let validationWarnings = 0;

    mappedData.forEach((item, index) => {
        // 必填字段检查
        if (!item.title) {
            log(`⚠️  第 ${index + 1} 行 (${item.activityNumber || 'N/A'}) 缺少标题`, 'warn');
            validationErrors++;
        }

        if (!item.category) {
            log(`⚠️  第 ${index + 1} 行 (${item.activityNumber || 'N/A'}) 缺少分类`, 'warn');
            validationErrors++;
        }

        if (!item.price) {
            log(`⚠️  第 ${index + 1} 行 (${item.activityNumber || 'N/A'}) 缺少价格`, 'warn');
            validationErrors++;
        }
    });

    if (validationErrors > 0) {
        log(`\n⚠️  验证完成: 发现 ${validationErrors} 个错误, ${validationWarnings} 个警告`, 'warn');
    } else {
        log(`✅ 验证通过: 所有数据格式正确`);
    }

    // 步骤6: 生成变更报告
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('步骤6: 生成变更报告');

    const oldIds = new Set(oldData.map(item => item.id));
    const newIds = new Set(mappedData.map(item => String(item.id)));

    const added = mappedData.filter(item => !oldIds.has(String(item.id)));
    const removed = oldData.filter(item => !newIds.has(String(item.id)));

    log(`📊 变更统计:`);
    log(`   新增: ${added.length} 条`);
    log(`   删除: ${removed.length} 条`);
    log(`   修改: ${mappedData.length - added.length} 条`);

    if (added.length > 0) {
        log('\n➕ 新增活动:');
        added.forEach(item => {
            log(`   - ${item.activityNumber || 'N/A'}: ${item.title}`);
        });
    }

    if (removed.length > 0) {
        log('\n➖ 删除活动:');
        removed.forEach(item => {
            log(`   - ${item.activityNumber || 'N/A'}: ${item.title}`);
        });
    }

    // 步骤7: 保存到JSON
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('步骤7: 保存到后台数据');

    try {
        fs.writeFileSync(JSON_FILE, JSON.stringify(mappedData, null, 2), 'utf8');
        log(`✅ 数据已保存到: ${JSON_FILE}`);
    } catch (error) {
        log(`❌ 保存失败: ${error.message}`, 'error');
        process.exit(1);
    }

    // 步骤8: 分类统计
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('步骤8: 分类统计');

    const categories = {};
    mappedData.forEach(item => {
        const cat = item.category || '未分类';
        categories[cat] = (categories[cat] || 0) + 1;
    });

    log('📊 分类分布:');
    Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
            log(`   ${cat}: ${count} 个`);
        });

    // 保存日志
    const logContent = logs.join('\n');
    fs.writeFileSync(logFile, logContent, 'utf8');
    log(`\n📝 详细日志已保存: ${logFile}`);

    // 完成
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('✨ 导入完成！');
    log(`\n📊 导入摘要:`);
    log(`   总记录: ${mappedData.length} 条`);
    log(`   新增: ${added.length} 条`);
    log(`   删除: ${removed.length} 条`);
    log(`   备份: ${path.basename(backupFile)}`);

} catch (error) {
    log(`\n❌ 导入失败: ${error.message}`, 'error');
    log(error.stack, 'error');

    // 保存错误日志
    const errorLogContent = logs.join('\n');
    fs.writeFileSync(logFile, errorLogContent, 'utf8');
    log(`\n📝 错误日志已保存: ${logFile}`);

    process.exit(1);
}
