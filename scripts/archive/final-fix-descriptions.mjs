#!/usr/bin/env node
/**
 * 最终版活动描述去重工具
 *
 * 功能：
 * 1. 正确识别并去除语义相同的重复
 * 2. 保留第一次出现的内容
 * 3. 确保修复后的文案完整、有意义
 *
 * 运行：node scripts/final-fix-descriptions.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔧 最终版活动描述去重工具\n');
console.log('='.repeat(60));

const DATA_FILE = path.join(projectRoot, 'data', 'items.json');

// 读取数据
console.log(`📖 读取数据: ${DATA_FILE}`);
let activities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
console.log(`📊 总活动数: ${activities.length}\n`);

// 创建备份
const timestamp = Date.now();
const backupFile = DATA_FILE + '.backup.' + timestamp;
fs.copyFileSync(DATA_FILE, backupFile);
console.log(`💾 备份: ${backupFile}\n`);

/**
 * 最终版去重函数
 */
function finalFixDescription(description) {
    if (!description) return description;

    let fixed = description;
    let changes = [];

    // 1. 处理瑜伽垫重复（保留"需自备瑜伽垫"，删除"需要自己带瑜伽垫"）
    if (fixed.includes('需要自己带瑜伽垫') && fixed.includes('需自备瑜伽垫')) {
        fixed = fixed.replace(/需要自己带瑜伽垫，/g, '');
        changes.push('删除"需要自己带瑜伽垫"，保留"需自备瑜伽垫"');
    }

    // 2. 处理价格重复（保留"150泰铢/单次课程"，删除"单次课程150泰铢"）
    if (fixed.match(/\d+泰铢\/单次课程/) && fixed.match(/单次课程\d+泰铢/)) {
        fixed = fixed.replace(/单次课程\d+泰铢，/g, '');
        changes.push('删除词序不同的价格重复');
    }

    // 3. 去除重复的字段标签（完全相同的标签和内容）
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
        const regex = new RegExp(
            '(' + field.icon + '\\s*)?' + field.name + '[：:]\\s*([^\\n]+)',
            'gi'
        );

        const matches = [...fixed.matchAll(regex)];
        const seen = new Set();

        matches.forEach(m => {
            const content = m[2]; // 字段内容
            const fullMatch = m[0]; // 完整匹配（包括标签）

            if (seen.has(content)) {
                // 删除重复的
                fixed = fixed.replace(fullMatch, '');
                changes.push(`删除重复字段"${field.name}"`);
            } else {
                seen.add(content);
            }
        });
    });

    // 4. 统一标点符号
    if (fixed.includes('!')) {
        const before = fixed;
        fixed = fixed.replace(/!/g, '。');
        if (before !== fixed) {
            changes.push('统一感叹号为句号');
        }
    }

    // 5. 清理多余空行
    fixed = fixed.replace(/\n{3,}/g, '\n\n');
    fixed = fixed.trim();

    return { fixed, changes };
}

// 修复每个活动
let fixedCount = 0;
const fixDetails = [];

console.log('🔧 开始修复...\n');

activities.forEach((act) => {
    if (!act.description) return;

    const result = finalFixDescription(act.description);

    if (result.before !== result.fixed) {
        fixedCount++;
        act.description = result.fixed;

        fixDetails.push({
            id: act.id,
            title: act.title,
            changes: result.changes,
            after: result.fixed.substring(0, 120),
            reduction: act.description.length - result.fixed.length
        });

        console.log(`\n${fixDetails.length}. ${act.title} (ID: ${act.id})`);
        result.changes.forEach(change => {
            console.log(`   ✓ ${change}`);
        });
        console.log(`   减少: ${act.description.length - result.fixed.length} 字符`);
    }
});

console.log(`\n\n✅ 修复完成！\n`);
console.log('📊 修复统计:');
console.log(`   总活动数: ${activities.length}`);
console.log(`   已修复活动: ${fixedCount}`);
console.log(`   修复率: ${((fixedCount / activities.length) * 100).toFixed(2)}%\n`);

// 保存数据
console.log('💾 保存修复后的数据...');
fs.writeFileSync(DATA_FILE, JSON.stringify(activities, null, 2), 'utf8');
console.log(`✅ 数据已保存\n`);

// 验证修复结果
console.log('🔍 验证修复结果...\n');
const yogaActivity = activities.find(a => a.id === '0008');
if (yogaActivity) {
    console.log('案例：瑜伽（One Nimman）');
    console.log('修复后的描述:');
    console.log(yogaActivity.description);
    console.log('');
}

console.log('='.repeat(60));
console.log('\n✅ 全部完成！');
console.log('\n💡 后续步骤:');
console.log('   1. 前端刷新浏览器会自动获取新数据');
console.log('   2. 如有问题，使用以下命令恢复:');
console.log(`      cp ${backupFile} ${DATA_FILE}`);
console.log(`   3. 备份时间戳: ${timestamp}\n`);
