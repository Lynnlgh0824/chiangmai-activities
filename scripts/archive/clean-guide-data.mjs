/**
 * 清理攻略数据格式
 * 移除多余的内联样式，确保表格有正确的格式
 */

import fs from 'fs';
import path from 'path';

const GUIDE_FILE = path.join(process.cwd(), 'data', 'guide.json');

/**
 * 清除HTML中的内联样式
 */
function cleanInlineStyles(html) {
    // 移除或清理style属性中的字体相关样式
    html = html.replace(/style="([^"]*)"/gi, (match, styleContent) => {
        // 移除font-size, font-family, color等样式
        let cleaned = styleContent
            .replace(/font-size:\s*[^;]+;?/gi, '')
            .replace(/font-family:\s*[^;]+;?/gi, '')
            .replace(/color:\s*[^;]+;?/gi, '')
            .replace(/line-height:\s*[^;]+;?/gi, '')
            .replace(/background-color:\s*[^;]+;?/gi, '')
            .replace(/;\s*;/g, ';') // 移除重复的分号
            .replace(/^;\s*/g, '') // 移除开头的分号
            .replace(/;\s*$/g, ''); // 移除结尾的分号

        // 如果清理后为空，移除整个style属性
        return cleaned.trim() ? `style="${cleaned}"` : '';
    });

    // 移除空的style属性
    html = html.replace(/\s+style=""/gi, '');

    return html;
}

/**
 * 确保表格有正确的样式
 */
function ensureTableStyles(html) {
    // 为所有表格添加必要的类或样式
    html = html.replace(/<table([^>]*)>/gi, '<table$1 style="border-collapse: collapse; width: 100%; margin: 12px 0; border: 2px solid #ddd;">');

    // 为表头添加样式
    html = html.replace(/<th([^>]*)>/gi, '<th$1 style="border: 1px solid #ddd; padding: 8px 12px; text-align: left; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600;">');

    // 为表格单元格添加样式
    html = html.replace(/<td([^>]*)>/gi, '<td$1 style="border: 1px solid #ddd; padding: 8px 12px; text-align: left; vertical-align: top;">');

    return html;
}

/**
 * 主处理函数
 */
function main() {
    console.log('🧹 开始清理攻略数据格式...\n');

    try {
        // 读取现有数据
        if (!fs.existsSync(GUIDE_FILE)) {
            console.log('❌ guide.json 文件不存在');
            process.exit(1);
        }

        const rawData = fs.readFileSync(GUIDE_FILE, 'utf8');
        const guideData = JSON.parse(rawData);

        console.log(`📖 读取攻略内容，长度: ${guideData.content?.length || 0} 字符\n`);

        if (!guideData.content) {
            console.log('⚠️ 攻略内容为空，无需清理');
            process.exit(0);
        }

        // 清理内联样式
        console.log('🔧 步骤 1/2: 清理内联样式...');
        let cleanedContent = cleanInlineStyles(guideData.content);
        console.log(`   移除了 ${guideData.content.length - cleanedContent.length} 个字符的冗余样式\n`);

        // 确保表格有正确样式
        console.log('🔧 步骤 2/2: 确保表格样式正确...');
        cleanedContent = ensureTableStyles(cleanedContent);
        console.log('   表格样式已优化\n');

        // 备份原始数据
        const backupFile = GUIDE_FILE.replace('.json', '.backup.json');
        fs.writeFileSync(backupFile, rawData, 'utf8');
        console.log(`💾 原始数据已备份到: ${path.basename(backupFile)}\n`);

        // 更新数据
        guideData.content = cleanedContent;
        guideData.lastCleanedAt = new Date().toISOString();

        // 写入清理后的数据
        fs.writeFileSync(GUIDE_FILE, JSON.stringify(guideData, null, 2), 'utf8');

        console.log('✅ 清理完成！\n');
        console.log('📊 统计信息:');
        console.log(`   - 原始长度: ${guideData.content?.length || 0} 字符`);
        console.log(`   - 清理后长度: ${cleanedContent.length} 字符`);
        console.log(`   - 压缩率: ${((1 - cleanedContent.length / guideData.content.length) * 100).toFixed(2)}%\n`);
        console.log('💡 提示: 请刷新后台管理页面查看效果\n');

    } catch (error) {
        console.error('❌ 清理失败:', error.message);
        process.exit(1);
    }
}

// 执行清理
main();
