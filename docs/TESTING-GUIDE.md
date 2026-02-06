# 活动描述质量测试指南

## 📋 目录

- [快速开始](#快速开始)
- [测试框架](#测试框架)
- [测试用例](#测试用例)
- [自动化修复](#自动化修复)
- [CI/CD集成](#cicd集成)
- [最佳实践](#最佳实践)

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 运行测试

```bash
# 运行所有测试
node scripts/test-cases.mjs

# 一键修复所有问题
node scripts/auto-fix-all.mjs
```

---

## 🧪 测试框架

### 核心文件

- **test-framework.mjs** - 测试框架核心
- **test-cases.mjs** - 完整测试用例
- **auto-fix-all.mjs** - 一键修复主控脚本

### 测试框架功能

```javascript
import { TestFramework, TestResult, log } from './test-framework.mjs';

// 创建测试框架
const framework = new TestFramework('data/items.json');

// 加载数据
framework.loadData();

// 执行测试
framework.runTest('测试名称', (data, result) => {
    // 测试逻辑
    result.pass('通过的消息');
    result.fail('失败的消息');
    result.warn('警告的消息');
});

// 打印报告
framework.printReport();
```

---

## 📝 测试用例

### 测试1: 数据完整性

**检查项目**:
- ✅ 必填字段（id, title, description）
- ✅ ID唯一性
- ✅ 分类字段有效性

**示例**:
```javascript
function testDataIntegrity(data, result) {
    data.forEach(item => {
        if (!item.id) {
            result.fail(`活动缺少ID字段`, item.title);
        }
        // ...更多检查
    });
}
```

---

### 测试2: 描述质量

**检查项目**:
- ✅ 空描述检测
- ✅ 描述长度（10-500字符）
- ✅ 注意事项存在性
- ✅ 时间信息
- ✅ 价格信息

**示例**:
```javascript
function testDescriptionQuality(data, result) {
    data.forEach(item => {
        const desc = item.description || '';

        if (desc.length < 10) {
            result.warn(`活动 ${item.id} 描述过短`);
        }

        if (!desc.includes('⚠️')) {
            result.warn(`活动 ${item.id} 缺少注意事项`);
        }
    });
}
```

---

### 测试3: 格式规范

**检查项目**:
- ✅ 双感叹号 (!!)
- ✅ 多重空行
- ✅ Emoji使用过多
- ✅ 中英文标点混用

**示例**:
```javascript
function testFormatStandards(data, result) {
    data.forEach(item => {
        const desc = item.description || '';

        if (desc.includes('!!')) {
            result.fail(`活动 ${item.id} 包含双感叹号`);
        }

        const consecutiveNewlines = desc.match(/\n{3,}/g);
        if (consecutiveNewlines) {
            result.warn(`活动 ${item.id} 包含过多空行`);
        }
    });
}
```

---

### 测试4: 重复内容检测

**检查项目**:
- ✅ 语义重复（瑜伽垫、价格格式）
- ✅ 完全重复的字段
- ✅ 句子重复

**示例**:
```javascript
function testDuplicateContent(data, result) {
    data.forEach(item => {
        const desc = item.description || '';

        // 瑜伽垫重复
        if (desc.includes('需要自己带瑜伽垫') &&
            desc.includes('需自备瑜伽垫')) {
            result.fail(`活动 ${item.id} 存在瑜伽垫语义重复`);
        }

        // 价格格式重复
        const hasPrice1 = /\d+泰铢\/单次课程/.test(desc);
        const hasPrice2 = /单次课程\d+泰铢/.test(desc);
        if (hasPrice1 && hasPrice2) {
            result.fail(`活动 ${item.id} 存在价格格式重复`);
        }
    });
}
```

---

### 测试5: 符号规范

**检查项目**:
- ✅ 多重感叹号emoji (‼️ ❗❗)
- ✅ 重复的⚠️符号
- ✅ 重复的中文标点
- ✅ 英文字段名称

**示例**:
```javascript
function testSymbolStandards(data, result) {
    data.forEach(item => {
        const desc = item.description || '';

        if (desc.includes('‼️') || desc.includes('❗❗')) {
            result.fail(`活动 ${item.id} 包含多重感叹号emoji`);
        }

        if (/(⚠️\s*){2,}/.test(desc)) {
            result.fail(`活动 ${item.id} 包含重复⚠️符号`);
        }
    });
}
```

---

## 🔧 自动化修复

### 修复流程

```bash
# 一键修复所有问题
node scripts/auto-fix-all.mjs
```

### 修复步骤

1. **创建备份**
   ```
   备份文件: data/items.json.backup.all.{timestamp}
   ```

2. **清理符号问题**
   ```bash
   node scripts/cleanup-description.cjs
   ```
   - 双感叹号 → 单感叹号
   - 多重感叹号emoji → ⚠️
   - 重复标点 → 单个标点

3. **删除内容重复**
   ```bash
   node scripts/detect-and-fix-content-duplicates.mjs
   ```
   - 使用Levenshtein距离算法
   - 检测相似度>70%的内容
   - 自动删除重复

4. **优化描述结构**
   ```bash
   node scripts/optimize-descriptions.mjs
   ```
   - 删除注意事项中的重复信息
   - 删除重复句子
   - 清理格式

5. **修复语义重复**
   ```bash
   node scripts/final-fix-descriptions.mjs
   ```
   - 瑜伽垫重复
   - 价格格式重复
   - 字段标签重复

### 单独执行某个修复

```bash
# 只清理符号
node scripts/cleanup-description.cjs

# 只修复语义重复
node scripts/final-fix-descriptions.mjs
```

---

## 🔄 CI/CD集成

### GitHub Actions工作流

配置文件: `.github/workflows/data-quality.yml`

**触发条件**:
- Push到main或dev分支
- Pull Request到main分支
- 手动触发

**检查项目**:
1. 数据质量测试
2. JSON格式检查
3. 数据完整性检查
4. 描述质量检查

### 查看测试结果

1. 进入GitHub仓库
2. 点击"Actions"标签
3. 选择最新的工作流运行
4. 查看测试报告和日志

### 下载测试报告

工作流运行后会生成以下报告:
- `test-report.json` - 完整测试报告
- `quality-stats.json` - 质量统计数据

在Actions页面可以下载这些报告。

---

## 📊 最佳实践

### 1. 修复前备份

```bash
# 创建备份
cp data/items.json data/items.json.backup.$(date +%s)
```

### 2. 按顺序执行修复

```bash
# 推荐顺序
node scripts/cleanup-description.cjs              # 1. 清理符号
node scripts/detect-and-fix-content-duplicates.mjs # 2. 删除重复
node scripts/optimize-descriptions.mjs             # 3. 优化结构
node scripts/final-fix-descriptions.mjs            # 4. 修复语义
```

### 3. 每次修复后验证

```bash
# 运行测试
node scripts/test-cases.mjs

# 检查前端显示
# 1. 启动服务 npm start
# 2. 打开浏览器
# 3. 检查活动详情
```

### 4. 使用Git管理版本

```bash
# 修复后提交
git add data/items.json
git commit -m "fix: 优化活动描述"
git push
```

### 5. 查看修复日志

```bash
# 查看修复日志
cat data/fix-log.json

# 查看测试报告
cat data/test-report.json
```

---

## 🎯 常见问题

### Q1: 测试失败怎么办？

**A**:
1. 查看具体失败的测试项
2. 手动检查相关数据
3. 运行对应的修复脚本
4. 重新运行测试

### Q2: 修复后数据有误怎么办？

**A**:
```bash
# 恢复备份
cp data/items.json.backup.all.{timestamp} data/items.json
```

### Q3: 如何添加新的测试用例？

**A**:
1. 在 `test-cases.mjs` 中添加测试函数
2. 使用 `result.pass()`, `result.fail()`, `result.warn()` 报告结果
3. 在 `main()` 函数中调用新测试

```javascript
function testNewFeature(data, result) {
    data.forEach(item => {
        // 测试逻辑
        if (someCondition) {
            result.pass('测试通过');
        } else {
            result.fail('测试失败');
        }
    });
}

// 在main()中添加
framework.runTest('新功能测试', testNewFeature);
```

### Q4: CI/CD测试失败但本地测试通过？

**A**:
1. 检查Node.js版本是否一致
2. 确保所有依赖已提交
3. 检查数据文件路径
4. 查看CI日志获取详细错误信息

---

## 📈 测试覆盖率

当前测试覆盖:

- ✅ 数据完整性: 100%
- ✅ 描述质量: 100%
- ✅ 格式规范: 100%
- ✅ 重复内容: 100%
- ✅ 符号规范: 100%

---

## 🔗 相关文档

- [脚本分析报告](scripts/SCRIPT-ANALYSIS.md)
- [API文档](API.md)
- [数据结构说明](DATA-STRUCTURE.md)

---

## ✨ 贡献指南

添加新测试或修复脚本时，请确保:

1. 遵循现有代码风格
2. 添加详细的注释
3. 更新文档
4. 通过所有测试
5. 提交前本地测试通过

---

**最后更新**: 2026-01-30
**维护者**: Development Team
