/**
 * 爬虫配置文件
 * 根据需要修改这些参数
 */

module.exports = {
  // 浏览器配置
  browser: {
    headless: false, // false = 显示浏览器窗口，true = 后台运行
    windowSize: {
      width: 1920,
      height: 1080,
    },
    // 启动参数
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  },

  // 搜索配置
  search: {
    keywords: [
      '清迈活动',
      '清迈瑜伽',
      '清迈体验',
      '清迈课程',
      'Chiang Mai yoga',
      'Chiang Mai activity',
    ],
    maxScrolls: 5, // 每个搜索结果滚动几次
    maxPostsPerKeyword: 10, // 每个关键词最多抓取几个帖子
  },

  // 行为配置
  behavior: {
    delayBetweenActions: 2000, // 操作间基础延迟（毫秒）
    randomDelay: true, // 是否添加随机延迟（模拟人类）
    loginWaitTime: 30000, // 登录等待时间（毫秒）
  },

  // 数据输出
  output: {
    dir: '../data/scrapped', // 输出目录
    formats: ['json', 'csv'], // 导出格式
    timestamp: true, // 文名是否添加时间戳
  },

  // 用户代理
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // 是否保存截图（用于调试）
  debug: {
    saveScreenshots: false,
    screenshotDir: '../data/screenshots',
  },
};
