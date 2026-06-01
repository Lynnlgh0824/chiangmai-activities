/**
 * 更新攻略内容 - 清理格式并优化显示
 */

import fs from 'fs';
import path from 'path';

const GUIDE_FILE = path.join(process.cwd(), 'data', 'guide.json');

/**
 * 清理HTML内容
 */
function cleanGuideContent(html) {
    let cleaned = html;

    // 1. 移除所有 class="ybc-*" 的属性
    cleaned = cleaned.replace(/\s+class="[^"]*ybc-[^"]*"/gi, '');
    cleaned = cleaned.replace(/\s+class="ybc-[^"]*"/gi, '');

    // 2. 移除 data-* 属性
    cleaned = cleaned.replace(/\s+data-[^=]+="[^"]*"/gi, '');

    // 3. 清理内联样式中的字体相关属性和冗余样式
    cleaned = cleaned.replace(/style="([^"]*)"/gi, (match, styleContent) => {
        let cleanedStyle = styleContent
            // 移除font相关
            .replace(/font-size:\s*[^;]+;?/gi, '')
            .replace(/font-family:\s*[^;]+;?/gi, '')
            .replace(/font-weight:\s*[^;]+;?/gi, '')
            // 移除color相关
            .replace(/color:\s*[^;]+;?/gi, '')
            .replace(/background-color:\s*[^;]+;?/gi, '')
            // 移除line-height
            .replace(/line-height:\s*[^;]+;?/gi, '')
            // 移除border-collapse和border-spacing（这些应该由CSS控制）
            .replace(/border-collapse:\s*[^;]+;?/gi, '')
            .replace(/border-spacing:\s*[^;]+;?/gi, '')
            // 清理
            .replace(/;\s*;/g, ';')
            .replace(/^;\s*/g, '')
            .replace(/;\s*$/g, '');

        // 如果清理后为空或只有无意义属性，移除整个style
        if (!cleanedStyle.trim() ||
            cleanedStyle.trim() === 'border-collapse: collapse' ||
            cleanedStyle.trim() === 'border-spacing: 0px' ||
            cleanedStyle.trim() === 'border-collapse: collapse; border-spacing: 0px') {
            return '';
        }

        return `style="${cleanedStyle}"`;
    });

    // 4. 移除空的style属性
    cleaned = cleaned.replace(/\s+style=""/gi, '');
    cleaned = cleaned.replace(/\s+style=''/gi, '');

    // 5. 修复表格样式
    cleaned = cleaned.replace(/<table([^>]*)>/gi, (match, attrs) => {
        return '<table style="border-collapse: collapse; width: 100%; margin: 12px 0; border: 2px solid #ddd;">';
    });

    cleaned = cleaned.replace(/<th([^>]*)>/gi, '<th style="border: 1px solid #ddd; padding: 8px 12px; text-align: left; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600;">');

    cleaned = cleaned.replace(/<td([^>]*)>/gi, '<td style="border: 1px solid #ddd; padding: 8px 12px; text-align: left; vertical-align: top;">');

    // 6. 修复列表 - 移除空的li元素
    cleaned = cleaned.replace(/<li[^>]*>\s*<span[^>]*>\s*&nbsp;\s*<\/span>\s*<\/li>/gi, '');

    // 7. 修复嵌套的h1标签（有些内容被错误地包裹在h1中）
    cleaned = cleaned.replace(/<h1><ul/gi, '<ul');
    cleaned = cleaned.replace(/<\/ul><\/h1>/gi, '</ul>');
    cleaned = cleaned.replace(/<h1><div/gi, '<div');
    cleaned = cleaned.replace(/<\/div><\/h1>/gi, '</div>');

    // 8. 确保标题层级正确
    // 将连续的h1改为h2
    cleaned = cleaned.replace(/<\/h1>\s*<h1>/gi, '</h1><h2>');
    cleaned = cleaned.replace(/<h1>([^<]*)(二、|三、|四、|五、|六、|七、)/gi, '<h2>$1$2');

    // 9. 清理多余的空格和换行
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    cleaned = cleaned.replace(/>\s+</g, '><');

    return cleaned;
}

/**
 * 主处理函数
 */
function main() {
    console.log('📝 开始更新攻略内容...\n');

    try {
        // 读取现有数据
        if (!fs.existsSync(GUIDE_FILE)) {
            console.log('❌ guide.json 文件不存在');
            process.exit(1);
        }

        const rawData = fs.readFileSync(GUIDE_FILE, 'utf8');
        const guideData = JSON.parse(rawData);

        console.log(`📖 读取攻略内容，原始长度: ${guideData.content?.length || 0} 字符\n`);

        if (!guideData.content) {
            console.log('⚠️ 攻略内容为空');
            process.exit(0);
        }

        // 备份原始数据
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = GUIDE_FILE.replace('.json', `.backup.${timestamp}.json`);
        fs.writeFileSync(backupFile, rawData, 'utf8');
        console.log(`💾 原始数据已备份到: ${path.basename(backupFile)}\n`);

        // 清理内容
        console.log('🔧 正在清理内容格式...');
        const cleanedContent = cleanGuideContent(guideData.content);

        // 更新数据
        guideData.content = cleanedContent;
        guideData.lastUpdated = new Date().toISOString();
        guideData.lastCleanedAt = new Date().toISOString();

        // 写入清理后的数据
        fs.writeFileSync(GUIDE_FILE, JSON.stringify(guideData, null, 2), 'utf8');

        console.log('✅ 更新完成！\n');
        console.log('📊 统计信息:');
        console.log(`   - 原始长度: ${guideData.content?.length || 0} 字符`);
        console.log(`   - 清理后长度: ${cleanedContent.length} 字符`);
        console.log(`   - 压缩了 ${((1 - cleanedContent.length / guideData.content.length) * 100).toFixed(2)}% 的冗余代码\n`);
        console.log('💡 提示:');
        console.log('   1. 刷新后台管理页面查看效果');
        console.log('   2. 使用"🧹 清理格式"按钮进一步优化');
        console.log('   3. 确认无误后点击保存\n');

    } catch (error) {
        console.error('❌ 更新失败:', error.message);
        process.exit(1);
    }
}

// 执行更新
main();
