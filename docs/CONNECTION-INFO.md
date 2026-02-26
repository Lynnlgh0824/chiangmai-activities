# 清迈项目 - 最新连接地址和访问信息

**更新时间**: 2026-01-29 15:14
**项目版本**: v2.6.0
**Git Commit**: b1836bf

---

## 🌐 访问地址

### 本地访问

```bash
# 主页
http://localhost:3000

# 后台管理
http://localhost:3000/admin.html

# API健康检查
http://localhost:3000/api/health

# 测试仪表板
http://localhost:3000/tests/test-dashboard-enhanced.html
```

### 局域网访问（从其他设备）

```bash
# 使用本机IP访问
http://192.168.1.133:3000

# 主页
http://192.168.1.133:3000/

# 后台管理
http://192.168.1.133:3000/admin.html

# API健康检查
http://192.168.1.133:3000/api/health
```

### 外网访问（如果已部署）

**Vercel部署地址**:
```bash
# 主页
https://go-cnx.vercel.app

# API端点
https://go-cnx.vercel.app/api/health
```

**GitHub仓库**:
```bash
https://github.com/Lynnlgh0824/chiangmai-activities
```

---

## 🚀 启动服务器

### 方式1: 启动后端服务器（已运行 ✅）

```bash
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai
npm start
```

**状态**: ✅ 服务器已运行（PID: 57702）
**端口**: 3000
**进程**: `node server.cjs`

### 方式2: 开发模式（前后端同时）

```bash
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai
npm run dev
```

**说明**:
- 同时启动前端和后端
- 前端: Vite开发服务器（端口: 5173）
- 后端: Express服务器（端口: 3000）

### 重启服务器

```bash
# 查找并终止现有进程
lsof -ti :3000 | xargs kill -9

# 重新启动
npm start
```

---

## 📱 移动设备测试

### iPhone/iPad (Safari)

```bash
# 1. 确保设备和Mac在同一WiFi
# 2. 在Safari中访问:
http://192.168.1.133:3000

# 3. 或使用localhost（仅在Mac本机上）
http://localhost:3000
```

### Android (Chrome)

```bash
# 在Chrome中访问:
http://192.168.1.133:3000
```

### 浏览器开发者工具测试

```bash
# 1. 打开Chrome
# 2. 访问: http://localhost:3000
# 3. 按F12打开开发者工具
# 4. 按Cmd+Shift+M切换到移动设备模式
# 5. 选择设备: iPhone 12 Pro
```

---

## 🔌 API端点

### 基础端点

```bash
# 健康检查
GET /api/health
curl http://localhost:3000/api/health

# 获取所有活动
GET /api/activities
curl http://localhost:3000/api/activities

# 获取单个活动
GET /api/activities/:id
curl http://localhost:3000/api/activities/0016

# 获取分类列表
GET /api/categories
curl http://localhost:3000/api/categories
```

### 管理端点

```bash
# 创建活动
POST /api/activities
curl -X POST http://localhost:3000/api/activities \
  -H "Content-Type: application/json" \
  -H "X-API-Key: chiangmai-2024-activities-api-key" \
  -d '{"title":"测试活动","category":"测试","location":"测试"}'

# 更新活动
PUT /api/activities/:id
curl -X PUT http://localhost:3000/api/activities/0016 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: chiangmai-2024-activities-api-key" \
  -d '{"title":"更新后的标题"}'

# 删除活动
DELETE /api/activities/:id
curl -X DELETE http://localhost:3000/api/activities/0016 \
  -H "X-API-Key: chiangmai-2024-activities-api-key"
```

---

## 📊 当前运行状态

### 服务器状态

```json
{
  "status": "✅ 运行中",
  "pid": 57702,
  "port": 3000,
  "uptime": "运行中",
  "last_check": "2026-01-29 15:14"
}
```

### Git状态

```bash
当前分支: main
最新Commit: b1836bf
Commit信息: "feat: PC端与移动端增强测试系统 + 自动更新功能 (v2.6.0)"
远程仓库: github.com:Lynnlgh0824/chiangmai-activities
同步状态: ✅ 已同步最新版本
```

### 最近更新

```bash
最新Commit: b1836bf
作者: Claude Code
日期: 2026-01-29
包含内容:
- PC端与移动端增强测试系统
- 自动更新功能
- 14个测试套件
- ~312个测试用例
```

---

## 🛠️ 开发工具

### 测试页面

```bash
# 增强测试仪表板（推荐）
http://localhost:3000/tests/test-dashboard-enhanced.html

# 自动化测试仪表板
http://localhost:3000/tests/test-automation-dashboard.html

# 移动端测试页面
http://localhost:3000/tests/test-mobile-verification.html

# PC端测试页面
http://localhost:3000/tests/test-desktop-verification.html
```

### 调试工具

```bash
# 查看服务器日志
tail -f server.log

# 查看实时日志
npm run dev:server

# 运行测试套件
npm test

# 运行E2E测试
npm run test:e2e
```

---

## 📂 项目结构

```
chiangmai-activities/
├── public/                    # 前端文件
│   ├── index.html           # 主应用页面 ⭐
│   ├── admin.html           # 后台管理 ⭐
│   └── tests/               # 测试页面
│       ├── test-dashboard-enhanced.html  ⭐
│       └── test-automation-dashboard.html
├── server.cjs               # Express服务器 ⭐
├── data/                    # 数据文件
│   ├── items.json          # 活动数据 ⭐
│   └── guide.json          # 攻略数据
├── docs/                    # 文档
│   ├── API.md              # API文档
│   ├── README.md           # 项目说明
│   └── UPDATE-LOG-2026-01-28-to-01-29.md
└── scripts/                 # 工具脚本
    ├── fix-touch-targets.sh
    └── fix-mobile-calendar.sh
```

---

## 🔐 安全信息

### API密钥

```bash
# API密钥（用于管理端点）
X-API-Key: chiangmai-2024-activities-api-key
```

⚠️ **注意**: 请勿在公开代码中暴露API密钥

### 环境变量

```bash
# .env 文件
PORT=3000
NODE_ENV=development
```

---

## 📱 快速测试

### 1. 测试API连接

```bash
# 健康检查
curl http://localhost:3000/api/health

# 预期响应
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-01-29T07:14:59.646Z"
}
```

### 2. 测试移动端布局

```bash
# 1. 打开Chrome
# 2. 访问: http://localhost:3000
# 3. 按F12打开开发者工具
# 4. 按Cmd+Shift+M切换移动设备模式
# 5. 选择设备: iPhone 12 Pro
# 6. 检查:
#    - 所有按钮≥44px×44px ✅
#    - 日历为3列布局 ✅
#    - 可以正常滚动 ✅
```

### 3. 测试后台管理

```bash
# 访问后台管理页面
http://localhost:3000/admin.html

# 测试功能:
# - ✅ 查看活动列表
# - ✅ 添加新活动
# - ✅ 编辑活动
# - ✅ 删除活动
# - ✅ 搜索活动
```

---

## 🔄 更新代码

### 获取最新代码

```bash
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai

# 拉取最新代码
git pull origin main

# 或者强制重置到最新版本
git fetch origin
git reset --hard origin/main
```

### 更新依赖

```bash
# 安装/更新依赖
npm install

# 如果有新依赖
npm update
```

### 重启服务器

```bash
# 停止现有服务器
lsof -ti :3000 | xargs kill -9

# 重新启动
npm start
```

---

## 📞 常用操作

### 查看日志

```bash
# 查看服务器日志（最后100行）
tail -100 server.log

# 实时查看日志
tail -f server.log
```

### 停止服务器

```bash
# 查找进程
lsof -ti :3000

# 停止进程
kill 57702

# 或强制停止
kill -9 57702
```

### 查看端口占用

```bash
# 查看3000端口占用
lsof -i :3000

# 查看所有Node进程
ps aux | grep node
```

---

## 🎯 快速开始

### 第一次使用

```bash
# 1. 进入项目目录
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai

# 2. 安装依赖
npm install

# 3. 启动服务器
npm start

# 4. 访问应用
# 在浏览器中打开: http://localhost:3000
```

### 日常使用

```bash
# 1. 启动服务器
npm start

# 2. 访问应用
# 本地: http://localhost:3000
# 局域网: http://192.168.1.133:3000

# 3. 测试功能
# - 查看活动列表
# - 搜索活动
# - 查看活动详情
# - 使用后台管理
```

---

## 📚 相关文档

### 项目文档

- **[README.md](README.md)** - 项目说明
- **[CHANGELOG.md](CHANGELOG.md)** - 更新日志
- **[docs/API.md](docs/API.md)** - API文档
- **[docs/DEPLOYMENT-GUIDE.md](docs/DEPLOYMENT-GUIDE.md)** - 部署指南

### 测试文档

- **[docs/TEST-REQUIREMENTS-UPDATE-GUIDE.md](docs/TEST-REQUIREMENTS-UPDATE-GUIDE.md)** - 测试需求更新指南
- **[docs/ENHANCED-TEST-INTEGRATION.md](docs/ENHANCED-TEST-INTEGRATION.md)** - 增强测试集成
- **[docs/PC-MOBILE-TEST-ARCHITECTURE.md](docs/PC-MOBILE-TEST-ARCHITECTURE.md)** - 测试架构

---

## 🔍 故障排除

### 问题1: 端口被占用

```bash
# 查看占用端口的进程
lsof -i :3000

# 停止进程
kill -9 [PID]

# 或使用不同端口
PORT=3001 npm start
```

### 问题2: API无响应

```bash
# 检查服务器状态
curl http://localhost:3000/api/health

# 如果无响应，重启服务器
npm start

# 查看错误日志
tail -f server.log
```

### 问题3: 页面无法访问

```bash
# 1. 确认服务器正在运行
lsof -i :3000

# 2. 检查防火墙设置
# macOS: 系统偏好设置 → 安全性与隐私 → 防火墙

# 3. 尝试用其他浏览器访问
# Safari, Chrome, Firefox

# 4. 清除浏览器缓存
# Chrome: Cmd+Shift+Delete
```

---

## 📞 技术支持

如有问题，请检查：

1. ✅ 服务器是否运行（http://localhost:3000/api/health）
2. ✅ 端口3000是否被占用
3. ✅ 浏览器控制台是否有错误
4. ✅ 网络连接是否正常

---

**创建时间**: 2026-01-29 15:14
**项目版本**: v2.6.0
**Git Commit**: b1836bf
**服务器状态**: ✅ 运行中（PID: 57702）
**端口**: 3000

**下一步**: 访问 http://localhost:3000 或 http://192.168.1.133:3000
