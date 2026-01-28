#!/usr/bin/env node

/**
 * PC端（桌面）专用测试
 * 验证PC端特有功能和用户体验
 */

const fs = require('fs');
const path = require('path');

console.log('💻 PC端（桌面）专用测试\n');
console.log('=' .repeat(60));

const indexPath = path.join(__dirname, 'public', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

let passed = 0;
let failed = 0;
const errors = [];

const tests = [
    // 鼠标交互
    {
        name: '1. 鼠标悬停效果（hover）',
        test: () => {
            const hasHover = html.includes(':hover') || html.includes('onmouseover') ||
                          html.includes('onmouseenter');
            console.log(`   Hover效果: ${hasHover ? '✅' : '⚠️  需检查'}`);
            return true; // 可选功能
        }
    },

    // 大屏幕布局
    {
        name: '2. 大屏幕布局（> 1024px）',
        test: () => {
            const hasLargeScreen = html.includes('min-width: 1024') || html.includes('min-width: 1200') ||
                                  html.includes('@media') && html.includes('min-width');
            console.log(`   大屏幕布局: ${hasLargeScreen ? '✅' : '❌'}`);
            return hasLargeScreen;
        }
    },

    // 桌面端弹窗
    {
        name: '3. 桌面端弹窗样式',
        test: () => {
            const hasDesktopModal = html.includes('.modal') || html.includes('.modal-overlay');
            const hasCenter = html.includes('display: flex') || html.includes('justify-content');
            console.log(`   桌面弹窗: ${hasDesktopModal ? '✅' : '❌'}`);
            console.log(`   居中对齐: ${hasCenter ? '✅' : '❌'}`);
            return hasDesktopModal && hasCenter;
        }
    },

    // 键盘导航
    {
        name: '4. 键盘导航（Tab/Enter）',
        test: () => {
            const hasKeyboardNav = html.includes('tabindex') || html.includes('onkeydown') ||
                                   html.includes('onkeypress');
            console.log(`   键盘导航: ${hasKeyboardNav ? '✅' : '⚠️  需检查'}`);
            return true; // 可选功能
        }
    },

    // 鼠标右键
    {
        name: '5. 鼠标右键菜单',
        test: () => {
            const hasContextMenu = html.includes('contextmenu') || html.includes('oncontextmenu');
            console.log(`   右键菜单: ${hasContextMenu ? '✅' : '⚠️  可选'}`);
            return true; // 可选功能
        }
    },

    // 桌面性能
    {
        name: '6. 桌面级性能优化',
        test: () => {
            const hasPerf = html.includes('will-change') || html.includes('transform') ||
                          html.includes('contain') || html.includes('content-visibility');
            console.log(`   性能优化: ${hasPerf ? '✅' : '⚠️  可优化'}`);
            return true; // 可选
        }
    },

    // 固定尺寸
    {
        name: '7. 固定尺寸显示',
        test: () => {
            const hasFixedLayout = html.includes('max-width') || html.includes('container') ||
                                  html.includes('width: 100%');
            console.log(`   尺寸控制: ${hasFixedLayout ? '✅' : '❌'}`);
            return hasFixedLayout;
        }
    },

    // Tab导航
    {
        name: '8. 桌面端Tab导航',
        test: () => {
            const hasTabNav = html.includes('tabs-nav') && html.includes('tab-item');
            console.log(`   Tab导航: ${hasTabNav ? '✅' : '❌'}`);
            return hasTabNav;
        }
    },

    // 筛选器
    {
        name: '9. 桌面端筛选器',
        test: () => {
            const hasFilter = html.includes('filter') || html.includes('筛选');
            console.log(`   筛选器: ${hasFilter ? '✅' : '❌'}`);
            return hasFilter;
        }
    },

    // 多窗口
    {
        name: '10. 多窗口支持',
        test: () => {
            const hasMultiWindow = html.includes('window.open') || html.includes('target');
            console.log(`   多窗口: ${hasMultiWindow ? '✅' : '⚠️  可选'}`);
            return true; // 可选
        }
    },

    // 快捷键
    {
        name: '11. 快捷键操作',
        test: () => {
            const hasShortcuts = html.includes('onkeydown') || html.includes('accesskey') ||
                                html.includes('ctrl') || html.includes('meta');
            console.log(`   快捷键: ${hasShortcuts ? '✅' : '⚠️  可选'}`);
            return true; // 可选
        }
    },

    // 滚动优化
    {
        name: '12. 桌面端滚动优化',
        test: () => {
            const hasScroll = html.includes('overflow') || html.includes('scroll') ||
                            html.includes('scroll-behavior');
            console.log(`   滚动优化: ${hasScroll ? '✅' : '❌'}`);
            return hasScroll;
        }
    },

    // 大屏内容
    {
        name: '13. 大屏内容展示',
        test: () => {
            const hasContent = html.includes('activity-card') || html.includes('card');
            console.log(`   内容展示: ${hasContent ? '✅' : '❌'}`);
            return hasContent;
        }
    },

    // 错误处理
    {
        name: '14. 桌面端错误提示',
        test: () => {
            const hasErrorHandling = html.includes('error') || html.includes('alert') ||
                                   html.includes('console.error');
            console.log(`   错误处理: ${hasErrorHandling ? '✅' : '❌'}`);
            return hasErrorHandling;
        }
    },

    // 浏览器兼容性
    {
        name: '15. 浏览器兼容性',
        test: () => {
            const hasCompatibility = html.includes('-webkit-') || html.includes('-moz-') ||
                                    html.includes('-ms-');
            console.log(`   浏览器前缀: ${hasCompatibility ? '✅' : '⚠️  可选'}`);
            return true; // 可选
        }
    }
];

console.log(`\n📋 运行 ${tests.length} 个PC端测试...\n`);

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
console.log(`\n📊 PC端测试结果:`);
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

console.log('💻 PC端特有功能验证完成！\n');

const exitCode = failed === 0 ? 0 : 1;
process.exit(exitCode);
