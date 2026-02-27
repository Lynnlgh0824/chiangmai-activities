#!/usr/bin/env node

/**
 * 清迈活动平台 - 移动端预览脚本
 *
 * 功能：
 * 1. 自动打开浏览器
 * 2. 设置移动端视口 (iPhone 12)
 * 3. 导航到首页
 * 4. 保持浏览器打开供预览
 */

const { chromium } = require('playwright');

async function openMobilePreview() {
    console.log('🚀 启动移动端预览...');
    console.log('📱 设备: iPhone 12 (390 x 844)');
    console.log('🌐 地址: http://localhost:4000\n');

    // 启动浏览器（非headless模式，显示窗口）
    const browser = await chromium.launch({
        headless: false,
        slowMo: 100,  // 稍微减慢操作，便于观察
        args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });

    // 创建iPhone 12上下文
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
    });

    // 添加iPhone样式
    await context.addInitScript(() => {
        // 模拟iPhone安全区域
        const style = document.createElement('style');
        style.textContent = `
            body {
                padding-top: env(safe-area-inset-top);
                padding-bottom: env(safe-area-inset-bottom);
            }
        `;
        document.head.appendChild(style);
    });

    const page = await context.newPage();

    // 监听console消息
    page.on('console', msg => {
        const type = msg.type();
        if (type === 'error') {
            console.log('❌ Browser Console Error:', msg.text());
        } else if (type === 'warning') {
            console.log('⚠️  Browser Console Warning:', msg.text());
        }
    });

    // 导航到首页
    console.log('⏳ 正在加载页面...');
    await page.goto('http://localhost:4000', {
        waitUntil: 'networkidle',
        timeout: 30000
    });

    // 等待页面完全加载
    await page.waitForTimeout(3000);

    console.log('\n✅ 移动端预览已启动！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 预览清单：');
    console.log('  1. ✅ 固定搜索栏 (65px, purple gradient)');
    console.log('  2. ✅ Tab导航 (横向滚动, sticky固定)');
    console.log('  3. ✅ 日期选择器 (紫色背景, 今天高亮)');
    console.log('  4. ✅ 活动列表 (横向滚动, 卡片式)');
    console.log('  5. ✅ "更多"Tab (下拉菜单)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 提示：');
    console.log('  - 浏览器将保持打开状态');
    console.log('  - 可手动测试各项功能');
    console.log('  - 按 Ctrl+C 退出预览\n');

    // 截图保存
    const screenshotPath = 'screenshots/mobile-preview.png';
    await page.screenshot({
        path: screenshotPath,
        fullPage: false
    });
    console.log(`📸 首屏截图已保存: ${screenshotPath}\n`);

    // 保持浏览器打开
    console.log('🔄 浏览器保持运行中...\n');

    // 监听进程退出信号
    process.on('SIGINT', async () => {
        console.log('\n\n👋 正在关闭浏览器...');
        await browser.close();
        console.log('✅ 预览已结束');
        process.exit(0);
    });

    // 保持进程运行
    await new Promise(() => {});
}

// 运行预览
openMobilePreview().catch(error => {
    console.error('\n❌ 预览启动失败:', error.message);
    process.exit(1);
});
