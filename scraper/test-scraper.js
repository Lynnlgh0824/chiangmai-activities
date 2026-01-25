/**
 * 测试爬虫功能
 * 用于验证环境和基本功能
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

console.log('🧪 开始测试爬虫环境...\n');

async function testBrowserLaunch() {
  console.log('1️⃣ 测试浏览器启动...');
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // 测试访问一个网站
    await page.goto('https://example.com', { waitUntil: 'networkidle2' });
    const title = await page.title();

    console.log('   ✅ 浏览器启动成功');
    console.log('   ✅ 页面加载成功:', title);

    await browser.close();
    return true;
  } catch (error) {
    console.error('   ❌ 浏览器启动失败:', error.message);
    return false;
  }
}

async function testXiaohongshuAccess() {
  console.log('\n2️⃣ 测试小红书访问...');
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // 访问小红书首页
    await page.goto('https://www.xiaohongshu.com', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const title = await page.title();
    console.log('   ✅ 小红书访问成功');
    console.log('   📄 页面标题:', title);

    await browser.close();
    return true;
  } catch (error) {
    console.error('   ❌ 小红书访问失败:', error.message);
    console.log('   💡 提示: 可能需要科学上网');
    return false;
  }
}

async function testDataExtraction() {
  console.log('\n3️⃣ 测试数据提取功能...');

  const { extractActivityInfo } = require('./xiaohongshu-scraper');

  const testContent = `
    清迈瑜伽早课
    时间：每天早上9:00-11:00
    地点：宁曼路瑜伽馆
    价格：500฿/节，首次免费体验
    适合所有级别的瑜伽爱好者
    包含瑜伽垫和茶点
  `;

  const result = extractActivityInfo(testContent);

  console.log('   ✅ 数据提取测试完成');
  console.log('   📊 提取结果:');
  console.log('      - 标题:', result.title);
  console.log('      - 价格:', result.price);
  console.log('      - 时间:', result.time);
  console.log('      - 地点:', result.location);
  console.log('      - 分类:', result.category);

  return result;
}

async function testFileWrite() {
  console.log('\n4️⃣ 测试文件写入权限...');
  try {
    const testDir = path.join(__dirname, '../data/scrapped');
    await fs.mkdir(testDir, { recursive: true });

    const testFile = path.join(testDir, 'test-write.json');
    await fs.writeFile(testFile, JSON.stringify({ test: 'success' }), 'utf8');

    console.log('   ✅ 文件写入成功');
    console.log('   📁 测试文件:', testFile);

    // 清理测试文件
    await fs.unlink(testFile);

    return true;
  } catch (error) {
    console.error('   ❌ 文件写入失败:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('  爬虫环境测试');
  console.log('========================================\n');

  const results = {
    browser: await testBrowserLaunch(),
    xiaohongshu: await testXiaohongshuAccess(),
    extraction: await testDataExtraction(),
    fileWrite: await testFileWrite(),
  };

  console.log('\n========================================');
  console.log('  测试结果汇总');
  console.log('========================================\n');

  console.log('浏览器启动:', results.browser ? '✅ 通过' : '❌ 失败');
  console.log('小红书访问:', results.xiaohongshu ? '✅ 通过' : '❌ 失败');
  console.log('数据提取:', results.extraction ? '✅ 通过' : '❌ 失败');
  console.log('文件写入:', results.fileWrite ? '✅ 通过' : '❌ 失败');

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    console.log('\n🎉 所有测试通过！可以开始使用爬虫了。');
    console.log('\n📖 使用方法: npm start\n');
  } else {
    console.log('\n⚠️  部分测试失败，请检查环境配置。');
    console.log('\n💡 建议:');
    if (!results.xiaohongshu) {
      console.log('   - 检查网络连接');
      console.log('   - 确认是否需要科学上网');
    }
    if (!results.browser) {
      console.log('   - 安装 Chrome/Chromium 浏览器');
      console.log('   - Ubuntu: sudo apt-get install chromium-browser');
    }
  }
}

// 运行测试
runAllTests().catch(console.error);
