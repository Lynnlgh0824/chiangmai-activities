# gocnx 清迈活动指南 - 微信小程序版

## 使用方式

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入本目录 `miniprogram/`
3. 修改 `app.js` 中的 `apiBase` 为你的 API 地址
4. 修改 `project.config.json` 中的 `appid` 为你的小程序 AppID
5. 编译运行

## 需要的图标文件

在 `assets/` 目录下放置以下 tabBar 图标（81x81px PNG）：

```
assets/
├── tab-activity.png          # 活动 tab（未选中）
├── tab-activity-active.png   # 活动 tab（选中）
├── tab-guide.png             # 攻略 tab（未选中）
└── tab-guide-active.png      # 攻略 tab（选中）
```

## 目录结构

```
miniprogram/
├── app.json              # 小程序配置
├── app.js                # 全局逻辑（数据加载、缓存）
├── app.wxss              # 全局样式
├── project.config.json   # 项目配置
├── sitemap.json          # 搜索收录配置
├── utils/
│   ├── api.js            # API 请求封装
│   └── cache.js          # 本地缓存工具
├── pages/
│   ├── index/            # 首页（活动列表 + 筛选）
│   ├── detail/           # 活动详情
│   └── guide/            # 旅行攻略
└── assets/               # 图标资源
```

## 与 Web 版的关系

- **共用同一套后端 API**（Express server.cjs）
- **共用同一份数据**（items.json）
- Web 版零改动，小程序版独立运行
