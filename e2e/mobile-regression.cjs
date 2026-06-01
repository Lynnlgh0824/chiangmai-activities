/**
 * 移动端回归测试 - CI 版本
 *
 * 包含 3 轮测试中验证通过的全部 13 个用例
 * 运行: node e2e/mobile-regression.cjs
 *
 * 通过率标准: 13/13 全通过
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 15000;

// ===== 测试结果收集 =====
const results = [];

function record(name, pass, detail = '') {
    results.push({ name, status: pass ? 'pass' : 'fail', detail });
    const icon = pass ? '✅' : '❌';
    console.log(`  ${icon} ${name}${detail ? ': ' + detail : ''}`);
}

async function run() {
    console.log('\n🧪 移动端回归测试开始\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    });
    const page = await context.newPage();

    // 收集 JS 错误
    const jsErrors = [];
    page.on('pageerror', err => jsErrors.push(err.message));
    page.on('console', msg => {
        if (msg.type() === 'error') jsErrors.push(msg.text());
    });

    try {
        await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT });
    } catch (e) {
        console.error('❌ 页面加载失败:', e.message);
        await browser.close();
        process.exit(1);
    }

    // =============================================
    // Round 1: 基础交互测试
    // =============================================
    console.log('\n📱 Round 1: 基础交互测试');

    // 1. 页面加载 + JS 错误
    await page.waitForTimeout(2000);
    const criticalErrors = jsErrors.filter(e =>
        !e.includes('favicon') && !e.includes('404') && !e.includes('net::')
    );
    record('R1-1 页面加载无 JS 错误', criticalErrors.length === 0,
        criticalErrors.length > 0 ? criticalErrors[0].substring(0, 80) : '无错误');

    // 2. 搜索栏触控目标
    const searchWrapper = await page.evaluate(() => {
        const el = document.querySelector('.search-input-wrapper');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { height: rect.height, top: rect.top };
    });
    record('R1-2 搜索框高度 ≥ 44px', searchWrapper && searchWrapper.height >= 44,
        searchWrapper ? `${searchWrapper.height}px` : '元素未找到');

    const searchBtnH = await page.evaluate(() => {
        const el = document.querySelector('.search-btn');
        return el ? el.getBoundingClientRect().height : 0;
    });
    record('R1-3 搜索按钮高度 ≥ 44px', searchBtnH >= 44, `${searchBtnH}px`);

    // 3. 筛选 Chip
    const chipMinH = await page.evaluate(() => {
        const chips = document.querySelectorAll('.filter-chip');
        if (!chips.length) return 0;
        return Math.min(...Array.from(chips).map(c => c.getBoundingClientRect().height));
    });
    record('R1-4 filter-chip 高度 ≥ 44px', chipMinH >= 44, `最小 ${chipMinH}px`);

    // 4. Tab 切换
    const tabPass = await page.evaluate(() => {
        const tabs = document.querySelectorAll('.tab-item:not(.desktop-only)');
        if (tabs.length < 4) return false;
        // 模拟点击每个 tab
        for (let i = 0; i < tabs.length; i++) {
            tabs[i].click();
            const pane = document.getElementById(`tab-${i}`);
            if (!pane || !pane.classList.contains('active')) return false;
        }
        return true;
    });
    record('R1-5 Tab 切换正常', tabPass, tabPass ? '全部切换成功' : '切换失败');

    // 5. Bottom Sheet footer 可见
    await page.evaluate(() => {
        const filterBtn = document.querySelector('.filter-trigger-btn');
        if (filterBtn) filterBtn.click();
    });
    await page.waitForTimeout(500);
    const sheetFooterVisible = await page.evaluate(() => {
        const footer = document.querySelector('.sheet-footer');
        if (!footer) return false;
        const style = getComputedStyle(footer);
        return style.display !== 'none' && footer.offsetHeight > 0;
    });
    record('R1-6 Bottom Sheet footer 可见', sheetFooterVisible);
    await page.evaluate(() => {
        const overlay = document.querySelector('#filterSheet .sheet-overlay');
        if (overlay) overlay.click();
    });
    await page.waitForTimeout(300);

    // 6. Modal 背景滚动锁定
    const modalLockPass = await page.evaluate(async () => {
        // 先滚动到有活动的位置
        window.scrollTo(0, 200);
        const scrollBefore = window.scrollY;

        // 点击第一个活动卡片
        const card = document.querySelector('.activity-chip');
        if (!card) return { pass: false, detail: '无活动卡片' };
        card.click();
        await new Promise(r => setTimeout(r, 500));

        const modal = document.getElementById('activityModal');
        if (!modal || !modal.classList.contains('active')) return { pass: false, detail: '弹窗未打开' };

        // 尝试滚动背景
        const scrollAfter = window.scrollY;
        const bodyFixed = document.body.style.position === 'fixed' ||
                          getComputedStyle(document.body).position === 'fixed';

        // 关闭弹窗
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.click();
        await new Promise(r => setTimeout(r, 300));

        return {
            pass: bodyFixed || document.body.style.overflow === 'hidden',
            detail: `position: ${document.body.style.position}, scrollY: ${scrollBefore} → ${scrollAfter}`
        };
    });
    record('R1-7 Modal 背景滚动锁定', modalLockPass.pass, modalLockPass.detail);

    // 7. 触控目标审计 (可见可点击元素)
    const touchAudit = await page.evaluate(() => {
        const clickables = document.querySelectorAll(
            'button, a, [onclick], .filter-chip, .tab-item, .activity-chip, .filter-option-item'
        );
        const undersized = [];
        clickables.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.height > 0 && rect.height < 44 && rect.width > 0) {
                undersized.push({
                    tag: el.tagName.toLowerCase(),
                    class: el.className.substring(0, 40),
                    h: Math.round(rect.height)
                });
            }
        });
        return undersized;
    });
    record('R1-8 触控目标 ≥ 44px', touchAudit.length === 0,
        touchAudit.length > 0
            ? `${touchAudit.length} 个不足: ${touchAudit.slice(0, 3).map(e => `${e.tag}.${e.class}(${e.h}px)`).join(', ')}`
            : '全部达标');

    // =============================================
    // Round 2: 视觉与布局测试
    // =============================================
    console.log('\n📱 Round 2: 视觉与布局测试');

    // 8. 水平溢出
    const overflow = await page.evaluate(() => {
        const body = document.body;
        return { scrollW: body.scrollWidth, clientW: body.clientWidth };
    });
    record('R2-1 无水平溢出', overflow.scrollW <= overflow.clientW,
        `scrollWidth=${overflow.scrollW} vs clientWidth=${overflow.clientW}`);

    // 9. 搜索栏布局（三元素在同一行）
    const searchBarLayout = await page.evaluate(() => {
        const wrapper = document.querySelector('.search-input-wrapper');
        const searchBtn = document.querySelector('.search-btn');
        const filterBtn = document.querySelector('.filter-trigger-btn');
        if (!wrapper || !searchBtn) return { pass: false };
        const wrapperTop = wrapper.getBoundingClientRect().top;
        const btnTop = searchBtn.getBoundingClientRect().top;
        return {
            pass: Math.abs(wrapperTop - btnTop) < 5,
            wrapperTop: Math.round(wrapperTop),
            btnTop: Math.round(btnTop)
        };
    });
    record('R2-2 搜索栏同行显示', searchBarLayout.pass,
        `wrapper:${searchBarLayout.wrapperTop} btn:${searchBarLayout.btnTop}`);

    // 10. 字号审计
    const fontAudit = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const tooSmall = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const parent = node.parentElement;
            if (!parent || !node.textContent.trim()) continue;
            const style = getComputedStyle(parent);
            const size = parseFloat(style.fontSize);
            const rect = parent.getBoundingClientRect();
            // 只检查可见文字且非装饰性元素
            if (rect.height > 0 && rect.width > 0 && size < 12 &&
                !parent.closest('.day-filter-chip') && // 排除装饰性图标
                !parent.closest('[aria-hidden="true"]')) {
                tooSmall.push({
                    text: node.textContent.trim().substring(0, 20),
                    size,
                    class: parent.className.substring(0, 30)
                });
            }
        }
        return tooSmall.slice(0, 5); // 最多报告5个
    });
    record('R2-3 字号 ≥ 12px', fontAudit.length === 0,
        fontAudit.length > 0
            ? `${fontAudit.length} 个偏小: ${fontAudit.map(f => `"${f.text}" ${f.size}px`).join(', ')}`
            : '全部达标');

    // 11. Placeholder 对比度
    const placeholderColor = await page.evaluate(() => {
        const input = document.querySelector('.search-input');
        if (!input) return null;
        return getComputedStyle(input, '::placeholder').color;
    });
    record('R2-4 placeholder 颜色达标', placeholderColor === 'rgb(118, 118, 118)',
        placeholderColor || '未获取到');

    // 12. viewport-fit=cover
    const viewportFit = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta ? meta.content.includes('viewport-fit=cover') : false;
    });
    record('R2-5 viewport-fit=cover', viewportFit);

    // =============================================
    // Round 3: 回归与边界测试
    // =============================================
    console.log('\n📱 Round 3: 回归与边界测试');

    // 13. 超小屏 (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    const smallScreenOverflow = await page.evaluate(() => {
        return { scrollW: document.body.scrollWidth, clientW: document.body.clientWidth };
    });
    record('R3-1 超小屏无溢出 (375px)', smallScreenOverflow.scrollW <= smallScreenOverflow.clientW,
        `scrollW=${smallScreenOverflow.scrollW} clientW=${smallScreenOverflow.clientW}`);
    // 恢复 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    // 14. overscroll-behavior
    const overscroll = await page.evaluate(() => {
        const html = getComputedStyle(document.documentElement);
        const body = getComputedStyle(document.body);
        return {
            html: html.overscrollBehavior || html.overscrollBehaviorY,
            body: body.overscrollBehavior || body.overscrollBehaviorY
        };
    });
    record('R3-2 overscroll-behavior 已设置',
        (overscroll.html === 'none' || overscroll.body === 'none'),
        `html=${overscroll.html}, body=${overscroll.body}`);

    // =============================================
    // 汇总
    // =============================================
    await browser.close();

    const pass = results.filter(r => r.status === 'pass').length;
    const fail = results.filter(r => r.status === 'fail').length;
    const total = results.length;

    console.log('\n' + '='.repeat(50));
    console.log(`📊 结果: ${pass}/${total} 通过, ${fail} 失败`);
    console.log('='.repeat(50));

    if (fail > 0) {
        console.log('\n❌ 失败项:');
        results.filter(r => r.status === 'fail').forEach(r => {
            console.log(`  - ${r.name}: ${r.detail}`);
        });
    }

    console.log('');

    // CI 模式：有失败则退出码 1
    if (process.env.CI === 'true' && fail > 0) {
        process.exit(1);
    }
}

run().catch(err => {
    console.error('测试运行异常:', err);
    process.exit(1);
});
