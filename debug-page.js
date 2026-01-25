const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 监听所有控制台消息
  page.on('console', msg => {
    console.log(`浏览器控制台 [${msg.type()}]:`, msg.text());
  });

  // 监听页面错误
  page.on('pageerror', error => {
    console.error('页面错误:', error.message);
  });

  // 监听请求失败
  page.on('requestfailed', request => {
    console.error('请求失败:', request.url(), request.failure().errorText);
  });

  console.log('🔍 正在加载页面并监控错误...');

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log('✅ 页面加载完成');

    // 等待一下让任何 JavaScript 错误显现
    await page.waitForTimeout(5000);

    console.log('\n📊 页面状态总结:');
    const url = page.url();
    console.log(`当前 URL: ${url}`);

    const title = await page.title();
    console.log(`页面标题: ${title}`);

    // 检查 React 是否加载
    const reactLoaded = await page.evaluate(() => {
      return typeof window.React !== 'undefined' ||
             typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
    });
    console.log(`React 已加载: ${reactLoaded}`);

    // 检查 #root 内容
    const rootInfo = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        innerHTMLLength: root ? root.innerHTML.length : 0,
        innerHTML: root ? root.innerHTML.substring(0, 200) : null,
        childrenCount: root ? root.children.length : 0
      };
    });
    console.log('#root 状态:', rootInfo);

  } catch (error) {
    console.error('发生错误:', error);
  }

  console.log('\n按任意键关闭浏览器...');
  // 等待用户查看
  await new Promise(resolve => setTimeout(resolve, 10000));

  await browser.close();
})();
