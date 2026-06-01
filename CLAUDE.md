# CLAUDE.md - Chiang Mai Guide Platform

> **项目**: Chiang Mai Guide Platform (清迈活动指南)
> **版本**: v2.2.0
> **状态**: 活跃维护中

---

## 项目身份

**项目名称**: Chiang Mai Guide Platform
**一句话描述**: 面向清迈旅居者、数字游民和游客的本地活动信息聚合平台

Claude 必须 **NEVER** 引用其他项目的文件、代码或上下文。
Claude 必须 **ONLY** 在本目录内操作：`/Users/yuzhoudeshengyin/Documents/my_project/Chiangmai/`

---

## 核心文档（必读）

| 文档 | 内容 |
|------|------|
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | 项目背景、问题与解决方案 |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | 完整目录结构详解 |
| [PROJECT_RULES.md](PROJECT_RULES.md) | 代码规范、命名约定 |
| [CHANGELOG.md](CHANGELOG.md) | 版本变更历史 |
| [QUICK_START.md](QUICK_START.md) | 快速启动指南 |

---

## 技术栈

- **前端**: HTML5 + CSS3 + 原生 JavaScript (ES6+)
- **后端**: Node.js + Express.js
- **数据**: localStorage + JSON 文件
- **测试**: Playwright
- **部署**: 静态文件部署

---

## 项目结构

```
Chiengmai/
├── index.html              # 主页面（活动展示）
├── admin.html              # 管理后台 ⭐
├── debug_admin.html        # 调试工具
├── server.cjs              # Express 服务器
├── data/
│   └── items.json          # 活动数据（主文件）⭐
├── scripts/                # 自动化脚本
├── public/                 # 静态资源
├── src/                    # 源代码
├── docs/                   # 文档目录
├── memory/                 # 项目记忆
└── e2e/                    # E2E 测试
```

---

## 数据管理

### 主数据文件
- `data/items.json` - 活动数据主文件

### 数据备份
- `data/items.json.backup.*` - 自动备份文件
- 使用 `scripts/` 下的脚本进行数据同步

---

## 常用命令

```bash
# 启动服务
./start-services.sh

# 运行测试
./test-all.sh

# 数据同步
./sync-data.sh

# Excel 导入
./start-excel-sync.sh
```

---

## 状态机规则

活动状态流转:
```
draft → pending → ongoing → expired
         ↓
       rejected
```

---

## 架构约束

Claude 必须 **NOT**:
- 未经允许修改目录结构
- 未经允许重命名文件
- 未经允许移动文件
- 未经允许删除文件

Claude 必须:
- 保持现有结构
- 遵循既定模式
- 不破坏结构的前提下扩展代码

---

## 工作流程

每个任务必须遵循:

1. **理解** - 复述需求，确认理解
2. **设计** - 分析方案，识别风险
3. **确认** - 展示完整计划，等待批准
4. **执行** - 按计划执行，验证每步

---

## 安全规则

- 永远不暴露密钥
- 不提交 `.env`
- 不提交私钥
- 不提交 `items.json`（数据文件）

---

## Git 规则

- `git push` 仅用于跨设备同步，不自动执行
- commit message 用英文，简洁描述变更意图

---

## 重要笔记

- 管理后台: `admin.html`
- 数据质量检查: 使用 Playwright 测试框架
- Excel 同步: 参考 `EXCEL-IMPORT-GUIDE.md`

---

**Last Updated**: 2026-04-14
