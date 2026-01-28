# 清迈活动平台 - 生产环境部署指南

**版本**: v2.6.0
**最后更新**: 2026-01-29
**适用环境**: Linux, macOS, Windows Server

---

## 📋 目录

- [部署前准备](#部署前准备)
- [环境配置](#环境配置)
- [安装依赖](#安装依赖)
- [启动服务](#启动服务)
- [反向代理配置](#反向代理配置)
- [进程管理](#进程管理)
- [监控和日志](#监控和日志)
- [常见问题](#常见问题)

---

## 🔧 部署前准备

### 系统要求

**最低配置**:
- CPU: 1核
- 内存: 512MB
- 磁盘: 1GB
- Node.js: >= 16.x

**推荐配置**:
- CPU: 2核+
- 内存: 2GB+
- 磁盘: 10GB+
- Node.js: >= 18.x

### 所需软件

1. **Node.js** (>= 16.x)
2. **npm** (随Node.js安装)
3. **Git** (可选，用于版本控制)
4. **PM2** (推荐，用于进程管理)

---

## ⚙️ 环境配置

### 1. 安装Node.js

#### Linux (Ubuntu/Debian)

```bash
# 使用NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version  # 应显示 v18.x.x
npm --version
```

#### macOS

```bash
# 使用Homebrew
brew install node

# 验证安装
node --version
npm --version
```

#### Windows

下载并安装：
- Node.js官网: https://nodejs.org/
- 选择 LTS 版本

### 2. 克隆项目

```bash
git clone https://github.com/Lynnlgh0824/chiengmai-activities.git
cd chiengmai-activities
```

或下载并解压项目文件。

### 3. 安装PM2（推荐）

PM2是一个进程管理器，可以保持应用持续运行。

```bash
npm install -g pm2
```

---

## 🔐 安全配置

### 创建环境变量文件

在项目根目录创建 `.env` 文件：

```bash
# .env 文件内容
NODE_ENV=production
PORT=3000

# API密钥（必须设置！）
ADMIN_API_KEY=your-secure-api-key-here-please-change-this

# 数据文件路径
DATA_FILE=./data/items.json
GUIDE_FILE=./data/guide.json
VERSION_FILE=./data/version.json
APP_VERSION_FILE=./app-version.json
REQUIREMENTS_LOG_FILE=./data/requirements-log.json

# 飞书集成（可选）
FEISHU_APP_ID=your_feishu_app_id
FEISHU_APP_SECRET=your_feishu_app_secret
```

**重要安全提示**:
- ✅ 将 `.env` 添加到 `.gitignore`（已配置）
- ✅ 生产环境必须更改默认API密钥
- ✅ 不要将 `.env` 提交到Git
- ✅ 定期轮换API密钥

### 生成安全的API密钥

```bash
# 生成随机密钥（Linux/macOS）
openssl rand -hex 32

# 或使用Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📦 安装依赖

```bash
# 进入项目目录
cd chiengmai-activities

# 安装依赖
npm install

# 或使用淘宝镜像（国内用户）
npm install --registry=https://registry.npmmirror.com
```

### 验证安装

```bash
# 检查依赖是否安装成功
npm list --depth=0
```

应该看到类似输出：
```
chiengmai-activities@2.0.0
├── axios@1.13.3
├── cors@2.8.5
├── dotenv@16.4.1
├── express@4.18.2
├── multer@1.4.5-lts.1
└── xlsx@0.18.5
```

---

## 🚀 启动服务

### 开发模式

```bash
# 启动后端服务
npm start

# 或使用开发服务器（支持热重载）
npm run dev:server
```

服务将运行在 `http://localhost:3000`

### 生产模式（使用PM2）

```bash
# 启动应用
pm2 start server.cjs --name "chiengmai-api"

# 查看状态
pm2 status

# 查看日志
pm2 logs chiengmai-api

# 重启应用
pm2 restart chiengmai-api

# 停止应用
pm2 stop chiengmai-api

# 删除应用
pm2 delete chiengmai-api
```

### PM2开机自启动

```bash
# 保存当前PM2进程列表
pm2 save

# 生成开机启动脚本
pm2 startup

# 按照提示执行输出的命令
```

---

## 🌐 反向代理配置

### 使用Nginx

#### 安装Nginx

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install nginx
```

**macOS**:
```bash
brew install nginx
```

#### 配置Nginx

创建配置文件 `/etc/nginx/sites-available/chiengmai-activities`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    # 重定向到HTTPS（可选）
    # return 301 https://$server_name$request_uri;

    # 静态文件
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API路由
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 上传文件大小限制
    client_max_body_size 2M;
}
```

#### HTTPS配置（使用Let's Encrypt）

```bash
# 安装certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

#### 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/chiengmai-activities /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

---

### 使用Apache

#### 启用模块

```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite
```

#### 配置虚拟主机

编辑 `/etc/apache2/sites-available/chiengmai-activities.conf`:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/chiengmai-activities/public

    # 启用代理
    ProxyPreserveHost On
    ProxyRequests Off

    # API路由
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPassReverse /api/ http://localhost:3000/api/

    # 静态文件
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # 上传文件大小限制
    LimitRequestBody 2097152
</VirtualHost>
```

---

## 📊 监控和日志

### 使用PM2监控

```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show chiengmai-api

# 查看日志
pm2 logs chiengmai-api --lines 100
```

### 日志文件位置

应用日志位于：
- PM2日志: `~/.pm2/logs/`
- 应用日志: （如果配置了）

### 配置日志轮转

创建 `/etc/logrotate.d/chiengmai-activities`:

```
/home/user/.pm2/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reload chiengmai-api > /dev/null 2>&1 || true
    endscript
}
```

---

## 🔒 安全加固

### 1. 防火墙配置

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. 文件权限

```bash
# 设置正确的文件权限
chmod 755 public
chmod 644 public/*.html
chmod 600 .env

# uploads目录权限
mkdir -p uploads
chmod 755 uploads
```

### 3. 定期更新依赖

```bash
# 检查过时的依赖
npm outdated

# 更新依赖
npm update

# 或使用audit工具
npm audit fix
```

---

## 🧪 测试部署

### 1. 健康检查

```bash
curl http://localhost:3000/api/health
```

应该返回：
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-01-29T10:30:00.000Z"
}
```

### 2. API Key认证测试

```bash
# 测试API Key
curl -H "X-API-Key: your-api-key" \
  -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"title":"测试活动","description":"测试"}'

# 测试无API Key（应该返回401）
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"title":"测试活动","description":"测试"}'
```

### 3. 速率限制测试

```bash
# 快速发送多个请求测试速率限制
for i in {1..150}; do
  curl http://localhost:3000/api/activities &
done
wait
```

第101个请求应该返回429。

### 4. 前端访问测试

访问 `http://your-domain.com` 或 `http://localhost:3000`

检查：
- ✅ 页面正常加载
- ✅ 活动列表显示
- ✅ 搜索功能正常
- ✅ 分类筛选正常
- ✅ Tab切换正常

---

## 📝 环境变量最佳实践

### 生产环境必需变量

```bash
NODE_ENV=production              # 必需
ADMIN_API_KEY=your-secure-key    # 必需
PORT=3000                       # 可选（默认3000）
```

### 可选变量

```bash
# 飞书集成
FEISHU_APP_ID
FEISHU_APP_SECRET

# 自定义端口
PORT=8080

# 日志级别
LOG_LEVEL=info
```

---

## 🚀 常见部署场景

### 场景1: VPS部署

```bash
# 1. 连接到VPS
ssh user@your-vps-ip

# 2. 更新系统
sudo apt-get update && sudo apt-get upgrade -y

# 3. 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. 安装PM2
npm install -g pm2

# 5. 克隆项目
git clone https://github.com/Lynnlgh0824/chiengmai-activities.git
cd chiengmai-activities

# 6. 安装依赖
npm install

# 7. 配置环境变量
cp .env.example .env
nano .env  # 编辑ADMIN_API_KEY

# 8. 启动服务
pm2 start server.cjs --name "chiengmai-api"
pm2 save
pm2 startup

# 9. 配置防火墙
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 场景2: Docker部署

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制应用文件
COPY . .

# 创建数据目录
RUN mkdir -p data uploads

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.cjs"]
```

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ADMIN_API_KEY=${ADMIN_API_KEY}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: always
```

部署：
```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 重启
docker-compose restart
```

### 场景3: Vercel部署（无服务器）

由于项目需要文件上传和持久化存储，Vercel部署需要额外配置。

建议使用Vercel部署前端部分，后端使用其他服务。

---

## 🔄 更新部署

### 更新应用代码

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装新依赖
npm install

# 3. 重启应用
pm2 restart chiengmai-api
```

### 零停机部署

```bash
# 1. 拉取代码到新目录
git clone https://github.com/Lynnlgh0824/chiengmai-activities.git chiengmai-new

# 2. 安装依赖
cd chiengmai-new
npm install

# 3. 复制环境文件和数据
cp ../chiengmai-activities/.env .
cp -r ../chiengmai-activities/data .
cp -r ../chiengmai-activities/uploads .

# 4. 启动新版本
pm2 start server.cjs --name "chiengmai-api-v2"

# 5. 切换流量（更新Nginx配置指向新端口）
# 6. 停止旧版本
pm2 stop chiengmai-api
pm2 delete chiengmai-api

# 7. 重命名新版本
pm2 restart chiengmai-api-v2
pm2 delete chiengmai-api-v2
```

---

## 🐛 故障排查

### 问题1: 端口被占用

**症状**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**:
```bash
# 查找占用端口的进程
lsof -ti :3000

# 杀死进程
kill -9 $(lsof -ti :3000)

# 或使用PM2
pm2 stop chiengmai-api
```

### 问题2: 权限错误

**症状**:
```
Error: EACCES: permission denied
```

**解决方案**:
```bash
# 修复文件权限
chmod 755 public
chmod 600 .env

# 修复uploads目录
mkdir -p uploads
chmod 755 uploads
```

### 问题3: 模块未找到

**症状**:
```
Error: Cannot find module 'express'
```

**解决方案**:
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 问题4: 环境变量未加载

**症状**: API Key不工作

**解决方案**:
```bash
# 检查.env文件是否存在
ls -la .env

# 检查PM2是否加载了环境变量
pm2 env chiengmai-api

# 重启PM2以加载新的环境变量
pm2 restart chiengmai-api --update-env
```

---

## 📈 性能优化建议

### 1. 启用Gzip压缩

在Nginx配置中添加：
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. 配置CDN

将静态资源托管到CDN：
- CSS文件
- JavaScript文件
- 图片文件

### 3. 数据库迁移（可选）

当前使用JSON文件存储，如果数据量增大，建议迁移到数据库：
- MongoDB
- PostgreSQL
- MySQL

---

## 🔐 生产环境检查清单

部署前检查：

- [ ] Node.js已安装（版本 >= 16.x）
- [ ] .env文件已配置
- [ ] ADMIN_API_KEY已设置为强密钥
- [ ] 依赖已安装（`npm install`）
- [ ] PM2已安装并配置
- [ ] 防火墙已配置
- [ ] Nginx已配置并测试
- [ ] SSL证书已配置（HTTPS）
- [ ] API测试通过
- [ ] 前端访问正常
- [ ] 日志轮转已配置
- [ ] 监控已设置
- [ ] 备份策略已制定

---

## 📞 支持和帮助

### 文档

- [API文档](./API-DOCUMENTATION.md)
- [优化总结](./OPTIMIZATION-SUMMARY.md)
- [开发者指南](./DEVELOPER-GUIDE.md)
- [故障排查](./TROUBLESHOOTING.md)

### 获取帮助

如遇到问题，请：
1. 查看[故障排查指南](./TROUBLESHOOTING.md)
2. 检查日志文件
3. 查看[项目问题记录](./project-issues-log.md)

---

## 📅 维护计划

### 日常维护

- 每周：检查日志大小
- 每月：更新依赖包
- 每月：检查安全更新
- 每季度：审查API密钥

### 备份策略

- 数据文件：每日备份
- 配置文件：版本控制
- 环境变量：安全存储

---

**部署指南版本**: v1.0
**最后更新**: 2026-01-29
**适用版本**: v2.6.0
