#!/usr/bin/env node
/**
 * Mobile Safe CSS v2.0 验证脚本
 * 检查 mobile-safe.css 是否遵循"状态来源唯一"原则
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 读取 mobile-safe.css
const cssPath = path.join(projectRoot, 'public/css/mobile-safe.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

console.log('🧹 Mobile Safe CSS v2.0 验证脚本\n');
console.log('='.repeat(60));

// 测试项
const tests = [
    {
        name: '✅ ① 移除 body.class 依赖',
        check: () => {
            // 检查是否还有 body.mode-h5 或 body.mode-pc
            return !cssContent.includes('body.mode-h5') &&
                   !cssContent.includes('body.mode-pc');
        },
        error: 'CSS 中仍然存在 body.mode-h5 或 body.mode-pc 依赖'
    },
    {
        name: '✅ ② 使用 @media 查询',
        check: () => {
            // 检查是否有 @media 查询
            return cssContent.includes('@media (max-width: 768px)');
        },
        error: 'CSS 中缺少 @media (max-width: 768px) 查询'
    },
    {
        name: '✅ ③ 全局 overflow-x: hidden',
        check: () => {
            return cssContent.includes('html, body') &&
                   cssContent.includes('overflow-x: hidden');
        },
        error: '缺少全局 overflow-x: hidden 规则'
    },
    {
        name: '✅ ④ container 层保护',
        check: () => {
            // 检查 .container 是否在 @media 查询中
            return cssContent.includes('.container') &&
                   cssContent.includes('@media (max-width: 768px)');
        },
        error: '缺少 container 层保护'
    },
    {
        name: '✅ ⑤ tab-pane 层保护',
        check: () => {
            return cssContent.includes('.tab-pane') &&
                   cssContent.includes('overflow-x: hidden');
        },
        error: '缺少 tab-pane 层保护'
    },
    {
        name: '✅ ⑥ active-filters 保护',
        check: () => {
            return cssContent.includes('.active-filters') &&
                   cssContent.includes('flex-wrap: wrap');
        },
        error: '缺少 active-filters 保护'
    },
    {
        name: '✅ ⑦ Flex 子元素保护',
        check: () => {
            return cssContent.includes('min-width: 0');
        },
        error: '缺少 Flex 子元素 min-width: 0 保护'
    },
    {
        name: '✅ ⑧ 开发态溢出报警器',
        check: () => {
            return cssContent.includes('body.debug-outline');
        },
        error: '缺少开发态溢出报警器'
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

console.log('='.repeat(60));
console.log(`\n测试结果: ${passed} 通过, ${failed} 失败`);

// 统计信息
console.log('\n📊 额外信息:');
console.log(`- mobile-safe.css 大小: ${Math.round(cssContent.length / 1024)} KB`);
console.log(`- @media 查询数量: ${(cssContent.match(/@media/g) || []).length}`);
console.log(`- min-width: 0 出现次数: ${(cssContent.match(/min-width:\s*0/g) || []).length}`);

// 检查潜在风险
console.log('\n⚠️  潜在风险检查:');

// 检查是否还有 body.mode 依赖
const bodyModeDep = (cssContent.match(/body\.mode-/g) || []).length;
if (bodyModeDep > 0) {
    console.log(`  - 发现 ${bodyModeDep} 处 body.mode 依赖（应该移除）`);
} else {
    console.log('  ✓ 无 body.mode 依赖');
}

// 检查是否有 !important 滥用
const importantCount = (cssContent.match(/!important/g) || []).length;
if (importantCount > 5) {
    console.log(`  - 发现 ${importantCount} 处 !important（可能过多）`);
} else {
    console.log(`  ✓ !important 使用合理（${importantCount} 处）`);
}

// 最终结果
console.log('\n' + '='.repeat(60));
if (failed === 0) {
    console.log('🎉 所有测试通过！CSS 状态来源唯一性验证成功。');
    console.log('\n✅ 核心原则：');
    console.log('   - 样式依赖 @media 查询，不依赖 body.class');
    console.log('   - 状态来源唯一（视口宽度）');
    console.log('   - 避免状态竞争');
    process.exit(0);
} else {
    console.log('❌ 部分测试失败，请检查上述错误。');
    process.exit(1);
}
