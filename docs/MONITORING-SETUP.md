# 监控配置示例

本目录包含生产环境监控系统的配置示例文件。

## 📁 文件说明

### 1. Sentry配置示例
- `sentry.example.js` - Sentry错误追踪配置示例

### 2. Google Analytics配置
- `analytics.example.html` - Google Analytics集成示例

### 3. 环境变量配置
- `.env.production` - 生产环境变量示例

---

## 🔐 Sentry配置指南

### 步骤1: 获取Sentry DSN

1. 访问 https://sentry.io/
2. 创建账号并创建新项目
3. 获取 DSN（Data Source Name）

### 步骤2: 在前端集成Sentry

在 `public/index.html` 中添加：

```html
<script src="https://browser.sentry-cdn.com/7.114.0/bundle.min.js" integrity="sha384-5r/1VjCTrR+f+M5L0t9Gi3/W9Q43goIvKzkiLPQCK8oxX29JlRY1alQKSJP6XkdP1U1vVBq1pRRQ" crossorigin="anonymous"></script>
<script>
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",  // 替换为你的DSN
    environment: "production",
    tracesSampleRate: 1.0,
    replaysSessionRate: 0.1,
    beforeSend(event, hint) {
      // 过滤敏感信息
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
    }
  });
</script>
```

### 步骤3: 配置错误上报

```javascript
// 在 ErrorTracker 中配置上报URL
ErrorTracker.init({
    enabled: true,
    environment: 'production',
    reportUrl: '/api/error-report'  // 你的后端错误上报端点
});
```

---

## 📊 Google Analytics配置指南

### 步骤1: 创建GA4媒体资源

1. 访问 https://analytics.google.com/
2. 创建账号
3. 创建媒体资源
4. 获取测量ID（格式: G-XXXXXXXXXX）

### 步骤2: 集成Analytics

在 `public/index.html` 中配置：

```javascript
Analytics.init({
    enabled: true,
    trackingId: 'G-XXXXXXXXXX',  // 替换为实际ID
    debug: false
});
```

### 步骤3: 使用Analytics追踪

```javascript
// 追踪页面浏览
Analytics.trackPageView('活动列表页');

// 追踪事件
Analytics.trackEvent('button_click', {
    button_name: 'search',
    category: 'interaction'
});

// 追踪错误
Analytics.trackError('API请求失败');

// 追踪性能
Analytics.trackPerformance('page_load', 1234, 'performance');
```

---

## 🌍 环境变量配置

### 生产环境 (.env.production)

```bash
# 基础配置
NODE_ENV=production
PORT=3000

# 安全配置（必须设置！）
ADMIN_API_KEY=your-secure-api-key-here-please-change-this

# Sentry配置
SENTRY_DSN=https://x@example@sentry.io/project-id
SENTRY_ENVIRONMENT=production

# Google Analytics配置
GA_TRACKING_ID=G-XXXXXXXXXX

# 日志配置
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_ALERTS=true
```

### 开发环境 (.env.development)

```bash
NODE_ENV=development
PORT=3000
ADMIN_API_KEY=dev-api-key-change-in-production
SENTRY_DSN=
GA_TRACKING_ID=
LOG_LEVEL=debug
```

---

## 🔧 配置验证

### 验证Sentry配置

```bash
# 在项目根目录运行
node -e "console.log('Sentry DSN:', process.env.SENTRY_DSN)"
```

### 验证Analytics配置

```javascript
// 在浏览器控制台
Analytics.trackEvent('test', { test: 'validation' });
```

---

## 📝 配置检查清单

部署前检查：

- [ ] Sentry DSN已配置
- [ ] Google Analytics测量ID已配置
- [ ] ADMIN_API_KEY已更改为强密钥
- [ ] NODE_ENV=production已设置
- [ ] 错误上报端点已配置
- [ ] 测试错误追踪功能
- [ ] 测试Analytics事件追踪

---

## 🔗 相关文档

- [Sentry官方文档](https://docs.sentry.io/)
- [Google Analytics文档](https://developers.google.com/analytics)
- [API文档](./API-DOCUMENTATION.md)
- [部署指南](./DEPLOYMENT-GUIDE.md)

---

**配置示例版本**: v1.0
**最后更新**: 2026-01-29
**适用版本**: v2.6.0
