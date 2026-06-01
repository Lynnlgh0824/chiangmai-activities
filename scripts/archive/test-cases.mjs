#!/usr/bin/env node
/**
 * 活动描述质量测试用例
 *
 * 测试项目：
 * 1. 数据完整性测试
 * 2. 描述质量测试
 * 3. 格式规范测试
 * 4. 重复内容测试
 * 5. 符号规范测试
 */

import { TestFramework, log } from './test-framework.mjs';

const DATA_FILE = '/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/data/items.json';

/**
 * 测试1: 数据完整性
 */
function testDataIntegrity(data, result) {
    log('Test1', '检查数据完整性...', 'RUN');

    // 1.1 检查必填字段
    data.forEach(item => {
        if (!item.id) {
            result.fail(`活动缺少ID字段`, item.title);
        } else {
            result.pass(`活动 ${item.id} 有ID字段`);
        }

        if (!item.title) {
            result.fail(`活动 ${item.id} 缺少标题`);
        } else {
            result.pass(`活动 ${item.id} 有标题`);
        }

        if (!item.description) {
            result.fail(`活动 ${item.id} 缺少描述`);
        } else {
            result.pass(`活动 ${item.id} 有描述`);
        }
    });

    // 1.2 检查ID唯一性
    const ids = new Set();
    const duplicateIds = new Set();

    data.forEach(item => {
        if (ids.has(item.id)) {
            duplicateIds.add(item.id);
        }
        ids.add(item.id);
    });

    if (duplicateIds.size > 0) {
        result.fail(`发现重复ID: ${[...duplicateIds].join(', ')}`);
    } else {
        result.pass('所有ID唯一');
    }

    // 1.3 检查分类字段
    const validCategories = [
        '瑜伽', '冥想', '舞蹈', '运动', '健身',
        '市集', '音乐', '文化艺术', '泰拳', '徒步'
    ];

    data.forEach(item => {
        if (!item.category) {
            result.fail(`活动 ${item.id} 缺少分类`);
        } else if (!validCategories.includes(item.category)) {
            result.warn(`活动 ${item.id} 分类不在标准列表中: ${item.category}`);
        } else {
            result.pass(`活动 ${item.id} 分类有效: ${item.category}`);
        }
    });
}

/**
 * 测试2: 描述质量
 */
function testDescriptionQuality(data, result) {
    log('Test2', '检查描述质量...', 'RUN');

    data.forEach(item => {
        const desc = item.description || '';

        // 2.1 检查空描述
        if (desc.trim().length === 0) {
            result.fail(`活动 ${item.id} 描述为空`);
            return;
        }

        // 2.2 检查描述长度
        if (desc.length < 10) {
            result.warn(`活动 ${item.id} 描述过短 (${desc.length} 字符)`);
        } else if (desc.length > 500) {
            result.warn(`活动 ${item.id} 描述过长 (${desc.length} 字符)`);
        } else {
            result.pass(`活动 ${item.id} 描述长度合适 (${desc.length} 字符)`);
        }

        // 2.3 检查是否有注意事项
        if (!desc.includes('⚠️') && !desc.includes('注意')) {
            result.warn(`活动 ${item.id} 缺少注意事项`);
        } else {
            result.pass(`活动 ${item.id} 包含注意事项`);
        }

        // 2.4 检查是否有基本信息
        const hasTimeInfo = desc.includes('时间') || desc.includes('营业') || desc.includes('开放');
        const hasPriceInfo = desc.includes('价格') || desc.includes('费用') || desc.includes('泰铢') || desc.includes('免费');

        if (hasTimeInfo) {
            result.pass(`活动 ${item.id} 描述包含时间信息`);
        } else {
            result.warn(`活动 ${item.id} 描述可能缺少时间信息`);
        }

        if (hasPriceInfo || item.price === '免费') {
            result.pass(`活动 ${item.id} 描述包含价格信息`);
        } else {
            result.warn(`活动 ${item.id} 描述可能缺少价格信息`);
        }
    });
}

/**
 * 测试3: 格式规范
 */
function testFormatStandards(data, result) {
    log('Test3', '检查格式规范...', 'RUN');

    data.forEach(item => {
        const desc = item.description || '';

        // 3.1 检查标点符号
        if (desc.includes('!!')) {
            result.fail(`活动 ${item.id} 包含双感叹号`);
        } else if (desc.includes('!')) {
            result.warn(`活动 ${item.id} 包含感叹号（应使用句号）`);
        } else {
            result.pass(`活动 ${item.id} 标点符号规范`);
        }

        // 3.2 检查空行
        const consecutiveNewlines = desc.match(/\n{3,}/g);
        if (consecutiveNewlines) {
            result.warn(`活动 ${item.id} 包含过多空行 (${consecutiveNewlines.length} 处)`);
        } else {
            result.pass(`活动 ${item.id} 空行使用合理`);
        }

        // 3.3 检查emoji使用
        const emojiPattern = /[\u{1F300}-\u{1F9FF}]/u;
        const emojis = desc.match(emojiPattern);
        if (emojis && emojis.length > 5) {
            result.warn(`活动 ${item.id} emoji使用过多 (${emojis.length} 个)`);
        } else {
            result.pass(`活动 ${item.id} emoji使用合理`);
        }

        // 3.4 检查中英文标点混用
        const hasMixedPunctuation = /[，。；：][a-zA-Z]|[a-zA-Z][，。；：]/.test(desc);
        if (hasMixedPunctuation) {
            result.warn(`活动 ${item.id} 可能存在中英文标点混用`);
        } else {
            result.pass(`活动 ${item.id} 标点使用规范`);
        }
    });
}

/**
 * 测试4: 重复内容检测
 */
function testDuplicateContent(data, result) {
    log('Test4', '检测重复内容...', 'RUN');

    data.forEach(item => {
        const desc = item.description || '';

        // 4.1 检查语义重复 - 瑜伽垫
        if (desc.includes('需要自己带瑜伽垫') && desc.includes('需自备瑜伽垫')) {
            result.fail(`活动 ${item.id} 存在瑜伽垫语义重复`);
        } else {
            result.pass(`活动 ${item.id} 无瑜伽垫重复`);
        }

        // 4.2 检查价格格式重复
        const hasPrice1 = /\d+泰铢\/单次课程/.test(desc);
        const hasPrice2 = /单次课程\d+泰铢/.test(desc);
        if (hasPrice1 && hasPrice2) {
            result.fail(`活动 ${item.id} 存在价格格式重复`);
        } else {
            result.pass(`活动 ${item.id} 无价格重复`);
        }

        // 4.3 检查完全重复的字段
        const fieldPatterns = [
            { name: '适合人群', icon: '👥' },
            { name: '活动特点', icon: '✨' },
            { name: '注意事项', icon: '⚠️' }
        ];

        fieldPatterns.forEach(field => {
            const regex = new RegExp(
                '(' + field.icon + '\\s*)?' + field.name + '[：:]\\s*([^\\n]+)',
                'gi'
            );

            const matches = [...desc.matchAll(regex)];
            const seen = new Set();
            let hasDuplicate = false;

            matches.forEach(m => {
                const content = m[2];
                if (seen.has(content)) {
                    hasDuplicate = true;
                } else {
                    seen.add(content);
                }
            });

            if (hasDuplicate) {
                result.fail(`活动 ${item.id} 字段"${field.name}"内容重复`);
            } else {
                result.pass(`活动 ${item.id} 字段"${field.name}"无重复`);
            }
        });

        // 4.4 检查句子重复（简单版）
        const sentences = desc.split(/[。\n]/).filter(s => s.trim().length > 10);
        const seenSentences = new Set();

        sentences.forEach(sentence => {
            const normalized = sentence.trim().toLowerCase().replace(/\s+/g, '');
            if (seenSentences.has(normalized)) {
                result.fail(`活动 ${item.id} 存在重复句子: ${sentence.substring(0, 30)}...`);
            } else {
                seenSentences.add(normalized);
            }
        });

        if (!result.errors.some(e => e.message.includes('重复句子'))) {
            result.pass(`活动 ${item.id} 无句子重复`);
        }
    });
}

/**
 * 测试5: 符号规范
 */
function testSymbolStandards(data, result) {
    log('Test5', '检查符号规范...', 'RUN');

    data.forEach(item => {
        const desc = item.description || '';

        // 5.1 检查多重感叹号emoji
        if (desc.includes('‼️') || desc.includes('❗❗')) {
            result.fail(`活动 ${item.id} 包含多重感叹号emoji`);
        } else {
            result.pass(`活动 ${item.id} 无多重感叹号emoji`);
        }

        // 5.2 检查重复的⚠️符号
        const warningMatches = desc.match(/(⚠️\s*){2,}/g);
        if (warningMatches) {
            result.fail(`活动 ${item.id} 包含重复⚠️符号`);
        } else {
            result.pass(`活动 ${item.id} ⚠️符号使用规范`);
        }

        // 5.3 检查重复的中文标点
        const duplicatePunctuation = /。{2,}|，{2,}|：{2,}/.test(desc);
        if (duplicatePunctuation) {
            result.fail(`活动 ${item.id} 包含重复中文标点`);
        } else {
            result.pass(`活动 ${item.id} 中文标点使用规范`);
        }

        // 5.4 检查英文字段名称后的标点
        const hasEnglishFieldName = /(Suitable for|Features|Duration|Language|Fee|Note|Contact)/.test(desc);
        if (hasEnglishFieldName) {
            result.warn(`活动 ${item.id} 包含英文字段名称`);
        } else {
            result.pass(`活动 ${item.id} 无英文字段名称`);
        }
    });
}

/**
 * 主函数
 */
async function main() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 活动描述质量自动化测试');
    console.log('='.repeat(80) + '\n');

    const framework = new TestFramework(DATA_FILE);

    // 加载数据
    if (!framework.loadData()) {
        process.exit(1);
    }

    // 执行所有测试
    framework.runTest('数据完整性测试', testDataIntegrity);
    framework.runTest('描述质量测试', testDescriptionQuality);
    framework.runTest('格式规范测试', testFormatStandards);
    framework.runTest('重复内容检测', testDuplicateContent);
    framework.runTest('符号规范测试', testSymbolStandards);

    // 打印报告
    const summary = framework.printReport();

    // 导出报告
    const reportPath = '/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/data/test-report.json';
    framework.exportReport(reportPath);

    // 返回退出码
    const exitCode = summary.totalFailed > 0 ? 1 : 0;
    process.exit(exitCode);
}

main().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
});
