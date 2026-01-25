# 📋 清迈活动数据 - 唯一 ID 说明

**更新日期**: 2026-01-26
**版本**: 1.0

---

## 🎯 为什么需要唯一 ID？

### 问题场景

1. **数据更新追踪**
   - 修改活动信息后，无法确认是否已同步到数据库
   - 重复添加相同活动时无法识别

2. **数据一致性**
   - Excel 和 JSON 数据可能不同步
   - API 返回的数据与源文件不一致

3. **前端引用**
   - 活动详情弹窗需要通过 ID 查找活动
   - 收藏、分享功能需要唯一标识符

### 解决方案

为每条活动数据生成**唯一 ID**，格式：`17693677202621728`（14位数字）

- 前 10 位：时间戳（精确到毫秒）
- 后 4 位：随机数

---

## 📊 当前数据状态

### 统计信息

| 项目 | 数量 |
|------|------|
| 总活动数 | 20 |
| 已分配 ID | 20 ✅ |
| 备份文件 | 清迈活动数据.backup.xlsx |
| JSON 备份 | data/items-with-ids.json |

### ID 字段位置

- **列位置**: 第一列（A 列）
- **字段名**: `id`
- **数据类型**: 数字
- **唯一性**: 保证全局唯一

---

## 🚀 使用方法

### 1️⃣ 查看现有 ID

```bash
# 方式1：查看 Excel 文件
open "清迈活动数据.xlsx"

# 方式2：查看 JSON 备份
cat data/items-with-ids.json | jq '.[].id'
```

### 2️⃣ 添加新活动时

**步骤**：
1. 打开 Excel 文件
2. 添加新行数据
3. **不要手动填写 ID 列**
4. 保存文件
5. 运行脚本自动生成 ID：

```bash
npm run add-ids
```

脚本会：
- ✅ 为新活动生成唯一 ID
- ✅ 保留已有活动的 ID
- ✅ 自动备份原文件
- ✅ 导出 JSON 备份

### 3️⃣ 导出数据到 JSON

```bash
npm run export-data
```

生成文件：`data/items.json`

### 4️⃣ 更新现有活动

**重要规则**：
- ⚠️ **永远不要修改 ID 列**
- ✅ 只修改其他字段（标题、时间、地点等）
- ✅ 保存后运行 `npm run add-ids` 确保数据正确

---

## 🔍 ID 查找方法

### 通过 Excel

1. 打开 `清迈活动数据.xlsx`
2. 查看 A 列的 `id` 字段
3. 使用 Excel 筛选功能查找特定 ID

### 通过 JSON

```bash
# 查找特定 ID 的活动
cat data/items-with-ids.json | jq '.[] | select(.id == 17693677202621728)'

# 查找特定标题的活动
cat data/items-with-ids.json | jq '.[] | select(.["活动标题*"] | contains("瑜伽"))'
```

### 在代码中使用

```javascript
// 查找活动
const activity = allActivities.find(a => a.id == activityId);

// 检查活动是否存在
if (!activity) {
    console.warn('活动未找到:', activityId);
    return;
}

// 使用活动数据
console.log(activity['活动标题*']);
console.log(activity.地点名称*);
```

---

## 📝 数据字段映射

### Excel 列名 → JSON 字段名

| Excel 列名 | JSON 字段 | 说明 |
|-----------|----------|------|
| id | id | **唯一标识符**（自动生成）|
| 活动标题* | title | 活动名称 |
| 分类* | category | 活动分类 |
| 地点名称* | location | 地点名称 |
| 时间* | time | 活动时间 |
| 星期* | weekdays | 活动星期 |
| 价格显示 | price | 价格 |
| 活动描述* | description | 活动描述 |
| 状态 | status | 活动状态 |

> 带 `*` 的字段为必填字段

---

## ⚠️ 注意事项

### ❌ 不要做的事

1. **不要手动修改 ID 列**
   - 手动修改可能导致 ID 重复
   - 可能导致数据引用错误

2. **不要删除 ID 列**
   - 删除后需要重新运行脚本
   - 会导致前端功能失效

3. **不要复制粘贴 ID**
   - 每个活动的 ID 必须唯一
   - 复制会导致数据冲突

### ✅ 推荐的做法

1. **添加新活动后运行脚本**
   ```bash
   npm run add-ids
   ```

2. **定期备份**
   - 原文件会自动备份为 `.backup.xlsx`
   - JSON 备份保存在 `data/items-with-ids.json`

3. **使用 ID 作为引用**
   - 前端通过 ID 查找活动
   - API 返回 JSON 时包含 ID 字段

---

## 🔄 工作流程

### 标准更新流程

```
1. 修改 Excel 数据
   ↓
2. 保存 Excel 文件
   ↓
3. 运行 npm run add-ids（验证/生成 ID）
   ↓
4. 运行 npm run export-data（导出 JSON）
   ↓
5. 测试 API 和前端显示
   ↓
6. 提交代码
```

---

## 🛠️ 故障排查

### 问题：脚本找不到 Excel 文件

**错误**: `❌ 文件不存在: ./清迈活动数据.xlsx`

**解决**:
```bash
# 确认文件位置
ls -la *.xlsx

# 如果在其他位置，移动到项目根目录
mv /path/to/清迈活动数据.xlsx ./
```

### 问题：ID 重复

**错误**: 多个活动有相同的 ID

**解决**:
```bash
# 重新运行脚本
npm run add-ids

# 检查备份文件
ls -la *.backup.xlsx
```

### 问题：前端找不到活动

**可能原因**:
1. ID 不匹配
2. JSON 未更新

**解决**:
```bash
# 重新导出数据
npm run export-data

# 重启服务器
npm run dev
```

---

## 📚 相关文档

- [API 文档](./API.md)
- [数据结构说明](./DATA_STRUCTURE.md)
- [更新日志](../CHANGELOG.md)

---

## 📞 支持

如有问题，请查看：
- 项目 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 文档目录: [docs/](./)

---

**最后更新**: 2026-01-26
**维护者**: Claude Code
