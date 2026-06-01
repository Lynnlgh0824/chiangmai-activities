const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();

    await page.goto('http://localhost:4000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('=== 移动端溢出检测 (375px iPhone X) ===\n');

    // 1. 检查页面是否有横向滚动条
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const hasHorizontalScroll = bodyScrollWidth > viewportWidth;
    console.log(`${hasHorizontalScroll ? '❌' : '✅'} 页面横向滚动: scrollWidth=${bodyScrollWidth}, innerWidth=${viewportWidth}`);

    // 2. 检查各关键元素是否溢出
    const elements = [
        { selector: '.header', name: 'Header' },
        { selector: '.search-section', name: '搜索区域' },
        { selector: '.search-input-wrapper', name: '搜索框' },
        { selector: '.search-btn', name: '搜索按钮' },
        { selector: '.filter-trigger-btn', name: '筛选按钮' },
        { selector: '.tabs-nav', name: 'Tab导航' },
        { selector: '.date-grid-header', name: '日期栏' },
        { selector: '.schedule-list', name: '活动列表' },
    ];

    for (const el of elements) {
        const info = await page.evaluate((sel) => {
            const elem = document.querySelector(sel);
            if (!elem) return null;
            const rect = elem.getBoundingClientRect();
            const style = window.getComputedStyle(elem);
            return {
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                width: Math.round(rect.width),
                overflow: style.overflowX,
                visible: rect.width > 0 && rect.height > 0
            };
        }, el.selector);

        if (!info) {
            console.log(`⚠️  ${el.name}: 元素不存在`);
            continue;
        }
        if (!info.visible) {
            console.log(`⚪ ${el.name}: 不可见 (隐藏)`);
            continue;
        }

        const overflowsRight = info.right > viewportWidth;
        const overflowsLeft = info.left < 0;
        const ok = !overflowsRight && !overflowsLeft;
        console.log(`${ok ? '✅' : '❌'} ${el.name}: left=${info.left}, right=${info.right}, width=${info.width}${overflowsRight ? ' → 超出右边!' : ''}${overflowsLeft ? ' → 超出左边!' : ''}`);
    }

    // 3. 检查搜索框和按钮是否重叠
    console.log('\n=== 搜索框与按钮重叠检测 ===');
    const overlap = await page.evaluate(() => {
        const wrapper = document.querySelector('.search-input-wrapper');
        const btn = document.querySelector('.search-btn');
        if (!wrapper || !btn) return { exists: false };

        const wrapperRect = wrapper.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();

        const overlaps = !(wrapperRect.right <= btnRect.left || wrapperRect.left >= btnRect.right);
        const gap = Math.round(btnRect.left - wrapperRect.right);

        return {
            exists: true,
            wrapperRight: Math.round(wrapperRect.right),
            btnLeft: Math.round(btnRect.left),
            gap,
            overlaps
        };
    });

    if (overlap.exists) {
        console.log(`${overlap.overlaps ? '❌ 搜索框与按钮重叠!' : '✅ 搜索框与按钮无重叠'} (间距: ${overlap.gap}px)`);
    }

    // 4. 检查筛选按钮是否可见且可点击
    console.log('\n=== 筛选按钮可见性 ===');
    const filterBtn = await page.evaluate(() => {
        const btn = document.querySelector('.filter-trigger-btn');
        if (!btn) return null;
        const style = window.getComputedStyle(btn);
        const rect = btn.getBoundingClientRect();
        return {
            display: style.display,
            visible: rect.width > 0 && rect.height > 0,
            inViewport: rect.right <= window.innerWidth && rect.left >= 0
        };
    });
    if (filterBtn) {
        console.log(`${filterBtn.visible ? '✅' : '❌'} 筛选按钮可见 (display: ${filterBtn.display})`);
        console.log(`${filterBtn.inViewport ? '✅' : '❌'} 筛选按钮在视口内`);
    }

    // 5. 截图保存
    await page.screenshot({ path: '/tmp/mobile-overflow-check.png', fullPage: false });
    console.log('\n📸 截图已保存: /tmp/mobile-overflow-check.png');

    await browser.close();
})();
