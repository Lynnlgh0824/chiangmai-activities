#!/usr/bin/env node
/**
 * 增强版活动描述重复修复工具
 *
 * 功能：
 * 1. 修复 data/items.json 中的重复描述
 * 2. 处理语义相同的重复（不仅仅是标签重复）
 * 3. 去除词序不同的重复
 * 4. 统一标点符号
 *
 * 运行：node scripts/fix-description-duplicates-enhanced.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔧 增强版活动描述重复修复工具\n');
console.log('='.repeat(60));

// 数据文件路径
const DATA_FILE = path.join(projectRoot, 'data', 'items.json');

// 检查文件是否存在
if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ 数据文件不存在: ${DATA_FILE}`);
    process.exit(1);
}

// 读取数据
console.log(`📖 读取数据文件: ${DATA_FILE}`);
const rawContent = fs.readFileSync(DATA_FILE, 'utf8');
let activities = JSON.parse(rawContent);
console.log(`📊 总活动数: ${activities.length}\n`);

// 创建备份
const backupFile = DATA_FILE + '.backup.' + Date.now();
console.log('💾 创建备份...');
fs.copyFileSync(DATA_FILE, backupFile);
console.log(`✅ 备份已保存: ${backupFile}\n`);

// =====================================================
// 去重函数
// =====================================================

/**
 * 智能去重函数
 */
function fixDescriptionDuplicates(description) {
    if (!description) return description;

    let fixed = description;

    // 1. 统一标点符号
    fixed = fixed.replace(/!/g, '。');
    fixed = fixed.replace(/；/g, '。');

    // 2. 处理"瑜伽垫"相关的重复
    const yogaMatMatches = [
        /需要自己带瑜伽垫/g,
        /需自备瑜伽垫/g,
        /自备瑜伽垫/g
    ];

    let yogaMatCount = 0;
    yogaMatMatches.forEach(pattern => {
        const matches = fixed.match(pattern);
        if (matches) {
            yogaMatCount += matches.length;
        }
    });

    if (yogaMatCount > 1) {
        // 保留第一个，删除其他
        yogaMatMatches.forEach((pattern, index) => {
            if (index > 0) {
                fixed = fixed.replace(pattern, '');
            }
        });
    }

    // 3. 处理价格相关的重复（"150泰铢/单次课程" vs "单次课程150泰铢"）
    const pricePattern1 = /(\d+)泰铢\/单次课程/g;
    const pricePattern2 = /单次课程(\d+)泰铢/g;

    const match1 = fixed.match(pricePattern1);
    const match2 = fixed.match(pricePattern2);

    if (match1 && match2 && match1[1] === match2[1]) {
        // 两个价格相同，只保留第一个
        fixed = fixed.replace(pricePattern2, '');
    }

    // 4. 去除重复的字段标签
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
            '(?:' + field.icon + '\\s*)?' + field.name + '[：:]\\s*.*?(?=\\n|$)',
            'gi'
        );

        const matches = fixed.match(regex);

        if (matches && matches.length > 1) {
            // 只保留第一次出现的内容
            const firstMatch = matches[0];

            // 移除所有匹配
            fixed = fixed.replace(regex, '');

            // 将第一次出现的内容添加回原位置
            fixed = firstMatch + '\n' + fixed;
        }
    });

    // 5. 清理多余空行和空格
    fixed = fixed.replace(/\n{3,}/g, '\n\n');
    fixed = fixed.replace(/[ \t]+$/gm, '');
    fixed = fixed.trim();

    return fixed;
}

// =====================================================
// 修复每个活动的描述
// =====================================================

let fixedCount = 0;
const fixDetails = [];

console.log('🔧 开始修复...\n');

activities.forEach((act, index) => {
    if (!act.description) return;

    const originalDesc = act.description;
    const fixedDesc = fixDescriptionDuplicates(act.description);

    if (originalDesc !== fixedDesc) {
        fixedCount++;
        act.description = fixedDesc;

        fixDetails.push({
            id: act.id || act._id,
            title: act.title,
            originalLength: originalDesc.length,
            fixedLength: fixedDesc.length,
            reduction: originalDesc.length - fixedDesc.length,
            originalPreview: originalDesc.substring(0, 100),
            fixedPreview: fixedDesc.substring(0, 100)
        });

        // 显示修复详情（前5个）
        if (fixDetails.length <= 5) {
            console.log(`\n${fixDetails.length}. ${act.title} (ID: ${act.id})`);
            console.log('   原长度:', originalDesc.length, '字符');
            console.log('   新长度:', fixedDesc.length, '字符');
            console.log('   减少:', originalDesc.length - fixedDesc.length, '字符');
            console.log('   原文:', originalDesc.substring(0, 80) + '...');
            console.log('   修复:', fixedDesc.substring(0, 80) + '...');
        }
    }

    // 显示进度
    if ((index + 1) % 50 === 0) {
        process.stdout.write(`\r进度: ${index + 1}/${activities.length}`);
    }
});

console.log(`\n\n✅ 修复完成！\n`);
console.log('📊 修复统计:');
console.log(`   总活动数: ${activities.length}`);
console.log(`   已修复活动: ${fixedCount}`);
console.log(`   修复率: ${((fixedCount / activities.length) * 100).toFixed(2)}%\n`);

// =====================================================
// 保存修复后的数据
// =====================================================

console.log('💾 保存修复后的数据...');
fs.writeFileSync(DATA_FILE, JSON.stringify(activities, null, 2), 'utf8');
console.log(`✅ 数据已保存: ${DATA_FILE}\n`);

// =====================================================
// 详细报告
// =====================================================

if (fixDetails.length > 0) {
    console.log('='.repeat(60));
    console.log('\n📋 所有修复详情:\n');

    fixDetails.forEach((detail, index) => {
        console.log(`${index + 1}. ${detail.title} (ID: ${detail.id})`);
        console.log(`   减少: ${detail.reduction} 字符`);
        console.log(`   原文: ${detail.originalPreview}...`);
        console.log(`   修复: ${detail.fixedPreview}...`);
        console.log('');
    });
}

console.log('='.repeat(60));
console.log('\n✅ 全部完成！');
console.log('\n💡 后续步骤:');
console.log('   1. 前端会自动从 API 获取最新数据');
console.log('   2. 刷新浏览器查看修复效果');
console.log('   3. 原始数据已备份，如需回滚使用备份文件');
console.log('   4. 运行 analyze 脚本验证修复效果\n');
