# 📝 活动描述重复文案问题 - 完整分析报告

**日期**: 2026-01-30
**问题**: 活动描述在详情弹窗中显示重复内容
**状态**: 已分析，待修复

---

## 🔍 问题表现

### 用户观察到的现象

1. **详情弹窗中显示重复内容**
   - 点击活动卡片查看详情
   - 弹窗中的描述部分包含重复的文案
   - 例如："适合人群：xxx" 出现多次

2. **多次处理过但未根治**
   - 之前已经尝试过多次修复
   - 问题仍然反复出现
   - 需要从数据和代码两个层面彻底解决

---

## 🎯 问题根源分析

### 1️⃣ 渲染位置分析

代码中有**3个地方**渲染活动信息：

#### 位置 1：列表视图（不显示描述）
```javascript
// 文件：index.html
// 行号：5498-5514
// 函数：createScheduleItemHTML(act, isHighlighted)

function createScheduleItemHTML(act, isHighlighted = false) {
    return `
        <div class="schedule-item">
            <div class="schedule-item-title">${cleanTitle(act.title)}</div>
            <div class="schedule-item-meta">
                <span>⏰ ${act.time || '灵活时间'}</span>
                <span>📍 ${act.location}</span>
            </div>
            <div class="schedule-item-price">${act.price}</div>
        </div>
    `;
}
```

**特点**：只显示标题、时间、地点、价格，**不显示描述**

---

#### 位置 2：详细卡片（显示描述前100字符）
```javascript
// 文件：index.html
// 行号：6403
// 函数：createDayDetailView(activities, day)

html += activities.map(act => `
    <div class="activity-detail-card">
        <div>${cleanTitle(act.title)}</div>
        <div>
            <span>⏰ ${act.time || '灵活时间'}</span>
            <span>📍 ${act.location}</span>
            <span>💰 ${act.price}</span>
        </div>
        ${act.description ? `<div>${act.description.substring(0, 100)}${act.description.length > 100 ? '...' : ''}</div>` : ''}
    </div>
`).join('');
```

**特点**：显示描述的**前100个字符**

---

#### 位置 3：详情弹窗（显示完整描述）⚠️
```javascript
// 文件：index.html
// 行号：6911-6975
// 函数：showActivityDetail(activityId)

function showActivityDetail(activityId) {
    const activity = allActivities.find(a => a.originalId == activityId || a.id == activityId);

    // 设置顶部字段（标题、分类、地点、时间、价格、频率）
    setTitle('modalTitle', activity.title);
    setTitle('modalCategory', activity.category);
    setTitle('modalLocation', activity.location);
    setTitle('modalTime', activity.time || '灵活时间');
    setTitle('modalPrice', activity.price || '');
    setTitle('modalFrequency', activity.frequency === 'weekly' ? '每周' : '一次性');

    // ⚠️ 格式化描述信息，过滤掉顶部已显示的字段
    const baseDescription = activity.description || '暂无描述';
    const formattedDescription = formatDescription(baseDescription, activity);

    const descEl = document.getElementById('modalDescription');
    if (descEl) {
        descEl.innerHTML = sanitizeHTML(formattedDescription);
    }
}
```

**特点**：显示完整描述，通过 `formatDescription` 函数处理

---

### 2️⃣ formatDescription 函数分析

```javascript
// 文件：index.html
// 行号：7005-7095

function formatDescription(description, activity = null) {
    if (!description) return '暂无描述';

    let formatted = description;

    // ========== 第1步：清理冗余符号 ==========
    formatted = formatted.replace(/!!+/g, '!');
    formatted = formatted.replace(/‼️+/g, '⚠️');
    formatted = formatted.replace(/❗❗+/g, '⚠️');
    formatted = formatted.replace(/❗+/g, '⚠️');
    formatted = formatted.replace(/(⚠️\s*){2,}/g, '⚠️ ');
    formatted = formatted.replace(/。+/g, '。');
    formatted = formatted.replace(/：+/g, '：');
    formatted = formatted.replace(/，+/g, '，');

    // ========== 第2步：过滤掉顶部已显示的字段 ==========
    if (activity) {
        // 过滤时间信息
        if (activity.time && activity.time !== '灵活时间') {
            formatted = formatted.replace(/[⏰]?\s*时间[：:]\s*[^\n]*/g, '');
        }

        // 过滤价格/费用信息
        if (activity.price) {
            formatted = formatted.replace(/[💰]?\s*费用[：:]\s*[^\n]*/g, '');
        }
    }

    // ========== 第3步：添加图标和结构化展示 ==========
    const fieldPatterns = [
        { pattern: /适合人群[：:]\s*/g, icon: '👥', label: '适合人群：' },
        { pattern: /活动特点[：:]\s*/g, icon: '✨', label: '活动特点：' },
        { pattern: /课程周期[：:]\s*/g, icon: '📚', label: '课程周期：' },
        { pattern: /标准课程周期[：:]\s*/g, icon: '📚', label: '课程周期：' },
        { pattern: /语言[：:]\s*/g, icon: '🌐', label: '语言：' },
        { pattern: /费用[：:]\s*/g, icon: '💰', label: '费用：' },
        { pattern: /官网[：:]\s*/g, icon: '🌐', label: '官网：' },
        { pattern: /联系方式[：:]\s*/g, icon: '📞', label: '联系方式：' },
        { pattern: /(⚠️\s*)?注意事项[：:]\s*/g, icon: '⚠️', label: '注意事项：' }
    ];

    // 替换所有匹配的字段
    fieldPatterns.forEach(({ pattern, icon, label }) => {
        formatted = formatted.replace(pattern, `\n<strong>${icon} ${label}</strong>`);
    });

    // ... HTML转义和格式化处理
}
```

---

## ⚠️ 问题根源

### 问题 1：数据源本身包含重复内容

**可能的情况**：
- JSON 数据文件中的 `description` 字段本身包含重复的标签和内容
- 例如：`"适合人群：xxx\n活动特点：yyy\n适合人群：xxx"`
- 数据采集时没有去重处理

**验证方法**：
```javascript
// 在浏览器控制台执行
allActivities.forEach(act => {
    const desc = act.description || '';
    const populationMatches = (desc.match(/适合人群/g) || []).length;
    if (populationMatches > 1) {
        console.log('发现重复:', act.id, act.title, populationMatches);
    }
});
```

---

### 问题 2：formatDescription 过滤规则不完整

**当前过滤的字段**：
- ✅ 时间（time）
- ✅ 价格/费用（price）

**未过滤的字段**：
- ❌ 标题（title）
- ❌ 分类（category）
- ❌ 地点（location）

**如果描述中包含这些字段，就会重复显示**

---

### 问题 3：字段标签格式不统一

**描述中可能出现的格式**：
- "适合人群："（中文冒号）
- "适合人群:"（英文冒号）
- "适合人群："（有空格）
- "适合人群："（多个冒号）
- "👥 适合人群："（已有图标）

**formatDescription 虽然处理了部分格式，但可能遗漏某些边界情况**

---

## 🔧 修复方案

### 方案 1：数据层修复（推荐）⭐

#### 步骤 1：检查数据源

```bash
# 找到数据文件
cd /Users/yuzhoudeshengyin/Documents/my_project/Chiengmai
find . -name "*.json" -type f | grep -E "(activity|data)"
```

#### 步骤 2：分析重复模式

```javascript
// 创建脚本：scripts/analyze-description-duplicates.mjs

import fs from 'fs';

const dataFiles = [
    'data/activities.json',
    'public/data/activities.json'
];

for (const file of dataFiles) {
    try {
        const content = fs.readFileSync(file, 'utf-8');
        const activities = JSON.parse(content);

        console.log(`\n分析文件: ${file}`);
        console.log(`总活动数: ${activities.length}`);

        let duplicateCount = 0;

        activities.forEach(act => {
            const desc = act.description || '';

            // 检查重复的字段标签
            const fields = ['适合人群', '活动特点', '课程周期', '语言', '费用', '注意事项', '联系方式', '官网'];

            fields.forEach(field => {
                const regex = new RegExp(field + '[：:]', 'g');
                const matches = desc.match(regex);
                if (matches && matches.length > 1) {
                    duplicateCount++;
                    console.log(`\n活动: ${act.title} (${act.id})`);
                    console.log(`  重复字段: ${field} (${matches.length}次)`);
                    console.log(`  描述预览: ${desc.substring(0, 200)}...`);
                }
            });
        });

        console.log(`\n发现重复: ${duplicateCount} 个字段`);

    } catch (error) {
        console.log(`文件不存在或无法解析: ${file}`);
    }
}
```

运行脚本：
```bash
node scripts/analyze-description-duplicates.mjs
```

#### 步骤 3：修复数据源

```javascript
// 创建脚本：scripts/fix-description-duplicates.mjs

import fs from 'fs';

function fixDescriptionDuplicates(description) {
    if (!description) return description;

    let fixed = description;

    // 定义需要去重的字段
    const fields = [
        { name: '适合人群', icon: '👥' },
        { name: '活动特点', icon: '✨' },
        { name: '课程周期', icon: '📚' },
        { name: '语言', icon: '🌐' },
        { name: '费用', icon: '💰' },
        { name: '注意事项', icon: '⚠️' },
        { name: '联系方式', icon: '📞' },
        { name: '官网', icon: '🌐' }
    ];

    // 对每个字段进行去重
    fields.forEach(field => {
        // 匹配所有出现的字段标签（包括已有图标的情况）
        const regex = new RegExp(`(?:${field.icon}\\s*)?${field.name}[：:]\\s*.*?(?:\\n|$)`, 'gi');

        const matches = fixed.match(regex);
        if (matches && matches.length > 1) {
            // 只保留第一次出现的内容
            const firstMatch = matches[0];

            // 移除所有匹配
            fixed = fixed.replace(regex, '');

            // 将第一次出现的内容添加到末尾
            fixed = fixed.trim() + '\n' + firstMatch.trim();
        }
    });

    return fixed;
}

// 读取数据文件
const dataFile = 'data/activities.json';
const activities = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

// 修复每个活动的描述
activities.forEach(act => {
    if (act.description) {
        act.description = fixDescriptionDuplicates(act.description);
    }
});

// 保存修复后的数据
fs.writeFileSync(dataFile, JSON.stringify(activities, null, 2), 'utf-8');

console.log('✅ 数据修复完成');
```

---

### 方案 2：代码层修复（增强 formatDescription）

#### 修复内容

```javascript
// 文件：index.html
// 函数：formatDescription

function formatDescription(description, activity = null) {
    if (!description) return '暂无描述';

    let formatted = description;

    // ========== 第0步：新增 - 去重处理 ==========
    // 对常见字段进行去重
    const deduplicateFields = [
        { pattern: /(?:👥\s*)?适合人群[：:]\s*.*?(?=\n|$)/gi },
        { pattern: /(?:✨\s*)?活动特点[：:]\s*.*?(?=\n|$)/gi },
        { pattern: /(?:📚\s*)?(?:标准)?课程周期[：:]\s*.*?(?=\n|$)/gi },
        { pattern: /(?:🌐\s*)?语言[：:]\s*.*?(?=\n|$)/gi },
        { pattern: /(?:💰\s*)?费用[：:]\s*.*?(?=\n|$)/gi },
        { pattern: /(?:⚠️\s*)?注意事项[：:]\s*.*?(?=\n|$)/gi },
        { pattern: /(?:📞\s*)?联系方式[：:]\s*.*?(?=\n|$)/gi },
        { pattern: /(?:🌐\s*)?官网[：:]\s*.*?(?=\n|$)/gi }
    ];

    deduplicateFields.forEach(({ pattern }) => {
        const matches = formatted.match(pattern);
        if (matches && matches.length > 1) {
            // 只保留第一次出现的内容
            const firstMatch = matches[0];
            // 移除所有匹配
            formatted = formatted.replace(pattern, '');
            // 将第一次出现的内容添加回原位置
            formatted = firstMatch + '\n' + formatted;
        }
    });

    // ========== 第1步：清理冗余符号 ==========
    formatted = formatted.replace(/!!+/g, '!');
    formatted = formatted.replace(/‼️+/g, '⚠️');
    formatted = formatted.replace(/❗❗+/g, '⚠️');
    formatted = formatted.replace(/❗+/g, '⚠️');
    formatted = formatted.replace(/(⚠️\s*){2,}/g, '⚠️ ');
    formatted = formatted.replace(/。+/g, '。');
    formatted = formatted.replace(/：+/g, '：');
    formatted = formatted.replace(/，+/g, '，');

    // ========== 第2步：过滤掉顶部已显示的字段（增强版）==========
    if (activity) {
        // 过滤标题
        if (activity.title) {
            formatted = formatted.replace(new RegExp(activity.title, 'g'), '');
        }

        // 过滤分类
        if (activity.category) {
            formatted = formatted.replace(/分类[：:]\s*[^\n]*/g, '');
        }

        // 过滤时间信息
        if (activity.time && activity.time !== '灵活时间') {
            formatted = formatted.replace(/[⏰]?\s*时间[：:]\s*[^\n]*/g, '');
        }

        // 过滤地点
        if (activity.location) {
            formatted = formatted.replace(/[📍]?\s*地点[：:]\s*[^\n]*/g, '');
            formatted = formatted.replace(new RegExp(activity.location, 'g'), '');
        }

        // 过滤价格/费用信息
        if (activity.price) {
            formatted = formatted.replace(/[💰]?\s*费用[：:]\s*[^\n]*/g, '');
            formatted = formatted.replace(new RegExp(activity.price, 'g'), '');
        }
    }

    // ========== 第3步：添加图标和结构化展示 ==========
    const fieldPatterns = [
        { pattern: /适合人群[：:]\s*/g, icon: '👥', label: '适合人群：' },
        { pattern: /活动特点[：:]\s*/g, icon: '✨', label: '活动特点：' },
        { pattern: /课程周期[：:]\s*/g, icon: '📚', label: '课程周期：' },
        { pattern: /标准课程周期[：:]\s*/g, icon: '📚', label: '课程周期：' },
        { pattern: /语言[：:]\s*/g, icon: '🌐', label: '语言：' },
        { pattern: /费用[：:]\s*/g, icon: '💰', label: '费用：' },
        { pattern: /官网[：:]\s*/g, icon: '🌐', label: '官网：' },
        { pattern: /联系方式[：:]\s*/g, icon: '📞', label: '联系方式：' },
        { pattern: /(⚠️\s*)?注意事项[：:]\s*/g, icon: '⚠️', label: '注意事项：' }
    ];

    // 替换所有匹配的字段
    fieldPatterns.forEach(({ pattern, icon, label }) => {
        formatted = formatted.replace(pattern, `\n<strong>${icon} ${label}</strong>`);
    });

    // ... 后续处理保持不变
}
```

---

## 📊 问题总结

### 给AI的清晰描述

**标题**：活动描述在详情弹窗中显示重复内容

**问题描述**：
1. 点击活动卡片查看详情时，弹窗中的描述部分包含重复的标签和内容
2. 例如："适合人群：xxx" 在描述中出现多次
3. 之前已经尝试过多次修复，但问题反复出现

**可能的原因**：
1. **数据源问题**：JSON 数据文件中的 description 字段本身包含重复内容
2. **过滤不完整**：formatDescription 函数未对所有重复字段进行去重
3. **格式不统一**：字段标签有多种格式（中文冒号、英文冒号、有空格等）

**需要的修复**：
1. 检查数据源，分析重复模式
2. 增强 formatDescription 函数的去重逻辑
3. 确保所有字段标签格式统一处理

**相关代码位置**：
- formatDescription 函数：index.html 第 7005-7095 行
- showActivityDetail 函数：index.html 第 6911-6975 行
- 数据文件：需要定位具体的 JSON 文件路径

---

**创建时间**: 2026-01-30
**维护者**: Claude Code
**相关文档**: [描述重复问题分析报告](./DESCRIPTION-DUPLICATE-ANALYSIS.md)
