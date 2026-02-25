# 🚀 智能自动导入系统使用指南

## ✨ 系统概述

智能自动导入系统是基于"一个数据也不能错"原则设计的Excel自动导入工具，提供了：

- ✅ **全面数据验证**：价格、时间、星期、必填字段
- ✅ **冲突检测**：自动发现时间和地点冲突
- ✅ **自动快照**：每次导入前自动备份，支持回滚
- ✅ **详细错误报告**：具体指出错误位置和修复建议
- ✅ **智能合并**：按活动编号自动更新或新增

---

## 📋 快速开始

### 方式一：自动监听模式（推荐）

```bash
# 启动Excel自动监听
npm run watch-excel
```

**工作流程**：
1. 修改 `清迈活动数据.xlsx` 文件
2. 保存文件
3. 系统自动检测变化
4. 执行以下步骤：
   - 📸 创建快照（安全备份）
   - 📖 读取Excel数据
   - 🔍 数据验证
   - ⚠️ 冲突检测
   - 🔄 智能合并
   - 💾 保存到JSON
   - 📝 生成日志

### 方式二：手动导入模式

```bash
# 手动执行智能导入
npm run import-excel:smart
```

**适用场景**：
- 不想启动监听进程
- 批量修改完成后一次性导入
- 调试和测试

---

## 🔍 数据验证规则

### 1. 价格格式验证

**允许的格式**：
```
✅ 免费
✅ 100฿
✅ 1,000฿
✅ 100-500฿
```

**错误示例**：
```
❌ 100泰铢
❌ 100
❌ 免费
❌ 100-500
```

### 2. 时间格式验证

**允许的格式**：
```
✅ 08:30-09:45
✅ 灵活时间
✅ 待定
```

**错误示例**：
```
❌ 8:30-9:45
❌ 08:30
❌ 上午8:30-9:45
```

### 3. 星期枚举验证

**允许的值**：
```
✅ 周一
✅ 周二
✅ 周三
✅ 周四
✅ 周五
✅ 周六
✅ 周日
```

**支持格式**：
- 单个：`周一`
- 多个（逗号分隔）：`周一,周三,周五`
- 多个（中文逗号）：`周一，周三，周五`
- 多个（顿号）：`周一、周三、周五`

### 4. 必填字段验证

**必填字段**：
- ✅ 活动标题（title）
- ✅ 分类（category）
- ✅ 地点（location）
- ✅ 时间（time）
- ✅ 星期（weekdays）

**可选字段**：
- 描述（description）
- 价格（price）- 但建议填写
- 其他自定义字段

---

## ⚠️ 冲突检测

系统会自动检测以下冲突：

### 时间和地点冲突

**检测逻辑**：
```javascript
// 如果两个活动：
// 1. 至少有一个相同的星期
// 2. 在同一地点
// → 则报告冲突
```

**示例**：
```
现有活动：瑜伽课 - 周一 08:00-09:00 - 宁曼路瑜伽馆
导入活动：普拉提 - 周一 08:30-09:30 - 宁曼路瑜伽馆
→ ⚠️ 冲突：同一时间、同一地点
```

**处理策略**：
- 使用导入数据覆盖（最新数据优先）
- 冲突仅作为警告，不会阻止导入

---

## 📸 快照系统

### 自动快照

- **触发时机**：每次导入前自动创建
- **保存位置**：`snapshots/` 目录
- **文件命名**：`snapshot-YYYY-MM-DDTHH-MM-SS-mmmZ.json`
- **保留策略**：只保留最近10个快照

### 快照内容

```json
{
  "timestamp": "2026-01-26T17:05:28.123Z",
  "filename": "清迈活动数据.xlsx",
  "activityCount": 18,
  "data": [
    {
      "id": "0001",
      "activityNumber": "0001",
      "title": "清迈晨间瑜伽",
      ...
    }
  ]
}
```

### 手动快照管理

```javascript
import {
  createSnapshot,
  listSnapshots,
  rollbackToSnapshot
} from './scripts/smart-auto-import.mjs';

// 创建快照
createSnapshot();

// 列出所有快照
const snapshots = listSnapshots();

// 回滚到指定快照
rollbackToSnapshot('snapshot-2026-01-26T17-05-28.123Z.json');
```

---

## 📝 错误报告

### 错误报告生成

当数据验证失败时，系统会自动生成错误报告：

**保存位置**：`errors/import-error-{timestamp}.json`

**报告格式**：
```json
{
  "timestamp": "2026-01-26T17:05:28.123Z",
  "filename": "清迈活动数据.xlsx",
  "summary": {
    "total": 20,
    "success": 18,
    "failed": 2
  },
  "errors": [
    {
      "row": 5,
      "title": "某活动",
      "field": "价格",
      "error": "价格格式错误",
      "suggestion": "请使用格式：免费、100฿、100-500฿"
    }
  ]
}
```

### 控制台输出

```
⚠️  发现 2 条数据有错误:

  第5行 "某活动": 价格 - 价格格式错误
  第10行 "另一活动": 时间 - 时间格式错误

❌ 导入失败：发现数据错误
💡 建议：请根据错误报告修改Excel文件后重试

📋 错误报告已生成: errors/import-error-1737896728123.json
   总数: 20
   成功: 18
   失败: 2
```

---

## 🔄 数据合并策略

### 按活动编号合并

系统使用 `activityNumber`（活动编号）作为唯一标识：

**场景1：新增活动**
```excel
活动编号 | 活动标题
0019     | 新活动
```
→ 新增到数据中

**场景2：更新现有活动**
```excel
活动编号 | 活动标题       | 价格
0001     | 清迈晨间瑜伽   | 150฿
```
→ 更新活动0001的价格信息

**场景3：删除活动**
```excel
# Excel中没有活动0006
```
→ 保持现有数据（不会删除）

**重要**：
- 只会新增或更新，**不会删除**现有活动
- 如果需要删除活动，请使用手动删除脚本

---

## 📂 目录结构

```
Chiengmai/
├── 清迈活动数据.xlsx          # Excel数据文件
├── data/
│   └── items.json             # JSON数据存储
├── scripts/
│   ├── smart-auto-import.mjs  # 智能自动导入脚本
│   ├── watch-excel.mjs        # 监听脚本
│   └── import-excel-enhanced.mjs
├── snapshots/                 # 快照目录（自动创建）
│   └── snapshot-*.json
├── errors/                    # 错误报告目录（自动创建）
│   └── import-error-*.json
└── logs/                      # 日志目录（自动创建）
    └── auto-import-*.log
```

---

## 💡 使用技巧

### 1. 首次导入

```bash
# 确保数据格式正确
# 启动监听
npm run watch-excel

# 修改Excel文件
# 保存后自动导入
```

### 2. 批量修改后导入

```bash
# 1. 修改Excel文件（修改多个活动）
# 2. 保存Excel
# 3. 等待自动导入完成
# 4. 检查控制台输出
```

### 3. 出错后修复

```bash
# 1. 查看错误报告
cat errors/import-error-*.json

# 2. 根据错误修改Excel

# 3. 保存Excel重新导入

# 4. 如果需要回滚
node -e "import('./scripts/smart-auto-import.mjs').then(m => m.rollbackToSnapshot('snapshot-xxx.json'))"
```

### 4. 定期备份

```bash
# 快照会自动创建，但可以手动创建额外备份
npm run import-excel:smart  # 会自动创建快照
```

---

## ⚙️ 高级配置

### 修改快照保留数量

编辑 `scripts/smart-auto-import.mjs`:

```javascript
function cleanOldSnapshots(keepCount = 10) {
  // 修改 keepCount 参数
}
```

### 修改监听防抖时间

编辑 `scripts/watch-excel.mjs`:

```javascript
// 等待1秒后再导入（避免文件未完全保存）
importTimeout = setTimeout(() => {
    importExcel();
    importTimeout = null;
}, 1000);  // 修改这个值（毫秒）
```

---

## 🐛 常见问题

### Q1: 导入失败怎么办？

1. 查看控制台错误信息
2. 查看 `errors/` 目录下的错误报告
3. 根据错误修改Excel文件
4. 重新保存Excel触发导入

### Q2: 如何恢复到之前的版本？

```bash
# 查看可用快照
ls snapshots/

# 使用Node.js回滚
node -e "import('./scripts/smart-auto-import.mjs').then(m => m.rollbackToSnapshot('snapshot-xxx.json'))"
```

### Q3: 监听没有响应？

1. 检查Excel文件是否完全保存
2. 检查监听进程是否在运行
3. 尝试手动导入：`npm run import-excel:smart`
4. 重启监听进程

### Q4: 如何删除快照？

```bash
# 删除所有快照
rm -rf snapshots/*

# 删除特定快照
rm snapshots/snapshot-xxx.json
```

### Q5: 如何查看导入历史？

```bash
# 查看日志文件
cat logs/auto-import-*.log

# 查看最近导入
ls -lt snapshots/ | head
```

---

## 📊 对比：基础导入 vs 智能导入

| 功能 | 基础导入 | 智能导入 |
|------|---------|---------|
| 数据读取 | ✅ | ✅ |
| 必填字段验证 | ✅ | ✅ |
| 价格格式验证 | ❌ | ✅ |
| 时间格式验证 | ❌ | ✅ |
| 星期枚举验证 | ❌ | ✅ |
| 冲突检测 | ❌ | ✅ |
| 自动快照 | ❌ | ✅ |
| 错误报告 | ❌ | ✅ |
| 详细日志 | ✅ | ✅ |
| 回滚功能 | ❌ | ✅ |

---

## 🎯 最佳实践

1. **每次修改前**：确保监听器在运行
2. **修改完成后**：检查控制台输出确认成功
3. **定期备份**：快照自动保留10个，但重要修改前可手动备份
4. **出错不要慌**：查看错误报告，修复后重新导入
5. **验证数据**：导入后在管理后台验证数据正确性

---

## 📞 需要帮助？

- 查看错误报告：`errors/import-error-*.json`
- 查看详细日志：`logs/auto-import-*.log`
- 检查快照：`snapshots/` 目录
- 回滚到之前版本：使用 `rollbackToSnapshot()` 函数

---

**祝使用愉快！🚀**
