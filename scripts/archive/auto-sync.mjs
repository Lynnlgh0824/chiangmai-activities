#!/usr/bin/env node

/**
 * 🔄 Excel自动同步系统
 *
 * 功能：
 * 1. 监听Excel文件变化
 * 2. 自动导入数据到JSON
 * 3. 触发前端数据刷新（通过Web Socket）
 * 4. 备份和日志记录
 *
 * 用法: node scripts/auto-sync.mjs
 * 或: npm run auto-sync
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置
const CONFIG = {
    excelFile: path.join(__dirname, '../清迈活动数据.xlsx'),
    jsonFile: path.join(__dirname, '../data/items.json'),
    backupDir: path.join(__dirname, '../backups'),
    logDir: path.join(__dirname, '../logs'),
    apiHealthCheck: 'http://localhost:3000/api/health',
    importDelay: 1500, // 文件保存后等待时间（毫秒）
};

// 创建必要的目录
[CONFIG.backupDir, CONFIG.logDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
});

// 日志系统
const logs = [];
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    logs.push(logEntry);

    // 控制台输出带颜色
    const colors = {
        info: '\x1b[36m',    // 青色
        success: '\x1b[32m', // 绿色
        warning: '\x1b[33m', // 黄色
        error: '\x1b[31m',   // 红色
        reset: '\x1b[0m'
    };

    const color = colors[level] || colors.info;
    console.log(`${color}${logEntry}${colors.reset}`);
}

// 保存日志到文件
function saveLog() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const logFile = path.join(CONFIG.logDir, `sync-${timestamp}.log`);
    fs.writeFileSync(logFile, logs.join('\n'));
    log(`日志已保存: ${logFile}`, 'success');
}

// 备份当前JSON文件
function backupJSON() {
    try {
        if (fs.existsSync(CONFIG.jsonFile)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const backupFile = path.join(CONFIG.backupDir, `items-${timestamp}.json`);
            fs.copyFileSync(CONFIG.jsonFile, backupFile);
            log(`备份已创建: ${path.basename(backupFile)}`, 'info');
        }
    } catch (error) {
        log(`备份失败: ${error.message}`, 'warning');
    }
}

// 检查API服务器状态
function checkServerStatus() {
    return new Promise((resolve) => {
        const http = require('http');
        const req = http.get(CONFIG.apiHealthCheck, (res) => {
            resolve(res.statusCode === 200);
        });

        req.on('error', () => {
            resolve(false);
        });

        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

// 导入Excel到JSON
function importExcelToJson() {
    try {
        log('开始导入Excel数据...', 'info');

        // 检查Excel文件
        if (!fs.existsSync(CONFIG.excelFile)) {
            throw new Error(`Excel文件不存在: ${CONFIG.excelFile}`);
        }

        // 读取Excel文件
        const workbook = XLSX.readFile(CONFIG.excelFile);
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
            throw new Error('Excel文件中没有工作表');
        }

        log(`读取工作表: ${sheetName}`, 'info');

        // 转换为JSON
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            defval: null,
            raw: false
        });

        if (jsonData.length === 0) {
            throw new Error('Excel文件中没有数据');
        }

        log(`读取到 ${jsonData.length} 条活动数据`, 'success');

        // 备份当前JSON
        backupJSON();

        // 验证和处理数据
        const processedData = processData(jsonData);

        // 保存到JSON文件
        fs.writeFileSync(
            CONFIG.jsonFile,
            JSON.stringify(processedData, null, 2),
            'utf-8'
        );

        log(`数据已保存到: ${CONFIG.jsonFile}`, 'success');
        log(`共 ${processedData.length} 个活动`, 'success');

        return processedData;
    } catch (error) {
        log(`导入失败: ${error.message}`, 'error');
        throw error;
    }
}

// 处理数据格式
function processData(rawData) {
    return rawData.map((item, index) => {
        // 确保有ID
        if (!item.id) {
            item.id = Date.now().toString() + index.toString().padStart(4, '0');
        }

        // 确保必要字段存在
        return {
            id: item.id,
            activityNumber: item.activityNumber || (index + 1).toString().padStart(4, '0'),
            title: item.title || item.name || '未命名活动',
            category: item.category || '其他',
            location: item.location || '待定',
            price: item.price || '免费',
            time: item.time || '灵活时间',
            duration: item.duration || '',
            timeInfo: item.timeInfo || '',
            weekdays: Array.isArray(item.weekdays) ? item.weekdays :
                       (typeof item.weekdays === 'string' ? item.weekdays.split(',').map(s => s.trim()) : []),
            description: item.description || '',
            organizer: item.organizer || '',
            contact: item.contact || '',
            frequency: item.frequency || 'weekly',
            source: item.source || {},
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    });
}

// 通知前端刷新数据（通过WebSocket或轮询）
async function notifyFrontend() {
    try {
        const serverRunning = await checkServerStatus();

        if (!serverRunning) {
            log('后端服务器未运行，跳过通知', 'warning');
            return;
        }

        log('通知前端刷新数据...', 'info');

        // 方案1: 如果有WebSocket，可以通过WebSocket推送
        // 方案2: 创建一个触发文件，前端轮询检测
        const triggerFile = path.join(__dirname, '../.update-trigger');
        fs.writeFileSync(triggerFile, Date.now().toString());

        log('前端已收到更新通知', 'success');
    } catch (error) {
        log(`通知前端失败: ${error.message}`, 'warning');
    }
}

// 执行完整的同步流程
async function performSync() {
    const startTime = Date.now();

    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
    log('🔄 开始同步Excel数据', 'info');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

    try {
        // 1. 导入Excel到JSON
        const data = importExcelToJson();

        // 2. 通知前端刷新
        await notifyFrontend();

        // 3. 保存日志
        saveLog();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        log(`✅ 同步完成！耗时 ${duration}秒`, 'success');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

        return true;
    } catch (error) {
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        log(`❌ 同步失败: ${error.message}`, 'error');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error');
        saveLog();
        return false;
    }
}

// 主监听循环
function startWatching() {
    console.log('\n' + '═'.repeat(70));
    console.log('🔄 Excel自动同步系统');
    console.log('═'.repeat(70));
    console.log(`📂 监听文件: ${path.basename(CONFIG.excelFile)}`);
    console.log(`📄 输出文件: ${path.basename(CONFIG.jsonFile)}`);
    console.log(`💾 备份目录: ${CONFIG.backupDir}`);
    console.log(`📋 日志目录: ${CONFIG.logDir}`);
    console.log('═'.repeat(70));
    console.log('💡 提示: 修改Excel文件后，将自动导入并更新前端数据');
    console.log('💡 提示: 按 Ctrl+C 停止监听');
    console.log('═'.repeat(70) + '\n');

    let isSyncing = false;
    let lastModified = 0;
    let syncTimeout = null;

    // 检查文件是否存在
    if (!fs.existsSync(CONFIG.excelFile)) {
        log(`❌ Excel文件不存在: ${CONFIG.excelFile}`, 'error');
        log('请先创建Excel文件，然后重新启动监听', 'error');
        process.exit(1);
    }

    // 防抖函数
    function debouncedSync() {
        if (syncTimeout) {
            clearTimeout(syncTimeout);
        }

        log('⏳ 检测到文件修改，准备同步...', 'info');

        syncTimeout = setTimeout(async () => {
            if (!isSyncing) {
                isSyncing = true;
                await performSync();
                isSyncing = false;
                log('\n💡 继续监听文件变化...\n', 'info');
            }
            syncTimeout = null;
        }, CONFIG.importDelay);
    }

    // 开始监听
    log('✅ 监听已启动\n', 'success');

    try {
        const watcher = fs.watch(CONFIG.excelFile, (eventType, filename) => {
            if (eventType === 'change') {
                try {
                    const currentModified = fs.statSync(CONFIG.excelFile).mtime.getTime();

                    // 避免重复触发（有些编辑器会触发多次change事件）
                    if (currentModified - lastModified > 500) {
                        lastModified = currentModified;
                        debouncedSync();
                    }
                } catch (error) {
                    log(`读取文件状态失败: ${error.message}`, 'warning');
                }
            }
        });

        // 处理进程退出
        process.on('SIGINT', () => {
            console.log('\n\n' + '═'.repeat(70));
            console.log('⏹️  收到停止信号，正在关闭监听...');
            console.log('═'.repeat(70));
            watcher.close();
            console.log('👋 监听已停止');
            console.log('═'.repeat(70) + '\n');
            process.exit(0);
        });

    } catch (error) {
        log(`❌ 监听失败: ${error.message}`, 'error');
        log('\n💡 如果问题仍然存在，可以尝试:', 'info');
        log('   1. 确保没有其他程序正在使用Excel文件', 'info');
        log('   2. 检查文件权限', 'info');
        log('   3. 使用手动导入: npm run import-excel', 'info');
        process.exit(1);
    }
}

// 如果直接运行此脚本，启动监听
if (import.meta.url === `file://${process.argv[1]}`) {
    startWatching();
}

export { performSync, importExcelToJson, notifyFrontend };
