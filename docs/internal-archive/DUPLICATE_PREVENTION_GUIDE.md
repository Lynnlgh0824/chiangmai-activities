# 🔄 重复数据防护机制

## 📋 概述

为了防止活动数据重复，我们建立了**三层防护机制**：

1. ✅ **添加前检查** - 脚本添加数据前检查标题是否已存在
2. ✅ **导入时检测** - Excel导入时同时检查编号和标题唯一性
3. ✅ **定期清理工具** - 发现重复时运行去重脚本

---

## 🛡️ 防护机制

### 1. 添加前检查

**适用场景**: 使用脚本添加新活动时

**检查位置**:
- `scripts/add-meditation-activities.mjs`
- 任何添加数据的脚本

**工作流程**:
```
准备添加新数据
    ↓
检查标题是否已存在
    ↓
发现重复 → 立即退出，提示用户
    ↓
无重复 → 继续添加
```

**示例输出**:
```
❌ 发现重复的活动标题:
  - Wat Tung Yu

⚠️  这些活动已经存在于Excel中，请检查数据！
💡 如需更新现有活动，请手动编辑Excel
```

---

### 2. 导入时检测

**适用场景**: 运行 `npm run import-excel:smart` 时

**检查位置**: `scripts/import-excel-enhanced.mjs`

**检查内容**:
- ✅ 活动编号唯一性
- ✅ 活动标题唯一性
- ✅ Excel内部重复

**工作流程**:
```
开始导入
    ↓
读取Excel数据
    ↓
检测编号重复
    ↓
检测标题重复
    ↓
发现重复 → 生成报告 → 停止导入
    ↓
无重复 → 继续导入
```

**示例输出**:
```
⚠️  发现重复数据，需要确认！

📌 活动标题重复 (2个):

   标题 "宁曼路复古市集" 重复 2 次:
      行21: 编号 0022
      行38: 编号 0039

📋 重复报告已保存: duplicate-report-xxx.json

❌ 导入暂停：发现重复数据，请处理后重试

💡 建议操作:
   1. 查看重复报告
   2. 在Excel中删除重复的行
   3. 或者运行: node scripts/remove-duplicates.mjs
```

---

### 3. 定期清理工具

**适用场景**: Excel中已经存在重复数据时

**工具脚本**: `scripts/remove-duplicates.mjs`

**运行方式**:
```bash
node scripts/remove-duplicates.mjs
```

**工作原理**:
1. 读取Excel数据
2. 按活动标题分组
3. 找出重复的标题
4. 保留编号较小的记录
5. 删除编号较大的重复记录
6. 创建备份
7. 保存清理后的Excel

**示例输出**:
```
🧹 清理Excel重复数据...

📊 原始数据: 57 行

📌 "宁曼路复古市集" 重复 2 次:
   ✓ 保留: 第21行 | 编号 0022
   ✗ 删除: 第38行 | 编号 0039

...（其他重复项）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 清理统计:
   原始行数: 57
   重复活动: 12
   保留行数: 45
   减少行数: 12

💾 创建备份: backup-before-cleanup-xxx.xlsx

✅ 写入清理后的数据...

✨ 清理完成！
```

---

## 📊 相关脚本

| 脚本名称 | 功能 | 使用场景 |
|---------|------|---------|
| `remove-duplicates.mjs` | 删除Excel重复数据 | 发现重复时 |
| `check-duplicates.mjs` | 检查编号重复 | 诊断问题 |
| `analyze-excel-duplicates.mjs` | 深度分析重复 | 分析数据质量 |
| `check-excel-status.mjs` | 查看Excel状态 | 日常检查 |
| `test-duplicate-detection.mjs` | 测试检测机制 | 验证功能 |

---

## 🚀 最佳实践

### 1. 添加新活动前
```bash
# 检查Excel状态
node scripts/check-excel-status.mjs

# 使用带检查的脚本添加数据
node scripts/add-xxx-activities.mjs
```

### 2. 导入数据前
```bash
# 检查是否有重复
node scripts/analyze-excel-duplicates.mjs

# 如果有重复，先清理
node scripts/remove-duplicates.mjs

# 然后再导入
npm run import-excel:smart
```

### 3. 定期维护
```bash
# 每周检查一次
node scripts/check-excel-status.mjs

# 发现异常时深度分析
node scripts/analyze-excel-duplicates.mjs
```

---

## ⚠️ 注意事项

1. **备份自动创建**
   - 去重脚本会自动创建备份
   - 备份文件名格式: `backup-before-cleanup-{timestamp}.xlsx`

2. **保留策略**
   - 编号较小的记录会被保留
   - 编号较大的重复记录会被删除

3. **导入失败时**
   - 查看生成的重复报告
   - 报告位置: `logs/duplicate-report-{timestamp}.json`
   - 按照提示处理后再导入

4. **标题规范**
   - 活动标题应该唯一且具有辨识度
   - 避免使用过于相似的标题
   - 例如：不要同时使用"瑜伽"和"瑜伽活动"

---

## 📈 统计数据

### 清理前（2026-01-26）
- 总行数: 57
- 唯一标题: 45
- 重复活动: 12

### 清理后（2026-01-26）
- 总行数: 45
- 唯一标题: 45
- 重复活动: 0 ✅

---

## 🎯 总结

通过三层防护机制，我们确保：
- ✅ 添加数据前检查重复
- ✅ 导入时检测并阻止重复
- ✅ 发现重复时可以快速清理
- ✅ 所有操作都有备份保护

**从此告别重复数据问题！** 🎉
