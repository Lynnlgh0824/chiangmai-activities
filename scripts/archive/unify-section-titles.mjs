/**
 * 统一主要章节标题为h1
 */

import fs from 'fs';
import path from 'path';

const GUIDE_FILE = path.join(process.cwd(), 'data', 'guide.json');

/**
 * 统一章节标题层级
 */
function unifySectionTitles(html) {
    // 将所有"中文数字+顿号"的章节标题统一为h1
    const sectionPattern = /<h([1-4])>([一二三四五六七八九十]+、\s*[^\n<]{5,100})<\/h\1>/gi;

    const unified = html.replace(sectionPattern, '<h1>$2</h1>');

    // 同时处理表情符号开头的章节（如💰换钱全攻略）
    const emojiPattern = /<h([1-4])>([💰📋🌐]\s*[^<]{5,100})<\/h\1>/gi;

    const final = unified.replace(emojiPattern, '<h1>$2</h1>');

    // 清理可能产生的空行
    const cleaned = final.replace(/<h1><\/h1>/gi, '');

    return cleaned;
}

/**
 * 主处理函数
 */
function main() {
    console.log('🔧 统一章节标题层级...\n');

    try {
        const rawData = fs.readFileSync(GUIDE_FILE, 'utf8');
        const guideData = JSON.parse(rawData);

        console.log(`📖 原始h1标题: ${(guideData.content.match(/<h1>/gi) || []).length} 个`);
        console.log(`📖 原始h2标题: ${(guideData.content.match(/<h2>/gi) || []).length} 个\n`);

        // 统一章节标题
        const unified = unifySectionTitles(guideData.content);

        // 统计
        const h1Count = (unified.match(/<h1>/gi) || []).length;
        const h2Count = (unified.match(/<h2>/gi) || []).length;
        const h3Count = (unified.match(/<h3>/gi) || []).length;

        // 更新数据
        guideData.content = unified;
        guideData.lastUpdated = new Date().toISOString();

        fs.writeFileSync(GUIDE_FILE, JSON.stringify(guideData, null, 2), 'utf8');

        console.log('✅ 修复完成！\n');
        console.log('📊 修复后标题统计:');
        console.log(`   - h1 标题（主要章节）: ${h1Count} 个`);
        console.log(`   - h2 标题（子章节）: ${h2Count} 个`);
        console.log(`   - h3 标题（小节）: ${h3Count} 个\n`);

        // 列出所有h1标题
        const h1Titles = unified.match(/<h1>[^<]+<\/h1>/gi) || [];
        console.log('📚 主要章节列表:');
        h1Titles.forEach((title, i) => {
            const cleanTitle = title.replace(/<\/?h1>/gi, '');
            console.log(`   ${i + 1}. ${cleanTitle.substring(0, 50)}`);
        });

    } catch (error) {
        console.error('❌ 失败:', error.message);
        process.exit(1);
    }
}

main();
