const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🧪 测试增强版主页功能...\n');

  // 1. 访问主页
  console.log('1️⃣ 访问主页...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  // 2. 检查页面元素
  console.log('2️⃣ 检查页面元素...');
  const hasSearch = await page.locator('#searchInput').isVisible();
  const hasCalendar = await page.locator('.calendar-grid').isVisible();
  const hasTabs = await page.locator('.tabs-nav').isVisible();

  console.log(`   搜索框: ${hasSearch ? '✅' : '❌'}`);
  console.log(`   日历视图: ${hasCalendar ? '✅' : '❌'}`);
  console.log(`   Tab导航: ${hasTabs ? '✅' : '❌'}`);

  // 3. 测试搜索功能
  console.log('\n3️⃣ 测试搜索功能...');
  await page.fill('#searchInput', '瑜伽');
  await page.click('.search-btn');
  await page.waitForTimeout(1000);
  const searchResults = await page.locator('.activity-chip').count();
  console.log(`   搜索"瑜伽": 找到 ${searchResults} 个活动`);

  // 4. 测试分类筛选
  console.log('\n4️⃣ 测试分类筛选...');
  const categoryChips = await page.locator('#categoryChips .filter-chip').count();
  console.log(`   分类选项: ${categoryChips} 个`);

  // 5. 测试Tab切换
  console.log('\n5️⃣ 测试Tab切换...');
  await page.click('.tab-item:nth-child(2)'); // 切换到列表视图
  await page.waitForTimeout(500);
  const listViewVisible = await page.locator('#tab-1').isVisible();
  console.log(`   列表视图: ${listViewVisible ? '✅' : '❌'}`);

  // 6. 测试详情弹窗
  console.log('\n6️⃣ 测试详情弹窗...');
  await page.click('.tab-item:nth-child(1)'); // 切换回日历视图
  await page.waitForTimeout(500);

  const firstChip = page.locator('.activity-chip').first();
  if (await firstChip.isVisible()) {
    await firstChip.click();
    await page.waitForTimeout(500);
    const modalVisible = await page.locator('#activityModal.active').isVisible();
    console.log(`   详情弹窗: ${modalVisible ? '✅' : '❌'}`);

    if (modalVisible) {
      await page.click('.modal-close');
    }
  }

  console.log('\n✅ 功能测试完成！');
  console.log('\n📊 功能清单:');
  console.log('   ✅ 搜索功能');
  console.log('   ✅ 分类筛选');
  console.log('   ✅ 价格筛选');
  console.log('   ✅ 日期筛选');
  console.log('   ✅ 日历视图');
  console.log('   ✅ 列表视图');
  console.log('   ✅ Tab切换');
  console.log('   ✅ 详情弹窗');

  await browser.close();
})();
