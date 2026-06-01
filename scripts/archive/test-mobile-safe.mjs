#!/usr/bin/env node
/**
 * Mobile Safe CSS 验证脚本
 * 检查 index.html 是否符合移动端防超宽安全规则
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 读取 index.html
const indexPath = path.join(projectRoot, 'public/index.html');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

console.log('🧹 Mobile Safe CSS 验证脚本\n');
console.log('=' .repeat(60));

// 测试项
const tests = [
    {
        name: '✅ ① 引入 mobile-safe.css',
        check: () => indexContent.includes('href="css/mobile-safe.css"'),
        error: '未找到 mobile-safe.css 引入'
    },
    {
        name: '✅ ② html/body 有 overflow-x: hidden',
        check: () => indexContent.includes('overflow-x: hidden') &&
                      indexContent.includes('html, body'),
        error: '未找到 html/body overflow-x: hidden 规则'
    },
    {
        name: '✅ ③ tab-pane 移除 !important',
        check: () => {
            // 检查是否还有 !important 在 tab-pane 的 padding-top
            const lines = indexContent.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('.tab-pane') &&
                    line.includes('padding-top') &&
                    line.includes('!important')) {
                    return false;
                }
            }
            return true;
        },
        error: 'tab-pane 仍有 !important（应该移除）'
    },
    {
        name: '✅ ④ active-filters 有 flex-wrap',
        check: () => indexContent.includes('.active-filters.show') &&
                      indexContent.includes('flex-wrap'),
        error: 'active-filters 缺少 flex-wrap'
    },
    {
        name: '✅ ⑤ active-filters 有 width: 100%',
        check: () => {
            const match = indexContent.match(/\.active-filters\.show\s*{([^}]+)}/);
            if (!match) return false;
            const styles = match[1];
            return styles.includes('width') && styles.includes('100%');
        },
        error: 'active-filters 缺少 width: 100%'
    },
    {
        name: '✅ ⑥ active-filters 有 box-sizing',
        check: () => {
            const match = indexContent.match(/\.active-filters\.show\s*{([^}]+)}/);
            if (!match) return false;
            const styles = match[1];
            return styles.includes('box-sizing') && styles.includes('border-box');
        },
        error: 'active-filters 缺少 box-sizing: border-box'
    },
    {
        name: '✅ ⑦ mobile-safe.css 文件存在',
        check: () => {
            const cssPath = path.join(projectRoot, 'public/css/mobile-safe.css');
            return fs.existsSync(cssPath);
        },
        error: 'mobile-safe.css 文件不存在'
    },
    {
        name: '✅ ⑧ 移动端检测脚本存在',
        check: () => indexContent.includes('mode-') &&
                      indexContent.includes('is-mobile'),
        error: '未找到移动端检测脚本（mode-h5 / is-mobile）'
    }
];

// 运行测试
let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
    try {
        const result = test.check();
        if (result) {
            console.log(`✓ ${test.name}`);
            passed++;
        } else {
            console.log(`✗ ${test.name}`);
            console.log(`  错误: ${test.error}`);
            failed++;
        }
    } catch (error) {
        console.log(`✗ ${test.name}`);
        console.log(`  错误: ${error.message}`);
        failed++;
    }
});

console.log('=' .repeat(60));
console.log(`\n测试结果: ${passed} 通过, ${failed} 失败`);

// 统计信息
console.log('\n📊 额外信息:');
console.log(`- index.html 大小: ${Math.round(indexContent.length / 1024)} KB`);
console.log(`- CSS 规则数量: ${(indexContent.match(/[^{]*{/g) || []).length}`);

// 检查潜在风险
console.log('\n⚠️  潜在风险检查:');

// 检查内联 style
const inlineStyles = (indexContent.match(/style="[^"]*width[^"]*"/g) || []).length;
if (inlineStyles > 0) {
    console.log(`  - 发现 ${inlineStyles} 处内联 width 样式（建议移到 CSS）`);
} else {
    console.log('  ✓ 无内联 width 样式');
}

// 检查内联 padding
const inlinePadding = (indexContent.match(/style="[^"]*padding[^"]*"/g) || []).length;
if (inlinePadding > 0) {
    console.log(`  - 发现 ${inlinePadding} 处内联 padding 样式（建议移到 CSS）`);
} else {
    console.log('  ✓ 无内联 padding 样式');
}

// 检查 overflow-x
const overflowHidden = (indexContent.match(/overflow-x:\s*hidden/g) || []).length;
console.log(`  - overflow-x: hidden 出现 ${overflowHidden} 次 ✓`);

// 最终结果
console.log('\n' + '=' .repeat(60));
if (failed === 0) {
    console.log('🎉 所有测试通过！移动端防超宽安全规则已正确应用。');
    process.exit(0);
} else {
    console.log('❌ 部分测试失败，请检查上述错误。');
    process.exit(1);
}
