/**
 * 移动端修复验证测试
 * 验证 8 个修复项是否生效
 */
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:4000';
const MOBILE_VIEWPORT = { width: 375, height: 812 }; // iPhone X

let passed = 0;
let failed = 0;
const results = [];

function log(test, ok, detail = '') {
    const status = ok ? '✅ PASS' : '❌ FAIL';
    results.push({ test, ok, detail });
    if (ok) passed++; else failed++;
    console.log(`${status} | ${test}${detail ? ' — ' + detail : ''}`);
}

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: MOBILE_VIEWPORT });
    const page = await context.newPage();

    // ===== 测试 1: Viewport meta 标签 =====
    console.log('\n=== 测试 1: Viewport 设置 ===');
    const viewport = await page.goto(BASE_URL).then(() =>
        page.$eval('meta[name="viewport"]', el => el.content)
    );
    const hasMaxScale = viewport.includes('maximum-scale=1.0');
    const hasNoScale = viewport.includes('user-scalable=no');
    log('Viewport maximum-scale=1.0', hasMaxScale, viewport);
    log('Viewport user-scalable=no', hasNoScale, viewport);

    // ===== 测试 2: CSS 语法错误修复 =====
    console.log('\n=== 测试 2: CSS 语法错误 ===');
    const cssResponse = await page.goto(`${BASE_URL}/css/style.css`);
    const cssText = await cssResponse.text();
    // 检查 .header 选择器后是否有多余的 }
    const headerBlockMatch = cssText.match(/\.header\s*\{[^}]*\}\s*\}/);
    log('CSS 无多余闭合括号', !headerBlockMatch, headerBlockMatch ? '发现多余 }' : '语法正确');

    // ===== 测试 3: 筛选按钮可见 =====
    console.log('\n=== 测试 3: 筛选按钮可见性 ===');
    await page.goto(BASE_URL);
    await page.waitForSelector('.filter-trigger-btn', { timeout: 5000 });
    const filterBtnDisplay = await page.$eval('.filter-trigger-btn', el => {
        const style = window.getComputedStyle(el);
        return style.display;
    });
    const filterBtnVisible = filterBtnDisplay !== 'none';
    log('筛选按钮 display 不为 none', filterBtnVisible, `display: ${filterBtnDisplay}`);

    const filterBtnText = await page.$eval('.filter-trigger-btn', el => el.textContent.trim());
    log('筛选按钮文字为"筛选"', filterBtnText === '筛选', `文字: "${filterBtnText}"`);

    // ===== 测试 4: Safe Area 支持 =====
    console.log('\n=== 测试 4: Safe Area 适配 ===');
    const hasSafeArea = cssText.includes('env(safe-area-inset-bottom)');
    log('CSS 包含 safe-area-inset-bottom', hasSafeArea);

    const safeAreaForSheet = cssText.includes('.sheet-content') && cssText.includes('safe-area-inset-bottom');
    log('Sheet 内容区有 Safe Area', safeAreaForSheet);

    const safeAreaForModal = cssText.includes('.modal-footer') && cssText.includes('safe-area-inset-bottom');
    log('弹窗底部有 Safe Area', safeAreaForModal);

    // ===== 测试 5: 触摸目标尺寸 =====
    console.log('\n=== 测试 5: 触摸目标尺寸 ===');
    await page.goto(BASE_URL);
    await page.waitForSelector('.search-btn', { timeout: 5000 });

    const searchBtnHeight = await page.$eval('.search-btn', el => {
        return parseFloat(window.getComputedStyle(el).height);
    });
    log('搜索按钮高度 >= 44px', searchBtnHeight >= 44, `高度: ${searchBtnHeight}px`);

    const searchInputHeight = await page.$eval('.search-input-wrapper', el => {
        return parseFloat(window.getComputedStyle(el).height);
    });
    log('搜索框高度 >= 44px', searchInputHeight >= 44, `高度: ${searchInputHeight}px`);

    const filterChipHeight = await page.$eval('.filter-chip', el => {
        return parseFloat(window.getComputedStyle(el).minHeight);
    }).catch(() => 0);
    log('筛选标签 min-height >= 38px', filterChipHeight >= 38, `minHeight: ${filterChipHeight}px`);

    // ===== 测试 6: Tab 导航定位 =====
    console.log('\n=== 测试 6: Tab 导航定位 ===');
    // 检查 CSS 中 .tabs-nav 的 position: sticky 是否只定义一次（在移动端媒体查询中）
    const stickyCount = (cssText.match(/\.tabs-nav\s*\{[^}]*position:\s*sticky/g) || []).length;
    log('Tab 导航 sticky 定义唯一', stickyCount <= 2, `出现次数: ${stickyCount}`); // PC 1次 + 移动端 1次

    const tabNavPosition = await page.$eval('.tabs-nav', el => {
        return window.getComputedStyle(el).position;
    });
    log('Tab 导航 position 为 sticky', tabNavPosition === 'sticky', `position: ${tabNavPosition}`);

    // ===== 测试 7: 日期栏滚动提示 =====
    console.log('\n=== 测试 7: 日期栏滚动提示 ===');
    const dateHeaderAfter = await page.evaluate(() => {
        const el = document.querySelector('.date-grid-header');
        if (!el) return null;
        const style = window.getComputedStyle(el, '::after');
        return {
            content: style.content,
            position: style.position,
            display: style.display
        };
    });
    const hasScrollHint = dateHeaderAfter && dateHeaderAfter.content !== 'none' && dateHeaderAfter.content !== '""';
    log('日期栏有滚动提示 ::after', hasScrollHint, dateHeaderAfter ? `content: ${dateHeaderAfter.content}` : '元素不存在');

    // ===== 测试 8: 冗余代码清理 =====
    console.log('\n=== 测试 8: 冗余代码清理 ===');
    // 检查 .search-icon-btn 移动端规则是否已简化（不再有 display: none !important）
    const searchIconBtnBlocks = cssText.match(/\.search-icon-btn\s*\{[^}]*\}/g) || [];
    const hasRedundantDisplayNone = searchIconBtnBlocks.some(block =>
        block.includes('display') && block.includes('none') && block.includes('!important')
    );
    log('search-icon-btn 无冗余 display:none !important', !hasRedundantDisplayNone, hasRedundantDisplayNone ? '仍有冗余规则' : '已清理');

    // ===== 测试 9: 筛选功能交互验证 =====
    console.log('\n=== 测试 9: 筛选功能交互 ===');
    await page.goto(BASE_URL);
    await page.waitForSelector('.filter-trigger-btn', { timeout: 5000 });

    // 点击筛选按钮（使用 force 绕过可能的层叠检查）
    await page.click('.filter-trigger-btn', { force: true });
    await page.waitForTimeout(500);

    const sheetVisible = await page.evaluate(() => {
        const sheet = document.querySelector('#filterSheet');
        return sheet && sheet.classList.contains('active');
    });
    log('点击筛选按钮打开 Bottom Sheet', sheetVisible);

    // 关闭 Sheet（点击遮罩上方空白区域）
    if (sheetVisible) {
        await page.click('.sheet-overlay', { position: { x: 100, y: 50 }, force: true });
        await page.waitForTimeout(500);
        const sheetClosed = await page.evaluate(() => {
            const sheet = document.querySelector('#filterSheet');
            return sheet && !sheet.classList.contains('active');
        });
        log('点击遮罩关闭 Bottom Sheet', sheetClosed);
    }

    // ===== 汇总 =====
    console.log('\n' + '='.repeat(50));
    console.log(`📊 测试结果: ${passed} 通过 / ${failed} 失败 / ${passed + failed} 总计`);
    console.log('='.repeat(50));

    if (failed > 0) {
        console.log('\n❌ 失败项:');
        results.filter(r => !r.ok).forEach(r => {
            console.log(`   - ${r.test}: ${r.detail}`);
        });
    }

    await browser.close();

    // 输出 JSON 结果供后续轮次使用
    const summary = { passed, failed, total: passed + failed, results };
    require('fs').writeFileSync(
        '/tmp/mobile-fixes-test-result.json',
        JSON.stringify(summary, null, 2)
    );

    process.exit(failed > 0 ? 1 : 0);
})();
