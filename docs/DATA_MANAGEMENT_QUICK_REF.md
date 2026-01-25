# 📋 数据管理快速参考

## 🎯 一分钟数据更新流程

```bash
# 1. 编辑 Excel
open "清迈活动数据.xlsx"

# 2. 添加/修改活动（不要手动填写 ID 列）

# 3. 运行脚本生成 ID
npm run add-ids

# 4. 导出到 JSON
npm run export-data

# 5. 重启服务器查看效果
npm run dev
```

---

## ⚠️ 重要规则

### ❌ 绝对不要

- ❌ 手动修改 Excel 中的 ID 列
- ❌ 删除 ID 列
- ❌ 复制粘贴 ID 到其他行

### ✅ 正确做法

- ✅ 添加新活动时，ID 列留空
- ✅ 运行 `npm run add-ids` 自动生成 ID
- ✅ 修改其他字段（标题、时间等）后重新运行脚本

---

## 📁 文件说明

| 文件 | 说明 | 自动生成？ |
|------|------|----------|
| `清迈活动数据.xlsx` | 源数据文件 | ❌ 手动编辑 |
| `清迈活动数据.backup.xlsx` | 自动备份 | ✅ 脚本生成 |
| `data/items.json` | 导出的 JSON | ✅ 脚本生成 |
| `data/items-with-ids.json` | 完整数据备份 | ✅ 脚本生成 |

---

## 🔍 快速查找

### 查找特定活动

```bash
# 通过 ID 查找（假设 ID 为 17693677202621728）
cat data/items-with-ids.json | jq '.[] | select(.id == 17693677202621728)'

# 通过标题查找
cat data/items-with-ids.json | jq '.[] | select(.title | contains("瑜伽"))'

# 通过分类查找
cat data/items-with-ids.json | jq '.[] | select(.category == "瑜伽")'
```

---

## 🆘 常见问题

### Q: 修改了 Excel 但前端没变化？

**A**: 需要重新导出数据：
```bash
npm run export-data
npm run dev
```

### Q: ID 列显示为数字还是文本？

**A**: Excel 显示为数字，JSON 中也是数字类型

### Q: 如何回滚到之前的版本？

**A**: 使用备份文件：
```bash
cp 清迈活动数据.backup.xlsx 清迈活动数据.xlsx
```

---

## 📚 更多信息

详细文档：[唯一 ID 使用指南](./UNIQUE_ID_GUIDE.md)
