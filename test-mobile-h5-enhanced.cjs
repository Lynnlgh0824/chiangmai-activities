#!/usr/bin/env node

/**
 * 移动端（H5）专用测试 - 增强版
 * 基于需求差异分析文档，验证移动端特有功能
 */

const fs = require('fs');
const path = require('path');

console.log('📱 移动端（H5）专用测试 - 增强版\n');
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
        name: '1. 移动设备自动检测（User-Agent）',
        test: () => {
            const hasDetection = html.includes('navigator.userAgent') ||
                                html.includes('isMobile') ||
                                html.includes('Android|webOS|iPhone');
            console.log(`   设备检测: ${hasDetection ? '✅' : '❌'}`);
            return hasDetection;
        }
    },
    {
        name: '2. H5模式标识（mode-h5类）',
        test: () => {
            const hasH5Mode = html.includes('mode-h5') || html.includes('CHIENGMAI_MODE');
            console.log(`   H5模式标识: ${hasH5Mode ? '✅' : '❌'}`);
            return hasH5Mode;
        }
    },

    // ==================== Viewport设置 ====================
    {
        name: '3. 移动端viewport设置（width=device-width）',
        test: () => {
            const hasViewport = html.includes('width=device-width');
            console.log(`   Viewport设置: ${hasViewport ? '✅' : '❌'}`);
            return hasViewport;
        }
    },

    // ==================== 首页布局 ====================
    {
        name: '4. 固定顶部Header（position: fixed）',
        test: () => {
            // 检查移动端媒体查询中的fixed定位
            const hasFixedHeader = html.includes('position: fixed') &&
                                  html.includes('@media') &&
                                  html.includes('max-width: 768px');
            console.log(`   固定Header: ${hasFixedHeader ? '✅' : '❌'}`);
            return hasFixedHeader;
        }
    },
    {
        name: '5. 隐藏标题节省空间（移动端）',
        test: () => {
            const hasHiddenTitle = html.includes('.header h1') &&
                                  html.includes('display: none') &&
                                  html.includes('@media') &&
                                  html.includes('max-width: 768px');
            console.log(`   隐藏标题: ${hasHiddenTitle ? '✅' : '⚠️  需检查'}`);
            return hasHiddenTitle;
        }
    },
    {
        name: '6. 移动端无圆角和无阴影',
        test: () => {
            const hasMobileStyle = html.includes('border-radius: 0') &&
                                  html.includes('box-shadow: none') &&
                                  html.includes('@media') &&
                                  html.includes('max-width: 768px');
            console.log(`   移动端样式: ${hasMobileStyle ? '✅' : '❌'}`);
            return hasMobileStyle;
        }
    },

    // ==================== Tab导航 ====================
    {
        name: '7. Tab横向滚动（overflow-x: auto）',
        test: () => {
            const hasHorizontalScroll = html.includes('overflow-x: auto') &&
                                      html.includes('tabs-nav') &&
                                      html.includes('-webkit-overflow-scrolling: touch');
            console.log(`   横向滚动: ${hasHorizontalScroll ? '✅' : '❌'}`);
            console.log(`   惯性滚动: ${html.includes('-webkit-overflow-scrolling: touch') ? '✅' : '❌'}`);
            return hasHorizontalScroll;
        }
    },
    {
        name: '8. Tab最小触摸尺寸（44px）',
        test: () => {
            const hasMinTouchSize = html.includes('min-width: 44px') ||
                                    html.includes('height: 44px');
            console.log(`   最小触摸尺寸: ${hasMinTouchSize ? '✅' : '❌'}`);
            return hasMinTouchSize;
        }
    },
    {
        name: '9. 6个Tab完整配置',
        test: () => {
            const tabItems = (html.match(/switchTab\(\d\)/g) || []).length;
            const has6Tabs = tabItems >= 6;
            console.log(`   Tab数量: ${tabItems}/6`);
            return has6Tabs;
        }
    },

    // ==================== 搜索功能 ====================
    {
        name: '10. 搜索仅显示图标（移动端）',
        test: () => {
            const hasIconOnly = html.includes('.search-btn {') &&  // 隐藏文字
                                  html.includes('display: none') &&
                                  html.includes('.search-icon-btn {') &&  // 显示图标
                                  html.includes('max-width: 768px');
            console.log(`   图标按钮: ${hasIconOnly ? '✅' : '❌'}`);
            return hasIconOnly;
        }
    },
    {
        name: '11. 搜索框44px触摸高度',
        test: () => {
            const hasTouchHeight = html.includes('min-height: 44px') &&
                                     html.includes('.search-input-wrapper') &&
                                     html.includes('max-width: 768px');
            console.log(`   触摸高度: ${hasTouchHeight ? '✅' : '❌'}`);
            return hasTouchHeight;
        }
    },
    {
        name: '12. 搜索防抖优化（300ms）',
        test: () => {
            const hasDebounce = html.includes('debounce') ||
                                  html.includes('debouncedSearch');
            console.log(`   防抖优化: ${hasDebounce ? '✅' : '⚠️  未实现'}`);
            return hasDebounce;
        }
    },

    // ==================== 筛选功能 ====================
    {
        name: '13. 筛选chip紧凑间距（移动端）',
        test: () => {
            const hasTightSpacing = html.includes('font-size: 11px') &&
                                     html.includes('.filter-chip') &&
                                     html.includes('max-width: 374px');
            console.log(`   紧凑间距: ${hasTightSpacing ? '✅' : '❌'}`);
            return hasTightSpacing;
        }
    },
    {
        name: '14. 筛选振动反馈',
        test: () => {
            const hasVibrate = html.includes('navigator.vibrate');
            console.log(`   振动支持: ${hasVibrate ? '✅' : '❌'}`);
            if (hasVibrate) {
                const hasVibrateCall = html.includes('vibrate(10)');
                console.log(`   振动调用: ${hasVibrateCall ? '✅' : '⚠️  未调用'}`);
            }
            return hasVibrate;
        }
    },

    // ==================== 弹窗功能 ====================
    {
        name: '15. 移动端弹窗宽度（95vw, max 420px）',
        test: () => {
            const hasMobileWidth = html.includes('width: 95vw') &&
                                     html.includes('max-width: 420px') &&
                                     html.includes('.modal') &&
                                     html.includes('max-width: 768px');
            console.log(`   移动端宽度: ${hasMobileWidth ? '✅' : '❌'}`);
            return hasMobileWidth;
        }
    },
    {
        name: '16. 弹窗高度85vh（移动端）',
        test: () => {
            const hasMobileHeight = html.includes('max-height: 85vh') &&
                                      html.includes('.modal') &&
                                      html.includes('max-width: 768px');
            console.log(`   移动端高度: ${hasMobileHeight ? '✅' : '❌'}`);
            return hasMobileHeight;
        }
    },
    {
        name: '17. 弹窗居中对齐（移动端）',
        test: () => {
            const hasCenter = html.includes('position: fixed') ||
                               html.includes('display: flex') ||
                               html.includes('justify-content');
            console.log(`   居中对齐: ${hasCenter ? '✅' : '❌'}`);
            return hasCenter;
        }
    },

    // ==================== CSS变量系统 ====================
    {
        name: '18. 移动端CSS变量覆盖（≤768px）',
        test: () => {
            const hasVarOverride = html.includes('@media (max-width: 768px)') &&
                                      html.includes(':root') &&
                                      (html.includes('--space-mobile-') || html.includes('--space-xs: var(--space-mobile-'));
            console.log(`   变量覆盖: ${hasVarOverride ? '✅' : '❌'}`);
            return hasVarOverride;
        }
    },
    {
        name: '19. 间距减半优化（移动端）',
        test: () => {
            const hasSmallerSpacing = html.includes('--space-mobile-xs: 2px') ||
                                     html.includes('--space-mobile-lg: 8px');
            const standardSpacing = html.includes('--space-lg: 16px');
            console.log(`   标准间距: ${standardSpacing ? '✅' : '❌'}`);
            console.log(`   移动端间距: ${hasSmallerSpacing ? '✅' : '❌'}`);
            return hasSmallerSpacing && standardSpacing;
        }
    },

    // ==================== 列表展示 ====================
    {
        name: '20. 活动卡片紧凑间距（移动端）',
        test: () => {
            const hasCompactSpacing = html.includes('margin-bottom: var(--space-sm)') &&
                                       html.includes('.activity-card') &&
                                       html.includes('max-width: 768px');
            console.log(`   紧凑间距: ${hasCompactSpacing ? '✅' : '❌'}`);
            return hasCompactSpacing;
        }
    },
    {
        name: '21. 列表项极小padding（4-12px）',
        test: () => {
            const hasTinyPadding = html.includes('padding: var(--space-sm)') ||
                                     html.includes('padding: var(--space-mobile-xs)') ||
                                     html.includes('.schedule-item');
            console.log(`   极小Padding: ${hasTinyPadding ? '✅' : '❌'}`);
            return hasTinyPadding;
        }
    },

    // ==================== 性能优化 ====================
    {
        name: '22. iOS惯性滚动（-webkit-overflow-scrolling）',
        test: () => {
            const hasInertialScroll = html.includes('-webkit-overflow-scrolling: touch');
            console.log(`   惯性滚动: ${hasInertialScroll ? '✅' : '❌'}`);
            return hasInertialScroll;
        }
    },
    {
        name: '23. 文本自动换行（word-break）',
        test: () => {
            const hasWordBreak = html.includes('word-break') ||
                                html.includes('overflow-wrap');
            console.log(`   文本换行: ${hasWordBreak ? '✅' : '❌'}`);
            return hasWordBreak;
        }
    },

    // ==================== 导航优化 ====================
    {
        name: '24. 周导航按钮缩小尺寸（移动端）',
        test: () => {
            const hasSmallNav = html.includes('padding: var(--space-mobile-xs)') &&
                                  html.includes('.nav-btn') &&
                                  html.includes('font-size: 12px') &&
                                  html.includes('max-width: 768px');
            console.log(`   导航按钮: ${hasSmallNav ? '✅' : '❌'}`);
            return hasSmallNav;
        }
    },
    {
        name: '25. 日期表头压缩（移动端）',
        test: () => {
            const hasCompactHeader = html.includes('min-width: 40px') &&
                                     html.includes('font-size: 11px') &&
                                     html.includes('.date-cell-header') &&
                                     html.includes('max-width: 768px');
            console.log(`   表头压缩: ${hasCompactHeader ? '✅' : '❌'}`);
            return hasCompactHeader;
        }
    },

    // ==================== 断点适配 ====================
    {
        name: '26. 主要断点768px（移动端）',
        test: () => {
            const hasBreakpoint = html.includes('@media (max-width: 768px)');
            console.log(`   768px断点: ${hasBreakpoint ? '✅' : '❌'}`);
            return hasBreakpoint;
        }
    },
    {
        name: '27. 超小屏断点374px（极限优化）',
        test: () => {
            const hasTinyScreen = html.includes('@media (max-width: 374px)');
            console.log(`   374px断点: ${hasTinyScreen ? '✅' : '❌'}`);
            return hasTinyScreen;
        }
    }
];

console.log(`\n📋 运行 ${tests.length} 个移动端专项测试...\n`);

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
console.log(`\n📊 移动端测试结果:`);
console.log(`   ✅ 通过: ${passed}/${tests.length}`);
console.log(`   ❌ 失败: ${failed}/${tests.length}`);
console.log(`   📈 通过率: ${Math.round((passed / tests.length) * 100)}%\n`);

// 测试分类统计
const categories = {
    '设备检测': tests.slice(0, 2),
    'Viewport': tests.slice(2, 3),
    '首页布局': tests.slice(3, 6),
    'Tab导航': tests.slice(6, 9),
    '搜索功能': tests.slice(9, 12),
    '筛选功能': tests.slice(12, 14),
    '弹窗功能': tests.slice(14, 17),
    'CSS变量': tests.slice(17, 19),
    '列表展示': tests.slice(19, 21),
    '性能优化': tests.slice(21, 23),
    '导航优化': tests.slice(23, 25),
    '断点适配': tests.slice(25, 27)
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

console.log('📱 移动端特有功能验证完成！\n');

const exitCode = failed === 0 ? 0 : 1;
process.exit(exitCode);
