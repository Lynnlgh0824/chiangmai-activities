# 数据更新流程（v1.0.9 起）

> 本文档说明：怎么把"新活动"或"改活动"推到线上让小程序用户看到。

## 核心原理

v1.0.9 起，小程序代码里的 `PROD_DATA` 指向：
```
https://cdn.jsdelivr.net/gh/Lynnlgh0824/chiengmai-activities@main/data
```

`@main` 表示始终取 GitHub `main` 分支最新版。**所以：**
- 改了 `data/items.json` → 推到 GitHub → 等 jsDelivr 同步 → 用户自动看到
- **不用重新上传小程序代码**（代码读 `items.json` 内容，不读版本号）

## 标准更新流程（5 步）

### ① 编辑数据

两种方式：
- **A. Excel 编辑**（适合运营）：编辑 `清迈活动数据.xlsx` → 用 `npm run import-excel:smart` 转成 JSON
- **B. 直接改 JSON**（适合开发者）：编辑 `data/items.json`

### ② 本地校验

```bash
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiangmai
node miniprogram/_selftest-h5data.cjs   # 21/21 必须全绿
```

### ③ 同步 + commit + push

```bash
# 同步到 public（Vercel 静态部署需要）
cp -f data/items.json public/data/items.json
cp -f data/guide.json public/data/guide.json
git add data/ public/data/
git commit -m "data: 更新 5 条新活动（2026-09-XX）"
git push origin main
```

### ④ 等 jsDelivr 同步（关键！）

- 首次推送：通常 **30 秒 ~ 5 分钟**
- 重复推送同名文件：jsDelivr 缓存**最长 12 小时**

**绕开缓存的 3 种方法：**

| 方法 | 操作 | 适用场景 |
|---|---|---|
| 用 commit hash | `git rev-parse HEAD` 拿到 SHA，改 `app.js` 里 `@main` 为 `@SHA`，重传代码 | 强一致需求 |
| 用版本 tag | 打 `git tag v1.x.y && git push --tags`，改 `@main` 为 `@v1.x.y` | 长期稳定版本 |
| 等 jsDelivr purge | https://www.jsdelivr.com/tools/purge 输入 URL 强制刷新 | 临时性测试 |

### ⑤ 验证

```bash
curl -sS -o /dev/null -w "HTTP %{http_code}  size %{size_download}B\n" \
  'https://cdn.jsdelivr.net/gh/Lynnlgh0824/chiengmai-activities@main/data/items.json'
```

或打开小程序，**杀掉重开**（杀掉微信后台进程，确保 `wx.setStorageSync` 缓存过期）。

## ⚠️ 缓存兜底说明

小程序有 6 小时本地缓存（`utils/cache.js`）。
- 缓存命中 → 直接显示，不打网络
- 缓存过期 → 打网络刷新
- 网络失败 → 用旧缓存兜底（永远不白屏）

所以**用户最多延迟 6 小时看到新数据**。如需立即生效：
- 让用户清理小程序缓存（微信 → 设置 → 通用 → 存储空间 → 清迈活动指南 → 清除）
- 或用上面 commit hash 强一致方案

## 紧急回滚

如果新数据有严重错误需要立即撤回：
```bash
git revert HEAD         # 撤销最近一次 commit
git push origin main    # 等 jsDelivr 同步（30s-5min）
```

不涉及代码改动，无需重传小程序。
