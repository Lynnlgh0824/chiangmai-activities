#!/usr/bin/env node
/**
 * 综合描述质量检查工具
 *
 * 功能：
 * 1. 检测语义重复（不同表达方式，相同含义）
 * 2. 检测完全重复（相同的字段标签和内容）
 * 3. 检测格式问题（标点、空行等）
 * 4. 检测内容质量问题（空描述、过短、过长）
 * 5. 生成详细报告
 *
 * 运行：node scripts/comprehensive-description-check.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 综合描述质量检查工具\n');
console.log('='.repeat(80));

const DATA_FILE = path.join(projectRoot, 'data', 'items.json');

// 读取数据
console.log(`📖 读取数据: ${DATA_FILE}`);
const activities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
console.log(`📊 总活动数: ${activities.length}\n`);

/**
 * 检测规则定义
 */
const CHECK_RULES = {
    // 1. 语义重复（不同表达，相同含义）
    semanticDuplicates: [
        {
            name: '瑜伽垫重复',
            patterns: ['需要自己带瑜伽垫', '需自备瑜伽垫'],
            keep: '需自备瑜伽垫',
            remove: '需要自己带瑜伽垫'
        },
        {
            name: '价格格式重复',
            patterns: [/\d+泰铢\/单次课程/, /单次课程\d+泰铢/],
            keep: '价格/次格式',
            remove: '次价格格式'
        },
        {
            name: '现场支付重复',
            patterns: ['现场支付', '现场现金支付'],
            keep: '现场支付',
            remove: '现场现金支付'
        },
        {
            name: '预约要求重复',
            patterns: ['需提前预约', '需要提前预约', '建议提前预约'],
            keep: '建议提前预约',
            remove: ['需提前预约', '需要提前预约']
        },
        {
            name: '免费/自愿捐赠重复',
            patterns: ['免费', '自愿捐赠', '随喜捐赠'],
            keep: '免费（自愿捐赠）',
            remove: ['免费', '自愿捐赠']
        }
    ],

    // 2. 完全重复（相同的字段标签和内容）
    exactDuplicates: [
        { name: '适合人群', icon: '👥' },
        { name: '活动特点', icon: '✨' },
        { name: '课程周期', icon: '📚' },
        { name: '标准课程周期', icon: '📚' },
        { name: '语言', icon: '🌐' },
        { name: '费用', icon: '💰' },
        { name: '注意事项', icon: '⚠️' },
        { name: '联系方式', icon: '📞' },
        { name: '官网', icon: '🌐' },
        { name: '预约方式', icon: '📝' }
    ],

    // 3. 格式问题
    formatIssues: [
        {
            name: '感叹号过多',
            pattern: /!/g,
            severity: 'warning'
        },
        {
            name: '连续空行过多',
            pattern: /\n{3,}/g,
            severity: 'warning'
        },
        {
            name: '中文标点后缺少空格',
            pattern: /[，。！？；：][^\n\s]/g,
            severity: 'info'
        },
        {
            name: '末尾标点缺失',
            pattern: /[^\n。！？；：]$/,
            severity: 'info'
        }
    ],

    // 4. 内容质量问题
    contentQuality: [
        {
            name: '空描述',
            check: (desc) => !desc || desc.trim().length === 0,
            severity: 'error'
        },
        {
            name: '描述过短',
            check: (desc) => desc && desc.trim().length < 10,
            severity: 'warning'
        },
        {
            name: '描述过长',
            check: (desc) => desc && desc.trim().length > 500,
            severity: 'warning'
        },
        {
            name: '缺少注意事项',
            check: (desc) => desc && !desc.includes('⚠️') && !desc.includes('注意'),
            severity: 'info'
        }
    ]
};

/**
 * 检查单个活动描述
 */
function checkDescription(activity) {
    const issues = [];
    const description = activity.description || '';

    // 1. 检查语义重复
    CHECK_RULES.semanticDuplicates.forEach(rule => {
        const foundPatterns = rule.patterns.filter(p => {
            if (typeof p === 'string') {
                return description.includes(p);
            } else if (p instanceof RegExp) {
                return p.test(description);
            }
            return false;
        });

        if (foundPatterns.length > 1) {
            issues.push({
                type: 'semantic_duplicate',
                severity: 'warning',
                rule: rule.name,
                message: `发现语义重复: ${foundPatterns.join(' vs ')}`,
                suggestion: `建议保留: ${rule.keep}`
            });
        }
    });

    // 2. 检查完全重复
    CHECK_RULES.exactDuplicates.forEach(field => {
        const regex = new RegExp(
            '(' + field.icon + '\\s*)?' + field.name + '[：:]\\s*([^\\n]+)',
            'gi'
        );

        const matches = [...description.matchAll(regex)];
        const seen = new Set();

        matches.forEach(m => {
            const content = m[2]; // 字段内容
            if (seen.has(content)) {
                issues.push({
                    type: 'exact_duplicate',
                    severity: 'warning',
                    rule: field.name,
                    message: `字段"${field.name}"内容重复: ${content}`,
                    suggestion: `删除重复的${field.name}标签`
                });
            } else {
                seen.add(content);
            }
        });
    });

    // 3. 检查格式问题
    CHECK_RULES.formatIssues.forEach(rule => {
        const matches = description.match(rule.pattern);
        if (matches && matches.length > 0) {
            issues.push({
                type: 'format_issue',
                severity: rule.severity,
                rule: rule.name,
                message: `${rule.name}: 发现 ${matches.length} 处`,
                count: matches.length
            });
        }
    });

    // 4. 检查内容质量
    CHECK_RULES.contentQuality.forEach(rule => {
        if (rule.check(description)) {
            issues.push({
                type: 'content_quality',
                severity: rule.severity,
                rule: rule.name,
                message: `${rule.name}: 描述长度 ${description.length}`
            });
        }
    });

    return issues;
}

/**
 * 生成报告
 */
function generateReport(results) {
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const errors = results.reduce((sum, r) =>
        sum + r.issues.filter(i => i.severity === 'error').length, 0);
    const warnings = results.reduce((sum, r) =>
        sum + r.issues.filter(i => i.severity === 'warning').length, 0);
    const infos = results.reduce((sum, r) =>
        sum + r.issues.filter(i => i.severity === 'info').length, 0);

    console.log('\n📊 检查统计:');
    console.log(`   总活动数: ${results.length}`);
    console.log(`   有问题的活动: ${results.filter(r => r.issues.length > 0).length}`);
    console.log(`   问题总数: ${totalIssues}`);
    console.log(`   ❌ 错误: ${errors}`);
    console.log(`   ⚠️  警告: ${warnings}`);
    console.log(`   ℹ️  信息: ${infos}\n`);

    // 按严重程度分类
    console.log('📋 问题分类:\n');

    // 错误级别
    const errorIssues = results.filter(r =>
        r.issues.some(i => i.severity === 'error')
    );
    if (errorIssues.length > 0) {
        console.log('❌ 错误级别问题:');
        errorIssues.forEach(r => {
            const errors = r.issues.filter(i => i.severity === 'error');
            console.log(`   ${r.activity.id} - ${r.activity.title}`);
            errors.forEach(e => {
                console.log(`      • ${e.rule}: ${e.message}`);
            });
        });
        console.log('');
    }

    // 警告级别
    const warningIssues = results.filter(r =>
        r.issues.some(i => i.severity === 'warning')
    );
    if (warningIssues.length > 0) {
        console.log('⚠️  警告级别问题:');
        warningIssues.forEach(r => {
            const warnings = r.issues.filter(i => i.severity === 'warning');
            console.log(`   ${r.activity.id} - ${r.activity.title}`);
            warnings.forEach(w => {
                console.log(`      • ${w.rule}: ${w.message}`);
                if (w.suggestion) {
                    console.log(`        💡 ${w.suggestion}`);
                }
            });
        });
        console.log('');
    }

    // 信息级别
    const infoIssues = results.filter(r =>
        r.issues.some(i => i.severity === 'info')
    );
    if (infoIssues.length > 0) {
        console.log('ℹ️  信息级别建议:');
        infoIssues.forEach(r => {
            const infos = r.issues.filter(i => i.severity === 'info');
            console.log(`   ${r.activity.id} - ${r.activity.title}`);
            infos.forEach(i => {
                console.log(`      • ${i.rule}: ${i.message}`);
            });
        });
        console.log('');
    }

    // 统计各类问题
    console.log('📈 问题类型分布:\n');
    const issueTypes = {};
    results.forEach(r => {
        r.issues.forEach(i => {
            const key = i.type;
            if (!issueTypes[key]) {
                issueTypes[key] = 0;
            }
            issueTypes[key]++;
        });
    });

    Object.entries(issueTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
            const typeNames = {
                semantic_duplicate: '语义重复',
                exact_duplicate: '完全重复',
                format_issue: '格式问题',
                content_quality: '内容质量'
            };
            console.log(`   ${typeNames[type]}: ${count}`);
        });

    console.log('\n' + '='.repeat(80));
}

// 执行检查
console.log('🔍 开始检查...\n');

const results = activities.map(activity => ({
    activity,
    issues: checkDescription(activity)
}));

// 过滤出有问题的活动
const problematicActivities = results.filter(r => r.issues.length > 0);

console.log(`✅ 检查完成！\n`);
console.log(`📋 发现问题的活动: ${problematicActivities.length} / ${results.length}\n`);

// 生成详细报告
generateReport(results);

// 导出JSON报告
const reportPath = path.join(projectRoot, 'data', 'quality-report.json');
const report = {
    timestamp: new Date().toISOString(),
    summary: {
        totalActivities: results.length,
        problematicActivities: problematicActivities.length,
        totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0)
    },
    issues: problematicActivities.map(r => ({
        id: r.activity.id,
        title: r.activity.title,
        description: r.activity.description,
        issues: r.issues
    }))
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(`\n📄 报告已保存: ${reportPath}`);

// 如果有问题，提示修复
if (problematicActivities.length > 0) {
    console.log('\n💡 发现问题，建议运行修复脚本:');
    console.log('   node scripts/comprehensive-description-fix.mjs');
}

console.log('\n✅ 全部完成！\n');
