# 清迈活动平台 - 访问链接汇总

**更新时间**: 2026-02-26

---

## 🌐 本地开发环境

### 主页面
- **本地**: http://localhost:4000
- **网络**: http://192.168.1.x:4000 (需要替换为实际IP)

### 移动端预览
- **iPhone 12 模拟**: 使用浏览器开发者工具切换到移动设备
- **自动预览脚本**: `node .ai-control/mobile-preview.cjs`

---

## 🌍 生产环境

### 主域名
- **Vercel**: https://gocnx.vercel.app

### 备用域名（如有）
- 检查 `package.json` 中的 `homepage` 字段
- 当前配置: `"homepage": "https://gocnx.vercel.app"`

---

## 📱 QR码访问

可以生成二维码，在手机上扫描访问：

```
http://localhost:4000
```

使用在线工具生成：https://qr.server.url2png.com

---

## 🔧 开发工具

### 浏览器开发者工具
1. 打开 Chrome/Safari
2. 按 F12 打开开发者工具
3. 点击"设备模拟"图标（或按 Ctrl+Shift+M）
4. 选择设备：
   - iPhone 12 Pro (390 x 844)
   - iPhone SE (375 x 667)
   - iPad (768 x 1024)

### Playwright E2E测试
```bash
# 运行测试
npm run test:e2e

# UI模式
npm run test:e2e:ui

# 查看报告
open test-results/index.html
```

---

## 📊 性能监控

### Lighthouse评分
- Chrome DevTools → Lighthouse
- 选择 "Mobile" 或 "Desktop"
- 运行审计

### 网络请求监控
- Chrome DevTools → Network
- 刷新页面查看所有请求

---

## 🆘 常见问题

### 端口被占用
```bash
# 查找占用4000端口的进程
lsof -ti:4000

# 杀死进程
kill -9 $(lsof -ti:4000)
```

### 页面缓存
```bash
# 强制刷新
Ctrl+Shift+R (Chrome)
Cmd+Shift+R (Safari)
```

### 移动端调试
```bash
# iOS模拟器
Xcode → Open Developer Tool → Simulator

# Android模拟器
Android Studio → AVD Manager
```

---

**生成时间**: 2026-02-26
**维护者**: Claude Code AI
