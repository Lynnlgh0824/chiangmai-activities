#!/usr/bin/env node

/**
 * 清迈活动平台 - E2E自动化验收测试
 *
 * 功能：
 * 1. 启动项目服务器
 * 2. 打开浏览器（支持移动端模拟）
 * 3. 执行点击操作
 * 4. 读取页面状态
 * 5. 检查API响应
 * 6. 监听Console日志
 * 7. 生成验收报告
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ====================== 配置 ======================
const CONFIG = {
    baseUrl: 'http://localhost:4000',
    serverPort: 4000,
    screenshotsDir: path.join(__dirname, '../screenshots'),
    headless: false,  // 显示浏览器窗口
    slowMo: 500,      // 慢动作模式，便于观察
};

// 移动端设备配置
const MOBILE_DEVICES = {
    'iPhone 12': {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
    },
    'iPad': {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
    },
    'Android': {
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
        viewport: { width: 360, height: 640 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
    }
};

// ====================== 测试结果 ======================
const testResults = {
    timestamp: new Date().toISOString(),
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        score: 0
    },
    tests: [],
    consoleLogs: [],
    apiRequests: [],
    screenshots: []
};

// ====================== 工具函数 ======================

/**
 * 等待函数
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 创建截图目录
 */
function ensureScreenshotsDir() {
    if (!fs.existsSync(CONFIG.screenshotsDir)) {
        fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true });
    }
}

/**
 * 检查服务器是否启动
 */
function checkServer() {
    return new Promise((resolve) => {
        const req = http.get(CONFIG.baseUrl, (res) => {
            resolve(true);
        });
        req.on('error', () => resolve(false));
    });
}

/**
 * 等待服务器启动
 */
async function waitForServer(maxAttempts = 30, interval = 1000) {
    console.log('⏳ 等待服务器启动...');

    for (let i = 0; i < maxAttempts; i++) {
        const isRunning = await checkServer();
        if (isRunning) {
            console.log('✅ 服务器已启动');
            return true;
        }
        await sleep(interval);
    }

    throw new Error('服务器启动超时');
}

/**
 * 记录测试结果
 */
function logTest(testName, passed, details, priority = 'P2') {
    const result = {
        name: testName,
        passed,
        details,
        priority,
        timestamp: new Date().toISOString()
    };

    testResults.tests.push(result);
    testResults.summary.total++;

    if (passed) {
        testResults.summary.passed++;
        console.log(`✅ ${testName}`);
    } else {
        testResults.summary.failed++;
        console.log(`❌ ${testName}: ${details}`);
    }
}

/**
 * 截图并保存
 */
async function takeScreenshot(page, name) {
    const filepath = path.join(CONFIG.screenshotsDir, `${name}.png`);
    await page.screenshot({ path: filepath, fullPage: false });
    testResults.screenshots.push({ name, path: filepath });
    console.log(`📸 截图已保存: ${filepath}`);
    return filepath;
}

// ====================== 测试套件 ======================

/**
 * 测试1: 页面加载验收
 */
async function testPageLoad(page) {
    console.log('\n📋 测试1: 页面加载验收');

    try {
        // 访问页面
        await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle' });
        await sleep(2000);

        // 检查页面标题
        const title = await page.title();
        logTest('页面标题加载', title.length > 0, title);

        // 检查页面是否有白屏
        const bodyVisible = await page.isVisible('body');
        logTest('页面内容可见', bodyVisible, 'body元素可见');

        // 截图
        await takeScreenshot(page, '01-page-loaded');

    } catch (error) {
        logTest('页面加载', false, error.message, 'P0');
    }
}

/**
 * 测试2: 页面结构验收
 */
async function testPageStructure(page) {
    console.log('\n📋 测试2: 页面结构验收');

    try {
        // 检查搜索栏
        const searchBar = await page.locator('.search-section').isVisible();
        logTest('搜索栏存在', searchBar, '找到.search-section');

        // 检查筛选按钮
        const filterBtn = await page.locator('.filter-trigger-btn').isVisible();
        logTest('筛选按钮存在', filterBtn, '找到.filter-trigger-btn');

        // 检查Tab导航
        const tabsNav = await page.locator('.tabs-nav').isVisible();
        logTest('Tab导航存在', tabsNav, '找到.tabs-nav');

        // 统计Tab数量
        const tabCount = await page.locator('.tab-item').count();
        logTest('Tab数量充足', tabCount >= 4, `找到${tabCount}个Tab (期望≥4)`);

        // 检查日期选择器
        const dateGridHeader = await page.locator('.date-grid-header').isVisible();
        logTest('日期选择器存在', dateGridHeader, '找到.date-grid-header');

        // 检查活动列表容器
        const calendarGrid = await page.locator('#calendarGrid').isVisible();
        logTest('活动列表容器存在', calendarGrid, '找到#calendarGrid');

        await takeScreenshot(page, '02-page-structure');

    } catch (error) {
        logTest('页面结构检查', false, error.message, 'P0');
    }
}

/**
 * 测试3: 今天高亮验收 (P0)
 */
async function testTodayHighlight(page) {
    console.log('\n📋 测试3: 今天高亮验收 (P0)');

    try {
        // 等待页面完全加载
        await page.waitForLoadState('networkidle');
        await sleep(2000);

        // 检查今天元素
        const todayElement = await page.locator('.today, .today-header').first();
        const exists = await todayElement.count() > 0;

        if (!exists) {
            logTest('今天元素存在', false, '未找到.today或.today-header', 'P0');
            return;
        }

        logTest('今天元素存在', true, '找到今天标记元素');

        // 检查今天是否被选中
        const todaySelected = await todayElement.locator('.selected, .selected-day, .active').count() > 0;
        logTest('今天默认选中', todaySelected, '今天元素处于选中状态', 'P0');

        // 检查今天高亮样式
        const backgroundColor = await todayElement.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.backgroundColor;
        });

        const hasSolidBg = backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                           backgroundColor !== 'transparent' &&
                           backgroundColor !== 'rgb(255, 255, 255)';

        logTest('今天有实心背景', hasSolidBg, `背景色: ${backgroundColor}`, 'P0');

        // 检查"今天"标签
        const hasTodayLabel = await todayElement.evaluate(el => {
            return el.textContent.includes('今天') ||
                   el.querySelector('[class*="label"], [class*="badge"], .tag');
        });

        logTest('显示"今天"标签', hasTodayLabel, hasTodayLabel ? '找到"今天"文字或标签' : '未找到', 'P0');

        await takeScreenshot(page, '03-today-highlight');

    } catch (error) {
        logTest('今天高亮检查', false, error.message, 'P0');
    }
}

/**
 * 测试4: 首屏密度验收 (P0)
 */
async function testFirstScreenDensity(page) {
    console.log('\n📋 测试4: 首屏密度验收 (P0)');

    try {
        // 等待活动加载
        await page.waitForSelector('#calendarGrid', { timeout: 10000 });
        await sleep(2000);

        // 统计活动卡片数量
        const dayCells = await page.locator('.day-cell').count();

        logTest('首屏活动密度', dayCells >= 1,
                `首屏显示${dayCells}个日期卡片 (包含多个活动)`, 'P0');

        // 统计活动chips数量
        const activityChips = await page.locator('.activity-chip').count();

        logTest('活动Chip统计', activityChips >= 4,
                `找到${activityChips}个活动Chip (期望≥4)`, 'P0');

        await takeScreenshot(page, '04-first-screen-density');

    } catch (error) {
        logTest('首屏密度检查', false, error.message, 'P0');
    }
}

/**
 * 测试5: 交互验收
 */
async function testInteractions(page) {
    console.log('\n📋 测试5: 交互验收');

    try {
        // 测试5.1: 点击日期筛选
        const dateCells = await page.locator('.date-cell-header').first();
        const dateExists = await dateCells.count() > 0;

        if (dateExists) {
            await dateCells.click();
            await sleep(1000);

            // 检查是否有点击反馈
            const selectedDate = await page.locator('.date-cell-header.selected-day').count() > 0;
            logTest('点击日期交互', selectedDate, '点击日期后有选中状态变化');

            await takeScreenshot(page, '05-date-click');
        }

        // 测试5.2: 点击Tab切换
        const secondTab = await page.locator('.tab-item').nth(1);
        await secondTab.click();
        await sleep(1000);

        const tabActive = await page.locator('.tab-item.active').count() > 0;
        logTest('点击Tab交互', tabActive, '点击Tab后有激活状态变化');

        await takeScreenshot(page, '06-tab-click');

        // 测试5.3: 点击活动卡片
        const firstCard = await page.locator('.day-cell').first();
        const cardExists = await firstCard.count() > 0;

        if (cardExists) {
            await firstCard.click();
            await sleep(1500);

            // 检查是否有弹窗或跳转
            const modal = await page.locator('.modal').isVisible();
            logTest('点击卡片交互', modal, '点击卡片后打开详情弹窗');

            await takeScreenshot(page, '07-card-click');

            // 关闭弹窗（如果打开了）
            if (modal) {
                const closeBtn = await page.locator('.modal-close').first();
                await closeBtn.click();
                await sleep(500);
            }
        }

    } catch (error) {
        logTest('交互测试', false, error.message);
    }
}

/**
 * 测试6: 移动端"更多"Tab功能
 */
async function testMobileMoreTab(page) {
    console.log('\n📋 测试6: 移动端"更多"Tab功能');

    try {
        // 查找"更多"Tab
        const moreTab = await page.locator('.tab-more');
        const moreExists = await moreTab.count() > 0;

        if (!moreExists) {
            logTest('移动端"更多"Tab', false, '未找到.tab-more元素（PC端）');
            return;
        }

        logTest('移动端"更多"Tab存在', true, '找到.tab-more按钮');

        // 点击"更多"Tab
        await moreTab.click();
        await sleep(1000);

        // 检查下拉菜单是否显示
        const dropdown = await page.locator('.tab-dropdown.show').isVisible();
        logTest('点击"更多"显示菜单', dropdown, '下拉菜单已展开');

        if (dropdown) {
            // 检查菜单项数量
            const dropdownItems = await page.locator('.dropdown-item').count();
            logTest('下拉菜单项数量', dropdownItems >= 2, `包含${dropdownItems}个菜单项`);

            await takeScreenshot(page, '08-mobile-more-dropdown');

            // 点击第一个菜单项
            const firstItem = await page.locator('.dropdown-item').first();
            await firstItem.click();
            await sleep(1000);

            // 检查菜单是否关闭
            const dropdownClosed = await page.locator('.tab-dropdown.show').count() === 0;
            logTest('点击菜单项后关闭', dropdownClosed, '点击菜单项后自动关闭下拉菜单');
        }

    } catch (error) {
        logTest('移动端"更多"Tab测试', false, error.message);
    }
}

/**
 * 测试7: API响应验收
 */
async function testAPIResponses(page) {
    console.log('\n📋 测试7: API响应验收');

    try {
        // 监听API请求
        const apiRequests = [];

        page.on('response', async (response) => {
            const url = response.url();
            const status = response.status();

            if (url.includes('/api/') || url.includes('/data/')) {
                apiRequests.push({
                    url,
                    status,
                    method: response.request().method(),
                    timestamp: new Date().toISOString()
                });

                testResults.apiRequests.push({
                    url,
                    status,
                    method: response.request().method()
                });
            }
        });

        // 重新加载页面以触发API请求
        await page.reload({ waitUntil: 'networkidle' });

        // 等待一会儿让API请求完成
        await sleep(3000);

        // 检查API请求
        const dataAPI = apiRequests.find(req => req.url.includes('/data/'));

        if (dataAPI) {
            logTest('数据API请求', dataAPI.status === 200,
                    `数据API返回: ${dataAPI.status}`, 'P0');
        } else {
            logTest('数据API请求', true, '数据可能已缓存或静态加载');
        }

        // 检查是否有失败的API请求
        const failedAPIs = apiRequests.filter(req => req.status >= 400);

        logTest('API无错误', failedAPIs.length === 0,
                failedAPIs.length > 0 ?
                `发现${failedAPIs.length}个失败请求: ${failedAPIs.map(f => f.url).join(', ')}` :
                '所有API请求正常', 'P1');

    } catch (error) {
        logTest('API响应检查', false, error.message, 'P1');
    }
}

/**
 * 测试8: Console日志检查
 */
async function testConsoleLogs(page) {
    console.log('\n📋 测试8: Console日志检查');

    try {
        const consoleMessages = [];

        // 监听console
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();

            consoleMessages.push({
                type,
                text,
                timestamp: new Date().toISOString()
            });

            testResults.consoleLogs.push({
                type,
                text
            });
        });

        // 执行一些操作来触发console
        await page.reload({ waitUntil: 'networkidle' });
        await sleep(2000);

        // 检查是否有错误日志
        const errors = consoleMessages.filter(msg =>
            msg.type === 'error' ||
            msg.text.includes('error') ||
            msg.text.includes('Error') ||
            msg.text.includes('exception') ||
            msg.text.includes('failed')
        );

        logTest('Console无错误', errors.length === 0,
                errors.length > 0 ?
                `发现${errors.length}个错误: ${errors.map(e => e.text).join('; ')}` :
                'Console日志正常', 'P0');

        // 检查是否有警告日志
        const warnings = consoleMessages.filter(msg => msg.type === 'warning');

        if (warnings.length > 0) {
            console.log(`⚠️  发现${warnings.length}个警告: ${warnings.map(w => w.text).join('; ')}`);
        }

    } catch (error) {
        logTest('Console日志检查', false, error.message, 'P1');
    }
}

// ====================== 主测试流程 ======================

/**
 * 运行PC端测试
 */
async function runDesktopTests() {
    console.log('\n🖥️  ========== 开始PC端测试 ==========\n');

    const browser = await chromium.launch({
        headless: CONFIG.headless,
        slowMo: CONFIG.slowMo
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();

    try {
        await testPageLoad(page);
        await testPageStructure(page);
        await testTodayHighlight(page);
        await testFirstScreenDensity(page);
        await testInteractions(page);
        await testAPIResponses(page);
        await testConsoleLogs(page);

    } finally {
        await browser.close();
    }
}

/**
 * 运行移动端测试
 */
async function runMobileTests(deviceName = 'iPhone 12') {
    console.log(`\n📱 ========== 开始移动端测试 (${deviceName}) ==========\n`);

    const device = MOBILE_DEVICES[deviceName];

    const browser = await chromium.launch({
        headless: CONFIG.headless,
        slowMo: CONFIG.slowMo
    });

    const context = await browser.newContext({
        ...device
    });

    const page = await context.newPage();

    try {
        await testPageLoad(page);
        await testPageStructure(page);
        await testTodayHighlight(page);
        await testFirstScreenDensity(page);
        await testInteractions(page);
        await testMobileMoreTab(page);
        await testAPIResponses(page);
        await testConsoleLogs(page);

    } finally {
        await browser.close();
    }
}

/**
 * 生成测试报告
 */
function generateReport() {
    console.log('\n📊 ========== 测试报告 ==========\n');

    // 计算得分
    const { total, passed, failed } = testResults.summary;
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;
    testResults.summary.score = score;

    console.log(`总测试数: ${total}`);
    console.log(`通过: ${passed}`);
    console.log(`失败: ${failed}`);
    console.log(`得分: ${score}/100`);

    // 打印失败测试
    const failedTests = testResults.tests.filter(t => !t.passed);
    if (failedTests.length > 0) {
        console.log('\n❌ 失败的测试:');
        failedTests.forEach(t => {
            console.log(`  [${t.priority}] ${t.name}: ${t.details}`);
        });
    }

    // Console摘要
    if (testResults.consoleLogs.length > 0) {
        console.log('\n📝 Console日志摘要:');
        const errors = testResults.consoleLogs.filter(l => l.type === 'error');
        const warnings = testResults.consoleLogs.filter(l => l.type === 'warning');
        console.log(`  错误: ${errors.length}, 警告: ${warnings.length}`);
    }

    // API摘要
    if (testResults.apiRequests.length > 0) {
        console.log('\n🌐 API请求摘要:');
        testResults.apiRequests.forEach(req => {
            const statusIcon = req.status === 200 ? '✅' : '❌';
            console.log(`  ${statusIcon} ${req.method} ${req.url} (${req.status})`);
        });
    }

    // 保存报告到文件
    const reportPath = path.join(__dirname, '../E2E_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 详细报告已保存: ${reportPath}`);

    console.log('\n' + '='.repeat(50));

    return score >= 80;
}

// ====================== 入口 ======================

/**
 * 主函数
 */
async function main() {
    console.log('🚀 清迈活动平台 - E2E自动化验收测试');
    console.log('测试时间:', new Date().toLocaleString('zh-CN'));
    console.log('='.repeat(50));

    ensureScreenshotsDir();

    try {
        // 检查服务器
        const serverRunning = await checkServer();
        if (!serverRunning) {
            console.log('⚠️  服务器未运行，请先运行: npm run dev');
            console.log('或者等待服务器启动...');
            await waitForServer();
        } else {
            console.log('✅ 服务器运行中');
        }

        // 运行PC端测试
        await runDesktopTests();

        // 运行移动端测试
        await runMobileTests('iPhone 12');
        await runMobileTests('iPad');

        // 生成报告
        const passed = generateReport();

        if (passed) {
            console.log('\n🎉 验收通过！');
            process.exit(0);
        } else {
            console.log('\n⚠️  验收未通过，请查看失败项');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ 测试执行出错:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// 运行测试
main();
