# 小红书清迈活动爬虫使用指南

## 📋 简介

这是一个基于 Puppeteer 的自动化爬虫，用于从小红书抓取清迈相关的活动信息。

### ✨ 新功能：自动写入 Excel

爬虫现在可以**自动将抓取的数据写入到【清迈活动数据.xlsx】**中！

**特性：**
- ✅ 智能分类（固定频率 vs 临时活动）
- ✅ 自动字段映射（18个字段）
- ✅ 直接追加到现有表格
- ✅ 自动备份原文件

📖 **详细指南**: 查看 [EXCEL-GUIDE.md](EXCEL-GUIDE.md)

## 🚀 快速开始

### 1. 安装依赖

```bash
cd scraper
npm install
```

### 2. 修改配置（可选）

编辑 `config.js` 文件，自定义爬虫参数：

```javascript
module.exports = {
  browser: {
    headless: false, // 显示浏览器窗口
  },
  search: {
    keywords: ['清迈瑜伽', '清迈活动'], // 搜索关键词
    maxPostsPerKeyword: 10, // 每个关键词抓取帖子数
  },
};
```

### 3. 运行爬虫

```bash
npm start
```

## 📝 使用步骤

### 方式一：手动登录模式（推荐）

1. 运行 `npm start`
2. 浏览器会自动打开小红书网站
3. **30秒内完成扫码登录**（使用手机小红书扫码）
4. 登录后按回车继续，或等待30秒自动继续
5. 爬虫会自动搜索、滚动、提取数据
6. 数据保存在 `data/scrapped/` 目录

### 方式二：无头模式（需要 cookies）

1. 修改 `config.js`：`headless: true`
2. 需要先保存登录 cookies（高级功能）
3. 运行爬虫

## 📊 输出文件

爬取完成后会生成两个文件：

### 1. JSON 格式
```json
[
  {
    "title": "清迈早间瑜伽课程",
    "category": "瑜伽",
    "price": "500฿",
    "time": "每天 9:00-11:00",
    "location": "清迈宁曼路",
    "description": "...",
    "images": ["...", "..."],
    "url": "https://..."
  }
]
```

### 2. CSV 格式
可以直接用 Excel 打开，包含以下列：
- 标题
- 分类
- 价格
- 时间
- 地点
- 描述
- 链接
- 图片

## ⚙️ 配置说明

### 搜索关键词
```javascript
keywords: [
  '清迈活动',      // 中文搜索
  '清迈瑜伽',
  'Chiang Mai',    // 英文搜索
  'เชียงใหม่',    // 泰文搜索
]
```

### 抓取数量
```javascript
maxScrolls: 5,              // 滚动5次加载更多
maxPostsPerKeyword: 10,     // 每个关键词最多抓10个帖子
```

### 延迟设置（避免被检测）
```javascript
delayBetweenActions: 2000,  // 每次操作间隔2秒
randomDelay: true,          // 随机延迟1-3秒
```

## 🎯 数据导入

抓取完成后，可以将数据导入到应用中：

### 方法1：使用 API
```bash
curl -X POST http://localhost:3000/api/activities/import \
  -H "Content-Type: application/json" \
  -d @data/scrapped/xiaohongshu-chiangmai-activities-xxx.json
```

### 方法2：在应用中添加导入功能

在您的应用中添加一个导入按钮，读取 JSON 文件并批量创建活动。

## 🔧 高级功能

### 1. 定时任务

使用 cron 定时运行爬虫：

```bash
# 每天早上8点抓取
0 8 * * * cd /path/to/scraper && npm start
```

### 2. Docker 容器化

```dockerfile
FROM node:18

WORKDIR /app
COPY scraper/ ./
RUN npm install

CMD ["npm", "start"]
```

### 3. 集成到现有应用

在 `server.js` 中添加爬虫 API：

```javascript
app.post('/api/scraper/run', async (req, res) => {
  const { run } = require('./scraper/xiaohongshu-scraper');
  const results = await run();
  res.json(results);
});
```

## ⚠️ 注意事项

1. **登录问题**
   - 小红书需要登录才能查看完整内容
   - 建议使用扫码登录，不要频繁登录
   - Cookies 有效期约7天

2. **反爬虫**
   - 不要设置过短的延迟
   - 不要频繁运行（建议间隔1小时以上）
   - 使用随机延迟模拟人类行为

3. **法律合规**
   - 仅用于个人学习和研究
   - 不要商用
   - 遵守小红书服务条款

4. **数据质量**
   - 自动提取可能不准确
   - 建议人工审核后再导入应用

## 🐛 故障排查

### 问题1：无法启动浏览器
```bash
# Ubuntu/Debian
sudo apt-get install -y \
  chromium-browser \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libnss3 \
  libcups2 \
  libxss1 \
  libxrandr2 \
  libasound2 \
  libpangocairo-1.0-0 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libgtk-3-0
```

### 问题2：抓取不到数据
- 检查是否登录成功
- 增加延迟时间
- 检查关键词是否正确

### 问题3：被限制访问
- 停止运行1-2小时
- 更换 IP 地址
- 增加延迟时间到5-10秒

## 📞 支持

如有问题，请检查：
1. Node.js 版本（建议 18+）
2. 依赖是否正确安装
3. 网络连接是否正常
4. 小红书是否可访问

## 📄 许可

MIT License - 仅用于学习目的
