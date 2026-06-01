import { test, expect } from '@playwright/test';

// iPhone 14 viewport
const VIEWPORT = { width: 390, height: 844 };
const BASE_URL = 'http://localhost:4000';

test.describe('Mobile UI Walkthrough - iPhone 14 (390x844)', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto(BASE_URL);
    // Wait for page to fully load and render
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // Allow JS to render dynamic content
  });

  // ==========================================
  // A. Header area (search bar + header)
  // ==========================================

  test('A1: Title "清迈指南" display', async ({ page }) => {
    // On mobile, h1 is display:none per CSS. Check if it's hidden.
    const h1 = page.locator('.header h1');
    const isVisible = await h1.isVisible();
    const boundingBox = isVisible ? await h1.boundingBox() : null;
    const text = await h1.textContent();

    console.log(`[A1] h1 visible: ${isVisible}, text: "${text}", bbox: ${JSON.stringify(boundingBox)}`);
    // On mobile, h1 is hidden (display:none) - this is by design
    // The title is effectively not shown on mobile to save space
  });

  test('A2: Search bar, search button, filter button on same row', async ({ page }) => {
    const searchSection = page.locator('.search-section');
    const searchWrapper = page.locator('.search-input-wrapper');
    const searchBtn = page.locator('.search-btn');
    const filterBtn = page.locator('.filter-trigger-btn');

    const sectionBox = await searchSection.boundingBox();
    const wrapperBox = await searchWrapper.boundingBox();
    const btnBox = await searchBtn.boundingBox();
    const filterBox = await filterBtn.boundingBox();

    console.log(`[A2] section: ${JSON.stringify(sectionBox)}`);
    console.log(`[A2] wrapper: ${JSON.stringify(wrapperBox)}`);
    console.log(`[A2] searchBtn: ${JSON.stringify(btnBox)}`);
    console.log(`[A2] filterBtn: ${JSON.stringify(filterBox)}`);

    // Check all are visible
    const allVisible = await searchWrapper.isVisible() && await searchBtn.isVisible() && await filterBtn.isVisible();

    // Check they are on the same row (similar y coordinate)
    if (wrapperBox && btnBox && filterBox) {
      const sameRow = Math.abs(wrapperBox.y - btnBox.y) < 10 && Math.abs(wrapperBox.y - filterBox.y) < 10;
      console.log(`[A2] allVisible: ${allVisible}, sameRow: ${sameRow}`);
    }
  });

  test('A3: Search input has visible area indicator', async ({ page }) => {
    const wrapper = page.locator('.search-input-wrapper');
    const styles = await wrapper.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        background: cs.backgroundColor,
        border: cs.border,
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow,
        width: el.offsetWidth,
        height: el.offsetHeight
      };
    });
    console.log(`[A3] search-input-wrapper styles: ${JSON.stringify(styles)}`);

    // Check that it has some visual indicator (background, border, or shadow)
    const hasVisualIndicator = styles.background !== 'rgba(0, 0, 0, 0)' ||
                                styles.border !== 'none' ||
                                styles.boxShadow !== 'none';
    console.log(`[A3] hasVisualIndicator: ${hasVisualIndicator}`);
  });

  test('A4: Search placeholder text readability', async ({ page }) => {
    const input = page.locator('.search-input');
    const placeholder = await input.getAttribute('placeholder');
    const placeholderStyle = await input.evaluate(el => {
      const cs = getComputedStyle(el, '::placeholder');
      return {
        color: cs.color,
        fontSize: cs.fontSize
      };
    });
    console.log(`[A4] placeholder: "${placeholder}", style: ${JSON.stringify(placeholderStyle)}`);
  });

  test('A5: Search button white bg + purple text on purple gradient', async ({ page }) => {
    const btn = page.locator('.search-btn');
    const btnStyles = await btn.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        background: cs.backgroundColor,
        color: cs.color,
        borderRadius: cs.borderRadius,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        width: el.offsetWidth,
        height: el.offsetHeight
      };
    });

    const header = page.locator('.header');
    const headerBg = await header.evaluate(el => getComputedStyle(el).backgroundImage);

    console.log(`[A5] searchBtn: ${JSON.stringify(btnStyles)}`);
    console.log(`[A5] header bg: ${headerBg}`);
  });

  // ==========================================
  // B. Filter area
  // ==========================================

  test('B6: Filter chips visibility', async ({ page }) => {
    // On mobile, filter-section is display:none
    const filterSection = page.locator('.filter-section');
    const isVisible = await filterSection.isVisible();
    console.log(`[B6] filter-section visible: ${isVisible} (hidden on mobile by design)`);

    // Check bottom sheet filter options instead
    // We'll check the filter sheet content when opened
  });

  test('B7: Selected vs unselected chip distinction', async ({ page }) => {
    // Check active and inactive chips
    const activeChip = page.locator('.filter-chip.active').first();
    const inactiveChip = page.locator('.filter-chip:not(.active)').first();

    if (await activeChip.count() > 0 && await inactiveChip.count() > 0) {
      const activeStyles = await activeChip.evaluate(el => {
        const cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color, border: cs.borderColor };
      });
      const inactiveStyles = await inactiveChip.evaluate(el => {
        const cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color, border: cs.borderColor };
      });
      console.log(`[B7] active: ${JSON.stringify(activeStyles)}`);
      console.log(`[B7] inactive: ${JSON.stringify(inactiveStyles)}`);
    } else {
      console.log(`[B7] filter-section hidden on mobile, checking bottom sheet filter options`);
    }
  });

  test('B8: Filter chip text truncation', async ({ page }) => {
    const chips = page.locator('.filter-chip');
    const count = await chips.count();
    for (let i = 0; i < count; i++) {
      const chip = chips.nth(i);
      const text = await chip.textContent();
      const box = await chip.boundingBox();
      const scrollWidth = await chip.evaluate(el => el.scrollWidth);
      const clientWidth = await chip.evaluate(el => el.clientWidth);
      const truncated = scrollWidth > clientWidth;
      if (truncated) {
        console.log(`[B8] WARN: chip "${text}" truncated (scrollWidth=${scrollWidth}, clientWidth=${clientWidth})`);
      }
    }
    console.log(`[B8] checked ${count} filter chips`);
  });

  // ==========================================
  // C. Tab navigation
  // ==========================================

  test('C9: Tab text complete display', async ({ page }) => {
    const tabs = page.locator('.tab-item:not(.desktop-only)');
    const count = await tabs.count();
    const results = [];
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      const text = await tab.textContent();
      const visible = await tab.isVisible();
      const box = visible ? await tab.boundingBox() : null;
      results.push({ text: text.trim(), visible, box });
    }
    console.log(`[C9] tabs: ${JSON.stringify(results)}`);
  });

  test('C10: Active tab visual indicator', async ({ page }) => {
    const activeTab = page.locator('.tab-item.active').first();
    const styles = await activeTab.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        color: cs.color,
        borderBottomColor: cs.borderBottomColor,
        borderBottomWidth: cs.borderBottomWidth,
        fontWeight: cs.fontWeight
      };
    });
    const inactiveTab = page.locator('.tab-item:not(.active)').first();
    const inactiveStyles = await inactiveTab.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        color: cs.color,
        borderBottomColor: cs.borderBottomColor,
        borderBottomWidth: cs.borderBottomWidth,
        fontWeight: cs.fontWeight
      };
    });
    console.log(`[C10] active tab: ${JSON.stringify(styles)}`);
    console.log(`[C10] inactive tab: ${JSON.stringify(inactiveStyles)}`);
  });

  test('C11: "更多" button visibility', async ({ page }) => {
    const moreBtn = page.locator('.tab-more');
    const isVisible = await moreBtn.isVisible();
    const box = isVisible ? await moreBtn.boundingBox() : null;
    const text = await moreBtn.textContent();
    console.log(`[C11] "更多" button visible: ${isVisible}, text: "${text.trim()}", box: ${JSON.stringify(box)}`);
  });

  // ==========================================
  // D. Content area (calendar cards)
  // ==========================================

  test('D12: Activity card spacing', async ({ page }) => {
    // Wait for calendar to render
    await page.waitForTimeout(1000);

    const chips = page.locator('.activity-chip');
    const count = await chips.count();
    console.log(`[D12] total activity chips: ${count}`);

    if (count >= 2) {
      const box1 = await chips.nth(0).boundingBox();
      const box2 = await chips.nth(1).boundingBox();
      if (box1 && box2) {
        const gap = box2.y - (box1.y + box1.height);
        console.log(`[D12] gap between first 2 chips: ${gap}px`);
      }
    }
  });

  test('D13: Activity name, time, price readability', async ({ page }) => {
    await page.waitForTimeout(1000);

    const chips = page.locator('.activity-chip');
    const count = await chips.count();

    if (count > 0) {
      const chip = chips.first();
      const chipText = await chip.textContent();
      const chipBox = await chip.boundingBox();
      const styles = await chip.evaluate(el => {
        const cs = getComputedStyle(el);
        return { fontSize: cs.fontSize, padding: cs.padding, borderLeft: cs.borderLeft };
      });
      console.log(`[D13] first chip text: "${chipText.trim()}", box: ${JSON.stringify(chipBox)}, styles: ${JSON.stringify(styles)}`);
    }
  });

  test('D14: Card left color bar visibility', async ({ page }) => {
    await page.waitForTimeout(1000);

    const chip = page.locator('.activity-chip').first();
    if (await chip.count() > 0) {
      const borderLeft = await chip.evaluate(el => {
        const cs = getComputedStyle(el);
        return {
          borderLeftColor: cs.borderLeftColor,
          borderLeftWidth: cs.borderLeftWidth,
          borderLeftStyle: cs.borderLeftStyle
        };
      });
      console.log(`[D14] chip left border: ${JSON.stringify(borderLeft)}`);
    }
  });

  test('D15: Calendar header dates clarity', async ({ page }) => {
    await page.waitForTimeout(1000);

    const headers = page.locator('.date-cell-header');
    const count = await headers.count();
    console.log(`[D15] date headers count: ${count}`);

    for (let i = 0; i < Math.min(count, 7); i++) {
      const h = headers.nth(i);
      const visible = await h.isVisible();
      if (visible) {
        const box = await h.boundingBox();
        const dateNum = await h.locator('.date-number').textContent();
        const weekday = await h.locator('.date-weekday').textContent();
        const styles = await h.evaluate(el => {
          const cs = getComputedStyle(el);
          return { bg: cs.backgroundColor, color: cs.color, borderRadius: cs.borderRadius };
        });
        console.log(`[D15] header[${i}]: date="${dateNum.trim()}", weekday="${weekday.trim()}", box: ${JSON.stringify(box)}, styles: ${JSON.stringify(styles)}`);
      }
    }
  });

  test('D16: Weekday text completeness', async ({ page }) => {
    await page.waitForTimeout(1000);

    const weekdays = page.locator('.date-weekday');
    const count = await weekdays.count();
    for (let i = 0; i < count; i++) {
      const wd = weekdays.nth(i);
      const text = await wd.textContent();
      const scrollW = await wd.evaluate(el => el.scrollWidth);
      const clientW = await wd.evaluate(el => el.clientWidth);
      if (scrollW > clientW) {
        console.log(`[D16] WARN: weekday "${text.trim()}" truncated`);
      }
    }
    console.log(`[D16] checked ${count} weekday labels`);
  });

  // ==========================================
  // E. Bottom Sheet
  // ==========================================

  test('E17-20: Bottom Sheet display checks', async ({ page }) => {
    // Open the filter bottom sheet
    const filterBtn = page.locator('.filter-trigger-btn');
    await filterBtn.click();
    await page.waitForTimeout(500);

    const sheet = page.locator('#filterSheet');
    const isActive = await sheet.evaluate(el => el.classList.contains('active'));
    console.log(`[E17] filter sheet active: ${isActive}`);

    if (isActive) {
      const content = page.locator('#filterSheet .sheet-content');
      const contentBox = await content.boundingBox();
      console.log(`[E17] sheet-content box: ${JSON.stringify(contentBox)}`);
      console.log(`[E17] full width: ${contentBox ? contentBox.width >= 388 : 'N/A'} (viewport: 390)`);

      // E18: Check corner radius
      const cornerRadius = await content.evaluate(el => getComputedStyle(el).borderRadius);
      console.log(`[E18] border-radius: ${cornerRadius}`);

      // E19: Check handle visibility
      const handle = page.locator('#filterSheet .sheet-handle');
      const handleVisible = await handle.isVisible();
      const handleBox = handleVisible ? await handle.boundingBox() : null;
      console.log(`[E19] handle visible: ${handleVisible}, box: ${JSON.stringify(handleBox)}`);

      // E20: Filter options text
      const options = page.locator('#filterSheet .filter-option-item');
      const optCount = await options.count();
      for (let i = 0; i < optCount; i++) {
        const opt = options.nth(i);
        const text = await opt.textContent();
        const scrollW = await opt.evaluate(el => el.scrollWidth);
        const clientW = await opt.evaluate(el => el.clientWidth);
        console.log(`[E20] option "${text.trim()}": truncated=${scrollW > clientW}`);
      }
    }

    // Close the sheet
    await page.locator('#filterSheet .sheet-overlay').click({ force: true });
    await page.waitForTimeout(300);
  });

  // ==========================================
  // F. Modal
  // ==========================================

  test('F21-25: Modal display checks', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Click first activity chip to open modal
    const chip = page.locator('.activity-chip').first();
    if (await chip.count() > 0) {
      await chip.click();
      await page.waitForTimeout(500);

      const modal = page.locator('.modal-overlay.active');
      const isActive = await modal.count() > 0;
      console.log(`[F21] modal active: ${isActive}`);

      if (isActive) {
        // F21: Modal title
        const title = page.locator('#modalTitle');
        const titleText = await title.textContent();
        const titleBox = await title.boundingBox();
        const titleStyles = await title.evaluate(el => {
          const cs = getComputedStyle(el);
          return { fontSize: cs.fontSize, fontWeight: cs.fontWeight, color: cs.color };
        });
        console.log(`[F21] title: "${titleText}", box: ${JSON.stringify(titleBox)}, styles: ${JSON.stringify(titleStyles)}`);

        // F22: Category badge
        const badge = page.locator('#modalCategory');
        const badgeVisible = await badge.isVisible();
        console.log(`[F22] category badge visible: ${badgeVisible} (CSS sets display:none)`);

        // F23: Time/location/price info
        const infoItems = page.locator('.info-item');
        const infoCount = await infoItems.count();
        for (let i = 0; i < infoCount; i++) {
          const item = infoItems.nth(i);
          const visible = await item.isVisible();
          if (visible) {
            const box = await item.boundingBox();
            const text = await item.textContent();
            console.log(`[F23] info[${i}]: "${text.trim()}", box: ${JSON.stringify(box)}`);
          }
        }

        // F24: "查看官网" button
        const linkBtn = page.locator('#modalLinkButton');
        const linkVisible = await linkBtn.isVisible();
        const linkBox = linkVisible ? await linkBtn.boundingBox() : null;
        const linkStyles = await linkBtn.evaluate(el => {
          const cs = getComputedStyle(el);
          return { bg: cs.backgroundColor, color: cs.color, fontSize: cs.fontSize, borderRadius: cs.borderRadius };
        });
        console.log(`[F24] link btn visible: ${linkVisible}, box: ${JSON.stringify(linkBox)}, styles: ${JSON.stringify(linkStyles)}`);

        // F25: Close button
        const closeBtn = page.locator('.modal-close');
        const closeVisible = await closeBtn.isVisible();
        const closeBox = closeVisible ? await closeBtn.boundingBox() : null;
        const closeStyles = await closeBtn.evaluate(el => {
          const cs = getComputedStyle(el);
          return { bg: cs.backgroundColor, color: cs.color, width: cs.width, height: cs.height, borderRadius: cs.borderRadius };
        });
        console.log(`[F25] close btn visible: ${closeVisible}, box: ${JSON.stringify(closeBox)}, styles: ${JSON.stringify(closeStyles)}`);

        // Close modal
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    } else {
      console.log(`[F21-25] No activity chips found to open modal`);
    }
  });

  // ==========================================
  // G. Global checks
  // ==========================================

  test('G26: Safe area adaptation (iPhone bottom bar)', async ({ page }) => {
    const body = page.locator('body');
    const bodyStyles = await body.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        paddingBottom: cs.paddingBottom,
        paddingBottomEnv: cs.paddingBottom
      };
    });

    // Check for env(safe-area-inset-bottom) usage
    const hasSafeArea = await page.evaluate(() => {
      const styles = document.styleSheets;
      let found = false;
      for (const sheet of styles) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.cssText && rule.cssText.includes('safe-area')) {
              found = true;
              break;
            }
          }
        } catch (e) {}
        if (found) break;
      }
      return found;
    });

    // Check viewport-fit meta tag
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : null;
    });

    console.log(`[G26] body padding-bottom: ${bodyStyles.paddingBottom}`);
    console.log(`[G26] has safe-area CSS: ${hasSafeArea}`);
    console.log(`[G26] viewport meta: ${viewportMeta}`);
  });

  test('G27: Color contrast check', async ({ page }) => {
    // Check key text/background contrast pairs
    const headerH1 = page.locator('.header h1');
    const searchPlaceholder = page.locator('.search-input');

    // Header: white text on purple bg
    const headerBg = await page.locator('.header').evaluate(el => getComputedStyle(el).backgroundColor);
    console.log(`[G27] header bg: ${headerBg}`);

    // Search placeholder
    const placeholderColor = await searchPlaceholder.evaluate(el => getComputedStyle(el, '::placeholder').color);
    console.log(`[G27] placeholder color: ${placeholderColor}`);

    // Tab text
    const tabActive = page.locator('.tab-item.active');
    const tabColor = await tabActive.evaluate(el => getComputedStyle(el).color);
    const tabBg = await page.locator('.tabs-nav').evaluate(el => getComputedStyle(el).backgroundColor);
    console.log(`[G27] active tab text: ${tabColor}, bg: ${tabBg}`);

    // Activity chip text
    await page.waitForTimeout(500);
    const chip = page.locator('.activity-chip').first();
    if (await chip.count() > 0) {
      const chipColor = await chip.evaluate(el => getComputedStyle(el).color);
      console.log(`[G27] chip text color: ${chipColor}`);
    }
  });

  test('G28: No clipping or overflow', async ({ page }) => {
    // Check if any element overflows the viewport
    const overflowResult = await page.evaluate(() => {
      const viewportWidth = 390;
      const issues = [];
      const allElements = document.querySelectorAll('*');

      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        if (rect.right > viewportWidth + 2) { // 2px tolerance
          const tag = el.tagName.toLowerCase();
          const cls = el.className ? `.${String(el.className).split(' ').join('.')}` : '';
          const id = el.id ? `#${el.id}` : '';
          if (!['SCRIPT', 'STYLE', 'LINK', 'META'].includes(tag)) {
            issues.push({
              selector: `${tag}${id}${cls}`,
              overflow: Math.round(rect.right - viewportWidth),
              width: Math.round(rect.width)
            });
          }
        }
      }
      return issues.slice(0, 20); // Limit output
    });

    console.log(`[G28] overflow elements: ${JSON.stringify(overflowResult)}`);

    // Also check body scroll width
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    console.log(`[G28] body scrollWidth: ${bodyScrollWidth}, viewport: ${viewportWidth}`);
  });

  // ==========================================
  // Tab Sheet (more tabs bottom sheet)
  // ==========================================

  test('Tab Sheet display check', async ({ page }) => {
    const moreBtn = page.locator('.tab-more');
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page.waitForTimeout(500);

      const tabSheet = page.locator('#tabSheet');
      const isActive = await tabSheet.evaluate(el => el.classList.contains('active'));
      console.log(`[TabSheet] active: ${isActive}`);

      if (isActive) {
        const options = page.locator('.tab-option-item');
        const count = await options.count();
        for (let i = 0; i < count; i++) {
          const opt = options.nth(i);
          const text = await opt.textContent();
          const visible = await opt.isVisible();
          console.log(`[TabSheet] option[${i}]: "${text.trim()}", visible: ${visible}`);
        }

        // Close
        await page.locator('#tabSheet .sheet-overlay').click({ force: true });
        await page.waitForTimeout(300);
      }
    }
  });
});
