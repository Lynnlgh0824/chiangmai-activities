# 清迈活动平台 - 开发者快速入门指南

**目标读者**: 新加入项目的开发者
**版本**: v2.6.0
**最后更新**: 2026-01-29

---

## 🚀 5分钟快速开始

### 1. 环境准备

```bash
# 检查Node.js版本
node --version  # 需要 >= 16.x

# 检查npm版本
npm --version

# 如果未安装，从 https://nodejs.org/ 下载安装
```

### 2. 克隆项目

```bash
git clone https://github.com/Lynnlgh0824/chiengmai-activities.git
cd chiengmai-activities
```

### 3. 安装依赖

```bash
npm install
```

### 4. 配置环境变量

```bash
# 创建.env文件
cp .env.example .env

# 编辑.env，设置ADMIN_API_KEY
nano .env
```

`.env` 文件内容：
```bash
NODE_ENV=development
PORT=3000
ADMIN_API_KEY=dev-api-key-change-in-production
```

### 5. 启动服务

```bash
# 开发模式（推荐）
npm run dev

# 或仅启动后端
npm start
```

### 6. 访问应用

- 主页: http://localhost:3000
- API健康检查: http://localhost:3000/api/health

---

## 📁 项目结构速览

```
chiengmai-activities/
├── public/
│   ├── index.html          # 主页（核心前端代码，~5000行）
│   ├── admin.html         # 后台管理
│   └── sw.js              # Service Worker
├── server.cjs              # Express服务器（~2000行）
├── data/
│   ├── items.json         # 活动数据
│   ├── guide.json         # 攻略数据
│   └── version.json       # 版本信息
├── docs/                  # 文档目录
├── scripts/               # 工具脚本
└── tests/                 # 测试文件
```

---

## 🔑 核心功能说明

### 6个Tab导航架构

| Tab | 名称 | 用途 | 数据筛选 |
|-----|------|------|----------|
| Tab 0 | 兴趣班 | 瑜伽、冥想等6个分类 | 兴趣班分类 |
| Tab 1 | 市集 | 周市集活动 | category='市集' |
| Tab 2 | 音乐 | 独立音乐Tab | category='音乐' |
| Tab 3 | 灵活时间活动 | 灵活时间活动 | flexibleTime=true |
| Tab 4 | 活动网站 | 官方网站链接 | source.url存在 |
| Tab 5 | 攻略信息 | 活动攻略 | - |

### 核心API端点

#### 读操作（无需认证）
```bash
GET /api/activities        # 获取所有活动
GET /api/items            # 获取项目
GET /api/guide           # 获取攻略
GET /api/health          # 健康检查
```

#### 写操作（需要API Key）
```bash
POST /api/activities     # 创建活动（需认证）
PUT /api/activities/:id # 更新活动（需认证）
DELETE /api/activities/:id # 删除活动（需认证）

# 使用示例
curl -H "X-API-Key: your-api-key" \
  -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"title":"新活动"}'
```

---

## 🛠️ 常用开发命令

### 服务器操作

```bash
# 启动开发服务器
npm run dev

# 启动生产服务器
npm start

# 使用PM2管理进程
pm2 start server.cjs --name "api"
pm2 logs api
pm2 restart api
pm2 stop api
```

### 数据管理

```bash
# 导出数据到JSON
npm run export-data

# 添加唯一ID
npm run add-ids

# 导入Excel数据
npm run import-excel:smart
```

### 测试

```bash
# 运行所有测试
npm test

# 运行E2E测试
npm run test:e2e

# 测试UI模式
npm run test:e2e:ui
```

---

## 🔧 调试技巧

### 1. 查看日志

```javascript
// 性能监控输出
// ⏱️  fetchActivities: 123ms

// 缓存命中提示
// ✅ 缓存命中: http://localhost:3000/api/activities

// 慢请求警告
// ⚠️  慢请求检测: POST /api/items - 1250ms
```

### 2. 测试API

```bash
# 测试健康检查
curl http://localhost:3000/api/health

# 测试API认证
curl -H "X-API-Key: dev-api-key-change-in-production" \
  -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"title":"测试"}'

# 测试速率限制
for i in {1..150}; do
  curl http://localhost:3000/api/activities &
done
```

### 3. 清除缓存

```javascript
// 在浏览器控制台
APICache.clear();

// 或刷新页面（Ctrl+Shift+R）
```

---

## 📚 重要文档速查

| 文档 | 路径 | 用途 |
|------|------|------|
| API文档 | [docs/API-DOCUMENTATION.md](./docs/API-DOCUMENTATION.md) | API端点和认证 |
| 优化总结 | [docs/OPTIMIZATION-SUMMARY.md](./docs/OPTIMIZATION-SUMMARY.md) | 四阶段优化详情 |
| 部署指南 | [docs/DEPLOYMENT-GUIDE.md](./docs/DEPLOYMENT-GUIDE.md) | 生产环境部署 |
| 性能报告 | [docs/PERFORMANCE-TEST-REPORT.md](./docs/PERFORMANCE-TEST-REPORT.md) | 性能测试结果 |
| 架构文档 | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 系统架构说明 |
| 项目需求 | [docs/PROJECT_REQUIREMENTS.md](./docs/PROJECT_REQUIREMENTS.md) | 完整需求文档 |
| 架构变更日志 | [docs/ARCHITECTURE-CHANGELOG-6TABS.md](./docs/ARCHITECTURE-CHANGELOG-6TABS.md) | 6个Tab架构变更 |

---

## 🎯 开发工作流

### 添加新功能

1. **修改数据**: 编辑 Excel → `npm run export-data`
2. **添加代码**: 编辑 `public/index.html` 或 `server.cjs`
3. **测试功能**: 访问 http://localhost:3000 测试
4. **提交代码**: `git add . && git commit -m "message"`
5. **推送代码**: `git push origin main`

### 调试问题

1. **检查日志**: `pm2 logs api`
2. **查看环境变量**: `pm2 env api`
3. **重启服务**: `pm2 restart api`
4. **查看端口占用**: `lsof -i :3000`

---

## 🔐 安全最佳实践

### 开发环境
```bash
# 使用默认API Key
ADMIN_API_KEY=dev-api-key-change-in-production
```

### 生产环境
```bash
# 必须更改API Key
ADMIN_API_KEY=生成的安全密钥
NODE_ENV=production
```

### API调用示例

```javascript
// 前端调用API（需要认证）
fetch('/api/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'  // 生产环境
  },
  body: JSON.stringify(data)
})
```

---

## 📊 性能优化工具

项目已集成以下性能工具：

```javascript
// 1. API缓存（自动）
await APICache.fetch('/api/activities');

// 2. 性能监控
PerfMonitor.start('operation');
// ... 执行操作
PerfMonitor.end('operation');

// 3. 错误追踪
ErrorTracker.captureError(error, { context: 'data' });

// 4. 性能告警
AlertSystem.init({
    thresholds: {
        slowRequest: 1000
    }
});
```

---

## 🧪 测试指南

### 单元测试

```bash
# 运行测试
npm test

# 查看覆盖率
npm run test:ui
```

### E2E测试

```bash
# 运行E2E测试
npm run test:e2e

# UI模式
npm run test:e2e:ui

# 调试模式
npm run test:e2e:debug
```

### 测试仪表板

访问: http://localhost:3000/test-dashboard-enhanced.html

包含10个测试套件，82个测试用例。

---

## 🚨 常见问题

### Q: API返回401/403错误？

**A**: 检查是否添加了API Key：
```javascript
headers: {
  'X-API-Key': 'your-api-key'
}
```

### Q: CORS错误？

**A**: 检查CORS配置是否允许你的域名：
- 开发: `http://localhost:5173`, `http://localhost:3000`
- 生产: `https://chiengmai-activities.vercel.app`

### Q: 端口被占用？

**A**:
```bash
# 查找占用进程
lsof -i :3000

# 终止进程
kill -9 $(lsof -ti :3000)
```

### Q: 数据更新不显示？

**A**:
```bash
# 清除浏览器缓存
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)

# 或手动清除APICache
# 在控制台执行: APICache.clear()
```

---

## 🔗 相关链接

- **GitHub**: https://github.com/Lynnlgh0824/chiengmai-activities
- **在线Demo**: https://chiengmai-activities.vercel.app
- **文档中心**: [./docs/](./docs/)

---

## 💡 开发提示

### 代码规范

- 前端代码在 `public/index.html`（~5000行）
- 后端代码在 `server.cjs`（~2000行）
- 所有代码包含详细注释

### 调试模式

```javascript
// 启用详细日志（开发环境）
logger.debug('调试信息');

// 生产环境自动禁用debug日志
```

### 性能分析

```javascript
// 测量操作耗时
PerfMonitor.measure('operationName', async () => {
    await doSomething();
});
```

---

## 📞 获取帮助

- 📖 查看完整文档
- 🐛 查看[故障排查指南](./TROUBLESHOOTING.md)
- 💬 提交Issue
- 📧 联系维护者

---

**开发者指南版本**: v1.0
**适用版本**: v2.6.0
**最后更新**: 2026-01-29
**状态**: ✅ 最新

---

**🎉 欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。**
