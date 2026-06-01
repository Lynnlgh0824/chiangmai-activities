/**
 * 修复攻略标题结构 - 移除不必要的嵌套h1标签
 */

import fs from 'fs';
import path from 'path';

const GUIDE_FILE = path.join(process.cwd(), 'data', 'guide.json');

/**
 * 修复标题结构
 */
function fixTitles(html) {
    let fixed = html;

    // 1. 移除包裹列表、表格、div的h1标签
    fixed = fixed.replace(/<h1><ul/gi, '<ul');
    fixed = fixed.replace(/<\/ul><\/h1>/gi, '</ul>');

    fixed = fixed.replace(/<h1><ol/gi, '<ol');
    fixed = fixed.replace(/<\/ol><\/h1>/gi, '</ol>');

    fixed = fixed.replace(/<h1><div/gi, '<div');
    fixed = fixed.replace(/<\/div><\/h1>/gi, '</div>');

    fixed = fixed.replace(/<h1><p/gi, '<p');
    fixed = fixed.replace(/<\/p><\/h1>/gi, '</p>');

    fixed = fixed.replace(/<h1><pre/gi, '<pre');
    fixed = fixed.replace(/<\/pre><\/h1>/gi, '</pre>');

    // 2. 移除包裹在h1中的hr标签
    fixed = fixed.replace(/<h1><hr/gi, '<hr');
    fixed = fixed.replace(/<\/h1><h2>/gi, '</h1><h2>');

    // 3. 修复标题层级
    // 将内容标题（一、二、三等）改为h1
    fixed = fixed.replace(/<h1>([一二三四五六七八九十]+、\s*[^<]+)<\/h1>/gi, (match, title) => {
        // 检查是否已经是h1，如果是则不处理
        if (title.includes('📝') || title.includes('🛂') || title.includes('✈️') ||
            title.includes('📱') || title.includes('🚗') || title.includes('🏥') ||
            title.includes('🌏') || title.includes('💰')) {
            return `<h1>${title}</h1>`;
        }
        return `<h1>${title}</h1>`;
    });

    // 4. 移除表情符号前的h1包裹（如果存在）
    fixed = fixed.replace(/<\/h1><h1>([📝🛂✈️📱🚗🏥🌏💰])/gi, '</h1>$1');

    // 5. 确保表情符号章节标题为h1
    fixed = fixed.replace(
        /<h([1-4])>([📝🛂✈️📱🚗🏥🌏💰]\s*[^<]+)<\/h\1>/gi,
        '<h1>$2</h1>'
    );

    // 6. 子标题保持为h2
    fixed = fixed.replace(/<h3>([^\n<]{5,50})<\/h3>/gi, (match, title) => {
        // 如果标题很短且不包含重点符号，可能是子标题
        if (title.length < 20 && !title.includes('：') && !title.includes('(')) {
            return `<h3>${title}</h3>`;
        }
        // 如果是重要的小节标题，保持h3
        return `<h3>${title}</h3>`;
    });

    // 7. 清理连续的空行
    fixed = fixed.replace(/<p><\/p>/gi, '');
    fixed = fixed.replace(/<p>\s*<\/p>/gi, '');

    // 8. 移除Apple-converted-space等特殊span
    fixed = fixed.replace(/<span class="Apple-converted-space">\s*&nbsp;\s*<\/span>/gi, ' ');

    return fixed;
}

/**
 * 主处理函数
 */
function main() {
    console.log('🔧 开始修复攻略标题结构...\n');

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
        const backupFile = GUIDE_FILE.replace('.json', `.before-title-fix.${timestamp}.json`);
        fs.writeFileSync(backupFile, rawData, 'utf8');
        console.log(`💾 原始数据已备份到: ${path.basename(backupFile)}\n`);

        // 修复标题结构
        console.log('🔧 正在修复标题结构...');
        const fixedContent = fixTitles(guideData.content);

        // 统计修复效果
        const beforeH1 = (guideData.content.match(/<h1>/gi) || []).length;
        const afterH1 = (fixedContent.match(/<h1>/gi) || []).length;
        const removedH1 = beforeH1 - afterH1;

        // 更新数据
        guideData.content = fixedContent;
        guideData.lastUpdated = new Date().toISOString();
        guideData.titleFixedAt = new Date().toISOString();

        // 写入修复后的数据
        fs.writeFileSync(GUIDE_FILE, JSON.stringify(guideData, null, 2), 'utf8');

        console.log('✅ 修复完成！\n');
        console.log('📊 修复统计:');
        console.log(`   - 移除了 ${removedH1} 个冗余的h1标签`);
        console.log(`   - 修复前: ${beforeH1} 个h1标签`);
        console.log(`   - 修复后: ${afterH1} 个h1标签`);
        console.log(`   - 内容长度: ${fixedContent.length} 字符\n`);
        console.log('💡 提示:');
        console.log('   1. 刷新后台管理页面查看效果');
        console.log('   2. 检查前端页面是否还有重复标题');
        console.log('   3. 确认无误后前端页面会自动更新\n');

    } catch (error) {
        console.error('❌ 修复失败:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// 执行修复
main();
