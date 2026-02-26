# 📊 数据同步指南

## 自动同步机制

项目已配置自动数据同步，确保线上线下数据一致。

### 🔧 自动同步方式

#### 1. Pre-commit 钩子（推荐）

每次提交 `data/` 目录的更改时，自动同步到 `public/data/`：

```bash
# 1. 编辑数据
vim data/items.json

# 2. 提交到 Git（自动同步）
git add data/items.json
git commit -m "update: 添加新活动"

# 3. 推送到 GitHub
git push
# → 触发 Vercel 自动部署 ✨
```

#### 2. 手动同步脚本

```bash
# 运行同步脚本
./sync-data.sh
```

#### 3. GitHub Actions（可选）

如果配置了 Vercel Token，推送到 main 分支会自动部署。

## 📁 目录结构

```
Chiengmai/
├── data/                    # 主数据源（本地开发）
│   ├── items.json          # 活动数据
│   └── guide.json          # 攻略数据
├── public/                  # 静态网站目录
│   ├── data/               # 同步的数据（生产环境）
│   │   ├── items.json      # 从 data/ 同步
│   │   └── guide.json      # 从 data/ 同步
│   └── index.html          # 主页面
└── sync-data.sh            # 同步脚本
```

## 🚀 更新数据的标准流程

### 方式一：使用 Git 自动同步（推荐）

```bash
# 1. 修改数据
vim data/items.json

# 2. 提交（pre-commit 钩子自动同步到 public/data/）
git add data/items.json
git commit -m "update: 更新活动信息"

# 3. 推送后自动部署
git push
```

### 方式二：手动同步后部署

```bash
# 1. 修改数据
vim data/items.json

# 2. 运行同步脚本
./sync-data.sh

# 3. 提交到 Git
git add public/data/
git commit -m "update: 同步数据"
git push
```

## 🌐 部署状态

- **生产环境**: https://go-cnx.vercel.app
- **数据文件**: https://go-cnx.vercel.app/data/items.json

## ⚠️ 注意事项

1. **只修改 `data/` 目录**：不要直接修改 `public/data/`
2. **提交前检查**：确保 `data/` 和 `public/data/` 内容一致
3. **自动同步**：Git pre-commit 钩子会自动同步
4. **部署时间**：通常 10-30 秒完成部署

## 🔍 验证数据一致性

```bash
# 检查两个文件是否一致
diff data/items.json public/data/items.json

# 或检查文件行数
wc -l data/items.json public/data/items.json
```

## 📝 配置 GitHub Actions 自动部署（可选）

如果要启用 GitHub Actions 自动部署：

1. 在 Vercel Dashboard 获取 Token：
   - Settings → Tokens → Create Token

2. 在 GitHub Repository 添加 Secrets：
   - Settings → Secrets and variables → Actions
   - 添加 `VERCEL_TOKEN`
   - 添加 `VERCEL_ORG_ID`（从 Vercel 项目设置获取）
   - 添加 `VERCEL_PROJECT_ID`（从 Vercel 项目设置获取）

3. 推送代码后自动部署

## 🛠️ 故障排查

### 数据不同步

```bash
# 手动同步
./sync-data.sh

# 或手动复制
cp data/items.json public/data/
cp data/guide.json public/data/
```

### Vercel 部署失败

```bash
# 手动部署
vercel --prod
```

### Git 钩子不工作

```bash
# 重新安装钩子
chmod +x .husky/pre-commit
git config core.hooksPath .husky
```
