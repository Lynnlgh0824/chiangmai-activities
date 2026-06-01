/**
 * 最终修复攻略标题结构 - 处理所有特殊情况
 */

import fs from 'fs';
import path from 'path';

const GUIDE_FILE = path.join(process.cwd(), 'data', 'guide.json');

/**
 * 彻底修复标题结构
 */
function finalFix(html) {
    let fixed = html;

    // 1. 移除包裹内容的h1标签
    fixed = fixed.replace(/<h1>(<ul|<ol|<div|<table|<p|<pre|<hr)/gi, '$1');
    fixed = fixed.replace(/(<\/ul>|<\/ol>|<\/div>|<\/table>|<\/p>|<\/pre>|<hr[^>]*>)<\/h1>/gi, '$1');

    // 2. 移除h1中的hr标签（保留hr）
    fixed = fixed.replace(/<\/h1><hr([^>]*)><\/h1>/gi, '<hr$1>');
    fixed = fixed.replace(/<h1><hr([^>]*)>/gi, '<hr$1>');

    // 3. 将"中文数字+顿号"的章节标题统一为h1
    fixed = fixed.replace(
        /<h([1-4])>([一二三四五六七八九十]+、\s*[^\n<]{5,100})<\/h\1>/gi,
        '<h1>$2</h1>'
    );

    // 4. 将包含表情符号+strong的h2标题转换为h1
    fixed = fixed.replace(
        /<h([1-4])>([💰📋🌐📝🛂✈️📱🚗🏥🌏])\s*<strong>([^<]+)<\/strong><\/h\1>/gi,
        '<h1>$1 $2</h1>'
    );

    // 5. 清理空的标签
    fixed = fixed.replace(/<h[1-4]>\s*<\/h[1-4]>/gi, '');
    fixed = fixed.replace(/<p>\s*<\/p>/gi, '');

    // 6. 移除Apple-converted-space等特殊span
    fixed = fixed.replace(/<span class="Apple-converted-space">\s*&nbsp;\s*<\/span>/gi, ' ');

    // 7. 清理连续的h1标签（保留第一个）
    fixed = fixed.replace(/<\/h1>\s*<h1>/gi, '');

    return fixed;
}

/**
 * 主处理函数
 */
function main() {
    console.log('🔧 最终修复攻略标题结构...\n');

    try {
        const rawData = fs.readFileSync(GUIDE_FILE, 'utf8');
        const guideData = JSON.parse(rawData);

        // 备份
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = GUIDE_FILE.replace('.json', `.before-final-fix.${timestamp}.json`);
        fs.writeFileSync(backupFile, rawData, 'utf8');
        console.log(`💾 已备份到: ${path.basename(backupFile)}\n`);

        // 修复
        console.log('🔧 正在修复...');
        const fixed = finalFix(guideData.content);

        // 统计
        const h1Count = (fixed.match(/<h1>/gi) || []).length;
        const h2Count = (fixed.match(/<h2>/gi) || []).length;
        const h3Count = (fixed.match(/<h3>/gi) || []).length;
        const h4Count = (fixed.match(/<h4>/gi) || []).length;

        // 列出所有主要标题
        const mainTitles = fixed.match(/<h1[^>]*>[^<]+<\/h1>/gi) || [];

        // 更新数据
        guideData.content = fixed;
        guideData.lastUpdated = new Date().toISOString();
        guideData.finalFixedAt = new Date().toISOString();

        fs.writeFileSync(GUIDE_FILE, JSON.stringify(guideData, null, 2), 'utf8');

        console.log('✅ 修复完成！\n');
        console.log('📊 标题统计:');
        console.log(`   - h1（主要章节）: ${h1Count} 个`);
        console.log(`   - h2（子章节）: ${h2Count} 个`);
        console.log(`   - h3（小节）: ${h3Count} 个`);
        console.log(`   - h4（子小节）: ${h4Count} 个\n`);
        console.log('📚 主要章节:');
        mainTitles.forEach((title, i) => {
            const cleanTitle = title.replace(/<\/?h1[^>]*>|<\/?strong>/gi, '').trim();
            console.log(`   ${i + 1}. ${cleanTitle}`);
        });
        console.log(`\n   总共 ${mainTitles.length} 个主要章节\n`);

    } catch (error) {
        console.error('❌ 失败:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
