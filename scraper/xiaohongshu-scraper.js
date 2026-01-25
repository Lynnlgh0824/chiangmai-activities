/**
 * 小红书清迈活动自动抓取脚本
 * 使用 Puppeteer 自动化浏览器操作
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');
const { writeToExcel, showPreview, determineActivityType } = require('./excel-writer');

// 使用隐身插件避免被检测
puppeteer.use(StealthPlugin());

// 配置
const CONFIG = {
  headless: false, // 设为 false 可看到浏览器操作
  searchKeywords: ['清迈活动', '清迈瑜伽', '清迈体验', 'Chiang Mai activity', 'เชียงใหม่'],
  maxScrolls: 5, // 最多滚动次数
  delayBetweenActions: 2000, // 操作间延迟（毫秒）
  outputDir: path.join(__dirname, '../data/scrapped'),
};

/**
 * 延迟函数
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 随机延迟（模拟人类行为）
 */
const randomDelay = async () => {
  const time = Math.random() * 2000 + 1000; // 1-3秒随机延迟
  await delay(time);
};

/**
 * 提取活动信息
 */
function extractActivityInfo(postContent) {
  const info = {
    title: '',
    description: '',
    price: '',
    date: '',
    time: '',
    location: '',
    category: '其他',
    images: [],
    url: '',
  };

  // 提取标题
  const titleMatch = postContent.match(/^(.{5,50})/);
  if (titleMatch) info.title = titleMatch[1].trim();

  // 提取价格
  const pricePatterns = [
    /(\d+฿)/,
    /(\d+泰铢)/,
    /(\d+THB)/,
    /(\d+บาท)/,
    /免费/,
    /Free/i,
  ];
  for (const pattern of pricePatterns) {
    const match = postContent.match(pattern);
    if (match) {
      info.price = match[0];
      break;
    }
  }

  // 提取时间
  const timePatterns = [
    /(\d{1,2}:\d{2})/,
    /(\d+月\d+日)/,
    /(周[一二三四五六七])/,
    /(每天|每周)/,
  ];
  for (const pattern of timePatterns) {
    const match = postContent.match(pattern);
    if (match) {
      info.time += match[0] + ' ';
    }
  }

  // 提取地点（清迈相关）
  const locationPatterns = [
    /清迈([^，。\n]{2,10})/,
    /宁曼路/,
    /古城/,
    /塔佩门/,
    /素贴山/,
    /湄平河/,
    /เชียงใหม่/,
  ];
  for (const pattern of locationPatterns) {
    const match = postContent.match(pattern);
    if (match) {
      info.location = match[0];
      break;
    }
  }

  // 提取分类
  if (postContent.includes('瑜伽') || postContent.includes('Yoga')) info.category = '瑜伽';
  else if (postContent.includes('冥想') || postContent.includes('meditation')) info.category = '冥想';
  else if (postContent.includes('烹饪') || postContent.includes('美食')) info.category = '美食体验';
  else if (postContent.includes('泰拳') || postContent.includes('拳击')) info.category = '户外探险';
  else if (postContent.includes('课程') || postContent.includes('学习')) info.category = '文化艺术';

  info.description = postContent.substring(0, 200);

  return info;
}

/**
 * 滚动页面加载更多内容
 */
async function scrollPage(page) {
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
  });
  await delay(1000);
}

/**
 * 抓取搜索结果页
 */
async function scrapeSearchResults(page, keyword) {
  console.log(`\n🔍 正在搜索: ${keyword}`);

  const activities = [];

  // 访问搜索页面
  const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
  await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  await randomDelay();

  // 滚动加载更多内容
  for (let i = 0; i < CONFIG.maxScrolls; i++) {
    console.log(`  📜 滚动加载第 ${i + 1} 次...`);
    await scrollPage(page);
    await randomDelay();
  }

  // 提取帖子信息
  const posts = await page.evaluate(() => {
    const postElements = document.querySelectorAll('.note-item, .feeds-page .note-item');
    const results = [];

    postElements.forEach((el, index) => {
      const titleEl = el.querySelector('.title, .note-title');
      const linkEl = el.querySelector('a');
      const imgEl = el.querySelector('img');

      results.push({
        index: index + 1,
        title: titleEl?.textContent || '',
        url: linkEl?.href || '',
        image: imgEl?.src || '',
      });
    });

    return results;
  });

  console.log(`  ✅ 找到 ${posts.length} 个相关帖子`);

  // 逐个访问帖子页面
  for (const post of posts.slice(0, 10)) { // 限制只访问前10个
    if (!post.url) continue;

    console.log(`  📖 正在读取: ${post.title || '无标题'}`);
    await page.goto(post.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await randomDelay();

    // 提取帖子内容
    const postDetail = await page.evaluate(() => {
      const titleEl = document.querySelector('.title, .note-title, h1');
      const contentEl = document.querySelector('.note-text, .content, .desc');
      const images = Array.from(document.querySelectorAll('img'))
        .map(img => img.src)
        .filter(src => src && !src.includes('avatar'));

      return {
        title: titleEl?.textContent || '',
        content: contentEl?.textContent || '',
        images: images.slice(0, 3), // 只取前3张图
      };
    });

    // 解析活动信息
    const activityInfo = extractActivityInfo(postDetail.content);
    activityInfo.url = post.url;
    activityInfo.images = postDetail.images;
    activityInfo.title = postDetail.title || activityInfo.title;

    // 只保存有意义的活动
    if (activityInfo.title || activityInfo.description) {
      activities.push(activityInfo);
      console.log(`    ✅ 已提取: ${activityInfo.title || '活动'}`);
    }

    await randomDelay();
  }

  return activities;
}

/**
 * 保存数据到文件
 */
async function saveData(data, keyword) {
  try {
    await fs.mkdir(CONFIG.outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `xiaohongshu-${keyword}-${timestamp}.json`;
    const filepath = path.join(CONFIG.outputDir, filename);

    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`\n💾 数据已保存到: ${filepath}`);

    return filepath;
  } catch (error) {
    console.error('❌ 保存数据失败:', error);
    throw error;
  }
}

/**
 * 导出为 CSV 格式
 */
async function exportToCSV(data, keyword) {
  const headers = ['标题', '分类', '价格', '时间', '地点', '描述', '链接', '图片'];

  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.price}"`,
      `"${item.time}"`,
      `"${item.location}"`,
      `"${(item.description || '').replace(/"/g, '""').substring(0, 50)}"`,
      `"${item.url}"`,
      `"${(item.images[0] || '').replace(/"/g, '""')}"`,
    ].join(','))
  ].join('\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `xiaohongshu-${keyword}-${timestamp}.csv`;
  const filepath = path.join(CONFIG.outputDir, filename);

  await fs.writeFile(filepath, '\uFEFF' + csvContent, 'utf8'); // 添加 BOM 以支持中文
  console.log(`\n📊 CSV 已导出: ${filepath}`);

  return filepath;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 小红书清迈活动爬虫启动');
  console.log('=' .repeat(50));

  let browser;
  try {
    // 启动浏览器
    console.log('\n🌐 正在启动浏览器...');

    // 直接使用系统 Chrome
    const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080',
      ],
      defaultViewport: { width: 1920, height: 1080 },
    });

    const page = await browser.newPage();

    // 设置用户代理
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('✅ 浏览器启动成功');

    // 首次访问需要手动登录
    console.log('\n⚠️  如果需要登录，请在浏览器中完成登录操作');
    console.log('⚠️  登录后按回车继续...\n');

    // 等待用户登录
    await page.goto('https://www.xiaohongshu.com', { waitUntil: 'networkidle2' });

    // 如果需要登录，给用户30秒时间
    console.log('⏰ 给您 30 秒时间登录...');
    await delay(30000);

    // 开始抓取
    const allActivities = [];

    for (const keyword of CONFIG.searchKeywords) {
      const activities = await scrapeSearchResults(page, keyword);
      allActivities.push(...activities);
      await delay(3000); // 关键词之间延迟3秒
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 抓取完成！共获取 ${allActivities.length} 条活动信息`);

    // 显示数据预览
    showPreview(allActivities);

    // 写入到 Excel 表格
    console.log('\n📥 正在写入 Excel 表格...');
    try {
      const result = await writeToExcel(allActivities);
      console.log(`\n✅ Excel 写入成功！`);
      console.log(`   - 总计: ${result.total} 条`);
      console.log(`   - 固定频率活动: ${result.regular} 条`);
      console.log(`   - 临时活动: ${result.temporary} 条`);
    } catch (error) {
      console.error(`\n⚠️  Excel 写入失败:`, error.message);
      console.log(`💡 您可以手动导入 JSON 文件`);
    }

    // 同时保存 JSON 和 CSV（作为备份）
    await saveData(allActivities, 'chiangmai-activities');
    await exportToCSV(allActivities, 'chiangmai-activities');

    console.log('\n✅ 所有任务完成！');

  } catch (error) {
    console.error('\n❌ 发生错误:', error);
  } finally {
    if (browser) {
      console.log('\n🔚 正在关闭浏览器...');
      await browser.close();
    }
  }
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { extractActivityInfo, scrapeSearchResults };
