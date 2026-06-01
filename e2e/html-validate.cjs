/**
 * HTML 结构验证脚本
 *
 * 检查 index.html 的标签嵌套是否正确
 * 运行: node e2e/html-validate.cjs
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, '..', 'public', 'index.html');

function validateHTML(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const errors = [];
    const warnings = [];
    const stack = [];

    // 自闭合标签
    const selfClosing = new Set([
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr'
    ]);

    // 忽略的标签（注释、doctype 等）
    let inComment = false;
    let inScript = false;
    let inStyle = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // 跳过注释
        if (line.includes('<!--')) inComment = true;
        if (line.includes('-->')) { inComment = false; continue; }
        if (inComment) continue;

        // 跳过 script 和 style 内容
        if (line.includes('<script')) inScript = true;
        if (line.includes('</script>')) { inScript = false; continue; }
        if (inScript) continue;

        if (line.includes('<style')) inStyle = true;
        if (line.includes('</style>')) { inStyle = false; continue; }
        if (inStyle) continue;

        // 匹配所有标签
        const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*\/?>/g;
        let match;

        while ((match = tagRegex.exec(line)) !== null) {
            const fullTag = match[0];
            const tagName = match[1].toLowerCase();

            // 跳过自闭合标签
            if (selfClosing.has(tagName)) continue;

            // 跳过 void 元素
            if (fullTag.endsWith('/>')) continue;

            // 开始标签
            if (!fullTag.startsWith('</')) {
                stack.push({ tag: tagName, line: lineNum });
            }
            // 结束标签
            else {
                if (stack.length === 0) {
                    errors.push(`Line ${lineNum}: 多余的 </${tagName}>，无匹配的开始标签`);
                    continue;
                }

                const last = stack[stack.length - 1];
                if (last.tag === tagName) {
                    stack.pop();
                } else {
                    // 检查是否跳过了中间标签
                    const idx = stack.findLastIndex(s => s.tag === tagName);
                    if (idx === -1) {
                        errors.push(`Line ${lineNum}: 多余的 </${tagName}>，无匹配的开始标签`);
                    } else {
                        // 弹出直到找到匹配
                        const popped = stack.splice(idx);
                        warnings.push(
                            `Line ${lineNum}: </${tagName}> 关闭了 ${popped.length - 1} 个未闭合的标签: ${popped.slice(0, -1).map(p => `<${p.tag}> (line ${p.line})`).join(', ')}`
                        );
                    }
                }
            }
        }
    }

    // 检查未闭合的标签
    stack.forEach(item => {
        errors.push(`未闭合的 <${item.tag}>，打开于 line ${item.line}`);
    });

    return { errors, warnings };
}

// 运行验证
console.log('\n🔍 HTML 结构验证\n');

if (!fs.existsSync(HTML_FILE)) {
    console.error(`❌ 文件不存在: ${HTML_FILE}`);
    process.exit(1);
}

const { errors, warnings } = validateHTML(HTML_FILE);

if (warnings.length > 0) {
    console.log('⚠️  警告:');
    warnings.forEach(w => console.log(`  ⚠️  ${w}`));
    console.log('');
}

if (errors.length > 0) {
    console.log('❌ 错误:');
    errors.forEach(e => console.log(`  ❌ ${e}`));
    console.log(`\n📊 结果: ${errors.length} 个错误, ${warnings.length} 个警告`);
    process.exit(1);
} else {
    console.log('✅ HTML 结构验证通过，无错误');
    if (warnings.length > 0) {
        console.log(`⚠️  有 ${warnings.length} 个警告，请检查`);
    }
}
