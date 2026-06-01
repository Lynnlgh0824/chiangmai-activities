#!/usr/bin/env node
/**
 * 分析活动描述中的重复字段
 *
 * 用途：检查数据源中的描述字段是否包含重复内容
 * 运行：node scripts/analyze-description-duplicates.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 活动描述重复分析工具\n');
console.log('=' .repeat(60));

// 查找所有可能的活动数据文件
const possibleDataPaths = [
    path.join(projectRoot, 'data', 'activities.json'),
    path.join(projectRoot, 'public', 'data', 'activities.json'),
    path.join(projectRoot, 'activities.json'),
];

let dataFile = null;
let activities = [];

// 查找数据文件
for (const filePath of possibleDataPaths) {
    try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
            dataFile = filePath;
            activities = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            console.log(`✅ 找到数据文件: ${filePath}`);
            console.log(`📊 总活动数: ${activities.length}\n`);
            break;
        }
    } catch (error) {
        // 文件不存在，继续查找
    }
}

if (!dataFile) {
    console.error('❌ 未找到活动数据文件');
    console.log('📁 尝试过的路径:');
    possibleDataPaths.forEach(p => console.log(`  - ${p}`));
    process.exit(1);
}

// 定义需要检查的字段
const fields = [
    { name: '适合人群', icon: '👥' },
    { name: '活动特点', icon: '✨' },
    { name: '课程周期', icon: '📚' },
    { name: '语言', icon: '🌐' },
    { name: '费用', icon: '💰' },
    { name: '注意事项', icon: '⚠️' },
    { name: '联系方式', icon: '📞' },
    { name: '官网', icon: '🌐' }
];

let totalDuplicates = 0;
const duplicateDetails = [];

// 分析每个活动
activities.forEach(act => {
    const desc = act.description || '';

    if (!desc) return;

    let activityHasDuplicates = false;

    fields.forEach(field => {
        // 匹配字段标签（带或不带图标）
        const regex = new RegExp(`(?:${field.icon}\\s*)?${field.name}[：:]`, 'gi');
        const matches = desc.match(regex);

        if (matches && matches.length > 1) {
            activityHasDuplicates = true;
            totalDuplicates++;

            if (duplicateDetails.length < 10) {
                // 只保存前10个例子
                duplicateDetails.push({
                    id: act.id || act.originalId,
                    title: act.title,
                    field: field.name,
                    count: matches.length,
                    preview: desc.substring(0, 150) + (desc.length > 150 ? '...' : '')
                });
            }
        }
    });
});

// 输出分析结果
console.log('📋 分析结果:\n');
console.log(`发现重复字段的活动: ${duplicateDetails.length} 个`);
console.log(`总重复字段数: ${totalDuplicates} 个\n`);

if (duplicateDetails.length > 0) {
    console.log('🔍 重复详情（前10个）:\n');
    duplicateDetails.forEach((detail, index) => {
        console.log(`${index + 1}. ${detail.title} (ID: ${detail.id})`);
        console.log(`   重复字段: ${detail.field} (${detail.count}次)`);
        console.log(`   描述预览: ${detail.preview}`);
        console.log('');
    });

    console.log('=' .repeat(60));
    console.log('\n✅ 分析完成！');
    console.log('\n💡 建议：');
    console.log('   1. 运行修复脚本: node scripts/fix-description-duplicates.mjs');
    console.log('   2. 或者手动编辑数据文件清理重复内容');
    console.log('   3. 或者增强 formatDescription 函数的去重逻辑\n');
} else {
    console.log('✅ 未发现重复字段，数据源正常！\n');
}

// 输出统计信息
console.log('📊 统计信息:');
console.log(`   数据文件: ${dataFile}`);
console.log(`   总活动数: ${activities.length}`);
console.log(`   有描述的活动: ${activities.filter(a => a.description).length}`);
console.log(`   有重复的活动: ${duplicateDetails.length}\n`);
