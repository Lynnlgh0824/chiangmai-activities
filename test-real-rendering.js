const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // 收集所有错误
  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error') {
      errors.push(text);
      console.error(`[ERROR] ${text}`);
    } else if (type === 'warning') {
      warnings.push(text);
      console.warn(`[WARN] ${text}`);
    } else {
      console.log(`[LOG] ${text}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('[PAGE ERROR]', error.message);
  });

  page.on('requestfailed', request => {
    const error = request.url() + ' - ' + request.failure().errorText;
    errors.push(error);
    console.error('[REQUEST FAILED]', error);
  });

  try {
    console.log('🔍 正在访问 http://localhost:5173');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('✅ 页面加载完成');
    console.log('⏳ 等待 10 秒让 React 渲染...');
    await page.waitForTimeout(10000);

    // 详细检查页面状态
    const diagnostics = await page.evaluate(() => {
      const root = document.getElementById('root');

      return {
        url: window.location.href,
        title: document.title,
        rootExists: !!root,
        rootInnerHTML: root ? root.innerHTML.substring(0, 500) : null,
        rootChildren: root ? root.children.length : 0,
        bodyChildren: document.body.children.length,
        reactLoaded: typeof window.React !== 'undefined',
        hasContent: root ? root.innerHTML.length > 0 : false
      };
    });

    console.log('\n📊 诊断信息:');
    console.log(JSON.stringify(diagnostics, null, 2));

    // 截图
    await page.screenshot({ path: 'diagnostic-screenshot.png', fullPage: true });
    console.log('\n📸 已保存诊断截图: diagnostic-screenshot.png');

  } catch (error) {
    console.error('❌ 发生错误:', error);
    errors.push(error.message);
  }

  console.log('\n📋 错误总结:');
  console.log(`错误数量: ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
  }

  if (errors.length === 0) {
    console.log('✅ 没有发现 JavaScript 错误');
  }

  await browser.close();
})();
