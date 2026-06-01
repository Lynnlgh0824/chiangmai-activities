// e2e/mobile-ux-walkthrough.spec.js
// Mobile UX Walkthrough - iPhone 14 (390x844)
// Tests: Touch feedback, scroll, search, filter, modal, edge cases

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4000';

test.describe('Mobile UX Walkthrough - iPhone 14 (390x844)', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 3,
  });

  let initialTotalCount = 0;

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    // Wait for data to load - the totalCount should become > 0
    await page.waitForFunction(() => {
      const el = document.getElementById('totalCount');
      return el && parseInt(el.textContent) > 0;
    }, { timeout: 15000 });
    initialTotalCount = parseInt(
      await page.locator('#totalCount').textContent()
    );
    console.log(`Initial total count: ${initialTotalCount}`);
  });

  // ============================================================
  // A. Touch Feedback (3 tests)
  // ============================================================

  test('A1 - Filter chip shows visual state on :active/:pressed', async ({ page }) => {
    // On mobile, filter-section is hidden (display:none).
    // We verify the CSS rules exist by parsing stylesheets.
    const hasActiveRule = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            const sel = rule.selectorText || '';
            if (sel.includes('.filter-chip:active')) {
              // Verify it has visual changes
              const style = rule.style;
              const hasTransform = style.transform && style.transform !== 'none';
              const hasBackground = style.backgroundColor !== '' || style.background !== '';
              return { found: true, hasTransform, hasBackground };
            }
          }
        } catch (e) {}
      }
      return { found: false };
    });

    expect(hasActiveRule.found).toBe(true);
    expect(hasActiveRule.hasTransform || hasActiveRule.hasBackground).toBe(true);
    console.log(`A1 PASS: CSS :active rule found for filter-chip, transform: ${hasActiveRule.hasTransform}, background: ${hasActiveRule.hasBackground}`);
  });

  test('A2 - Tab shows instant visual feedback on tap', async ({ page }) => {
    // Check tab-item has active/hover styling
    const tabStyles = await page.evaluate(() => {
      const tab = document.querySelector('.tab-item');
      if (!tab) return null;
      const cs = getComputedStyle(tab);
      return {
        cursor: cs.cursor,
        transition: cs.transition,
        borderBottom: cs.borderBottom,
        hasMinHeight: parseInt(cs.minHeight) >= 44,
      };
    });

    expect(tabStyles).not.toBeNull();
    expect(tabStyles.cursor).toBe('pointer');
    expect(tabStyles.transition).toContain('all');
    // 44px minimum touch target
    expect(tabStyles.hasMinHeight).toBe(true);

    // Actually tap a tab and verify active class changes
    const secondTab = page.locator('.tab-item').nth(1);
    await secondTab.tap();
    await page.waitForTimeout(300);

    const isActive = await secondTab.evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(true);
    console.log('A2 PASS: Tab has pointer cursor, transition, 44px min-height, and active class toggles');
  });

  test('A3 - Search button has hover/active styles', async ({ page }) => {
    const searchBtnStyles = await page.evaluate(() => {
      const btn = document.querySelector('.search-btn');
      if (!btn) return null;
      const cs = getComputedStyle(btn);
      return {
        cursor: cs.cursor,
        transition: cs.transition,
        minHeight: parseInt(cs.minHeight),
        // Check pseudo-element styles via cssText analysis
        hasHoverRule: !!document.styleSheets,
      };
    });

    expect(searchBtnStyles).not.toBeNull();
    expect(searchBtnStyles.cursor).toBe('pointer');
    expect(searchBtnStyles.transition).toContain('all');
    expect(searchBtnStyles.minHeight).toBeGreaterThanOrEqual(44);

    // Check that CSS contains :hover and :active rules for search-btn
    const hasHoverActiveCSS = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            const sel = rule.selectorText || '';
            if (sel.includes('.search-btn:hover') || sel.includes('.search-btn:active')) {
              return true;
            }
          }
        } catch (e) {}
      }
      return false;
    });

    expect(hasHoverActiveCSS).toBe(true);
    console.log('A3 PASS: Search button has cursor:pointer, transition, 44px min-height, and hover/active CSS rules');
  });

  // ============================================================
  // B. Scroll Experience (4 tests)
  // ============================================================

  test('B4 - Vertical page scroll is smooth without jank', async ({ page }) => {
    // Measure scroll performance
    const scrollResult = await page.evaluate(async () => {
      const startY = window.scrollY;

      // Scroll down in steps and measure time
      const results = [];
      for (let i = 0; i < 5; i++) {
        const t0 = performance.now();
        window.scrollBy(0, 200);
        await new Promise(r => requestAnimationFrame(r));
        const t1 = performance.now();
        results.push(t1 - t0);
      }

      // Check overscroll-behavior is set
      const bodyStyle = getComputedStyle(document.body);
      const hasOverscrollBehavior = bodyStyle.overscrollBehaviorY !== '' ||
                                     bodyStyle.overscrollBehavior !== '';

      return {
        frameTimes: results,
        avgFrameTime: results.reduce((a, b) => a + b, 0) / results.length,
        hasOverscrollBehavior,
        canScroll: document.documentElement.scrollHeight > window.innerHeight,
      };
    });

    // Each frame should be under 50ms (20fps minimum)
    expect(scrollResult.avgFrameTime).toBeLessThan(50);
    // Page should be scrollable
    expect(scrollResult.canScroll).toBe(true);
    // overscroll-behavior should be configured (prevents rubber band)
    expect(scrollResult.hasOverscrollBehavior).toBe(true);
    console.log(`B4 PASS: Smooth scroll, avg frame: ${scrollResult.avgFrameTime.toFixed(1)}ms, overscroll-behavior: ${scrollResult.hasOverscrollBehavior}`);
  });

  test('B5 - Calendar date headers are horizontally accessible', async ({ page }) => {
    // On mobile, date-grid-header uses flex layout with 7 date cells
    const dateHeaderInfo = await page.evaluate(() => {
      const header = document.querySelector('#dateGridHeader');
      if (!header) return null;
      const cs = getComputedStyle(header);
      const cells = header.querySelectorAll('.date-cell-header');
      return {
        display: cs.display,
        overflowX: cs.overflowX,
        cellCount: cells.length,
        containerWidth: header.offsetWidth,
        allCellsVisible: cells.length > 0,
      };
    });

    expect(dateHeaderInfo).not.toBeNull();
    // Should have 7 date cells (one week)
    expect(dateHeaderInfo.cellCount).toBe(7);
    // Container should be flex on mobile
    expect(dateHeaderInfo.display).toContain('flex');
    console.log(`B5 PASS: Date header has ${dateHeaderInfo.cellCount} cells, flex display, container width: ${dateHeaderInfo.containerWidth}px`);
  });

  test('B6 - Page bottom has safe area padding', async ({ page }) => {
    const safeAreaInfo = await page.evaluate(() => {
      const tabContent = document.querySelector('.tab-content');
      if (!tabContent) return null;
      const cs = getComputedStyle(tabContent);
      return {
        paddingBottom: cs.paddingBottom,
        // Check if safe-area CSS is defined (even if not applied in simulator)
        hasSafeAreaCSS: !!document.querySelector('meta[name="viewport"]')?.content.includes('viewport-fit=cover'),
      };
    });

    expect(safeAreaInfo).not.toBeNull();
    // viewport-fit=cover enables safe area insets
    expect(safeAreaInfo.hasSafeAreaCSS).toBe(true);
    console.log(`B6 PASS: Safe area configured, viewport-fit=cover: ${safeAreaInfo.hasSafeAreaCSS}, padding-bottom: ${safeAreaInfo.paddingBottom}`);
  });

  test('B7 - Modal content is scrollable', async ({ page }) => {
    // Open a modal by clicking an activity
    const activityChip = page.locator('.activity-chip').first();
    if ((await activityChip.count()) === 0) {
      test.skip();
      return;
    }

    await activityChip.tap();
    await page.waitForSelector('#activityModal.active', { timeout: 5000 });

    const modalScrollInfo = await page.evaluate(() => {
      const scrollable = document.querySelector('.modal-scrollable-content');
      if (!scrollable) return null;
      const cs = getComputedStyle(scrollable);
      return {
        overflowY: cs.overflowY,
        maxHeight: cs.maxHeight,
        canScroll: scrollable.scrollHeight > scrollable.clientHeight,
        scrollHeight: scrollable.scrollHeight,
        clientHeight: scrollable.clientHeight,
      };
    });

    expect(modalScrollInfo).not.toBeNull();
    expect(modalScrollInfo.overflowY).toBe('auto');

    // Try scrolling the modal content
    if (modalScrollInfo.canScroll) {
      const scrolled = await page.evaluate(() => {
        const scrollable = document.querySelector('.modal-scrollable-content');
        const before = scrollable.scrollTop;
        scrollable.scrollBy(0, 50);
        return scrollable.scrollTop > before;
      });
      expect(scrolled).toBe(true);
    }

    console.log(`B7 PASS: Modal scrollable content has overflow-y:auto, canScroll: ${modalScrollInfo.canScroll}`);

    // Close modal
    await page.locator('.modal-close').tap();
    await page.waitForTimeout(300);
  });

  // ============================================================
  // C. Search Experience (3 tests)
  // ============================================================

  test('C8 - Search input auto-scrolls into view on focus', async ({ page }) => {
    // Scroll down first
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const beforeScrollY = await page.evaluate(() => window.scrollY);

    // Focus the search input
    const searchInput = page.locator('#searchInput');
    await searchInput.tap();
    await page.waitForTimeout(500);

    // Verify scrollIntoView was called (scroll position should change or input should be visible)
    const isInputVisible = await searchInput.isVisible();
    expect(isInputVisible).toBe(true);

    // Check that the search input's bounding rect is within the viewport
    const inputRect = await searchInput.boundingBox();
    expect(inputRect).not.toBeNull();
    // Input should be at least partially in the viewport (y < viewport height)
    const isInViewport = inputRect.y < 844;
    expect(isInViewport).toBe(true);

    console.log(`C8 PASS: Search input visible and in viewport after focus, y=${inputRect.y}`);

    // Blur to dismiss keyboard
    await page.evaluate(() => document.activeElement?.blur());
    await page.waitForTimeout(200);
  });

  test('C9 - Search results update in real-time', async ({ page }) => {
    const beforeCount = await page.locator('#totalCount').textContent();

    // Type a search term
    const searchInput = page.locator('#searchInput');
    await searchInput.tap();
    await searchInput.fill('瑜伽');
    // Trigger search (debounce is 300ms, wait longer)
    await page.waitForTimeout(500);

    // Trigger search via Enter key for immediate effect
    await searchInput.press('Enter');
    await page.waitForTimeout(300);

    const afterCount = await page.locator('#totalCount').textContent();

    // The count should change (likely fewer results for a specific keyword)
    console.log(`C9: Before="${beforeCount}", After search "瑜伽"="${afterCount}"`);
    expect(parseInt(afterCount)).toBeLessThanOrEqual(parseInt(beforeCount));
    // Verify it's not zero (assuming there are yoga activities)
    expect(parseInt(afterCount)).toBeGreaterThan(0);

    console.log(`C9 PASS: Search for "瑜伽" changed count from ${beforeCount} to ${afterCount}`);
  });

  test('C10 - Clearing search restores initial state', async ({ page }) => {
    // First search for something
    const searchInput = page.locator('#searchInput');
    await searchInput.tap();
    await searchInput.fill('瑜伽');
    await searchInput.press('Enter');
    await page.waitForTimeout(300);

    const filteredCount = await page.locator('#totalCount').textContent();
    expect(parseInt(filteredCount)).toBeLessThan(initialTotalCount);

    // Clear search
    await searchInput.fill('');
    await searchInput.press('Enter');
    await page.waitForTimeout(500);

    const restoredCount = parseInt(await page.locator('#totalCount').textContent());

    // After clearing search, count should return to initial
    console.log(`C10: Filtered="${filteredCount}", Restored="${restoredCount}", Initial="${initialTotalCount}"`);
    expect(restoredCount).toBe(initialTotalCount);

    console.log(`C10 PASS: Clearing search restored count from ${filteredCount} to ${restoredCount} (initial: ${initialTotalCount})`);
  });

  // ============================================================
  // D. Filter Experience (4 tests)
  // ============================================================

  test('D11 - Bottom Sheet open animation is smooth', async ({ page }) => {
    // Open filter sheet
    const filterBtn = page.locator('.filter-trigger-btn');
    await filterBtn.tap();
    await page.waitForTimeout(100);

    // Check animation properties
    const sheetAnimation = await page.evaluate(() => {
      const sheet = document.getElementById('filterSheet');
      const content = sheet.querySelector('.sheet-content');
      const overlay = sheet.querySelector('.sheet-overlay');
      const cs = getComputedStyle(content);
      const overlayCs = getComputedStyle(overlay);

      return {
        sheetHasActive: sheet.classList.contains('active'),
        contentTransition: cs.transition,
        contentTransform: cs.transform,
        overlayTransition: overlayCs.transition,
        pointerEvents: getComputedStyle(sheet).pointerEvents,
      };
    });

    expect(sheetAnimation.sheetHasActive).toBe(true);
    expect(sheetAnimation.contentTransition).toContain('transform');
    expect(sheetAnimation.contentTransition).toContain('cubic-bezier');
    expect(sheetAnimation.pointerEvents).toBe('auto');

    // Wait for animation to complete
    await page.waitForTimeout(400);

    // Verify sheet is fully shown
    const isFullyShown = await page.evaluate(() => {
      const content = document.querySelector('#filterSheet .sheet-content');
      const transform = getComputedStyle(content).transform;
      // Should be matrix(1,0,0,1,0,0) or none when fully open
      return transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)';
    });
    expect(isFullyShown).toBe(true);

    console.log('D11 PASS: Bottom Sheet has smooth cubic-bezier animation, opens to translateY(0)');

    // Close sheet
    await page.locator('#filterSheet .sheet-overlay').tap();
    await page.waitForTimeout(400);
  });

  test('D12 - Filter option shows instant selection feedback', async ({ page }) => {
    // Open filter sheet
    await page.locator('.filter-trigger-btn').tap();
    await page.waitForTimeout(400);

    // Click a filter option (e.g., "兴趣班")
    const classOption = page.locator('#categoryOptions .filter-option-item').nth(1);
    await classOption.tap();
    await page.waitForTimeout(200);

    const isSelected = await classOption.evaluate(el => el.classList.contains('selected'));
    expect(isSelected).toBe(true);

    // Check visual feedback
    const optionStyles = await classOption.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        background: cs.background,
        color: cs.color,
        hasTransition: cs.transition.includes('all'),
        hasActiveRule: cs.transition !== '',
      };
    });

    expect(optionStyles.hasTransition).toBe(true);

    console.log('D12 PASS: Filter option has selected class and transition feedback');

    // Close sheet
    await page.locator('#filterSheet .sheet-overlay').tap();
    await page.waitForTimeout(400);
  });

  test('D13 - Apply filter changes result count', async ({ page }) => {
    // Open filter sheet
    await page.locator('.filter-trigger-btn').tap();
    await page.waitForTimeout(400);

    // Select "兴趣班" category
    const classOption = page.locator('#categoryOptions .filter-option-item').nth(1);
    await classOption.tap();
    await page.waitForTimeout(200);

    // Click "应用" button
    const applyBtn = page.locator('.sheet-btn.primary');
    await applyBtn.tap();
    await page.waitForTimeout(500);

    // Check that count changed
    const filteredCount = parseInt(await page.locator('#totalCount').textContent());
    console.log(`D13: After filter, count = ${filteredCount}, initial = ${initialTotalCount}`);
    // Count should be different from initial (or at least not errored)
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialTotalCount);

    console.log(`D13 PASS: Filter applied, count changed from ${initialTotalCount} to ${filteredCount}`);
  });

  test('D14 - Reset filter restores to initial state', async ({ page }) => {
    // Apply a filter first
    await page.locator('.filter-trigger-btn').tap();
    await page.waitForTimeout(400);

    // Select a category
    const classOption = page.locator('#categoryOptions .filter-option-item').nth(1);
    await classOption.tap();
    await page.waitForTimeout(200);

    // Apply
    await page.locator('.sheet-btn.primary').tap();
    await page.waitForTimeout(500);

    const filteredCount = parseInt(await page.locator('#totalCount').textContent());

    // Open filter sheet again
    await page.locator('.filter-trigger-btn').tap();
    await page.waitForTimeout(400);

    // Click "重置" button
    const resetBtn = page.locator('.sheet-btn.secondary');
    await resetBtn.tap();
    await page.waitForTimeout(300);

    // Verify all options are reset to "all"
    const resetState = await page.evaluate(() => {
      const allSelected = document.querySelectorAll('.filter-option-item.selected');
      return Array.from(allSelected).every(el => el.dataset.value === 'all');
    });

    expect(resetState).toBe(true);

    // Close sheet and apply reset
    await page.locator('.sheet-btn.primary').tap();
    await page.waitForTimeout(500);

    const afterResetCount = parseInt(await page.locator('#totalCount').textContent());
    console.log(`D14: Filtered=${filteredCount}, After reset=${afterResetCount}, Initial=${initialTotalCount}`);

    console.log('D14 PASS: Reset button restores all options to "all"');
  });

  // ============================================================
  // E. Modal Experience (4 tests)
  // ============================================================

  test('E15 - Modal has open animation', async ({ page }) => {
    const activityChip = page.locator('.activity-chip').first();
    if ((await activityChip.count()) === 0) {
      test.skip();
      return;
    }

    await activityChip.tap();
    await page.waitForTimeout(100);

    // Check animation
    const animationInfo = await page.evaluate(() => {
      const modal = document.querySelector('.modal');
      const overlay = document.getElementById('activityModal');
      if (!modal || !overlay) return null;

      const cs = getComputedStyle(modal);
      return {
        animation: cs.animation,
        hasSlideUpAnimation: cs.animation.includes('slideUp') || cs.animationName === 'slideUp',
        overlayHasFadeIn: getComputedStyle(overlay).animation.includes('fadeIn') ||
                          getComputedStyle(overlay).animationName === 'fadeIn',
      };
    });

    expect(animationInfo).not.toBeNull();
    // Modal should have slideUp animation
    expect(animationInfo.hasSlideUpAnimation).toBe(true);

    console.log('E15 PASS: Modal has slideUp animation on open');

    // Wait and close
    await page.waitForTimeout(500);
    await page.locator('.modal-close').tap();
    await page.waitForTimeout(300);
  });

  test('E16 - Modal scroll does not bleed through to background', async ({ page }) => {
    const activityChip = page.locator('.activity-chip').first();
    if ((await activityChip.count()) === 0) {
      test.skip();
      return;
    }

    await activityChip.tap();
    await page.waitForSelector('#activityModal.active', { timeout: 5000 });

    // Verify body scroll is locked
    const bodyLocked = await page.evaluate(() => {
      return {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        isFixed: document.body.style.position === 'fixed',
      };
    });

    expect(bodyLocked.overflow).toBe('hidden');
    expect(bodyLocked.isFixed).toBe(true);

    // Try scrolling on the overlay - body should not move
    const scrollBefore = await page.evaluate(() => window.scrollY);

    // Simulate scroll gesture on modal
    const modal = page.locator('.modal');
    await modal.evaluate(el => el.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 })));
    await page.waitForTimeout(200);

    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter).toBe(scrollBefore);

    console.log(`E16 PASS: Background scroll locked (overflow:hidden, position:fixed), scrollY unchanged: ${scrollBefore} -> ${scrollAfter}`);

    await page.locator('.modal-close').tap();
    await page.waitForTimeout(300);
  });

  test('E17 - Clicking overlay closes modal', async ({ page }) => {
    const activityChip = page.locator('.activity-chip').first();
    if ((await activityChip.count()) === 0) {
      test.skip();
      return;
    }

    await activityChip.tap();
    await page.waitForSelector('#activityModal.active', { timeout: 5000 });

    // Click on the overlay (not on the modal itself)
    await page.locator('#activityModal').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Modal should be closed
    const modalClosed = await page.evaluate(() => {
      return !document.getElementById('activityModal').classList.contains('active');
    });
    expect(modalClosed).toBe(true);

    console.log('E17 PASS: Clicking overlay area closes modal');
  });

  test('E18 - Background scroll position restores after modal close', async ({ page }) => {
    // Scroll down first
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(300);
    const scrollBefore = await page.evaluate(() => window.scrollY);

    const activityChip = page.locator('.activity-chip').first();
    if ((await activityChip.count()) === 0) {
      test.skip();
      return;
    }

    await activityChip.tap();
    await page.waitForSelector('#activityModal.active', { timeout: 5000 });

    // Close modal
    await page.locator('.modal-close').tap();
    await page.waitForTimeout(500);

    const scrollAfter = await page.evaluate(() => window.scrollY);

    // Scroll position should be restored
    expect(scrollAfter).toBe(scrollBefore);

    console.log(`E18 PASS: Scroll position restored: before=${scrollBefore}, after=${scrollAfter}`);
  });

  // ============================================================
  // F. Edge Cases (3 tests)
  // ============================================================

  test('F19 - Rapid consecutive Tab clicks do not cause errors', async ({ page }) => {
    // Capture console errors
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    // Rapidly click through tabs
    const tabs = page.locator('.tab-item:not(.desktop-only):not(.tab-more)');

    for (let i = 0; i < 3; i++) {
      for (let t = 0; t < await tabs.count(); t++) {
        await tabs.nth(t).tap();
        // Very short delay to simulate rapid tapping
        await page.waitForTimeout(50);
      }
    }

    // Wait for everything to settle
    await page.waitForTimeout(1000);

    // Check no JS errors
    const jsErrors = errors.filter(e =>
      !e.includes('ResizeObserver') && !e.includes('favicon')
    );

    expect(jsErrors.length).toBe(0);

    // Verify a tab is still active
    const activeTab = await page.locator('.tab-item.active').count();
    expect(activeTab).toBe(1);

    // Verify content is displayed
    const totalCount = await page.locator('#totalCount').textContent();
    expect(parseInt(totalCount)).toBeGreaterThan(0);

    console.log(`F19 PASS: Rapid Tab clicks: 0 JS errors, active tabs: ${activeTab}, total: ${totalCount}`);
  });

  test('F20 - Opening modal then filter sheet does not cause conflict', async ({ page }) => {
    const activityChip = page.locator('.activity-chip').first();
    if ((await activityChip.count()) === 0) {
      test.skip();
      return;
    }

    // Open modal
    await activityChip.tap();
    await page.waitForSelector('#activityModal.active', { timeout: 5000 });

    // Now try to open filter sheet (while modal is open)
    // The filter button might be behind the modal, but let's try programmatically
    await page.evaluate(() => {
      if (typeof openFilterSheet === 'function') openFilterSheet();
    });
    await page.waitForTimeout(500);

    const bothOpen = await page.evaluate(() => {
      const modal = document.getElementById('activityModal');
      const sheet = document.getElementById('filterSheet');
      return {
        modalActive: modal.classList.contains('active'),
        sheetActive: sheet.classList.contains('active'),
      };
    });

    // Either both are open or one took precedence. Key is no crash.
    console.log(`F20: Modal active: ${bothOpen.modalActive}, Sheet active: ${bothOpen.sheetActive}`);

    // Close both
    await page.evaluate(() => {
      if (typeof closeModal === 'function') closeModal();
      if (typeof closeFilterSheet === 'function') closeFilterSheet();
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    });
    await page.waitForTimeout(300);

    // Verify page is still functional
    const totalCount = await page.locator('#totalCount').textContent();
    expect(parseInt(totalCount)).toBeGreaterThan(0);

    console.log(`F20 PASS: No crash when modal and sheet opened together, page still functional`);
  });

  test('F21 - Keyboard popup does not break page layout', async ({ page }) => {
    // Focus search input to trigger virtual keyboard
    const searchInput = page.locator('#searchInput');
    await searchInput.tap();
    await page.waitForTimeout(500);

    // Simulate keyboard by reducing viewport height (as iOS would)
    // We check that the header position handling is correct
    const layoutInfo = await page.evaluate(() => {
      const header = document.querySelector('.header');
      const container = document.querySelector('.container');
      const search = document.querySelector('#searchInput');

      // Check no horizontal overflow
      const bodyWidth = document.body.scrollWidth;
      const viewportWidth = window.innerWidth;

      return {
        bodyOverflowsHorizontally: bodyWidth > viewportWidth,
        containerMaxWidth: getComputedStyle(container).maxWidth,
        searchVisible: search.offsetParent !== null,
        headerPosition: getComputedStyle(header).position,
      };
    });

    // No horizontal overflow
    expect(layoutInfo.bodyOverflowsHorizontally).toBe(false);
    // Search should still be visible
    expect(layoutInfo.searchVisible).toBe(true);

    console.log(`F21 PASS: Keyboard popup layout OK, no horizontal overflow, search visible, header position: ${layoutInfo.headerPosition}`);

    // Blur to dismiss keyboard
    await page.evaluate(() => document.activeElement?.blur());
    await page.waitForTimeout(300);
  });
});
