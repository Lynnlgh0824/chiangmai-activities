const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 正在访问主页: http://localhost:5173');

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log('✅ 页面加载成功');

    // 等待 React 渲染
    await page.waitForTimeout(3000);

    // 检查页面标题
    const title = await page.title();
    console.log(`📄 页面标题: ${title}`);

    // 检查 #root 元素
    const rootExists = await page.$('#root');
    console.log(`📍 #root 元素存在: ${!!rootExists}`);

    if (rootExists) {
      const rootVisible = await page.isVisible('#root');
      console.log(`👁️  #root 元素可见: ${rootVisible}`);

      const rootHTML = await page.$eval('#root', el => el.innerHTML);
      console.log(`📝 #root HTML 内容长度: ${rootHTML.length} 字符`);

      if (rootHTML.length > 0) {
        console.log('✅ #root 有内容！');

        // 显示前 500 个字符
        console.log('\n📋 #root 内容预览:');
        console.log(rootHTML.substring(0, 500));
        console.log('...\n');
      } else {
        console.log('❌ #root 是空的！');
      }
    }

    // 检查是否有活动卡片
    const activities = await page.$$('.activity-card, .card, [class*="activity"], [class*="Activity"]');
    console.log(`🎯 找到活动卡片数量: ${activities.length}`);

    // 截图
    await page.screenshot({ path: 'homepage-screenshot.png', fullPage: true });
    console.log('📸 已保存截图: homepage-screenshot.png');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }

  await browser.close();
  console.log('\n✅ 检查完成');
})();
