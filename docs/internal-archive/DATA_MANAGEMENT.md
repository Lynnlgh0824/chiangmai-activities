# 清迈活动数据维护指南

> 数据管理、优化和维护文档

**最后更新：** 2025-01-26
**数据版本：** v2.1
**活动总数：** 47个

---

## 📊 数据概况

### 当前数据状态

| 分类 | 数量 | 说明 |
|------|------|------|
| 市集 | 17 | 夜市、手作市集、特色市集 |
| 冥想 | 6 | 禅修中心、冥想课程 |
| 音乐 | 6 | 酒吧、Live Music |
| 舞蹈 | 4 | 摇摆舞、探戈、萨尔萨、尊巴 |
| 户外运动 | 4 | 划船、网球、高尔夫、射击、攀岩 |
| 瑜伽 | 2 | 公园瑜伽、室内瑜伽 |
| 文化艺术 | 2 | 语言交换、英语角 |
| 健身 | 2 | 健身房、游泳 |
| 咏春拳 | 1 | 传统武术 |
| 徒步 | 1 | 户外徒步 |
| 泰拳 | 1 | 泰拳体验 |
| 攀岩 | 1 | 室内攀岩 |
| **总计** | **47** | - |

---

## 🔄 数据维护记录

### 2025-01-26 - 字段合并与优化

#### ✅ 已完成的优化

1. **删除重复活动**（6个）
   - 删除椰林集市、艺术村集市等重复项
   - 数据从52个优化到46个，后增加到47个

2. **修正时间错误**（4个）
   - JJ市集周末版：06:30-22:00 → 06:00-14:00
   - 清迈大学前门夜市：10:00-23:00 → 17:00-23:00
   - 面包集市：07:00-16:00 → 07:00-11:00（仅周六）
   - 瓦洛洛市场：08:00-17:00 → 06:00-19:00

3. **统一价格格式**（5个）
   - walkin → 免费（自愿捐赠/现场参与）
   - 捐赠 → 免费（自愿捐赠）

4. **补充星期字段**（8个）
   - 临时活动标注"无固定时间"

5. **统一持续时间描述**（7个）
   - 灵活时间 → 时间灵活，无固定时长限制

6. **字段合并** ⭐ 重要
   - 合并"注意事项"到"描述"字段
   - Excel从18列简化到**17列**
   - 前端和后端无需修改（未使用notes字段）

7. **脚本同步优化**
   - 更新导出脚本（删除notes列）
   - 更新导入脚本（删除notes映射）
   - 确保Excel与后台数据完全同步

---

## 📋 数据字段规范

### Excel字段（17列）

| # | 字段名 | JSON字段名 | 类型 | 必填 | 说明 |
|---|--------|-----------|------|------|------|
| 1 | 活动编号 | activityNumber | string | ✅ | 唯一标识，如0001 |
| 2 | 活动标题 | title | string | ✅ | 活动名称 |
| 3 | 分类 | category | string | ✅ | 市集、音乐、瑜伽等 |
| 4 | 地点 | location | string | ✅ | 详细地址 |
| 5 | 价格 | price | string | ✅ | 价格描述 |
| 6 | 时间 | time | string | ✅ | HH:MM-HH:MM |
| 7 | 持续时间 | duration | string | ✅ | 时长描述 |
| 8 | 时间信息 | timeInfo | string | - | 固定频率/临时活动 |
| 9 | 星期 | weekdays | array | - | 周一至周日，逗号分隔 |
| 10 | 序号 | sortOrder | number | - | 排序序号 |
| 11 | 最低价格 | minPrice | number | - | 数字 |
| 12 | 最高价格 | maxPrice | number | - | 数字 |
| 13 | 最大人数 | maxParticipants | number/string | - | 数字或"不限" |
| 14 | 描述 | description | string | ✅ | 活动介绍+注意事项 |
| 15 | 灵活时间 | flexibleTime | string | - | 是/否 |
| 16 | 状态 | status | string | - | 草稿/进行中 |
| 17 | 需要预约 | requireBooking | string | - | 是/否 |

### 描述字段规范

**格式：**
```
【活动介绍】
活动特色、环境、氛围等介绍

⚠️ 注意事项：
- 实用提醒
- 操作指南
- 重要提醒
```

**示例：**
```
位于古城西南角的免费社区瑜伽，环境优美，适合所有水平的练习者。

⚠️ 注意事项：
需自备瑜伽垫，或现场租用（15-20泰铢）。下雨天活动取消。建议提前到达。
```

---

## 🛠️ 维护工具

### 命令速查

```bash
# 导出数据到Excel
npm run export-to-excel

# 从Excel导入数据
npm run import-excel

# 启动开发服务器
npm run dev

# 启动生产服务器
npm start
```

### 脚本说明

| 脚本 | 功能 | 使用场景 |
|------|------|---------|
| `export-json-to-excel.mjs` | JSON → Excel | 更新Excel文件 |
| `import-excel-enhanced.mjs` | Excel → JSON | 同步Excel修改到后台 |
| `merge-description-notes.mjs` | 合并字段 | 一次性执行（已完成） |
| `optimize-excel-data.mjs` | 数据优化 | 价格、时间等优化 |
| `validate-excel-status.mjs` | 验证数据 | 检查Excel格式 |

---

## 🔄 数据维护流程

### 标准流程

```
┌─────────────────────────────────────┐
│     数据修改标准流程                 │
└─────────────────────────────────────┘

1. 修改数据
   ↓
   方式A：直接编辑 JSON
   └─ data/items.json

   方式B：编辑 Excel
   └─ 清迈活动数据.xlsx

2. 同步数据
   ↓
   JSON → Excel: npm run export-to-excel
   Excel → JSON: npm run import-excel

3. 验证数据
   ↓
   ✓ 检查Excel列数（17列）
   ✓ 检查活动总数（47个）
   ✓ 检查字段完整性

4. 测试前端
   ↓
   ✓ 访问 http://localhost:5173
   ✓ 检查活动显示
   ✓ 测试筛选功能
```

### 数据变更检查清单

**修改前：**
- [ ] 备份现有数据
- [ ] 确认修改范围
- [ ] 评估影响范围

**修改后：**
- [ ] 验证Excel格式（17列）
- [ ] 验证JSON结构
- [ ] 测试前端显示
- [ ] 测试导入导出
- [ ] 更新维护记录

---

## ⚠️ 常见问题

### Q1: Excel和后台数据不一致？

**解决方法：**
```bash
# 重新导出Excel
npm run export-to-excel

# 或重新导入
npm run import-excel
```

### Q2: 修改了Excel但前台没变化？

**原因：** Excel数据没有同步到后台

**解决方法：**
```bash
# 运行导入脚本
npm run import-excel
```

### Q3: 导入时提示字段错误？

**检查项：**
1. Excel是否有17列（不是18列或19列）
2. 列名是否正确（"活动编号"不是"id"）
3. 活动编号是否唯一

### Q4: Excel显示多少列？

**正确答案：** 17列

```
1. 活动编号     10. 序号
2. 活动标题     11. 最低价格
3. 分类         12. 最高价格
4. 地点         13. 最大人数
5. 价格         14. 描述（包含注意事项）
6. 时间         15. 灵活时间
7. 持续时间     16. 状态
8. 时间信息     17. 需要预约
9. 星期
```

### Q5: 为什么没有id列？

**答案：** 使用活动编号作为唯一标识

- Excel：只有"活动编号"列
- JSON：`id` = `activityNumber`
- 避免重复和混淆

---

## 📦 备份策略

### 自动备份

**导入Excel时自动备份：**
- 位置：`backups/backup-YYYY-MM-DDTHH-MM-SS.xlsx`
- 频率：每次导入时自动创建

### 手动备份

**重要修改前手动备份：**
```bash
# 备份JSON
cp data/items.json data/items.json.backup-$(date +%s).json

# 备份Excel
cp 清迈活动数据.xlsx 清迈活动数据.backup-$(date +%s).xlsx
```

---

## 📈 数据质量目标

### 当前数据质量（2025-01-26）

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 字段完整性 | 100% | 100% | ✅ |
| 价格格式统一 | 100% | 100% | ✅ |
| 时间准确性 | 100% | 100% | ✅ |
| 描述完整性 | 100% | 100% | ✅ |
| 无重复活动 | 0个 | 0个 | ✅ |
| Excel列数规范 | 17列 | 17列 | ✅ |

---

## 🔗 相关文件

### 数据文件

- **主数据：** [../data/items.json](../data/items.json)
- **Excel文件：** [../清迈活动数据.xlsx](../清迈活动数据.xlsx)

### 工具脚本

- [../scripts/export-json-to-excel.mjs](../scripts/export-json-to-excel.mjs)
- [../scripts/import-excel-enhanced.mjs](../scripts/import-excel-enhanced.mjs)
- [../scripts/optimize-excel-data.mjs](../scripts/optimize-excel-data.mjs)
- [../scripts/merge-description-notes.mjs](../scripts/merge-description-notes.mjs)

### 前后端文件

- **前端：** [../index.html](../index.html)
- **后端：** [../server.cjs](../server.cjs)

---

## 📚 归档文档

历史报告已归档到 [archive/](archive/) 目录：

- MARKET_TIME_VERIFICATION_REPORT.md
- DATA_CLEANUP_COMPLETION_REPORT.md
- EXCEL_DATA_OPTIMIZATION_REPORT.md
- DATA_COMPARISON_ANALYSIS.md
- SCRIPT_SYNC_FIX_REPORT.md
- REALTIME_STATUS_FEATURE.md
- REALTIME_STATUS_OPTIMIZATION.md
- ... (共15个归档文件)

---

**维护者：** Claude Code AI Assistant
**项目路径：** `/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai`
**文档版本：** 1.0.0

🎉 **数据持续优化，保持简洁！**
