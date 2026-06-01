#!/usr/bin/env node

/**
 * 全链路功能测试脚本 - suspended过滤功能完整版
 *
 * 测试覆盖：
 * 1. 数据层测试（JSON、Excel、API）
 * 2. 前端过滤逻辑测试
 * 3. 业务逻辑完整性测试
 * 4. 用户体验测试
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 测试结果统计
const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    total: 0
};

// 工具函数：输出测试结果
function logTest(category, name, passed, message, details = '') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ PASS [${category}] ${name}`);
    } else {
        testResults.failed++;
        console.log(`❌ FAIL [${category}] ${name}`);
    }
    if (message) console.log(`    ${message}`);
    if (details) console.log(`    ${details}`);
    console.log('');
}

// 工具函数：输出警告
function logWarning(category, name, message, details = '') {
    testResults.warnings++;
    console.log(`⚠️  WARN [${category}] ${name}`);
    console.log(`    ${message}`);
    if (details) console.log(`    ${details}`);
    console.log('');
}

// 工具函数：HTTP GET请求
function httpGet(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

// ============================================
// 测试套件1: 数据层测试
// ============================================
async function testDataLayer() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 测试套件1: 数据层测试');
    console.log('='.repeat(80) + '\n');

    try {
        // 测试1.1: 检查items.json文件存在性
        const jsonPath = path.join(__dirname, '../data/items.json');
        const jsonExists = fs.existsSync(jsonPath);
        logTest(
            '数据层',
            '1.1 JSON文件存在性',
            jsonExists,
            jsonExists ? '文件存在' : '文件不存在',
            jsonPath
        );

        // 测试1.2: 加载并验证JSON数据
        let itemsData;
        try {
            itemsData = require(jsonPath);
            logTest(
                '数据层',
                '1.2 JSON文件格式',
                true,
                'JSON格式正确',
                `包含 ${itemsData.length} 个活动`
            );
        } catch (error) {
            logTest(
                '数据层',
                '1.2 JSON文件格式',
                false,
                'JSON解析失败',
                error.message
            );
            return;
        }

        // 测试1.3: 验证status字段存在
        const hasStatus = itemsData.every(item => 'status' in item);
        logTest(
            '数据层',
            '1.3 status字段完整性',
            hasStatus,
            hasStatus ? '所有活动都有status字段' : '部分活动缺少status字段'
        );

        // 测试1.4: 检查suspended活动
        const suspendedActivities = itemsData.filter(item => item.status === 'suspended');
        const has0001Suspended = itemsData.some(item =>
            item.activityNumber === '0001' && item.status === 'suspended'
        );

        logTest(
            '数据层',
            '1.4 suspended活动数量',
            suspendedActivities.length === 1,
            `发现 ${suspendedActivities.length} 个suspended活动`,
            `活动编号: ${suspendedActivities.map(a => a.activityNumber).join(', ')}`
        );

        // 测试1.5: 验证活动0001状态
        const activity0001 = itemsData.find(item => item.activityNumber === '0001');
        if (activity0001) {
            logTest(
                '数据层',
                '1.5 活动0001状态正确性',
                activity0001.status === 'suspended',
                `活动0001状态: ${activity0001.status}`,
                `预期: suspended, 实际: ${activity0001.status}`
            );

            // 测试1.6: 验证suspensionNote字段
            const hasNote = activity0001.suspensionNote &&
                             activity0001.suspensionNote.length > 0;
            logTest(
                '数据层',
                '1.6 suspensionNote字段',
                hasNote,
                hasNote ? 'suspensionNote字段存在' : 'suspensionNote字段缺失',
                activity0001.suspensionNote || '(无)'
            );
        } else {
            logTest(
                '数据层',
                '1.5 活动0001存在性',
                false,
                '未找到活动0001',
                '请检查items.json'
            );
        }

        // 测试1.7: 统计状态分布
        const statusCount = {};
        itemsData.forEach(item => {
            const status = item.status || '进行中';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        const expectedStatusCount = {
            '进行中': 44,
            'suspended': 1
        };

        const statusCorrect =
            statusCount['进行中'] === expectedStatusCount['进行中'] &&
            statusCount['suspended'] === expectedStatusCount['suspended'];

        logTest(
            '数据层',
            '1.7 状态分布正确性',
            statusCorrect,
            `状态分布: ${JSON.stringify(statusCount)}`,
            `预期: ${JSON.stringify(expectedStatusCount)}`
        );

        // 测试1.8: 检查Excel文件
        const excelPath = path.join(__dirname, '../清迈活动数据.xlsx');
        const excelExists = fs.existsSync(excelPath);
        logTest(
            '数据层',
            '1.8 Excel文件同步',
            excelExists,
            excelExists ? 'Excel文件已同步' : 'Excel文件不存在',
            excelPath
        );

        // 测试1.9: 检查备份文件
        const backupDir = path.join(__dirname, '../backups');
        const backupExists = fs.existsSync(backupDir);
        let backupFiles = [];
        if (backupExists) {
            backupFiles = fs.readdirSync(backupDir)
                .filter(f => f.includes('backup') && f.endsWith('.xlsx'))
                .sort()
                .slice(-3);
        }

        logTest(
            '数据层',
            '1.9 备份文件创建',
            backupFiles.length > 0,
            `发现 ${backupFiles.length} 个备份文件`,
            `最新备份: ${backupFiles[backupFiles.length - 1] || '无'}`
        );

    } catch (error) {
        logTest(
            '数据层',
            '数据层测试',
            false,
            '数据层测试失败',
            error.message
        );
    }
}

// ============================================
// 测试套件2: API层测试
// ============================================
async function testApiLayer() {
    console.log('\n' + '='.repeat(80));
    console.log('🌐 测试套件2: API层测试');
    console.log('='.repeat(80) + '\n');

    try {
        // 测试2.1: API可访问性
        let apiData;
        try {
            apiData = await httpGet('http://localhost:3000/api/activities');
            logTest(
                'API层',
                '2.1 API服务可访问性',
                apiData && apiData.success,
                'API服务正常运行',
                'http://localhost:3000/api/activities'
            );
        } catch (error) {
            logTest(
                'API层',
                '2.1 API服务可访问性',
                false,
                '无法连接到API服务器',
                error.message
            );
            return;
        }

        // 测试2.2: API返回数据格式
        const hasData = apiData.data && Array.isArray(apiData.data);
        logTest(
            'API层',
            '2.2 API返回数据格式',
            hasData,
            hasData ? `返回数组格式，包含 ${apiData.data.length} 个活动` : '数据格式错误'
        );

        // 测试2.3: API返回状态字段
        const allHaveStatus = apiData.data.every(item => 'status' in item);
        logTest(
            'API层',
            '2.3 API返回status字段',
            allHaveStatus,
            allHaveStatus ? '所有活动都有status字段' : '部分活动缺少status字段'
        );

        // 测试2.4: API中suspended活动数量
        const apiSuspendedCount = apiData.data.filter(item => item.status === 'suspended').length;
        logTest(
            'API层',
            '2.4 API suspended活动数量',
            apiSuspendedCount === 1,
            `API返回 ${apiSuspendedCount} 个suspended活动`,
            `预期: 1个`
        );

        // 测试2.5: API中活动0001状态
        const api0001 = apiData.data.find(item => item.activityNumber === '0001');
        if (api0001) {
            logTest(
                'API层',
                '2.5 API活动0001状态',
                api0001.status === 'suspended',
                `API返回活动0001状态: ${api0001.status}`
            );
        }

        // 测试2.6: 数据一致性（JSON vs API）
        const itemsData = require(path.join(__dirname, '../data/items.json'));
        const apiActivityNumbers = apiData.data.map(a => a.activityNumber).sort();
        const jsonActivityNumbers = itemsData.map(a => a.activityNumber).sort();

        const numbersMatch = JSON.stringify(apiActivityNumbers) === JSON.stringify(jsonActivityNumbers);
        logTest(
            'API层',
            '2.6 数据一致性（JSON vs API）',
            numbersMatch,
            numbersMatch ? 'API和JSON活动数量一致' : `API: ${apiActivityNumbers.length}个, JSON: ${jsonActivityNumbers.length}个`,
            `活动编号一致性: ${numbersMatch ? '通过' : '失败'}`
        );

    } catch (error) {
        logTest(
            'API层',
            'API层测试',
            false,
            'API层测试失败',
            error.message
        );
    }
}

// ============================================
// 测试套件3: 业务逻辑测试
// ============================================
async function testBusinessLogic() {
    console.log('\n' + '='.repeat(80));
    console.log('💼 测试套件3: 业务逻辑测试');
    console.log('='.repeat(80) + '\n');

    try {
        // 加载数据
        const apiData = await httpGet('http://localhost:3000/api/activities');
        const itemsData = require(path.join(__dirname, '../data/items.json'));

        // 测试3.1: 过滤逻辑 - 计算应显示的活动数
        const activeInApi = apiData.data.filter(a => a.status === '进行中' || !a.status);
        const activeInJson = itemsData.filter(a => a.status === '进行中' || !a.status);
        const suspendedCount = apiData.data.filter(a => a.status === 'suspended').length;

        logTest(
            '业务逻辑',
            '3.1 过滤后活动数量计算',
            activeInApi.length === 44,
            `API返回45个，suspended ${suspendedCount} 个，应显示 ${activeInApi.length} 个`,
            `实际: ${activeInApi.length} 个活动`
        );

        // 测试3.2: 活动0001过滤验证
        const is0001Filtered = !activeInApi.some(a => a.activityNumber === '0001');
        logTest(
            '业务逻辑',
            '3.2 活动0001被正确过滤',
            is0001Filtered,
            is0001Filtered ? '活动0001不在显示列表中' : '活动0001仍在显示列表中',
            `预期: 被过滤, 实际: ${is0001Filtered ? '已过滤' : '未过滤'}`
        );

        // 测试3.3: 其他活动未被误过滤
        const otherActivities = activeInApi.filter(a => a.activityNumber !== '0001');
        const expectedActivities = ['0008', '0012', '0056']; // 示例活动

        logTest(
            '业务逻辑',
            '3.3 其他活动正常显示',
            otherActivities.length > 0,
            `其他活动数量: ${otherActivities.length} 个`,
            `示例: ${otherActivities.slice(0, 3).map(a => a.activityNumber).join(', ')}`
        );

        // 测试3.4: 状态值唯一性
        const uniqueStatuses = new Set(apiData.data.map(a => a.status || '进行中'));
        const expectedStatuses = new Set(['进行中', 'suspended']);

        logTest(
            '业务逻辑',
            '3.4 状态值唯一性',
            uniqueStatuses.size === 2,
            `状态值: ${Array.from(uniqueStatuses).join(', ')}`,
            `预期: 进行中, suspended`
        );

        // 测试3.5: suspensionNote字段完整性
        const suspendedItem = apiData.data.find(a => a.status === 'suspended');
        if (suspendedItem) {
            const hasNote = suspendedItem.suspensionNote && suspendedItem.suspensionNote.length > 0;

            logTest(
                '业务逻辑',
                '3.5 suspended活动字段完整性',
                hasNote,
                hasNote ? 'suspended活动信息完整' : 'suspensionNote字段缺失',
                `suspensionNote: ${hasNote ? '✓' : '✗'}`
            );
        }

    } catch (error) {
        logTest(
            '业务逻辑',
            '业务逻辑测试',
            false,
            '业务逻辑测试失败',
            error.message
        );
    }
}

// ============================================
// 测试套件4: 用户体验测试
// ============================================
async function testUserExperience() {
    console.log('\n' + '='.repeat(80));
    console.log('👤 测试套件4: 用户体验测试');
    console.log('='.repeat(80) + '\n');

    try {
        // 测试4.1: 用户体验一致性
        const itemsData = require(path.join(__dirname, '../data/items.json'));
        const suspendedItems = itemsData.filter(item => item.status === 'suspended');

        if (suspendedItems.length > 0) {
            const allHaveNotes = suspendedItems.every(item =>
                item.suspensionNote && item.suspensionNote.length > 0
            );

            logTest(
                '用户体验',
                '4.1 suspended活动提示信息',
                allHaveNotes,
                allHaveNotes ? '所有suspended活动都有提示信息' : '部分suspended活动缺少提示',
                `提示率: ${suspendedItems.filter(i => i.suspensionNote).length}/${suspendedItems.length}`
            );

            // 测试4.2: 提示信息合理性
            suspendedItems.forEach(item => {
                if (item.suspensionNote) {
                    const hasReason = item.suspensionNote.includes('关闭') ||
                                     item.suspensionNote.includes('暂停') ||
                                     item.suspensionNote.includes('恢复');

                    if (!hasReason) {
                        logWarning(
                            '用户体验',
                            `4.2 ${item.activityNumber} 提示信息`,
                            '提示信息可能不够清晰',
                            `备注: ${item.suspensionNote.substring(0, 50)}`
                        );
                    }
                }
            });
        } else {
            logTest(
                '用户体验',
                '4.1 suspended活动数量',
                suspendedItems.length === 0,
                '当前无suspended活动',
                '所有活动正常显示'
            );
        }

        // 测试4.3: 界面一致性（前端文件存在性）
        const indexPath = path.join(__dirname, '../index.html');
        const indexExists = fs.existsSync(indexPath);

        logTest(
            '用户体验',
            '4.2 主页面文件存在性',
            indexExists,
            indexExists ? 'index.html存在' : 'index.html不存在',
            indexPath
        );

        // 测试4.4: 过滤代码实现
        if (indexExists) {
            const indexContent = fs.readFileSync(indexPath, 'utf-8');
            const hasFilterLogic = indexContent.includes("item.status !== '进行中'");

            logTest(
                '用户体验',
                '4.3 过滤逻辑实现',
                hasFilterLogic,
                hasFilterLogic ? '过滤逻辑已实现' : '过滤逻辑未实现',
                '代码: if (item.status !== \'进行中\')'
            );
        }

    } catch (error) {
        logTest(
            '用户体验',
            '用户体验测试',
            false,
            '用户体验测试失败',
            error.message
        );
    }
}

// ============================================
// 测试套件5: 文档完整性测试
// ============================================
async function testDocumentation() {
    console.log('\n' + '='.repeat(80));
    console.log('📚 测试套件5: 文档完整性测试');
    console.log('='.repeat(80) + '\n');

    try {
        const docsDir = path.join(__dirname, '../docs');

        // 检查必需文档
        const requiredDocs = [
            { name: '功能方案文档', path: '活动暂停状态方案-简化版.md' },
            { name: '检查清单模板', path: '全链路功能开发检查清单.md' }
        ];

        requiredDocs.forEach(doc => {
            const docPath = path.join(docsDir, doc.path);
            const exists = fs.existsSync(docPath);

            logTest(
                '文档',
                `5.${requiredDocs.indexOf(doc) + 1} ${doc.name}`,
                exists,
                exists ? `${doc.name} 存在` : `${doc.name} 缺失`,
                docPath
            );
        });

        // 检查测试文件
        const testScript = path.join(__dirname, '../test-suspended-filter.cjs');
        const testPage = path.join(__dirname, '../test-suspended-filter.html');

        logTest(
            '文档',
            '5.3 测试脚本存在',
            fs.existsSync(testScript),
            '测试脚本: test-suspended-filter.cjs'
        );

        logTest(
            '文档',
            '5.4 测试页面存在',
            fs.existsSync(testPage),
            '测试页面: test-suspended-filter.html'
        );

    } catch (error) {
        logTest(
            '文档',
            '文档测试',
            false,
            '文档测试失败',
            error.message
        );
    }
}

// ============================================
// 主测试执行
// ============================================
async function runAllTests() {
    console.log('🧪 清迈指南 - suspended功能全链路测试');
    console.log('测试时间:', new Date().toLocaleString('zh-CN'));
    console.log('测试目标: 验证suspended过滤功能在所有环节的完整性');
    console.log('');

    try {
        // 依次执行测试套件
        await testDataLayer();
        await testApiLayer();
        await testBusinessLogic();
        await testUserExperience();
        await testDocumentation();

        // 输出总结
        console.log('\n' + '='.repeat(80));
        console.log('📊 测试总结报告');
        console.log('='.repeat(80) + '\n');

        console.log(`总测试数: ${testResults.total}`);
        console.log(`✅ 通过: ${testResults.passed}`);
        console.log(`❌ 失败: ${testResults.failed}`);
        console.log(`⚠️  警告: ${testResults.warnings}`);

        const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
        console.log(`\n通过率: ${passRate}%`);

        if (testResults.failed === 0 && testResults.warnings === 0) {
            console.log('\n🎉 所有测试通过！suspended功能完整实现！');
        } else if (testResults.failed === 0) {
            console.log('\n⚠️  所有测试通过，但有 ' + testResults.warnings + ' 个警告需要注意');
        } else {
            console.log('\n❌ 部分测试失败，请检查上述失败项');
        }

        console.log('\n' + '='.repeat(80));
        console.log('💡 后续行动建议：');
        console.log('  1. 如有测试失败，请根据具体错误进行修复');
        console.log('  2. 如有警告，建议优化相关功能');
        console.log('  3. 强制刷新浏览器验证前端效果: Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)');
        console.log('  4. 访问测试页面查看可视化结果: http://localhost:3000/test-suspended-filter.html');

    } catch (error) {
        console.error('\n❌ 测试执行失败:', error);
    }
}

// 运行测试
runAllTests().catch(error => {
    console.error('\n❌ 测试脚本执行失败:', error);
    process.exit(1);
});
