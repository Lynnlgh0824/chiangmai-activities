#!/usr/bin/env node

/**
 * 优化活动描述，去除重复信息，简化内容
 * - 删除注意事项中已经在前面的字段中提到的信息
 * - 简化冗长的句子
 * - 合并相似信息
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const itemsJsonPath = path.join(__dirname, '../data/items.json');

// 读取数据
const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('📊 开始优化活动描述...\n');
console.log(`原始数据: ${items.length} 个活动\n`);

let optimizeCount = 0;
const details = [];

items.forEach(item => {
    if (!item.description) return;

    const originalDesc = item.description;
    let optimizedDesc = item.description;
    let hasChanges = false;

    // 1. 删除注意事项中重复前面字段的信息
    const fieldsToCheck = [
        { name: '课程周期', value: item.duration },
        { name: '时间', value: item.time },
        { name: '价格', value: item.price },
        { name: '费用', value: item.price }
    ];

    // 检查注意事项部分
    const noticeMatch = optimizedDesc.match(/[⚠️]?\s*注意事项[：:]\s*([\s\S]*?)(?=\n\n|\n[⚠️👥✨📚🌐💰🌐📞⏰]|$)/);

    if (noticeMatch) {
        const noticeContent = noticeMatch[1];
        let newNoticeContent = noticeContent;

        // 检查并删除重复信息
        fieldsToCheck.forEach(field => {
            if (field.value) {
                // 如果注意事项中包含字段值，删除该句
                const patterns = [
                    new RegExp(`${field.value}[。，]?$`, 'gm'),
                    new RegExp(`${field.value}[，。]?(?:需|建议)?`, 'gm'),
                    new RegExp(`[^。]*${field.value}[^。]*[。]`, 'g')
                ];

                patterns.forEach(pattern => {
                    if (pattern.test(newNoticeContent)) {
                        newNoticeContent = newNoticeContent.replace(pattern, '');
                        hasChanges = true;
                    }
                });
            }
        });

        // 删除常见的冗余短语
        const redundantPhrases = [
            /适合初学者[。，]?/g,
            /英语教学[。，]?/g,
            /需自备瑜伽垫[。，]?/g,
            /有会讲中文的居士提供翻译协助[。，]?/g,
            /课程费用包含食宿[。，]?/g
        ];

        redundantPhrases.forEach(pattern => {
            if (pattern.test(newNoticeContent)) {
                newNoticeContent = newNoticeContent.replace(pattern, '');
                hasChanges = true;
            }
        });

        // 更新注意事项
        if (newNoticeContent !== noticeContent && newNoticeContent.trim().length > 0) {
            optimizedDesc = optimizedDesc.replace(
                /[⚠️]?\s*注意事项[：:]\s*[\s\S]*?(?=\n\n|\n[⚠️👥✨📚🌐💰🌐📞⏰]|$)/,
                `⚠️ 注意事项：\n${newNoticeContent.trim()}`
            );
        }
    }

    // 2. 删除重复的句子（完全相同的句子）
    const sentences = optimizedDesc.split(/[。\n]/);
    const uniqueSentences = [];
    const seenSentences = new Set();

    for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (trimmed && !seenSentences.has(trimmed)) {
            uniqueSentences.push(trimmed);
            seenSentences.add(trimmed);
        } else if (trimmed && seenSentences.has(trimmed)) {
            hasChanges = true;
        }
    }

    optimizedDesc = uniqueSentences.join('。\n');

    // 3. 清理多余的空行和标点
    optimizedDesc = optimizedDesc
        .replace(/\n\s*\n\s*\n/g, '\n\n') // 多个空行变两个
        .replace(/。{2,}/g, '。') // 多个句号变一个
        .replace(/，{2,}/g, '，') // 多个逗号变一个
        .trim();

    if (hasChanges) {
        item.description = optimizedDesc;
        optimizeCount++;
        details.push({
            id: item.id || item.activityNumber,
            title: item.title,
            original: originalDesc.substring(0, 150),
            optimized: optimizedDesc.substring(0, 150)
        });
    }
});

console.log('✅ 优化完成:\n');
console.log(`   优化数量: ${optimizeCount} 个活动\n`);

if (details.length > 0) {
    console.log('📝 优化详情（前5个）:\n');
    details.slice(0, 5).forEach((detail, i) => {
        console.log(`[${i+1}] [${detail.id}] ${detail.title}`);
        console.log(`   优化前: ${detail.original}...`);
        console.log(`   优化后: ${detail.optimized}...`);
        console.log('');
    });
}

// 保存优化后的数据
fs.writeFileSync(itemsJsonPath, JSON.stringify(items, null, 2), 'utf-8');

console.log(`\n✅ 数据已保存到 items.json`);
console.log(`\n💡 下一步: 运行以下命令重新导出Excel`);
console.log(`   npm run export-to-excel`);
