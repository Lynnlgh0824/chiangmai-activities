#!/usr/bin/env node
/**
 * 活动描述质量自动化测试框架
 *
 * 功能：
 * 1. 加载测试用例
 * 2. 执行测试
 * 3. 生成测试报告
 * 4. 验证修复效果
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

/**
 * 日志输出
 */
function log(type, message, status = 'INFO') {
    const icons = {
        'PASS': '✅',
        'FAIL': '❌',
        'WARN': '⚠️ ',
        'INFO': 'ℹ️ ',
        'RUN': '🔄',
        'DONE': '✨'
    };

    const color = {
        'PASS': colors.green,
        'FAIL': colors.red,
        'WARN': colors.yellow,
        'INFO': colors.cyan,
        'RUN': colors.blue,
        'DONE': colors.bold + colors.green
    }[status] || colors.reset;

    console.log(`${color}${icons[status]} [${type}]${colors.reset} ${message}`);
}

/**
 * 测试结果类
 */
class TestResult {
    constructor(name) {
        this.name = name;
        this.passed = 0;
        this.failed = 0;
        this.warnings = 0;
        this.errors = [];
        this.startTime = Date.now();
    }

    pass(message) {
        this.passed++;
        log(this.name, message, 'PASS');
    }

    fail(message, details) {
        this.failed++;
        this.errors.push({ message, details });
        log(this.name, message, 'FAIL');
    }

    warn(message) {
        this.warnings++;
        log(this.name, message, 'WARN');
    }

    getDuration() {
        return Date.now() - this.startTime;
    }

    getStatus() {
        if (this.failed > 0) return 'FAILED';
        if (this.warnings > 0) return 'WARNING';
        return 'PASSED';
    }

    print() {
        console.log(`\n${colors.bold}测试: ${this.name}${colors.reset}`);
        console.log(`  状态: ${this.getStatus()}`);
        console.log(`  通过: ${this.passed}`);
        console.log(`  失败: ${this.failed}`);
        console.log(`  警告: ${this.warnings}`);
        console.log(`  耗时: ${this.getDuration()}ms`);

        if (this.errors.length > 0) {
            console.log(`\n  错误详情:`);
            this.errors.forEach((err, i) => {
                console.log(`    ${i + 1}. ${err.message}`);
                if (err.details) {
                    console.log(`       ${err.details}`);
                }
            });
        }
    }
}

/**
 * 测试框架
 */
class TestFramework {
    constructor(dataFile) {
        this.dataFile = dataFile;
        this.data = null;
        this.results = [];
    }

    /**
     * 加载数据
     */
    loadData() {
        log('Framework', '加载数据文件...', 'RUN');
        try {
            const content = fs.readFileSync(this.dataFile, 'utf8');
            this.data = JSON.parse(content);
            log('Framework', `成功加载 ${this.data.length} 个活动`, 'DONE');
            return true;
        } catch (error) {
            log('Framework', `加载数据失败: ${error.message}`, 'FAIL');
            return false;
        }
    }

    /**
     * 执行测试用例
     */
    runTest(testName, testFn) {
        const result = new TestResult(testName);
        this.results.push(result);

        log('Framework', `开始测试: ${testName}...`, 'RUN');

        try {
            testFn(this.data, result);
        } catch (error) {
            result.fail('测试执行异常', error.message);
        }

        log('Framework', `测试完成: ${testName} (${result.getDuration()}ms)`, 'DONE');
    }

    /**
     * 打印测试报告
     */
    printReport() {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`${colors.bold}📊 测试报告${colors.reset}`);
        console.log(`${'='.repeat(80)}\n`);

        const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
        const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
        const totalWarnings = this.results.reduce((sum, r) => sum + r.warnings, 0);
        const totalTests = totalPassed + totalFailed;

        this.results.forEach(result => {
            result.print();
            console.log('');
        });

        console.log(`${colors.bold}总计:${colors.reset}`);
        console.log(`  测试套件: ${this.results.length}`);
        console.log(`  测试用例: ${totalTests}`);
        console.log(`  通过: ${colors.green}${totalPassed}${colors.reset}`);
        console.log(`  失败: ${colors.red}${totalFailed}${colors.reset}`);
        console.log(`  警告: ${colors.yellow}${totalWarnings}${colors.reset}`);

        const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0;
        console.log(`  通过率: ${passRate}%`);

        console.log(`\n${'='.repeat(80)}\n`);

        return {
            totalTests,
            totalPassed,
            totalFailed,
            totalWarnings,
            passRate: parseFloat(passRate)
        };
    }

    /**
     * 导出JSON报告
     */
    exportReport(outputPath) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalSuites: this.results.length,
                totalTests: this.results.reduce((sum, r) => sum + r.passed + r.failed, 0),
                totalPassed: this.results.reduce((sum, r) => sum + r.passed, 0),
                totalFailed: this.results.reduce((sum, r) => sum + r.failed, 0),
                totalWarnings: this.results.reduce((sum, r) => sum + r.warnings, 0)
            },
            results: this.results.map(r => ({
                name: r.name,
                status: r.getStatus(),
                passed: r.passed,
                failed: r.failed,
                warnings: r.warnings,
                duration: r.getDuration(),
                errors: r.errors
            }))
        };

        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
        log('Framework', `报告已保存: ${outputPath}`, 'DONE');
    }
}

export { TestFramework, TestResult, log, colors };
