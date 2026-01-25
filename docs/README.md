# 📚 项目文档目录

> 📅 最后更新：2026-01-25

---

## 📂 目录结构

```
docs/
├── API.md              # API 完整文档
├── ARCHITECTURE.md     # 系统架构文档
├── technical/          # 技术文档 (8个)
├── data/               # 数据相关文档 (3个)
├── integration/        # 第三方集成文档 (2个)
├── maintenance/        # 维护文档 (1个)
├── reports/            # 工作报告 (2个)
└── README.md           # 本文件
```

---

## 📁 technical/ - 技术文档

技术实现和问题修复相关文档。

| 文档 | 说明 |
|------|------|
| [AI-IMPORT-QUICKSTART.md](technical/AI-IMPORT-QUICKSTART.md) | AI 智能导入功能使用指南 |
| [问题排查指南.md](technical/问题排查指南.md) | 草稿功能问题排查（206 行）|
| [问题诊断步骤.md](technical/问题诊断步骤.md) | 后台管理问题诊断（161 行）|
| [编辑功能修复报告.md](technical/编辑功能修复报告.md) | 编辑功能问题修复 |
| [状态字段功能说明.md](technical/状态字段功能说明.md) | 活动状态字段说明 |
| [弹窗按钮悬浮布局.md](technical/弹窗按钮悬浮布局.md) | UI 布局文档 |
| [免费部署指南.md](technical/免费部署指南.md) | Vercel/Railway 部署 |
| [快速参考卡片.md](technical/快速参考卡片.md) | 快速参考 |
| [数据实时联动修复报告.md](technical/数据实时联动修复报告.md) | 联动功能修复 |

---

## 📊 data/ - 数据相关文档

数据结构、字段说明和数据源文档。

| 文档 | 说明 |
|------|------|
| [chiangmai-activities-sources.md](data/chiangmai-activities-sources.md) | ⭐ 清迈活动资讯网站清单（含链接验证）|
| [活动字段说明-详细版.md](data/活动字段说明-详细版.md) | 活动数据字段详细说明 |
| [活动录入表格-使用说明.md](data/活动录入表格-使用说明.md) | 数据录入表格使用指南 |

### 链接验证结果（2026-01-25）

- ✅ 有效：16 个
- ❌ 失效：29 个
- ⚠️ 重定向：10 个

> 💡 提示：失效链接已标注 ❌，可使用 `node scripts/verify-links.js` 重新验证

---

## 🔌 integration/ - 第三方集成文档

第三方平台集成相关文档。

| 文档 | 说明 |
|------|------|
| [飞书集成指南.md](integration/飞书集成指南.md) | 飞书企业版集成方案 |
| [飞书个人版集成指南.md](integration/飞书个人版集成指南.md) | 飞书个人版集成方案 |

---

## 📝 reports/ - 工作报告

历史工作总结和测试报告。

| 文档 | 说明 |
|------|------|
| [测试报告.md](reports/测试报告.md) | 功能测试报告 |
| [今日工作总结-2025-01-25.md](reports/今日工作总结-2025-01-25.md) | 2025-01-25 工作总结 |

---

## 📄 根目录文档

项目根目录保留的文档。

| 文档 | 说明 |
|------|------|
| [CLAUDE.md](../CLAUDE.md) | 项目总体说明 |
| [FILENAME-UPDATE-SUMMARY.md](../FILENAME-UPDATE-SUMMARY.md) | 文件命名规范 |
| [今日工作总结.md](../今日工作总结.md) | 通用工作总结 |
| [免费部署指南.md](../免费部署指南.md) | Vercel/Railway 部署指南 |
| [快速参考卡片.md](../快速参考卡片.md) | 快速参考 |
| [快速同步指南.md](../快速同步指南.md) | 数据同步指南 |
| [推送代码步骤.md](../推送代码步骤.md) | Git 推送步骤 |
| [数据实时联动修复报告.md](../数据实时联动修复报告.md) | 联动功能修复 |
| [项目地址总览.md](../项目地址总览.md) | 项目信息 |

---

## 🔧 维护工具

### 验证网站链接

```bash
node scripts/verify-links.js
```

验证 `docs/data/chiangmai-activities-sources.md` 中的所有链接。

详见：[VERIFY_LINKS_SCHEDULE.md](maintenance/VERIFY_LINKS_SCHEDULE.md)

---

## 📝 文档规范

### 创建新文档时

1. **选择正确的目录**
   - 技术实现 → `technical/`
   - 数据相关 → `data/`
   - 第三方集成 → `integration/`
   - 工作报告 → `reports/`

2. **命名规范**
   - 使用中文命名（便于搜索）
   - 或使用英文命名（便于协作）
   - 避免特殊字符

3. **添加元数据**
   ```markdown
   > 📅 创建日期：YYYY-MM-DD
   > 🎯 目标：文档目的
   > 👤 作者：可选
   ```

### 更新文档时

1. 在文档顶部添加 `最后更新日期`
2. 标注过时内容（使用 ⚠️ 或 ❌）
3. 删除已无用的内容

---

## 🎯 快速导航

| 我想... | 查看文档 |
|---------|----------|
| 了解数据源 | [chiangmai-activities-sources.md](data/chiangmai-activities-sources.md) |
| 添加新活动 | [活动录入表格-使用说明.md](data/活动录入表格-使用说明.md) |
| 修复 bug | [问题排查指南.md](technical/问题排查指南.md) |
| 集成飞书 | [飞书集成指南.md](integration/飞书集成指南.md) |
| 部署项目 | [免费部署指南.md](../免费部署指南.md) |
| 推送代码 | [推送代码步骤.md](../推送代码步骤.md) |

---

## 📊 统计信息

| 类型 | 数量 |
|------|------|
| 顶级文档 | 3 个 (API.md, ARCHITECTURE.md, README.md) |
| technical/ | 9 个文档 |
| data/ | 3 个文档 |
| integration/ | 2 个文档 |
| maintenance/ | 1 个文档 |
| reports/ | 2 个文档 |
| **总计** | **20 个文档** |

---

**文档维护者：** Claude Code Assistant
**最后更新：** 2026-01-25
