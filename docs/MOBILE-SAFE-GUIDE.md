# 🧹 Mobile Anti-Overflow 安全使用指南

## 📖 概述

`mobile-safe.css` 是一套专为移动端设计的防横向溢出安全清单，确保在任何状态切换、DOM 显示/隐藏的情况下，页面都不会出现横向滚动条或白色空白区域。

**创建时间**: 2026-01-30
**适用范围**: 移动端 H5 页面（375px - 768px）

---

## ✅ 安全规则检查清单

### ✅ ① 全局兜底（必须有）
```css
html, body {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
}
```
**作用**: 防止任何子元素把页面整体撑宽，移动端等价于安全气囊

### ✅ ② container 层保护
```css
body.mode-h5.is-mobile .container {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
}
```
**原因**: container 一旦没锁 width，里面 flex / absolute / translate 都可能外溢

### ✅ ③ tab/pane 层禁止内联 padding
```css
body.mode-h5.is-mobile .tab-pane {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
    padding-top: var(--tab-offset, 16px);
}
```
**原则**: tab-pane 永远不能参与横向尺寸计算

### ✅ ④ active-filters 永不超宽组件
```css
body.mode-h5.is-mobile .active-filters {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-wrap: wrap;        /* 🔥 必须：能 wrap 就别 scroll */
    gap: 8px;
    overflow-x: hidden;     /* 防止单条撑爆 */
}
```
**心法**: 筛选条 ≠ 横向滚动容器，能 wrap 就别 scroll

### ✅ ⑤ 日期/Tab 按钮区分开角色
```css
body.mode-h5.is-mobile .date-tabs,
body.mode-h5.is-mobile .date-grid {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;       /* 可以横滚，但不撑页面 */
    box-sizing: border-box;
}
```
**区分**:
| 类型 | overflow |
|------|----------|
| 页面容器 | hidden |
| 功能滚动区 | auto |

### ✅ ⑥ 列表卡片防内容撑爆
```css
body.mode-h5.is-mobile .card,
body.mode-h5.is-mobile .list-item {
    max-width: 100%;
    box-sizing: border-box;
    min-width: 0;           /* 🔥 防 flex 子元素撑爆 */
}
```
**关键**: 这是 90% flex 超宽 bug 的解药

### ✅ ⑦ show/hide 状态切换安全
```css
body.mode-h5.is-mobile .show {
    display: flex;          /* 明确 layout */
    max-width: 100%;
}
```
**注意**: display 切换时，浏览器会重新算宽，不给上限 = 风险

---

## 🛠️ 开发态溢出报警器

### 如何启用

在浏览器控制台执行：

```javascript
// 启用溢出报警器
document.body.classList.add('debug-outline');

// 禁用溢出报警器
document.body.classList.remove('debug-outline');
```

### 报警器颜色说明

- **红色外框** (`rgba(255, 0, 0, 0.3)`): 有 width/min-width/max-width 样式的元素（潜在风险）
- **淡红色外框** (`rgba(255, 0, 0, 0.1)`): 所有元素（用于观察布局结构）
- **绿色外框** (`rgba(0, 255, 0, 0.2)`): 已添加 overflow-x: hidden 的安全元素

### 使用场景

1. **调试新添加的组件**: 启用报警器，检查是否有红色外框元素超出容器
2. **修复横向溢出问题**: 快速定位是哪个元素撑宽了页面
3. **Code Review**: 视觉化检查布局安全性

---

## 🔍 常见问题诊断

### 问题 1: 右侧出现白色空白

**可能原因**:
- active-filters 没有设置 `width: 100%` 和 `box-sizing: border-box`
- flex 子元素没有设置 `min-width: 0`
- 内联 padding（style="padding-top: 200px"）

**解决方案**:
```css
/* 检查并添加 */
.element {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    min-width: 0;  /* flex 子元素必须 */
}
```

### 问题 2: 切换 Tab 时出现横向滚动

**可能原因**:
- tab-pane 使用内联样式设置 padding
- display: block 切换时浏览器重新计算宽度

**解决方案**:
```css
/* 不要用内联 style */
/* ❌ 错误 */
<div class="tab-pane" style="padding-top: 200px">

/* ✅ 正确 */
.tab-pane {
    padding-top: var(--tab-offset, 16px);
}
```

### 问题 3: 筛选标签撑宽页面

**可能原因**:
- active-filters 没有设置 `flex-wrap: wrap`
- 子元素没有设置 `flex-shrink: 1`

**解决方案**:
```css
.active-filters {
    display: flex;
    flex-wrap: wrap;  /* 必须 */
    gap: 8px;
}

.active-filters > * {
    flex-shrink: 1;
    max-width: calc(100vw - 48px);
}
```

---

## 📊 项目集成状态

### ✅ 已完成

- [x] 创建 `mobile-safe.css` 安全样式文件
- [x] 在 `index.html` 中引入安全样式
- [x] 修复 `tab-pane` 内联 padding（移除 !important）
- [x] 修复 `active-filters` 超宽保护
- [x] 添加 Flex 子元素通用保护（`min-width: 0`）
- [x] 创建开发态溢出报警器

### 📝 后续建议

- [ ] 在开发环境默认启用 `debug-outline`
- [ ] 添加自动化测试检测横向溢出
- [ ] Code Review 时检查新增样式是否符合安全清单

---

## 🧠 一句话总结

> **移动端只要"状态条 + flex + 未锁宽"，迟早横向溢出。**

---

## 📞 问题反馈

如果在使用过程中发现新的溢出问题，请按照以下步骤排查：

1. 启用 `debug-outline` 查看红色外框元素
2. 对照安全规则检查清单逐项验证
3. 使用 Chrome DevTools 的 Elements 面板查看元素计算后的宽度
4. 记录复现步骤和截图，提交 Issue

---

**最后更新**: 2026-01-30
**维护者**: Claude Code
