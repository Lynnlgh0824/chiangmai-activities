#!/usr/bin/env node
/**
 * 智能去重脚本 - 安全版本
 *
 * 功能：
 * 1. 只删除完全相同的重复内容
 * 2. 保留语义相近但表述不同的内容
 * 3. 手动处理用户报告的特定问题
 *
 * 运行：node scripts/smart-fix-descriptions.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔧 智能去重脚本 - 安全版本\n');
console.log('='.repeat(60));

const DATA_FILE = path.join(projectRoot, 'data', 'items.json');

// 读取数据
console.log(`📖 读取数据: ${DATA_FILE}`);
const rawContent = fs.readFileSync(DATA_FILE, 'utf8');
let activities = JSON.parse(rawContent);
console.log(`📊 总活动数: ${activities.length}\n`);

// 创建备份
const backupFile = DATA_FILE + '.backup.' + Date.now();
console.log('💾 创建备份...');
fs.copyFileSync(DATA_FILE, backupFile);
console.log(`✅ 备份已保存\n`);

/**
 * 安全去重函数
 */
function smartFixDescription(description) {
    if (!description) return description;

    let fixed = description;

    // 1. 去除完全相同的字段标签重复
    const fieldPatterns = [
        { name: '适合人群', icon: '👥' },
        { name: '活动特点', icon: '✨' },
        { name: '课程周期', icon: '📚' },
        { name: '标准课程周期', icon: '📚' },
        { name: '语言', icon: '🌐' },
        { name: '费用', icon: '💰' },
        { name: '注意事项', icon: '⚠️' },
        { name: '联系方式', icon: '📞' },
        { name: '官网', icon: '🌐' }
    ];

    fieldPatterns.forEach(field => {
        // 匹配完全相同的字段标签（包括后面的内容到换行）
        const regex = new RegExp(
            '(?:' + field.icon + '\\s*)?' + field.name + '[：:]\\s*([^\\n]*)',
            'gi'
        );

        const matches = [...fixed.matchAll(regex)];

        if (matches.length > 1) {
            // 检查是否有完全相同的内容
            const seen = new Set();
            matches.forEach(m => {
                const content = m[1] || '';
                if (seen.has(content)) {
                    // 删除重复的
                    fixed = fixed.replace(m[0], '');
                } else {
                    seen.add(content);
                }
            });
        }
    });

    // 2. 处理特定的已知问题案例
    // 案例1：瑜伽垫重复
    if (fixed.includes('需要自己带瑜伽垫') && fixed.includes('需自备瑜伽垫')) {
        // 保留"需自备瑜伽垫"（更简洁），删除"需要自己带瑜伽垫"
        fixed = fixed.replace(/需要自己带瑜伽垫[，,]?\s*/g, '');
    }

    // 案例2：价格格式不同但意思相同
    const pricePattern1 = /(\d+)泰铢\/单次课程/g;
    const pricePattern2 = /单次课程(\d+)泰铢/g;

    const match1 = fixed.match(pricePattern1);
    const match2 = fixed.match(pricePattern2);

    if (match1 && match2 && match1[1] === match2[1]) {
        // 只保留第一个格式
        fixed = fixed.replace(pricePattern2, '');
    }

    // 3. 统一标点符号
    fixed = fixed.replace(/!/g, '。');
    fixed = fixed.replace(/；/g, '。');

    // 4. 清理多余空行
    fixed = fixed.replace(/\n{3,}/g, '\n\n');
    fixed = fixed.trim();

    return fixed;
}

// 修复每个活动
let fixedCount = 0;
const fixDetails = [];

console.log('🔧 开始修复...\n');

activities.forEach((act) => {
    if (!act.description) return;

    const original = act.description;
    const fixed = smartFixDescription(act.description);

    if (original !== fixed) {
        fixedCount++;
        act.description = fixed;

        fixDetails.push({
            id: act.id,
            title: act.title,
            original: original.substring(0, 150),
            fixed: fixed.substring(0, 150),
            reduction: original.length - fixed.length
        });

        console.log(`\n${fixDetails.length}. ${act.title} (ID: ${act.id})`);
        console.log(`   原文: ${original.substring(0, 100)}...`);
        console.log(`   修复: ${fixed.substring(0, 100)}...`);
        console.log(`   减少: ${original.length - fixed.length} 字符`);
    }
});

console.log(`\n\n✅ 修复完成！`);
console.log(`📊 已修复活动: ${fixedCount}\n`);

// 保存数据
console.log('💾 保存数据...');
fs.writeFileSync(DATA_FILE, JSON.stringify(activities, null, 2), 'utf8');
console.log('✅ 数据已保存\n');

console.log('='.repeat(60));
console.log('\n💡 后续步骤:');
console.log('   1. 检查浏览器验证修复效果');
console.log('   2. 如有问题，使用备份文件恢复');
console.log('   3. 备份文件:', backupFile);
console.log('');
