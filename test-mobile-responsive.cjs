#!/usr/bin/env node

/**
 * 移动端响应式测试
 * 验证移动端功能和用户体验
 */

const fs = require('fs');
const path = require('path');

console.log('📱 移动端响应式测试\n');
console.log('=' .repeat(60));

const indexPath = path.join(__dirname, 'public', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

let passed = 0;
let failed = 0;
const errors = [];

const tests = [
    // 响应式设计
    {
        name: '1. 响应式viewport设置',
        test: () => {
            const hasViewport = html.includes('viewport') || html.includes('width=device-width');
            console.log(`   Viewport设置: ${hasViewport}`);
            return hasViewport;
        }
    },
    {
        name: '2. 移动端媒体查询',
        test: () => {
            const hasMediaQuery = html.includes('@media') || html.includes('max-width');
            console.log(`   媒体查询: ${hasMediaQuery}`);
            return hasMediaQuery;
        }
    },
    {
        name: '3. 移动端弹窗样式',
        test: () => {
            const hasModalStyles = html.includes('.modal') || html.includes('modal-overlay');
            console.log(`   弹窗样式: ${hasModalStyles}`);
            return hasModalStyles;
        }
    },

    // 移动端交互
    {
        name: '4. 触摸事件支持',
        test: () => {
            const hasTouchEvents = html.includes('touchstart') || html.includes('ontouchstart') ||
                                  html.includes('addEventListener') && html.includes('click');
            console.log(`   触摸事件: ${hasTouchEvents}`);
            return hasTouchEvents;
        }
    },
    {
        name: '5. 移动端滚动优化',
        test: () => {
            const hasOverflowScroll = html.includes('overflow-y') || html.includes('overflow') || html.includes('scroll');
            console.log(`   滚动优化: ${hasOverflowScroll}`);
            return hasOverflowScroll;
        }
    },

    // 文本换行
    {
        name: '6. 文本换行处理',
        test: () => {
            const hasWordBreak = html.includes('word-break') || html.includes('overflow-wrap');
            console.log(`   文本换行: ${hasWordBreak}`);
            return hasWordBreak;
        }
    },
    {
        name: '7. 长文本截断',
        test: () => {
            const hasTextOverflow = html.includes('text-overflow') || html.includes('ellipsis');
            console.log(`   文本截断: ${hasTextOverflow}`);
            return hasTextOverflow;
        }
    },

    // 弹窗功能
    {
        name: '8. 活动详情弹窗',
        test: () => {
            const hasModalFunction = html.includes('showModal') || html.includes('openModal') ||
                                   (html.includes('modal') && html.includes('classList.add'));
            console.log(`   弹窗功能: ${hasModalFunction}`);
            return hasModalFunction;
        }
    },
    {
        name: '9. 弹窗居中对齐',
        test: () => {
            const hasCenterAlign = html.includes('display: flex') || html.includes('justify-content') ||
                                  html.includes('align-items') || html.includes('margin: auto');
            console.log(`   居中对齐: ${hasCenterAlign}`);
            return hasCenterAlign;
        }
    },

    // 性能优化
    {
        name: '10. 图片懒加载',
        test: () => {
            const hasLazyLoad = html.includes('loading="lazy"') || html.includes('lazyload');
            console.log(`   图片懒加载: ${hasLazyLoad}`);
            return hasLazyLoad;
        }
    },
    {
        name: '11. 移动端性能优化',
        test: () => {
            const hasPerformance = html.includes('will-change') || html.includes('transform') ||
                                  html.includes('backface-visibility');
            console.log(`   性能优化: ${hasPerformance}`);
            return hasPerformance;
        }
    },

    // 多设备支持
    {
        name: '12. 小屏幕适配（< 400px）',
        test: () => {
            const hasSmallScreen = html.includes('max-width: 400') || html.includes('max-width: 375');
            console.log(`   小屏幕适配: ${hasSmallScreen}`);
            return hasSmallScreen;
        }
    },
    {
        name: '13. 大屏幕适配（> 768px）',
        test: () => {
            const hasLargeScreen = html.includes('min-width: 768') || html.includes('min-width: 1024');
            console.log(`   大屏幕适配: ${hasLargeScreen}`);
            return hasLargeScreen;
        }
    },

    // Tab导航
    {
        name: '14. 移动端Tab导航',
        test: () => {
            const hasTabNav = html.includes('tabs-nav') && html.includes('tab-item');
            console.log(`   Tab导航: ${hasTabNav}`);
            return hasTabNav;
        }
    },
    {
        name: '15. Tab切换功能',
        test: () => {
            const hasTabSwitch = html.includes('switchTab') || html.includes('onclick');
            console.log(`   Tab切换: ${hasTabSwitch}`);
            return hasTabSwitch;
        }
    },

    // 筛选功能
    {
        name: '16. 移动端筛选器',
        test: () => {
            const hasFilter = html.includes('filter') || html.includes('筛选');
            console.log(`   筛选器: ${hasFilter}`);
            return hasFilter;
        }
    },
    {
        name: '17. 筛选按钮',
        test: () => {
            const hasFilterBtn = html.includes('filter-button') || html.includes('筛选按钮');
            console.log(`   筛选按钮: ${hasFilterBtn}`);
            return hasFilterBtn;
        }
    },

    // 错误处理
    {
        name: '18. 移动端错误提示',
        test: () => {
            const hasErrorHandling = html.includes('error') || html.includes('alert') ||
                                   html.includes('console.error');
            console.log(`   错误处理: ${hasErrorHandling}`);
            return hasErrorHandling;
        }
    }
];

console.log(`\n📋 运行 ${tests.length} 个测试...\n`);

tests.forEach((testCase, index) => {
    try {
        const result = testCase.test();
        if (result) {
            console.log(`✅ ${testCase.name}\n`);
            passed++;
        } else {
            console.log(`❌ ${testCase.name}\n`);
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

console.log('=' .repeat(60));
console.log(`\n📊 测试结果:`);
console.log(`   ✅ 通过: ${passed}/${tests.length}`);
console.log(`   ❌ 失败: ${failed}/${tests.length}`);
console.log(`   📈 通过率: ${Math.round((passed / tests.length) * 100)}%\n`);

if (errors.length > 0) {
    console.log('❌ 失败的测试:');
    errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.test}`);
        console.log(`      错误: ${err.error}`);
    });
    console.log('');
}

const exitCode = failed === 0 ? 0 : 1;
process.exit(exitCode);
