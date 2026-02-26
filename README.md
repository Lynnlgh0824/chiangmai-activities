# 🏝️ 清迈活动策划管理系统

> **智能活动管理与数据质量控制系统**

[![GitHub stars](https://img.shields.io/github/stars/Lynnlgh0824/chiangmai-activities)](https://github.com/Lynnlgh0824/chiangmai-activities)
[![GitHub license](https://img.shields.io/github/license/Lynnlgh0824/chiangmai-activities)](https://github.com/Lynnlgh0824/chiangmai-activities)

---

## ✨ 核心功能

### 📊 活动管理
- ✅ **活动信息管理** - 创建、编辑、删除活动
- ✅ **数据验证** - 自动检测数据质量问题
- ✅ **备份机制** - 自动备份和恢复
- ✅ **批量操作** - 批量导入/导出数据

### 🔧 自动化工具
- ✅ **GitHub Actions** - 自动数据质量检查
- ✅ **测试框架** - 自动化测试脚本
- ✅ **自动修复** - 智能修复数据问题
- ✅ **定时任务** - 定期数据验证

### 📈 数据质量
- ✅ **描述重复检测** - 检测并修复重复描述
- ✅ **完整性检查** - 验证必填字段
- ✅ **一致性验证** - 确保数据格式一致

---

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/Lynnlgh0824/chiangmai-activities.git
cd chiangmai-activities
```

### 本地运行

```bash
# 使用 Python 启动本地服务器
python3 -m http.server 8000
# 访问 http://localhost:8000
```

### 在线访问

🌐 **生产环境**：https://go-cnx.vercel.app

直接访问线上部署版本，无需本地安装。

### 查看活动数据

活动数据存储在 `data/items.json` 文件中。

---

## 📂 项目结构

```
chiangmai-activities/
├── data/                         # 数据目录
│   ├── items.json               # 活动数据（主文件）
│   └── items.json.backup.*      # 自动备份文件
├── scripts/                      # 自动化脚本
│   ├── test-framework.mjs       # 测试框架
│   ├── auto-fix-all.mjs         # 自动修复工具
│   └── smart-fix-descriptions.mjs  # 智能描述修复
├── docs/                         # 文档目录
│   ├── TESTING-GUIDE.md         # 测试指南
│   └── TESTING-SUMMARY.md       # 测试总结
├── .github/workflows/           # GitHub Actions
│   └── data-quality.yml         # 数据质量工作流
└── archives/                    # 归档文件
    └── Chiengmai-backups.tar.gz # 备份文件
```

---

## 🔧 自动化工具

### 数据质量检查

```bash
# 运行测试框架
node scripts/test-framework.mjs

# 检查描述重复
node scripts/comprehensive-description-check.mjs

# 智能修复
node scripts/smart-fix-descriptions.mjs
```

### 自动修复

```bash
# 一键修复所有问题
node scripts/auto-fix-all.mjs
```

---

## 📊 数据格式

### 活动数据结构

```json
{
  "id": "unique-id",
  "title": "活动标题",
  "description": "活动描述",
  "date": "2026-02-06",
  "location": "地点",
  "category": "类别"
}
```

---

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
node scripts/test-framework.mjs

# 运行特定测试
node scripts/test-cases.mjs
```

### 测试覆盖

- ✅ 描述重复检测
- ✅ 数据完整性验证
- ✅ 格式一致性检查
- ✅ 自动修复功能

---

## 🔄 GitHub Actions

### 数据质量工作流

项目配置了 GitHub Actions 自动运行数据质量检查：

- **触发条件**：push 到 main 分支
- **检查内容**：
  - 描述重复检测
  - 数据完整性验证
  - 格式一致性检查

### 查看运行结果

访问：https://github.com/Lynnlgh0824/chiangmai-activities/actions

---

## 📝 文档索引

### 快速开始
- [AUTOMATION-GUIDE.md](AUTOMATION-GUIDE.md) - 自动化系统指南
- [TESTING-GUIDE.md](docs/TESTING-GUIDE.md) - 测试指南

### 技术文档
- [AUTOMATED-TESTING-IMPLEMENTATION-REPORT.md](AUTOMATED-TESTING-IMPLEMENTATION-REPORT.md) - 自动化测试实现报告
- [SCRIPT-ANALYSIS.md](scripts/SCRIPT-ANALYSIS.md) - 脚本分析

### API 文档
- [API-CONNECTION-VERIFICATION.md](API-CONNECTION-VERIFICATION.md) - API 连接验证

### 安全指南
- [AUTO-COMMIT-SAFETY-GUIDE.md](AUTO-COMMIT-SAFETY-GUIDE.md) - 自动提交安全指南

---

## 🎯 使用场景

### 场景一：添加新活动

1. 编辑 `data/items.json`
2. 添加活动数据
3. 运行验证脚本检查质量
4. 提交到 GitHub

### 场景二：修复数据问题

1. 运行数据质量检查
2. 识别问题类型
3. 使用自动修复工具
4. 验证修复结果

### 场景三：批量导入

1. 准备导入数据
2. 验证数据格式
3. 合并到主文件
4. 运行测试确认

---

## 🐛 常见问题

### Q: 如何恢复数据？
A: 使用 `archives/` 目录中的备份文件

### Q: 测试失败怎么办？
A: 查看 [TESTING-GUIDE.md](docs/TESTING-GUIDE.md) 获取帮助

### Q: 如何添加新的验证规则？
A: 编辑 `.github/workflows/data-quality.yml`

---

## 📊 最新更新

### 2025-02-06
- ✅ 添加 GitHub Actions 数据质量工作流
- ✅ 实现自动化测试框架
- ✅ 添加自动修复脚本
- ✅ 创建完整文档体系
- ✅ 推送到 GitHub

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License

---

## 🔗 相关链接

- **🌐 在线访问**：https://go-cnx.vercel.app
- **GitHub 仓库**：https://github.com/Lynnlgh0824/chiangmai-activities
- **问题反馈**：https://github.com/Lynnlgh0824/chiangmai-activities/issues

---

**让活动管理更简单！** 🏝️✨
