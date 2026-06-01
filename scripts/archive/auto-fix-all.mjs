#!/usr/bin/env node
/**
 * 活动描述一键修复主控脚本
 *
 * 功能：
 * 1. 按顺序执行所有修复脚本
 * 2. 自动备份原数据
 * 3. 验证修复效果
 * 4. 生成修复报告
 *
 * 使用：node scripts/auto-fix-all.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(step, message, status = 'INFO') {
    const icons = {
        'START': '🚀',
        'RUN': '🔄',
        'PASS': '✅',
        'FAIL': '❌',
        'WARN': '⚠️ ',
        'INFO': 'ℹ️ ',
        'DONE': '✨',
        'SKIP': '⏭️ '
    };

    const color = {
        'START': colors.bold + colors.blue,
        'RUN': colors.blue,
        'PASS': colors.green,
        'FAIL': colors.red,
        'WARN': colors.yellow,
        'INFO': colors.cyan,
        'DONE': colors.bold + colors.green,
        'SKIP': colors.yellow
    }[status] || colors.reset;

    console.log(`${color}${icons[status]} [${step}]${colors.reset} ${message}`);
}

/**
 * 创建备份
 */
function createBackup(dataFile) {
    const timestamp = Date.now();
    const backupFile = `${dataFile}.backup.all.${timestamp}`;

    log('Backup', `创建备份: ${path.basename(backupFile)}`, 'RUN');
    fs.copyFileSync(dataFile, backupFile);
    log('Backup', '备份完成', 'DONE');

    return backupFile;
}

/**
 * 执行脚本
 */
function runScript(scriptPath, description) {
    log('Script', description, 'RUN');

    try {
        const output = execSync(`node "${scriptPath}"`, {
            cwd: projectRoot,
            encoding: 'utf8',
            stdio: 'pipe'
        });

        log('Script', `${description} - 完成`, 'PASS');
        return { success: true, output };
    } catch (error) {
        log('Script', `${description} - 失败: ${error.message}`, 'FAIL');
        return { success: false, error: error.message };
    }
}

/**
 * 主流程
 */
async function main() {
    console.log('\n' + '='.repeat(80));
    console.log(`${colors.bold}🔧 活动描述一键修复系统${colors.reset}`);
    console.log('='.repeat(80) + '\n');

    const DATA_FILE = path.join(projectRoot, 'data', 'items.json');

    // 检查数据文件
    if (!fs.existsSync(DATA_FILE)) {
        log('System', `数据文件不存在: ${DATA_FILE}`, 'FAIL');
        process.exit(1);
    }

    // 读取原始数据
    const originalData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const originalSize = fs.statSync(DATA_FILE).size;

    log('System', `原始数据: ${originalData.length} 个活动`, 'INFO');
    log('System', `文件大小: ${(originalSize / 1024).toFixed(2)} KB`, 'INFO');

    // 创建备份
    const backupFile = createBackup(DATA_FILE);

    // 修复步骤配置
    const fixSteps = [
        {
            name: '清理符号问题',
            script: 'scripts/cleanup-description.cjs',
            description: '清理符号（!! → !，‼️ → ⚠️）',
            required: false
        },
        {
            name: '删除内容重复',
            script: 'scripts/detect-and-fix-content-duplicates.mjs',
            description: '删除语义重复内容',
            required: false
        },
        {
            name: '优化描述结构',
            script: 'scripts/optimize-descriptions.mjs',
            description: '优化描述结构',
            required: false
        },
        {
            name: '修复语义重复',
            script: 'scripts/final-fix-descriptions.mjs',
            description: '修复语义重复（瑜伽垫、价格等）',
            required: true
        }
    ];

    // 执行修复步骤
    console.log(`\n${colors.bold}📋 修复步骤${colors.reset}\n`);
    console.log('='.repeat(80));

    const results = [];

    for (const step of fixSteps) {
        const scriptPath = path.join(projectRoot, step.script);

        // 检查脚本是否存在
        if (!fs.existsSync(scriptPath)) {
            log('Script', `脚本不存在: ${step.script}`, 'WARN');
            if (step.required) {
                log('Script', `这是必需的脚本，终止流程`, 'FAIL');
                process.exit(1);
            } else {
                log('Script', `跳过此步骤`, 'SKIP');
                continue;
            }
        }

        // 执行脚本
        const result = runScript(scriptPath, step.description);
        results.push({
            name: step.name,
            success: result.success,
            output: result.output || result.error
        });

        if (!result.success && step.required) {
            log('System', `必需步骤失败，终止流程`, 'FAIL');
            log('System', `恢复备份: ${backupFile}`, 'RUN');
            fs.copyFileSync(backupFile, DATA_FILE);
            log('System', '已恢复原始数据', 'DONE');
            process.exit(1);
        }

        console.log('');
    }

    // 读取修复后的数据
    const fixedData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const fixedSize = fs.statSync(DATA_FILE).size;

    // 生成统计报告
    console.log(`\n${colors.bold}📊 修复统计${colors.reset}\n`);
    console.log('='.repeat(80));

    const sizeReduction = originalSize - fixedSize;
    const sizeReductionPercent = ((sizeReduction / originalSize) * 100).toFixed(2);

    console.log(`原始数据: ${originalData.length} 个活动, ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`修复后: ${fixedData.length} 个活动, ${(fixedSize / 1024).toFixed(2)} KB`);
    console.log(`减少: ${sizeReduction} 字节 (${sizeReductionPercent}%)`);

    console.log(`\n${colors.bold}📋 执行结果${colors.reset}\n`);

    results.forEach((result, index) => {
        const status = result.success ? 'PASS' : 'FAIL';
        const icon = result.success ? '✅' : '❌';
        console.log(`${icon} ${index + 1}. ${result.name}`);
    });

    // 执行测试验证
    console.log(`\n${colors.bold}🧪 执行测试验证${colors.reset}\n`);
    console.log('='.repeat(80));

    const testScript = path.join(projectRoot, 'scripts/test-cases.mjs');

    if (fs.existsSync(testScript)) {
        log('Test', '运行自动化测试...', 'RUN');

        try {
            execSync(`node "${testScript}"`, {
                cwd: projectRoot,
                stdio: 'inherit'
            });
            log('Test', '测试完成', 'PASS');
        } catch (error) {
            log('Test', `测试失败: ${error.message}`, 'WARN');
        }
    } else {
        log('Test', '测试脚本不存在，跳过验证', 'SKIP');
    }

    // 完成
    console.log(`\n${colors.bold}${colors.green}✨ 修复完成！${colors.reset}\n`);
    console.log('='.repeat(80));

    console.log(`\n💡 后续步骤:`);
    console.log(`   1. 检查前端显示效果`);
    console.log(`   2. 如有问题，使用以下命令恢复:`);
    console.log(`      cp "${backupFile}" "${DATA_FILE}"`);
    console.log(`   3. 备份文件: ${backupFile}\n`);

    // 保存修复日志
    const logPath = path.join(projectRoot, 'data', 'fix-log.json');
    const fixLog = {
        timestamp: new Date().toISOString(),
        backupFile,
        originalSize,
        fixedSize,
        sizeReduction,
        sizeReductionPercent: parseFloat(sizeReductionPercent),
        results
    };

    fs.writeFileSync(logPath, JSON.stringify(fixLog, null, 2), 'utf8');
    log('System', `修复日志已保存: ${logPath}`, 'DONE');
}

main().catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
});
