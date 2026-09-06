# 清迈活动指南小程序（miniprogram）

微信小程序「清迈活动指南」前端工程，对应 AppID `wx330f8a72f90c7076`。

## 当前版本

- **版本号**：v1.0.9（2026-09-06）
- **代码大小**：44.8 KB（已上传 WeChat 体验版）
- **架构**：纯静态前端 + jsDelivr CDN 数据源（无后端依赖）

## 目录结构

```
miniprogram/
├── app.js          # 入口：环境检测 + 数据加载
├── app.json        # 全局配置（3 个 tab + tabBar）
├── app.wxss        # 全局样式
├── project.config.json       # 微信开发者工具配置
├── project.private.config.json
├── pages/
│   ├── index/      # 首页（6 tab + 4 下拉 + 列表卡片）
│   ├── detail/     # 活动详情页
│   └── guide/      # 攻略文档页
├── utils/
│   ├── api.js      # API 代理（CDN 模式下走内存）
│   └── cache.js    # 本地存储封装
├── assets/         # tabBar 图标
├── deploy.sh       # 一键部署（check/preview/upload）
├── start-dev.command  # 一键启动本地开发
└── _selftest-*.cjs # 逻辑自检脚本
```

## 数据源（v1.0.9 起）

| 环境 | 数据源 | 备注 |
|---|---|---|
| 本地开发 | `http://localhost:4000` | 需先启动 `start-dev.command` |
| 体验版/正式版 | `https://cdn.jsdelivr.net/gh/Lynnlgh0824/chiengmai-activities@main/data` | 公开 CDN，免认证 |

环境检测：`app.js` 用 `wx.getAccountInfoSync()` 判 `envVersion`，自动切换。

## 本地开发

```bash
# 一键启动（后端 + GUI）
bash start-dev.command
# 或手动：
PORT=4000 node server.cjs       # 终端 1
open -a /Applications/wechatwebdevtools.app --args ./miniprogram  # 终端 2
```

## 部署

```bash
bash deploy.sh check     # 检查 CLI/登录/逻辑自检
bash deploy.sh preview   # 生成体验版预览二维码
bash deploy.sh upload    # 上传到 WeChat 体验版
```

前提：开发者工具顶部菜单 → 设置 → 安全设置 → 开启「服务端口」+ 重启 + 扫码登录。

## 提交审核前

1. **小程序后台「开发管理 → 服务器域名」** 加白名单：
   - `request 合法域名`: `https://cdn.jsdelivr.net`
2. **类目**：工具 → 信息查询
3. **隐私政策 URL**：`https://cdn.jsdelivr.net/gh/Lynnlgh0824/chiengmai-activities@main/PRIVACY.md`
4. **文案**：参考 `../REVIEW.md`（项目根目录）
