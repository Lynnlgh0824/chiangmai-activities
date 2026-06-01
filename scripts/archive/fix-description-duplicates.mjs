#!/usr/bin/env node
/**
 * 修复活动描述中的重复字段
 *
 * 用途：自动去除描述中重复的字段标签和内容
 * 运行：node scripts/fix-description-duplicates.mjs
 *
 * ⚠️  注意：运行前请备份数据文件！
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔧 活动描述重复修复工具\n');
console.log('=' .repeat(60));

// 查找数据文件
const possibleDataPaths = [
    path.join(projectRoot, 'data', 'activities.json'),
    path.join(projectRoot, 'public', 'data', 'activities.json'),
    path.join(projectRoot, 'activities.json'),
];

let dataFile = null;
let activities = [];

for (const filePath of possibleDataPaths) {
    try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
            dataFile = filePath;
            activities = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            console.log('✅ 找到数据文件: ${filePath}');
            console.log('📊 总活动数: ${activities.length}\n');
            break;
        }
    } catch (error) {
        // 文件不存在，继续查找
    }
}

if (!dataFile) {
    console.error('❌ 未找到活动数据文件');
    process.exit(1);
}

// 创建备份
const backupFile = dataFile + '.backup.' + Date.now();
console.log('💾 创建备份...');
fs.copyFileSync(dataFile, backupFile);
console.log('✅ 备份已保存: ${backupFile}\n');

// 去重函数
function fixDescriptionDuplicates(description) {
    if (!description) return description;

    let fixed = description;

    // 定义需要去重的字段
    const deduplicateFields = [
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

    // 对每个字段进行去重
    deduplicateFields.forEach(field => {
        // 匹配所有出现的字段标签
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

    // 清理多余空行
    fixed = fixed.replace(/\n{3,}/g, '\n\n');
    fixed = fixed.trim();

    return fixed;
}

// 修复每个活动的描述
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

        if (fixDetails.length < 5) {
            fixDetails.push({
                title: act.title,
                id: act.id || act.originalId,
                originalLength: originalDesc.length,
                fixedLength: fixedDesc.length,
                reduction: originalDesc.length - fixedDesc.length
            });
        }
    }

    // 显示进度
    if ((index + 1) % 100 === 0) {
        console.log('进度: ${index + 1}/${activities.length}');
    }
});

console.log('\n✅ 修复完成！\n');
console.log('📊 修复统计:');
console.log('   总活动数: ${activities.length}');
console.log('   已修复活动: ${fixedCount}');
console.log('   修复率: ${((fixedCount / activities.length) * 100).toFixed(2)}%\n');

if (fixDetails.length > 0) {
    console.log('🔍 修复示例（前5个）:\n');
    fixDetails.forEach((detail, index) => {
        console.log('${index + 1}. ${detail.title} (ID: ${detail.id})');
        console.log('   原长度: ${detail.originalLength} 字符');
        console.log('   新长度: ${detail.fixedLength} 字符');
        console.log('   减少: ${detail.reduction} 字符');
        console.log('');
    });
}

// 保存修复后的数据
console.log('💾 保存修复后的数据...');
fs.writeFileSync(dataFile, JSON.stringify(activities, null, 2), 'utf-8');
console.log('✅ 数据已保存: ${dataFile}\n');

console.log('=' .repeat(60));
console.log('\n✅ 全部完成！');
console.log('\n💡 提示：');
console.log('   - 原始数据已备份');
console.log('   - 如需回滚，使用备份文件');
console.log('   - 建议刷新浏览器查看修复效果\n');
