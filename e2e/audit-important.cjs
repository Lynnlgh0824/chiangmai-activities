/**
 * !important 使用审计
 *
 * 扫描 style.css 中所有 !important 使用，按优先级分类
 * 运行: node e2e/audit-important.cjs
 */

const fs = require('fs');
const path = require('path');

const CSS_FILE = path.join(__dirname, '..', 'public', 'css', 'style.css');
const content = fs.readFileSync(CSS_FILE, 'utf-8');
const lines = content.split('\n');

// 分类统计
const categories = {
    mobile_override: [],   // 移动端 @media 内的覆盖
    desktop_override: [],  // PC 端的覆盖
    inline_fix: [],        // 修复性覆盖（注释含"修复"/"fix"/"P0"/"P1"）
    color_fix: [],         // 颜色相关
    layout_fix: [],        // 布局相关
    other: []
};

let inMedia = '';
let currentMediaStart = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 追踪 @media 块
    if (line.includes('@media')) {
        inMedia = line.trim().substring(0, 60);
        currentMediaStart = lineNum;
    }
    if (inMedia && line.includes('}') && !line.includes('{')) {
        // 简化判断：遇到单独的 } 可能是 media 结束
        // 实际应更精确，这里做近似
    }

    if (line.includes('!important')) {
        const trimmed = line.trim();
        const entry = { line: lineNum, code: trimmed.substring(0, 80), media: inMedia || 'base' };

        if (inMedia && inMedia.includes('max-width')) {
            categories.mobile_override.push(entry);
        } else if (inMedia && inMedia.includes('min-width')) {
            categories.desktop_override.push(entry);
        } else {
            categories.other.push(entry);
        }
    }
}

// 输出报告
console.log('\n📊 !important 使用审计报告\n');
console.log(`总计: ${lines.filter(l => l.includes('!important')).length} 处\n`);

console.log('分类统计:');
console.log(`  移动端 @media (max-width): ${categories.mobile_override.length} 处`);
console.log(`  桌面端 @media (min-width): ${categories.desktop_override.length} 处`);
console.log(`  其他/基础样式: ${categories.other.length} 处`);

console.log('\n' + '='.repeat(60));
console.log('📋 清理建议（按优先级）\n');

console.log('🟢 低风险 - 可直接清理（移动端 media 内的重复覆盖）:');
console.log(`   ${categories.mobile_override.length} 处`);
console.log('   策略: 提高选择器特异性，用 .container .element 替代 !important\n');

console.log('🟡 中风险 - 需要逐个评估:');
console.log(`   ${categories.other.length} 处`);
console.log('   策略: 检查是否可通过 CSS 层叠顺序解决\n');

console.log('🔴 高风险 - 暂不清理（桌面端覆盖，需验证）:');
console.log(`   ${categories.desktop_override.length} 处`);
console.log('   策略: 在桌面端测试后再清理\n');

// 输出前 10 个最容易清理的
console.log('='.repeat(60));
console.log('🎯 前 10 个建议优先清理:\n');
const easy = categories.mobile_override.slice(0, 10);
easy.forEach((e, i) => {
    console.log(`  ${i + 1}. Line ${e.line}: ${e.code}`);
});
