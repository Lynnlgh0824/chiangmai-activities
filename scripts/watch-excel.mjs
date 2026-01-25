#!/usr/bin/env node

/**
 * Excel文件自动监听和导入
 * 功能：监听Excel文件变化，自动导入到后台
 * 用法: npm run watch-excel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXCEL_FILE = path.join(__dirname, '../清迈活动数据.xlsx');
const IMPORT_SCRIPT = path.join(__dirname, 'import-excel-enhanced.mjs');

console.log('👀 开始监听Excel文件变化...\n');
console.log(`📂 监听文件: ${EXCEL_FILE}`);
console.log('💡 提示: 修改Excel文件后，会自动导入到后台');
console.log('💡 提示: 按 Ctrl+C 停止监听\n');

let isImporting = false;
let lastModified = 0;
let importTimeout = null;

// 导入函数
function importExcel() {
    if (isImporting) {
        console.log('⏳ 正在导入中，跳过本次触发...');
        return;
    }

    isImporting = true;
    console.log('\n' + '='.repeat(60));
    console.log('🔄 检测到文件变化，开始导入...');
    console.log('='.repeat(60));

    const importProcess = exec(`node "${IMPORT_SCRIPT}"`, {
        cwd: __dirname
    });

    importProcess.stdout.on('data', (data) => {
        console.log(data.toString().trim());
    });

    importProcess.stderr.on('data', (data) => {
        console.error(data.toString().trim());
    });

    importProcess.on('close', (code) => {
        isImporting = false;
        console.log('\n' + '='.repeat(60));
        if (code === 0) {
            console.log('✅ 导入完成，继续监听...\n');
        } else {
            console.log(`⚠️  导入结束，退出码: ${code}\n`);
        }
        console.log('💡 等待下次文件修改...\n');
    });
}

// 防抖函数 - 避免频繁触发
function debouncedImport() {
    if (importTimeout) {
        clearTimeout(importTimeout);
    }

    console.log('⏳ 检测到文件修改，等待文件保存完成...');

    // 等待1秒后再导入（避免文件未完全保存）
    importTimeout = setTimeout(() => {
        importExcel();
        importTimeout = null;
    }, 1000);
}

// 检查文件是否存在
if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`❌ Excel文件不存在: ${EXCEL_FILE}`);
    console.error('请先创建Excel文件，然后重新启动监听');
    process.exit(1);
}

// 开始监听
console.log('✅ 监听已启动');
console.log('━'.repeat(60) + '\n');

try {
    // 使用 fs.watch 监听文件变化
    const watcher = fs.watch(EXCEL_FILE, (eventType, filename) => {
        if (eventType === 'change') {
            const currentModified = fs.statSync(EXCEL_FILE).mtime.getTime();

            // 避免重复触发（有些编辑器会触发多次change事件）
            if (currentModified - lastModified > 500) {
                lastModified = currentModified;
                debouncedImport();
            }
        }
    });

    // 处理进程退出
    process.on('SIGINT', () => {
        console.log('\n\n⏹️  收到停止信号，正在关闭监听...');
        watcher.close();
        console.log('👋 监听已停止');
        process.exit(0);
    });

} catch (error) {
    console.error('❌ 监听失败:', error.message);
    console.error('\n💡 如果问题仍然存在，可以尝试:');
    console.error('   1. 确保没有其他程序正在使用Excel文件');
    console.error('   2. 检查文件权限');
    console.error('   3. 使用手动导入: npm run import-excel');
    process.exit(1);
}
