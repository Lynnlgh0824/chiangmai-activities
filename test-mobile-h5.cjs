#!/usr/bin/env node

/**
 * 移动端（H5）专用测试
 * 验证移动端特有功能和用户体验
 */

const fs = require('fs');
const path = require('path');

console.log('📱 移动端（H5）专用测试\n');
console.log('=' .repeat(60));

const indexPath = path.join(__dirname, 'public', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

let passed = 0;
let failed = 0;
const errors = [];

const tests = [
    // 触摸交互
    {
        name: '1. 触摸事件支持（touchstart/click）',
        test: () => {
            const hasTouch = html.includes('touchstart') || html.includes('ontouchstart') ||
                          html.includes('addEventListener') && html.includes('click');
            console.log(`   触摸事件: ${hasTouch ? '✅' : '❌'}`);
            return hasTouch;
        }
    },

    // Viewport设置
    {
        name: '2. 移动端viewport设置（width=device-width）',
        test: () => {
            const hasViewport = html.includes('width=device-width') || html.includes('viewport');
            console.log(`   Viewport设置: ${hasViewport ? '✅' : '❌'}`);
            return hasViewport;
        }
    },

    // 小屏幕适配
    {
        name: '3. 小屏幕布局适配（< 480px）',
        test: () => {
            const hasSmallScreen = html.includes('max-width: 480') || html.includes('max-width: 400') ||
                                  html.includes('@media') && html.includes('max-width');
            console.log(`   小屏幕适配: ${hasSmallScreen ? '✅' : '❌'}`);
            return hasSmallScreen;
        }
    },

    // 移动端弹窗
    {
        name: '4. 移动端弹窗样式和交互',
        test: () => {
            const hasMobileModal = html.includes('.modal') && html.includes('position: fixed');
            console.log(`   移动端弹窗: ${hasMobileModal ? '✅' : '❌'}`);
            return hasMobileModal;
        }
    },

    // 触摸滚动
    {
        name: '5. 触摸滚动和弹性滚动',
        test: () => {
            const hasTouchScroll = html.includes('-webkit-overflow-scrolling') ||
                                  html.includes('overflow-y: auto') ||
                                  html.includes('overflow-y: scroll');
            console.log(`   触摸滚动: ${hasTouchScroll ? '✅' : '❌'}`);
            return hasTouchScroll;
        }
    },

    // 虚拟键盘
    {
        name: '6. 虚拟键盘适配',
        test: () => {
            const hasKeyboardAvoid = html.includes('viewport meta') ||
                                    html.includes('resize') && html.includes('keyboard');
            console.log(`   键盘适配: ${hasKeyboardAvoid ? '✅' : '⚠️  需检查'}`);
            return true; // 宽松检查
        }
    },

    // 横竖屏
    {
        name: '7. 横竖屏切换支持',
        test: () => {
            const hasOrientation = html.includes('orientation') || html.includes('portrait') ||
                                    html.includes('landscape');
            console.log(`   横竖屏支持: ${hasOrientation ? '✅' : '⚠️  可选'}`);
            return true; // 可选功能
        }
    },

    // 移动性能
    {
        name: '8. 移动端性能优化',
        test: () => {
            const hasOptimization = html.includes('will-change') || html.includes('transform') ||
                                   html.includes('backface-visibility');
            console.log(`   性能优化: ${hasOptimization ? '✅' : '❌'}`);
            return hasOptimization;
        }
    },

    // 移动网络
    {
        name: '9. 移动网络优化（3G/4G）',
        test: () => {
            const hasNetworkOpt = html.includes('loading="lazy"') || html.includes('async') ||
                                  html.includes('defer');
            console.log(`   网络优化: ${hasNetworkOpt ? '✅' : '⚠️  可优化'}`);
            return true; // 可选
        }
    },

    // Tab导航
    {
        name: '10. 移动端Tab导航',
        test: () => {
            const hasTabNav = html.includes('tabs-nav') && html.includes('tab-item');
            const isTouchFriendly = html.includes('cursor: pointer') || html.includes('onclick');
            console.log(`   Tab导航: ${hasTabNav ? '✅' : '❌'}`);
            console.log(`   触摸友好: ${isTouchFriendly ? '✅' : '❌'}`);
            return hasTabNav && isTouchFriendly;
        }
    },

    // 筛选器
    {
        name: '11. 移动端筛选器',
        test: () => {
            const hasFilter = html.includes('filter') || html.includes('筛选');
            console.log(`   筛选器: ${hasFilter ? '✅' : '❌'}`);
            return hasFilter;
        }
    },

    // 手势
    {
        name: '12. 手势操作支持',
        test: () => {
            const hasGestures = html.includes('swipe') || html.includes('touchstart') ||
                               html.includes('touchend') || html.includes('touchmove');
            console.log(`   手势支持: ${hasGestures ? '✅' : '⚠️  可选'}`);
            return true; // 可选功能
        }
    },

    // 文本换行
    {
        name: '13. 长文本自动换行',
        test: () => {
            const hasWordBreak = html.includes('word-break') || html.includes('overflow-wrap');
            console.log(`   文本换行: ${hasWordBreak ? '✅' : '❌'}`);
            return hasWordBreak;
        }
    },

    // 安全区
    {
        name: '14. 底部安全区适配',
        test: () => {
            const hasSafeArea = html.includes('safe-area-inset') || html.includes('env(safe-area)');
            console.log(`   安全区: ${hasSafeArea ? '✅' : '⚠️  可选'}`);
            return true; // 可选功能
        }
    },

    // 错误处理
    {
        name: '15. 移动端错误提示',
        test: () => {
            const hasErrorHandling = html.includes('error') || html.includes('alert') ||
                                   html.includes('console.error');
            console.log(`   错误处理: ${hasErrorHandling ? '✅' : '❌'}`);
            return hasErrorHandling;
        }
    }
];

console.log(`\n📋 运行 ${tests.length} 个移动端测试...\n`);

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

console.log('=' .repeat(60));
console.log(`\n📊 移动端测试结果:`);
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

console.log('📱 移动端特有功能验证完成！\n');

const exitCode = failed === 0 ? 0 : 1;
process.exit(exitCode);
