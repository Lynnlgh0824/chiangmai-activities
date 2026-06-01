/**
 * 重新修复攻略标题结构 - 保留主要章节标题
 */

import fs from 'fs';
import path from 'path';

const GUIDE_FILE = path.join(process.cwd(), 'data', 'guide.json');

/**
 * 重新构建正确的标题结构
 */
function rebuildStructure(html) {
    // 定义主要章节的正则模式
    const sectionPattern = /<h1>([一二三四五六七八九十]+、\s*[^\n<]*[📝🛂✈️📱🚗🏥🌏💰][^\n<]*)<\/h1>/gi;

    let sections = [];
    let lastIndex = 0;
    let match;

    // 提取所有主要章节
    while ((match = sectionPattern.exec(html)) !== null) {
        sections.push({
            title: match[1],
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }

    // 如果没有找到章节，直接返回清理后的HTML
    if (sections.length === 0) {
        return cleanNestedTags(html);
    }

    // 重建内容
    let result = '';
    let currentPosition = 0;

    sections.forEach((section, index) => {
        // 添加当前位置到章节开始的内容
        result += cleanNestedTags(html.substring(currentPosition, section.startIndex));

        // 添加章节标题（作为h1）
        result += `<h1>${section.title}</h1>`;

        currentPosition = section.endIndex;
    });

    // 添加最后一个章节之后的内容
    result += cleanNestedTags(html.substring(currentPosition));

    return result;
}

/**
 * 清理嵌套的标签
 */
function cleanNestedTags(html) {
    let cleaned = html;

    // 移除包裹列表、表格、div的h1标签（这些不应该被h1包裹）
    cleaned = cleaned.replace(/<h1>\s*(<ul|<ol|<div|<table|<p|<pre)/gi, '$1');
    cleaned = cleaned.replace(/(<\/ul>|<\/ol>|<\/div>|<\/table>|<\/p>|<\/pre>)\s*<\/h1>/gi, '$1');

    // 移除空的h1标签
    cleaned = cleaned.replace(/<h1>\s*<\/h1>/gi, '');

    // 移除连续的h1标签（保留第一个）
    cleaned = cleaned.replace(/<\/h1>\s*<h1>/gi, '<br>');

    // 移除Apple-converted-space等特殊span
    cleaned = cleaned.replace(/<span class="Apple-converted-space">\s*&nbsp;\s*<\/span>/gi, ' ');

    // 清理连续的空行和空段落
    cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
    cleaned = cleaned.replace(/<p><\/p>/gi, '');

    // 移除h1中的hr标签
    cleaned = cleaned.replace(/<h1><hr[^>]*><\/h1>/gi, '<hr>');

    return cleaned;
}

/**
 * 主处理函数
 */
function main() {
    console.log('🔧 重新修复攻略标题结构...\n');

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

        // 重新构建结构
        console.log('🔧 正在重建标题结构...');
        const rebuiltContent = rebuildStructure(guideData.content);

        // 统计
        const h1Count = (rebuiltContent.match(/<h1>/gi) || []).length;
        const h2Count = (rebuiltContent.match(/<h2>/gi) || []).length;
        const h3Count = (rebuiltContent.match(/<h3>/gi) || []).length;

        // 更新数据
        guideData.content = rebuiltContent;
        guideData.lastUpdated = new Date().toISOString();
        guideData.structureFixedAt = new Date().toISOString();

        // 写入修复后的数据
        fs.writeFileSync(GUIDE_FILE, JSON.stringify(guideData, null, 2), 'utf8');

        console.log('✅ 修复完成！\n');
        console.log('📊 标题统计:');
        console.log(`   - h1 标题（主章节）: ${h1Count} 个`);
        console.log(`   - h2 标题（子章节）: ${h2Count} 个`);
        console.log(`   - h3 标题（小节）: ${h3Count} 个`);
        console.log(`   - 内容长度: ${rebuiltContent.length} 字符\n`);
        console.log('💡 主要章节应该包括:');
        console.log('   一、📝 行前备忘录');
        console.log('   二、🛂 签证攻略');
        console.log('   三、✈️ 清迈机场入境流程');
        console.log('   ... 等共7-8个主要章节\n');

    } catch (error) {
        console.error('❌ 修复失败:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// 执行修复
main();
