# 🚀 快速开始指南

## 5分钟上手小红书爬虫

### 步骤 1: 进入目录
```bash
cd scraper
```

### 步骤 2: 一键启动
```bash
./run.sh
```

或者直接运行：
```bash
npm start
```

### 步骤 3: 扫码登录
1. 浏览器会自动打开小红书
2. **30秒内**用手机小红书扫码登录
3. 等待爬虫自动开始工作

### 步骤 4: 查看结果
数据保存在：
```
data/scrapped/xiaohongshu-chiangmai-activities-时间戳.json
data/scrapped/xiaohongshu-chiangmai-activities-时间戳.csv
```

---

## 📥 导入数据到应用

### 方法1: 自动导入
```bash
node import-data.js
```

### 方法2: 手动导入
1. 打开 `data/scrapped/` 目录
2. 用 Excel 查看 CSV 文件
3. 手动编辑后通过应用界面导入

---

## ⚙️ 自定义配置

编辑 `config.js` 文件：

```javascript
// 修改搜索关键词
keywords: [
  '清迈瑜伽',
  '清迈烹饪课',
  'Chiang Mai tour',
],

// 修改抓取数量
maxPostsPerKeyword: 20,  // 每个关键词抓20个帖子
```

---

## 🐛 常见问题

### Q: 无法启动浏览器？
```bash
# macOS
确保已安装 Chrome 浏览器

# Ubuntu/Debian
sudo apt-get install chromium-browser
```

### Q: 无法访问小红书？
- 检查网络连接
- 可能需要科学上网

### Q: 登录后没有数据？
- 检查关键词是否正确
- 尝试增加 `maxScrolls` 值
- 查看浏览器窗口是否有错误

### Q: 想要更快的速度？
修改 `config.js`：
```javascript
delayBetweenActions: 1000,  // 减少延迟（谨慎使用）
```

---

## 📊 输出数据格式

### JSON 格式
```json
[
  {
    "title": "清迈瑜伽早课",
    "category": "瑜伽",
    "price": "500฿",
    "time": "每天 9:00-11:00",
    "location": "宁曼路",
    "description": "...",
    "images": ["url1", "url2"],
    "url": "帖子链接"
  }
]
```

### CSV 格式
可以用 Excel 直接打开，包含：
- 标题
- 分类
- 价格
- 时间
- 地点
- 描述
- 链接
- 图片

---

## 🎯 使用技巧

1. **首次使用**：建议用 `headless: false` 观察运行过程
2. **定时抓取**：使用 cron 定时任务每天运行
3. **数据验证**：导入前先用 Excel 检查 CSV
4. **避免封号**：不要频繁运行，建议间隔1小时+

---

## 📞 需要帮助？

查看详细文档：`README.md`

测试环境：`npm test`
