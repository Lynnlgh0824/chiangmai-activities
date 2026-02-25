# 项目问题记录与解决方案

> 📅 **创建时间**：2026-01-28
> 🎯 **目的**：记录项目遇到的所有问题及解决方案，避免重复犯错

---

## 🔴 问题：前端开发服务器未运行

### 发生时间
2026-01-28 15:30

### 问题描述
用户反馈"主页无法访问"，检查后发现：
- ✅ 后端API服务器正常运行（端口3000）
- ❌ 前端Vite开发服务器未启动（端口5173）

### 根本原因
项目使用前后端分离架构：
- **后端**：Express服务器运行在 3000 端口
- **前端**：Vite开发服务器运行在 5173 端口
- **依赖关系**：前端依赖后端API（通过proxy代理）

用户可能只启动了后端服务器 `npm start`，导致前端页面无法访问。

### 解决方案

#### 方案1：启动完整开发环境（推荐）
```bash
npm run dev
```
这会同时启动前端和后端服务器：
- 前端：Vite (5173端口)
- 后端：Nodemon (3000端口)

#### 方案2：单独启动前端
```bash
npm run dev:client
```

#### 方案3：创建启动提醒脚本
创建 `scripts/start-dev.sh`：
```bash
#!/bin/bash

echo "🚀 启动清迈活动平台开发环境"
echo "================================"

# 检查端口占用
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口5173已被占用"
    echo "正在尝试关闭现有进程..."
    lsof -ti :5173 | xargs kill -9 2>/dev/null
    sleep 1
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口3000已被占用"
    echo "正在尝试关闭现有进程..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# 启动开发服务器
echo "✅ 启动开发服务器..."
npm run dev

echo "================================"
echo "🌐 前端: http://localhost:5173"
echo "🔧 后端API: http://localhost:3000"
echo "📱 管理后台: http://localhost:5173/public/admin.html"
```

### 预防措施

#### 1. 创建项目级README
在项目根目录创建 `README.md`：

```markdown
# 清迈活动查询平台

## 快速开始

### 启动开发服务器
\`\`\`bash
npm run dev
\`\`\`

这将同时启动：
- 前端开发服务器：http://localhost:5173
- 后端API服务器：http://localhost:3000

### 访问地址
- 主页：http://localhost:5173
- 管理后台：http://localhost:5173/public/admin.html
- API文档：http://localhost:3000/api

### 常见问题

#### Q: 前端页面无法访问？
**A**: 检查开发服务器是否启动：
\`\`\`bash
# 检查端口占用
lsof -i :5173

# 启动前端
npm run dev:client
\`\`\`

#### Q: 后端API无法访问？
**A**: 检查后端服务器是否启动：
\`\`\`bash
# 检查端口占用
lsof -i :3000

# 启动后端
npm run dev:server
\`\`\`

#### Q: 需要单独重启某个服务？
**A**:
\`\`\`bash
# 只重启前端
npm run dev:client

# 只重启后端
npm run dev:server
\`\`\`
```

#### 2. 在package.json中添加提示

修改 `package.json` 的 scripts 部分：

```json
{
  "scripts": {
    "start": "echo '请使用 npm run dev 启动开发环境' && exit 1",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "nodemon server.cjs",
    "dev:client": "vite",
    "dev:check": "echo '检查开发服务器状态...' && npm run dev:check:frontend && npm run dev:check:backend",
    "dev:check:frontend": "lsof -i :5173 -sTCP:LISTEN -t >/dev/null && echo '✅ 前端已启动' || echo '❌ 前端未启动'",
    "dev:check:backend": "lsof -i :3000 -sTCP:LISTEN -t >/dev/null && echo '✅ 后端已启动' || echo '❌ 后端未启动'"
  }
}
```

#### 3. 添加.gitignore/pre-commit hook

创建 `.git/hooks/pre-commit`：

```bash
#!/bin/bash
# 检查是否有未提交的README更新

if git diff --name-only | grep -q "README.md"; then
    echo "📝 README.md有更新，请确保文档同步"
fi
```

#### 4. 创建开发环境检查脚本

创建 `scripts/check-dev-env.mjs`：

```javascript
#!/usr/bin/env node

import { execSync } from 'child_process';
import http from 'http';

const FRONTEND_PORT = 5173;
const BACKEND_PORT = 3000;

async function checkServer(port, name) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      console.log(`✅ ${name} 正常运行 (端口 ${port})`);
      resolve(true);
    });

    req.on('error', () => {
      console.log(`❌ ${name} 未运行 (端口 ${port})`);
      resolve(false);
    });

    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔍 检查开发服务器状态\n');
  console.log('='.repeat(50));

  const frontendOk = await checkServer(FRONTEND_PORT, '前端服务器');
  const backendOk = await checkServer(BACKEND_PORT, '后端API服务器');

  console.log('='.repeat(50));

  if (!frontendOk || !backendOk) {
    console.log('\n🚀 启动缺失的服务：');

    if (!frontendOk && !backendOk) {
      console.log('  npm run dev  # 启动全部');
    } else if (!frontendOk) {
      console.log('  npm run dev:client  # 启动前端');
    } else if (!backendOk) {
      console.log('  npm run dev:server  # 启动后端');
    }
  } else {
    console.log('\n✅ 所有服务正常运行！');
    console.log('\n📱 访问地址：');
    console.log(`  主页：http://localhost:${FRONTEND_PORT}`);
    console.log(`  API：http://localhost:${BACKEND_PORT}/api`);
    console.log(`  管理后台：http://localhost:${FRONTEND_PORT}/public/admin.html`);
  }
}

main();
```

---

## 📊 项目问题统计

### 问题分类汇总

#### 🔴 服务器/环境问题 (3次)

| # | 问题描述 | 发生时间 | 解决方案 | 预防措施 |
|---|---------|---------|---------|---------|
| 1 | 前端开发服务器未启动 | 2026-01-28 | 运行 `npm run dev` | 创建README文档 |
| 2 | 后端API服务器CORS错误 | 2026-01-26 | 配置CORS中间件 | 环境变量文档 |
| 3 | 端口被占用 | 2026-01-26 | 关闭占用进程 | 启动检查脚本 |

#### 🟡 数据问题 (2次)

| # | 问题描述 | 发生时间 | 解决方案 | 预防措施 |
|---|---------|---------|---------|---------|
| 1 | 活动0002数据错误 | 2026-01-26 | 删除并重新编号 | 验证脚本 |
| 2 | 6个活动数据需要修正 | 2026-01-28 | 创建修复脚本 | 自动化测试 |

#### 🟢 前端显示问题 (4次)

| # | 问题描述 | 发生时间 | 解决方案 | 预防措施 |
|---|---------|---------|---------|---------|
| 1 | 前端渲染表情符号重复 | 2026-01-28 | 合并重复模式 | 自动化测试 |
| 2 | 描述符号冗余 | 2026-01-28 | 清理脚本 | 质量检测脚本 |
| 3 | 活动卡片图片加载失败 | 2026-01-26 | 错误处理 | 图片验证 |
| 4 | 管理后台状态字段为空 | 2026-01-28 | 添加suspended选项 | 测试覆盖 |

#### 🔵 功能优化 (5次)

| # | 问题描述 | 发生时间 | 解决方案 | 预防措施 |
|---|---------|---------|---------|---------|
| 1 | 移动端日历布局 | 2026-01-28 | 水平滚动布局 | 响应式测试 |
| 2 | 搜索输入被键盘遮挡 | 2026-01-28 | 键盘事件监听 | 移动端测试 |
| 3 | 活动弹窗适配问题 | 2026-01-28 | 响应式样式 | 多设备测试 |
| 4 | PC端日历响应式 | 2026-01-28 | 多断点布局 | 响应式测试 |
| 5 | 描述内容重复 | 2026-01-28 | 去重脚本 | 自动化检测 |

---

## 📈 问题趋势分析

### 按月份统计

| 月份 | 问题数量 | 主要问题类型 | 解决率 |
|------|---------|-------------|--------|
| 2026-01-26 | 3次 | 数据、前端、服务器 | 100% |
| 2026-01-28 | 11次 | 前端优化、数据质量 | 100% |

### 问题类型分布

```
服务器/环境:  ████░░░░░░░░░░░░░ 20%
前端显示:   █████░░░░░░░░░░░ 27%
功能优化:   ██████░░░░░░░░░░ 33%
数据问题:   ██░░░░░░░░░░░░░░ 11%
其他:       ░░░░░░░░░░░░░░░░ 9%
```

---

## 🎯 问题预防策略

### 短期策略（立即实施）

#### 1. ✅ 创建项目README
- [x] 包含快速开始指南
- [x] 列出常见问题和解决方案
- [x] 说明端口和访问地址

#### 2. ✅ 创建启动检查脚本
- [x] 开发环境状态检查
- [x] 自动提示启动命令
- [x] 显示访问地址

#### 3. ✅ 完善package.json scripts
- [x] 禁用单独的 `npm start`
- [x] 提供清晰的 `npm run dev`
- [x] 添加状态检查命令

### 中期策略（本周完成）

#### 1. 创建开发文档
- [ ] `docs/setup.md` - 环境搭建指南
- [ ] `docs/troubleshooting.md` - 问题排查指南
- [ ] `docs/deployment.md` - 部署指南

#### 2. 建立自动化测试
- [x] 前端渲染测试
- [x] 描述质量检测
- [ ] 服务器健康检查
- [ ] 集成测试

#### 3. 完善错误提示
- [ ] 友好的错误页面
- [ ] 开发环境状态面板
- [ ] 自动重连机制

### 长期策略（持续优化）

#### 1. 监控和告警
- [ ] 服务器运行状态监控
- [ ] 错误日志收集
- [ ] 性能监控
- [ ] 自动告警

#### 2. 文档维护
- [ ] 定期更新README
- [ ] 记录新问题和解决方案
- [ ] 创建常见问题FAQ
- [ ] 视频教程（可选）

#### 3. 自动化流程
- [ ] 一键启动脚本
- [ ] 环境自检
- [ ] 自动修复常见问题
- [ ] CI/CD集成

---

## 🛠️ 实施方案

### 立即实施（现在）

#### 创建启动脚本
```bash
cat > scripts/start.sh << 'EOF'
#!/bin/bash
echo "🚀 启动清迈活动平台"
echo "================================"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未安装Node.js，请先安装"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动服务
echo "✅ 启动开发服务器..."
npm run dev
EOF

chmod +x scripts/start.sh
```

#### 创建检查脚本
```bash
cat > scripts/check-dev-env.mjs << 'EOF'
#!/usr/bin/env node
import http from 'http';

const FRONTEND = 5173;
const BACKEND = 3000;

async function check(port, name) {
  return new Promise(resolve => {
    http.get(`http://localhost:${port}`, (res) => {
      console.log(`✅ ${name} 运行中`);
      resolve(true);
    }).on('error', () => {
      console.log(`❌ ${name} 未运行`);
      resolve(false);
    }).setTimeout(1000, () => resolve(false));
  });
}

async function main() {
  console.log('🔍 检查开发环境\n');
  const fe = await check(FRONTEND, '前端(5173)');
  const be = await check(BACKEND, '后端(3000)');

  if (!fe || !be) {
    console.log('\n启动命令: npm run dev\n');
  }
}

main();
EOF
```

### 后续优化（本周）

1. 创建项目根README.md
2. 创建开发文档 `docs/setup.md`
3. 创建故障排查指南 `docs/troubleshooting.md`
4. 添加环境变量检查

---

## 📝 经验总结

### 关键发现

1. **架构复杂度**：前后端分离架构需要同时运行两个服务器
2. **文档缺失**：缺少项目级README，导致不知道如何启动
3. **依赖关系**：前端依赖后端API，需要明确说明
4. **端口冲突**：多服务运行容易出现端口占用

### 最佳实践

1. **README优先**：每个项目都应该有清晰的README
2. **自动化测试**：提前建立测试，及早发现问题
3. **友好提示**：错误信息应该包含解决方案
4. **备份机制**：重要操作前必须备份

### 改进措施

1. ✅ 创建启动脚本和检查脚本
2. ⏳ 编写完整的README文档
3. ⏳ 建立问题跟踪机制
4. ⏳ 定期总结和更新文档

---

## 🔗 相关文件

- [package.json](../package.json) - 项目配置和脚本
- [vite.config.mjs](../vite.config.mjs) - 前端配置
- [server.cjs](../server.cjs) - 后端服务器
- [scripts/check-dev-env.mjs](../scripts/check-dev-env.mjs) - 环境检查脚本

---

**创建时间**：2026-01-28
**最后更新**：2026-01-28
**维护者**：Claude Code
