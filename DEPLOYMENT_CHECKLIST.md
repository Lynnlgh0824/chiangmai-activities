# 清迈活动平台 - 上线检查清单

## ✅ 上线前检查

### 1. 代码构建
- [x] 生产构建成功 (`npm run build`)
- [x] 无编译错误
- [x] 打包大小合理（JS: 214KB, CSS: 16KB）

### 2. 功能测试
- [x] 活动列表显示正常
- [x] 搜索和筛选功能正常
- [x] 活动详情弹窗正常
- [x] 6个Tab分类显示正常
- [x] 日期导航功能正常
- [x] 后台管理界面正常
- [x] Tab栏悬浮固定正常

### 3. 数据检查
- [x] 后台API正常运行
- [x] 活动数据已导入（20条）
- [x] 数据格式正确

## 🚀 上线步骤

### 方案A：本地部署（当前）
```bash
# 启动后端
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai
npm start

# 启动前端（新终端）
npm run build
npm run preview
```

访问：
- 前端：http://localhost:4173
- 后台：http://localhost:3000/admin.html

### 方案B：云服务器部署（推荐）
1. 准备服务器（阿里云/腾讯云）
2. 安装 Node.js 环境
3. 上传代码到服务器
4. 安装依赖：`npm install --production`
5. 启动服务：`npm start`
6. 配置域名和SSL证书

### 方案C：容器化部署（Docker）
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 数据维护

### 日常维护流程

**添加新活动**：
1. 方式1：访问后台 http://your-domain/admin.html
2. 方式2：编辑Excel → 运行导入脚本

**批量更新活动**：
1. 导出当前数据（从后台手动复制）
2. 在Excel中批量编辑
3. 运行导入脚本更新

**数据备份**：
```bash
# 备份数据文件
cp data/items.json data/items-backup-$(date +%Y%m%d).json
```

## ⚠️ 注意事项

1. **端口配置**：
   - 后端默认：3000
   - 前端开发：5173
   - 前端预览：4173

2. **环境变量**：
   - API地址：`VITE_API_URL` (默认：http://localhost:3000)
   - 在 `.env` 文件中配置

3. **数据安全**：
   - 定期备份 `data/items.json`
   - 不要将 `.env` 提交到代码仓库
   - 生产环境使用环境变量

## 🔄 更新部署

**更新代码后**：
```bash
# 1. 拉取最新代码
git pull

# 2. 安装新依赖
npm install

# 3. 重新构建
npm run build

# 4. 重启服务
pm2 restart chiengmai
```

## 📞 技术支持

- 项目路径：`/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai`
- 启动命令：`npm start`
- 停止服务：`Ctrl + C` 或 `pm2 stop chiengmai`

---

生成时间：2026-01-25
版本：2.0.0
