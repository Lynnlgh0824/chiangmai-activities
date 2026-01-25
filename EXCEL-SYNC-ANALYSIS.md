# Excel与后台数据同步 - 功能分析与问题预判

## 📋 目标
实现本地Excel表格与后台数据之间的双向同步功能，确保数据一致性和操作便捷性。

---

## 🔍 当前架构分析

### 现有数据流
```
Excel文件 (清迈活动数据.xlsx)
    ↓ (手动运行脚本)
导出脚本 (scripts/export-excel-to-json.mjs)
    ↓
JSON文件 (data/items.json)
    ↓
后台API (/api/items)
    ↓
前端页面 (index.html, admin.html)
```

### 现有问题
1. ❌ Excel修改后需要手动运行导出脚本
2. ❌ 后台修改无法反向同步到Excel
3. ❌ 缺少数据验证和冲突检测
4. ❌ 活动编号需要手动管理
5. ❌ 没有版本控制和回滚机制

---

## 🎯 明日要实现的功能

### 1. Excel → 后台（已有流程，需优化）
**当前状态：** 基本可用，需要完善

**需要优化的点：**
- [ ] 自动检测Excel文件变化
- [ ] 智能字段映射（已有，但需测试）
- [ ] 数据验证（必填字段、格式检查）
- [ ] 冲突检测和解决策略
- [ ] 变更日志记录

**可能遇到的问题：**

#### 问题1: ID格式不一致
**现象：**
- Excel中ID显示为科学计数法（1.76937E+16）
- 导出后ID变成字符串 "17693723926957500"

**解决方案：**
```javascript
// 在导出脚本中统一ID格式
item.id = String(item.id).replace(/\..*/, ''); // 确保是整数
```

#### 问题2: 缺失必填字段
**现象：**
- Excel中某些行缺少title或category
- 导出时数据不完整

**解决方案：**
```javascript
// 添加数据验证
const requiredFields = ['title', 'category'];
const missingFields = requiredFields.filter(field => !item[field]);
if (missingFields.length > 0) {
    console.warn(`⚠️ 活动 ${activityNumber} 缺少必填字段: ${missingFields.join(', ')}`);
    // 跳过或使用默认值
}
```

#### 问题3: 星期字段格式混乱
**现象：**
- Excel中可能是数组、逗号分隔字符串、换行分隔
- 导出后格式不统一

**解决方案：**
```javascript
// 统一处理星期字段
function parseWeekdays(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        // 支持多种分隔符：逗号、顿号、空格、换行
        return value.split(/[,，、\n\r]+/).map(s => s.trim()).filter(Boolean);
    }
    return [];
}
```

---

### 2. 后台 → Excel（新功能，重点开发）
**目标：** 从后台数据导出为格式化的Excel文件

**实现步骤：**

#### 步骤1: 创建导出脚本
```javascript
// scripts/export-json-to-excel.mjs
import XLSX from 'xlsx';
import fs from 'fs';

const JSON_FILE = './data/items.json';
const EXCEL_FILE = './清迈活动数据-导出.xlsx';

// 读取JSON数据
const items = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));

// 按活动编号排序
items.sort((a, b) => {
    const numA = parseInt(a.activityNumber || a['活动编号'] || '0');
    const numB = parseInt(b.activityNumber || b['活动编号'] || '0');
    return numA - numB;
});

// 定义列顺序（与格式化后的Excel一致）
const columnOrder = [
    '活动编号', '活动标题', '分类', '地点', '价格',
    '时间', '持续时间', '时间信息', '星期', '序号',
    '最低价格', '最高价格', '最大人数', '描述',
    '灵活时间', '状态', '需要预约', 'id'
];

// 转换为Excel格式
const excelData = items.map(item => ({
    '活动编号': item.activityNumber || item['活动编号'] || '',
    '活动标题': item.title || '',
    '分类': item.category || '',
    '地点': item.location || '',
    '价格': item.price || '',
    '时间': item.time || '',
    '持续时间': item.duration || '',
    '时间信息': item.timeInfo || '',
    '星期': Array.isArray(item.weekdays) ? item.weekdays.join(', ') : '',
    '序号': item.sortOrder || 0,
    '最低价格': item.minPrice || 0,
    '最高价格': item.maxPrice || 0,
    '最大人数': item.maxParticipants || 0,
    '描述': item.description || '',
    '灵活时间': item.flexibleTime || '否',
    '状态': item.status || '草稿',
    '需要预约': item.requireBooking || '是',
    'id': item.id || ''
}));

// 创建工作表
const worksheet = XLSX.utils.json_to_sheet(excelData, {
    header: columnOrder
});

// 设置列宽
const colWidths = [
    { wch: 12 }, // 活动编号
    { wch: 30 }, // 活动标题
    { wch: 12 }, // 分类
    { wch: 30 }, // 地点
    { wch: 18 }, // 价格
    { wch: 18 }, // 时间
    { wch: 15 }, // 持续时间
    { wch: 15 }, // 时间信息
    { wch: 20 }, // 星期
    { wch: 8 },  // 序号
    { wch: 12 }, // 最低价格
    { wch: 12 }, // 最高价格
    { wch: 12 }, // 最大人数
    { wch: 40 }, // 描述
    { wch: 12 }, // 灵活时间
    { wch: 12 }, // 状态
    { wch: 12 }, // 需要预约
    { wch: 18 }  // id
];
worksheet['!cols'] = colWidths;

// 保存文件
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, '活动列表');
XLSX.writeFile(workbook, EXCEL_FILE);

console.log(`✅ 已导出 ${items.length} 条活动到 ${EXCEL_FILE}`);
```

#### 步骤2: 添加npm脚本
```json
// package.json
{
  "scripts": {
    "export-json-to-excel": "node scripts/export-json-to-excel.mjs",
    "export-to-excel": "npm run export-json-to-excel"
  }
}
```

**可能遇到的问题：**

##### 问题1: 星期数组导出格式
**现象：**
- JSON中是数组：`["周一", "周二"]`
- Excel中显示为：`["周一","周二"]`（带引号）

**解决方案：**
```javascript
// 转换为逗号分隔的字符串
'星期': Array.isArray(item.weekdays) ? item.weekdays.join(', ') : (item.weekdays || '')
```

##### 问题2: ID列格式
**现象：**
- JSON中ID是字符串或数字
- Excel中显示为科学计数法

**解决方案：**
```javascript
// 方案1: 转换为文本格式
excelData.forEach(item => {
    item.id = String(item.id); // 确保是字符串
});

// 方案2: 在Excel中强制文本格式
// 需要使用XLSX的cell属性
```

##### 问题3: 文件覆盖提示
**现象：**
- 导出时可能覆盖正在使用的Excel文件

**解决方案：**
```javascript
// 添加时间戳或备份
const timestamp = new Date().toISOString().slice(0, 10);
const EXCEL_FILE = `./清迈活动数据-导出-${timestamp}.xlsx`;

// 或者先备份
if (fs.existsSync(EXCEL_FILE)) {
    fs.copyFileSync(EXCEL_FILE, `./${EXCEL_FILE}.bak`);
}
```

---

### 3. 双向同步冲突解决（核心难点）

#### 场景1: 同时修改同一活动
**问题：**
- Excel中修改了活动0001的title
- 后台也修改了活动0001的price
- 导入时应该保留哪个版本？

**解决方案：**

##### 方案A: 时间戳比较（推荐）
```javascript
// 在数据中添加 updatedAt 字段
const excelTime = new Date(item.updatedAt || 0);
const dbTime = new Date(dbItem.updatedAt || 0);

if (excelTime > dbTime) {
    // Excel版本更新，使用Excel数据
} else {
    // 后台版本更新，保留后台数据
    console.warn(`⚠️ 活动 ${activityNumber} 后台版本更新，跳过`);
}
```

##### 方案B: 字段级别合并
```javascript
// 合并不同字段的修改
const mergedItem = {
    ...dbItem, // 保留后台原有数据
    ...item,   // Excel中的修改覆盖
    // 特殊处理某些字段
    price: item.price || dbItem.price,
    description: item.description || dbItem.description
};
```

##### 方案C: 手动冲突解决
```javascript
// 创建冲突报告
const conflicts = [];

if (item.title !== dbItem.title) {
    conflicts.push({
        field: 'title',
        activityNumber,
        excelValue: item.title,
        dbValue: dbItem.title
    });
}

if (conflicts.length > 0) {
    console.log('\n⚠️ 发现冲突:');
    conflicts.forEach(c => {
        console.log(`  ${c.activityNumber} - ${c.field}`);
        console.log(`    Excel: ${c.excelValue}`);
        console.log(`    后台: ${c.dbValue}`);
    });
    // 询问用户如何处理
}
```

#### 场景2: 活动编号冲突
**问题：**
- Excel中添加新活动，编号0003
- 但后台已存在0003（之前删除又恢复了）

**解决方案：**
```javascript
// 检查活动编号是否已存在
function checkActivityNumberConflict(excelData, dbData) {
    const excelNumbers = new Set(excelData.map(item => item.activityNumber));
    const dbNumbers = new Set(dbData.map(item => item.activityNumber));

    const conflicts = [...excelNumbers].filter(num => dbNumbers.has(num));

    if (conflicts.length > 0) {
        console.log('⚠️ 发现活动编号冲突:', conflicts);
        // 自动重新编号
        return autoRenumberActivities(excelData, dbData);
    }

    return excelData;
}

// 自动重新编号函数
function autoRenumberActivities(excelData, dbData) {
    const usedNumbers = new Set(dbData.map(item => parseInt(item.activityNumber)));
    let nextNumber = 1;

    return excelData.map(item => {
        if (usedNumbers.has(parseInt(item.activityNumber))) {
            // 分配新编号
            while (usedNumbers.has(nextNumber)) {
                nextNumber++;
            }
            const newNumber = String(nextNumber).padStart(4, '0');
            console.log(`🔄 ${item.activityNumber} → ${newNumber}`);
            item.activityNumber = newNumber;
            usedNumbers.add(nextNumber);
        }
        return item;
    });
}
```

#### 场景3: 删除活动的处理
**问题：**
- Excel中删除了活动0002
- 后台数据中仍然存在0002
- 导入时应该如何处理？

**解决方案：**

##### 方案A: 软删除（推荐）
```javascript
// 不真正删除，只标记为已删除
item.status = 'deleted';
item.deletedAt = new Date().toISOString();
```

##### 方案B: 硬删除
```javascript
// 创建备份后删除
const deleted = dbData.filter(item => !excelData.find(e => e.activityNumber === item.activityNumber));

if (deleted.length > 0) {
    console.log('🗑️ 将删除以下活动:');
    deleted.forEach(item => {
        console.log(`  - ${item.activityNumber}: ${item.title}`);
    });

    // 保存到备份文件
    fs.writeFileSync('./deleted-backup.json', JSON.stringify(deleted, null, 2));

    // 确认后删除
    const confirm = prompt('确认删除这些活动吗？(yes/no)');
    if (confirm.toLowerCase() === 'yes') {
        // 执行删除
    }
}
```

---

## 🛠️ 技术实现要点

### 1. 文件监听（自动化导入）
使用 `chokidar` 监听Excel文件变化：

```javascript
import chokidar from 'chokidar';

console.log('👀 监听Excel文件变化...');

const watcher = chokidar.watch('./清迈活动数据.xlsx', {
    persistent: true,
    ignoreInitial: true
});

watcher.on('change', (path) => {
    console.log(`\n📝 检测到文件变化: ${path}`);
    console.log('⏳ 自动导入中...');

    // 延迟执行，等待文件保存完成
    setTimeout(() => {
        exec('npm run export-data', (error, stdout, stderr) => {
            if (error) {
                console.error('❌ 导入失败:', error.message);
                return;
            }
            console.log('✅ 导入成功!');
        });
    }, 1000);
});
```

### 2. 数据验证框架
```javascript
// 验证规则配置
const validationRules = {
    title: {
        required: true,
        minLength: 2,
        maxLength: 100
    },
    category: {
        required: true,
        allowed: ['瑜伽', '冥想', '舞蹈', '徒步', '泰拳', '攀岩', '健身', '户外探险', '文化艺术', '咏春拳']
    },
    price: {
        required: true,
        pattern: /^(免费|\d+泰铢|walkin|捐赠)/
    },
    time: {
        required: false,
        pattern: /^(\d{2}:\d{2}-\d{2}:\d{2}|灵活时间)$/
    }
};

// 验证函数
function validateItem(item, rules) {
    const errors = [];

    Object.keys(rules).forEach(field => {
        const rule = rules[field];
        const value = item[field];

        // 必填检查
        if (rule.required && !value) {
            errors.push(`${field} 是必填字段`);
            return;
        }

        // 长度检查
        if (value) {
            if (rule.minLength && value.length < rule.minLength) {
                errors.push(`${field} 长度不能少于 ${rule.minLength} 个字符`);
            }
            if (rule.maxLength && value.length > rule.maxLength) {
                errors.push(`${field} 长度不能超过 ${rule.maxLength} 个字符`);
            }
        }

        // 枚举值检查
        if (rule.allowed && value && !rule.allowed.includes(value)) {
            errors.push(`${field} 必须是以下值之一: ${rule.allowed.join(', ')}`);
        }

        // 正则检查
        if (rule.pattern && value && !rule.pattern.test(value)) {
            errors.push(`${field} 格式不正确`);
        }
    });

    return errors;
}

// 使用示例
items.forEach((item, index) => {
    const errors = validateItem(item, validationRules);
    if (errors.length > 0) {
        console.warn(`⚠️ 第 ${index + 1} 行 (${item.activityNumber}) 验证失败:`);
        errors.forEach(err => console.warn(`  - ${err}`));
    }
});
```

### 3. 变更日志
```javascript
// 记录每次导入的变更
function importExcel() {
    const oldData = JSON.parse(fs.readFileSync('./data/items.json', 'utf8'));
    // ... 导入新数据 ...
    const newData = JSON.parse(fs.readFileSync('./data/items.json', 'utf8'));

    // 生成变更日志
    const changes = {
        timestamp: new Date().toISOString(),
        added: [],
        modified: [],
        deleted: [],
        conflicts: []
    };

    // 检测新增
    newData.forEach(newItem => {
        const exists = oldData.find(old => old.id === newItem.id);
        if (!exists) {
            changes.added.push({
                activityNumber: newItem.activityNumber,
                title: newItem.title
            });
        }
    });

    // 检测修改
    newData.forEach(newItem => {
        const oldItem = oldData.find(old => old.id === newItem.id);
        if (oldItem) {
            const diff = {};
            ['title', 'price', 'time', 'location'].forEach(field => {
                if (newItem[field] !== oldItem[field]) {
                    diff[field] = {
                        old: oldItem[field],
                        new: newItem[field]
                    };
                }
            });
            if (Object.keys(diff).length > 0) {
                changes.modified.push({
                    activityNumber: newItem.activityNumber,
                    changes: diff
                });
            }
        }
    });

    // 保存日志
    const logFile = `./import-log-${Date.now()}.json`;
    fs.writeFileSync(logFile, JSON.stringify(changes, null, 2));
    console.log(`📋 变更日志已保存: ${logFile}`);
}
```

---

## ⚠️ 可能遇到的关键问题汇总

### 问题1: Excel文件锁定
**现象：** Excel文件在Excel中打开时，Node.js无法读取或写入

**解决方案：**
```javascript
// 检查文件是否被锁定
import { open } from 'fs/promises';

async function isFileLocked(filepath) {
    try {
        const fd = await open(filepath, 'r+');
        await fd.close();
        return false;
    } catch (error) {
        if (error.code === 'EBUSY' || error.code === 'EPERM') {
            return true;
        }
        return false;
    }
}

// 使用
if (await isFileLocked('./清迈活动数据.xlsx')) {
    console.error('❌ 文件正在使用中，请关闭Excel后重试');
    process.exit(1);
}
```

### 问题2: 编码问题
**现象：** 中文显示为乱码

**解决方案：**
```javascript
// 确保使用UTF-8编码
fs.writeFileSync(filepath, content, 'utf8');

// Excel可能需要BOM
fs.writeFileSync(filepath, '\uFEFF' + content, 'utf8');
```

### 问题3: 大数据量性能
**现象：** 活动数量多时导出/导入慢

**解决方案：**
```javascript
// 分批处理
function processDataInBatches(data, batchSize, processFn) {
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        processFn(batch, i / batchSize);

        // 显示进度
        console.log(`进度: ${Math.min(100, Math.round((i + batchSize) / data.length * 100))}%`);
    }
}
```

### 问题4: Excel公式丢失
**现象：** 导出时Excel中的公式不见了

**解决方案：**
```javascript
// XLSX库不支持公式，需要在导入时计算值
// 或使用 exceljs 库代替
```

---

## 📝 推荐实施顺序

### 优先级1（核心功能）
1. ✅ 完善 Excel → 后台 导出（已有）
2. 🔄 实现 后台 → Excel 导出（新建）
3. 🔄 添加数据验证和错误提示

### 优先级2（提升体验）
4. 🔄 实现冲突检测和解决
5. 🔄 添加变更日志
6. 🔄 自动文件监听

### 优先级3（高级功能）
7. 🔄 Web界面一键导入导出
8. 🔄 版本控制和回滚
9. 🔄 多人协作支持

---

## 🎯 明日具体任务清单

### 上午任务
- [ ] 创建 `scripts/export-json-to-excel.mjs`
- [ ] 测试从JSON导出Excel
- [ ] 添加npm脚本 `export-to-excel`
- [ ] 验证导出的Excel格式正确

### 下午任务
- [ ] 实现数据验证框架
- [ ] 添加冲突检测逻辑
- [ ] 创建变更日志系统
- [ ] 编写使用文档

### 测试任务
- [ ] 测试双向同步（Excel → 后台 → Excel）
- [ ] 测试冲突场景
- [ ] 测试边界情况（空文件、格式错误等）
- [ ] 性能测试（大量数据）

---

## 📚 需要提前学习的知识点

1. **XLSX库高级用法**
   - 单元格格式设置
   - 列宽自动调整
   - 工作表操作

2. **文件系统API**
   - 文件监听（chokidar）
   - 文件锁定检测
   - 原子性写入

3. **数据验证**
   - JSON Schema
   - 自定义验证规则
   - 错误提示

4. **冲突解决策略**
   - 时间戳比较
   - 字段级别合并
   - 三方合并

5. **性能优化**
   - 流式处理
   - 分批操作
   - 进度显示

---

## 💡 最佳实践建议

1. **始终备份**
   - 每次操作前备份原文件
   - 保留最近3-5个版本

2. **数据验证**
   - 导入前验证数据格式
   - 导出前验证数据完整性

3. **错误处理**
   - 详细的错误日志
   - 友好的错误提示
   - 失败回滚机制

4. **用户确认**
   - 危险操作前询问用户
   - 显示变更预览
   - 支持取消操作

5. **文档完善**
   - 清晰的使用说明
   - 常见问题解答
   - 示例代码
