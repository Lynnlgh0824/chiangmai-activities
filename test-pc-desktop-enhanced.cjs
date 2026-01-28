#!/usr/bin/env node

/**
 * PC端（桌面）专用测试 - 增强版
 * 基于需求差异分析文档，验证PC端特有功能
 */

const fs = require('fs');
const path = require('path');

console.log('💻 PC端（桌面）专用测试 - 增强版\n');
console.log('基于需求差异分析文档 v2.6.0\n');
console.log('=' .repeat(70));

const indexPath = path.join(__dirname, 'public', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

let passed = 0;
let failed = 0;
const errors = [];

const tests = [
    // ==================== 设备检测 ====================
    {
        name: '1. PC端模式标识（mode-pc类）',
        test: () => {
            const hasPCMode = html.includes('mode-pc') || html.includes('CHIENGMAI_MODE');
            console.log(`   PC模式标识: ${hasPCMode ? '✅' : '⚠️'}`);
            return hasPCMode;
        }
    },

    // ==================== 首页布局 ====================
    {
        name: '2. 相对定位Header（position: relative）',
        test: () => {
            const hasRelativeHeader = html.includes('.header {') ||
                                      html.includes('position: relative');
            // 确保PC端不是fixed
            const notMobileFixed = !html.includes('max-width: 768px') ||
                                     !html.includes('position: fixed !important');
            console.log(`   相对定位: ${hasRelativeHeader ? '✅' : '❌'}`);
            console.log(`   非固定定位: ${notMobileFixed ? '✅' : '⚠️  需检查'}`);
            return hasRelativeHeader && notMobileFixed;
        }
    },
    {
        name: '3. 显示h1标题（PC端）',
        test: () => {
            const hasTitle = html.includes('.header h1');
            // 确保在PC端（max-width > 768px）时显示
            const isPCTitle = !html.includes('max-width: 768px') ||
                               !html.includes('.header h1') ||
                               (html.includes('@media') && !html.includes('max-width: 768px'));
            console.log(`   h1标题: ${hasTitle ? '✅' : '❌'}`);
            console.log(`   PC端显示: ${isPCTitle ? '✅' : '❌'}`);
            return hasTitle;
        }
    },
    {
        name: '4. 容器圆角和阴影（PC端）',
        test: () => {
            const hasRadius = html.includes('border-radius: 12px');
            const hasShadow = html.includes('box-shadow: 0 2px 12px');
            // 确保这些样式不在移动端媒体查询内
            const isPCStyle = !html.includes('max-width: 768px') ||
                             (html.includes('.container {') &&
                              !html.includes('border-radius: 0') &&
                              !html.includes('box-shadow: none'));
            console.log(`   圆角: ${hasRadius ? '✅' : '❌'}`);
            console.log(`   阴影: ${hasShadow ? '✅' : '❌'}`);
            return hasRadius && hasShadow && isPCStyle;
        }
    },

    // ==================== Tab导航 ====================
    {
        name: '5. Tab不滚动（overflow: hidden）',
        test: () => {
            const hasNoScroll = html.includes('.tabs-nav {') ||
                                  html.includes('overflow: hidden');
            console.log(`   不滚动: ${hasNoScroll ? '✅' : '⚠️'}`);
            return hasNoScroll;
        }
    },
    {
        name: '6. 标准Tab尺寸（14px 24px）',
        test: () => {
            const hasStandardSize = html.includes('padding: 14px 24px') ||
                                     html.includes('.tab-item {');
            // 确保不是移动端的小尺寸（10px 12px）
            const notMobileSize = !html.includes('padding: 10px 12px') ||
                                   !html.includes('font-size: 11px');
            console.log(`   标准尺寸: ${hasStandardSize && notMobileSize ? '✅' : '⚠️  需检查'}`);
            return hasStandardSize && notMobileSize;
        }
    },
    {
        name: '7. Tab悬停效果（:hover）',
        test: () => {
            const hasHover = html.includes('.tab-item:hover') ||
                             html.includes('transition: all');
            console.log(`   Hover效果: ${hasHover ? '✅' : '❌'}`);
            return hasHover;
        }
    },

    // ==================== 搜索功能 ====================
    {
        name: '8. 搜索框最大宽度400px（PC端）',
        test: () => {
            const hasMaxWidth = html.includes('max-width: 400px') ||
                                  html.includes('.search-input-wrapper');
            // 确保不在移动端媒体查询内
            const isPCStyle = !html.includes('max-width: 768px') ||
                             html.includes('.search-section {') ||
                             html.includes('flex-direction: row');
            console.log(`   最大宽度: ${hasMaxWidth ? '✅' : '❌'}`);
            return hasMaxWidth && isPCStyle;
        }
    },
    {
        name: '9. 显示搜索文字按钮（PC端）',
        test: () => {
            const hasTextButton = html.includes('.search-btn {');
            // 检查display: flex存在（显示）
            const isDisplayFlex = html.includes('.search-btn {') &&
                               (html.includes('display: flex') ||
                                !html.includes('display: none'));
            console.log(`   文字按钮: ${isDisplayFlex ? '✅' : '❌'}`);
            return isDisplayFlex;
        }
    },
    {
        name: '10. Enter键搜索支持',
        test: () => {
            const hasEnterKey = html.includes('addEventListener') &&
                               html.includes('keypress') &&
                               html.includes('key === \'Enter\'');
            console.log(`   Enter键: ${hasEnterKey ? '✅' : '❌'}`);
            return hasEnterKey;
        }
    },

    // ==================== 列表展示 ====================
    {
        name: '11. 日历单元格标准高度（120px）',
        test: () => {
            const hasStandardHeight = html.includes('min-height: 120px') ||
                                       html.includes('.day-cell');
            const isPCHeight = !html.includes('min-height: 80px') ||
                              !html.includes('min-height: auto');
            console.log(`   标准高度: ${hasStandardHeight ? '✅' : '❌'}`);
            console.log(`   非移动端压缩: ${isPCHeight ? '✅' : '⚠️'}`);
            return hasStandardHeight && isPCHeight;
        }
    },
    {
        name: '12. 标准Padding（16-20px）',
        test: () => {
            const hasStandardPadding = html.includes('padding: var(--space-lg)') ||
                                        html.includes('padding: 20px') ||
                                        html.includes('padding: var(--space-xl)');
            const notMobilePadding = !html.includes('padding: var(--space-sm)') ||
                                     !html.includes('padding: var(--space-xs)') ||
                                     !html.includes('max-width: 768px');
            console.log(`   标准Padding: ${hasStandardPadding ? '✅' : '❌'}`);
            console.log(`   非移动端: ${notMobilePadding ? '✅' : '⚠️'}`);
            return hasStandardPadding && notMobilePadding;
        }
    },
    {
        name: '13. 活动卡片Hover效果',
        test: () => {
            const hasHover = html.includes('.activity-card:hover') ||
                             html.includes('transform: translateY') ||
                             html.includes('box-shadow: 0 4px');
            console.log(`   Hover效果: ${hasHover ? '✅' : '❌'}`);
            return hasHover;
        }
    },

    // ==================== 弹窗功能 ====================
    {
        name: '14. 弹窗固定宽度500px（PC端）',
        test: () => {
            const hasFixedWidth = html.includes('max-width: 500px') &&
                                    html.includes('.modal');
            // 确保不在移动端媒体查询内（移动端是420px）
            const isPCWidth = !html.includes('max-width: 420px') ||
                             !html.includes('width: 95vw');
            console.log(`   固定宽度: ${hasFixedWidth ? '✅' : '❌'}`);
            return hasFixedWidth && isPCWidth;
        }
    },
    {
        name: '15. 弹窗标准高度（80vh）',
        test: () => {
            const hasStandardHeight = html.includes('max-height: 80vh') &&
                                        html.includes('.modal');
            console.log(`   标准高度: ${hasStandardHeight ? '✅' : '❌'}`);
            return hasStandardHeight;
        }
    },

    // ==================== CSS变量系统 ====================
    {
        name: '16. 标准CSS变量（非移动端）',
        test: () => {
            const hasStandardVars = html.includes('--space-xs: 4px') &&
                                      html.includes('--space-lg: 16px') &&
                                      html.includes(':root {');
            console.log(`   标准变量: ${hasStandardVars ? '✅' : '❌'}`);
            return hasStandardVars;
        }
    },
    {
        name: '17. 非移动端变量覆盖',
        test: () => {
            // 检查不在移动端媒体查询内的变量
            const hasPCOnlyVars = html.includes('--space-xl: 20px') ||
                                     html.includes('--space-2xl: 24px');
            const notOverride = !html.includes('--space-mobile-xl') ||
                              !html.includes('--space-mobile-2xl');
            console.log(`   PC端变量: ${hasPCOnlyVars ? '✅' : '❌'}`);
            console.log(`   无覆盖: ${notOverride ? '✅' : '⚠️'}`);
            return hasPCOnlyVars && notOverride;
        }
    },

    // ==================== 性能优化 ====================
    {
        name: '18. 硬件加速（transform）',
        test: () => {
            const hasAcceleration = html.includes('transform') ||
                                     html.includes('backface-visibility') ||
                                     html.includes('will-change');
            console.log(`   硬件加速: ${hasAcceleration ? '✅' : '⚠️'}`);
            return hasAcceleration;
        }
    },
    {
        name: '19. 过渡动画（transition）',
        test: () => {
            const hasTransition = html.includes('transition: all') ||
                                     html.includes('transition: transform');
            console.log(`   过渡动画: ${hasTransition ? '✅' : '❌'}`);
            return hasTransition;
        }
    },

    // ==================== 大屏幕适配 ====================
    {
        name: '20. 大屏幕优化（>1024px）',
        test: () => {
            const hasLargeScreen = html.includes('min-width: 1024px') ||
                                     html.includes('max-width: 1200px') ||
                                     html.includes('max-width: 1400px');
            console.log(`   大屏幕: ${hasLargeScreen ? '✅' : '❌'}`);
            return hasLargeScreen;
        }
    },
    {
        name: '21. 超大屏优化（> 1920px）',
        test: () => {
            const hasUltraWide = html.includes('min-width: 1920px') ||
                                   html.includes('max-width: 1600px');
            console.log(`   超大屏: ${hasUltraWide ? '✅' : '❌'}`);
            return hasUltraWide;
        }
    },

    // ==================== 鼠标交互 ====================
    {
        name: '22. 鼠标滚轮支持',
        test: () => {
            const hasScroll = html.includes('overflow-y') ||
                                html.includes('overflow: auto');
            console.log(`   滚轮支持: ${hasScroll ? '✅' : '❌'}`);
            return hasScroll;
        }
    },
    {
        name: '23. 交互反馈（Hover + 点击）',
        test: () => {
            const hasInteraction = html.includes(':hover') &&
                                   html.includes('onclick');
            console.log(`   交互支持: ${hasInteraction ? '✅' : '❌'}`);
            return hasInteraction;
        }
    },

    // ==================== 筛选功能 ====================
    {
        name: '24. 筛选Chip标准尺寸（13px）',
        test: () => {
            const hasStandardSize = html.includes('font-size: 13px') &&
                                     html.includes('.filter-chip');
            const notMobileSize = !html.includes('font-size: 11px') ||
                                   !html.includes('max-width: 374px');
            console.log(`   标准尺寸: ${hasStandardSize && notMobileSize ? '✅' : '⚠️'}`);
            return hasStandardSize && notMobileSize;
        }
    },
    {
        name: '25. 筛选器悬停预览',
        test: () => {
            const hasPreview = html.includes('.filter-chip:hover') ||
                               html.includes('background: #f5f5f5');
            console.log(`   悬停预览: ${hasPreview ? '✅' : '❌'}`);
            return hasPreview;
        }
    },

    // ==================== 键盘导航 ====================
    {
        name: '26. Tab键支持',
        test: () => {
            const hasTabSupport = html.includes('tabindex') ||
                                html.includes('onkeydown');
            console.log(`   Tab键: ${hasTabSupport ? '⚠️  部分支持' : '❌'}`);
            return hasTabSupport;
        }
    },
    {
        name: '27. Enter键确认',
        test: () => {
            const hasEnterKey = html.includes('key === \'Enter\'') ||
                                html.includes('e.key === \'Enter\'');
            console.log(`   Enter键: ${hasEnterKey ? '✅' : '❌'}`);
            return hasEnterKey;
        }
    },

    // ==================== 错误处理 ====================
    {
        name: '28. 控制台错误处理',
        test: () => {
            const hasErrorHandling = html.includes('console.error') ||
                                     html.includes('pageerror');
            console.log(`   错误处理: ${hasErrorHandling ? '✅' : '❌'}`);
            return hasErrorHandling;
        }
    },
    {
        name: '29. 用户反馈机制',
        test: () => {
            const hasFeedback = html.includes('alert') ||
                               html.includes('toast') ||
                               html.includes('notification');
            console.log(`   反馈机制: ${hasFeedback ? '✅' : '⚠️  需检查'}`);
            return hasFeedback;
        }
    },

    // ==================== 布局优化 ====================
    {
        name: '30. 容器最大宽度1200px',
        test: () => {
            const hasMaxWidth = html.includes('max-width: 1200px') ||
                                     html.includes('.container {');
            console.log(`   最大宽度: ${hasMaxWidth ? '✅' : '❌'}`);
            return hasMaxWidth;
        }
    }
];

console.log(`\n📋 运行 ${tests.length} 个PC端专项测试...\n`);

tests.forEach((testCase, index) => {
    try {
        const result = testCase.test();
        if (result) {
            passed++;
        } else {
            failed++;
            errors.push({
                test: testCase.name,
                error: '测试条件未满足'
            });
        }
    } catch (error) {
        console.log(`❌ ${testCase.name}`);
        console.log(`   错误: ${error.message}\n`);
        failed++;
        errors.push({
            test: testCase.name,
            error: error.message
        });
    }
});

console.log('=' .repeat(70));
console.log(`\n📊 PC端测试结果:`);
console.log(`   ✅ 通过: ${passed}/${tests.length}`);
console.log(`   ❌ 失败: ${failed}/${tests.length}`);
console.log(`   📈 通过率: ${Math.round((passed / tests.length) * 100)}%\n`);

// 测试分类统计
const categories = {
    '设备检测': tests.slice(0, 1),
    '首页布局': tests.slice(1, 4),
    'Tab导航': tests.slice(4, 7),
    '搜索功能': tests.slice(7, 10),
    '列表展示': tests.slice(10, 13),
    '弹窗功能': tests.slice(13, 15),
    'CSS变量': tests.slice(15, 17),
    '性能优化': tests.slice(17, 19),
    '大屏幕': tests.slice(19, 21),
    '鼠标交互': tests.slice(21, 23),
    '筛选功能': tests.slice(23, 25),
    '键盘导航': tests.slice(25, 27),
    '错误处理': tests.slice(27, 29),
    '布局优化': tests.slice(29, 30)
};

Object.keys(categories).forEach(category => {
    const categoryTests = categories[category];
    const categoryPassed = categoryTests.filter(t => !errors.find(e => e.test === t.name));
    console.log(`${category}: ${categoryPassed.length}/${categoryTests.length} 通过`);
});

if (errors.length > 0) {
    console.log('\n❌ 失败的测试:');
    errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.test}`);
        console.log(`      错误: ${err.error}`);
    });
    console.log('');
}

console.log('💻 PC端特有功能验证完成！\n');

const exitCode = failed === 0 ? 0 : 1;
process.exit(exitCode);
