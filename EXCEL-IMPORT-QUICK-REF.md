# 📥 Excel自动导入 - 快速参考

## 🚀 三种导入方式

### 1️⃣ 后台界面（推荐）
```
1. 访问 http://localhost:3000/admin.html
2. 点击 "📥 导入Excel" 按钮
3. 确认导入
4. 完成！
```

### 2️⃣ 命令行
```bash
npm run import-excel
```

### 3️⃣ 文件自动监听
```bash
npm run watch-excel
# 修改Excel后自动导入，按Ctrl+C停止
```

---

## 📊 导出Excel

```bash
# 命令行
npm run export-to-excel

# 后台界面
点击 "📤 导出Excel" 按钮
```

---

## 📁 重要文件

| 文件 | 说明 |
|------|------|
| `清迈活动数据.xlsx` | 主Excel文件 |
| `backups/` | 备份目录 |
| `logs/import-*.log` | 导入日志 |
| `data/items.json` | 后台数据 |

---

## 🛠️ 可用命令

```bash
# 导入Excel到后台
npm run import-excel

# 从后台导出Excel
npm run export-to-excel

# 验证数据格式
npm run validate-data

# 启动文件监听
npm run watch-excel

# 传统导入方式
npm run export-data
```

---

## ⚡ 核心功能

✅ **自动备份** - 每次导入前自动备份
✅ **数据验证** - 自动检查数据格式
✅ **变更报告** - 显示新增/删除/修改
✅ **日志记录** - 完整的操作日志
✅ **一键导入** - 后台界面按钮操作
✅ **文件监听** - Excel修改后自动导入

---

## 📝 完整文档

查看详细文档：[EXCEL-IMPORT-GUIDE.md](EXCEL-IMPORT-GUIDE.md)

---

*快速参考 v1.0 - 2026-01-26*
