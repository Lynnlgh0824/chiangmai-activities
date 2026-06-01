# 移动端 Code Review Checklist

> 每次修改 `index.html`、`style.css`、`app.js` 时，逐项检查。

---

## A. 触控目标 (Touch Targets)

- [ ] 所有可点击元素 `min-height ≥ 44px`（iOS HIG）
- [ ] 可点击元素间距 `≥ 8px`
- [ ] 筛选标签关闭按钮区域 `≥ 32px`
- [ ] Bottom Sheet 选项高度 `≥ 44px`

**快速检查命令：**
```javascript
// 在浏览器 Console 运行
document.querySelectorAll('button, a, [onclick], .filter-chip, .tab-item, .activity-chip')
  .forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.height < 44) console.warn('❌ 触控不足:', el, r.height + 'px');
  });
```

---

## B. 字号可读性

- [ ] 用户可读文字 `font-size ≥ 12px`
- [ ] 占位符颜色 `≥ #767676`（WCAG AA 对比度 4.5:1）
- [ ] 主要文字 `#333` 在白底上（12.6:1 AAA）
- [ ] 次要文字 `#666` 在白底上（5.7:1 AA）

---

## C. 布局与溢出

- [ ] 无水平溢出（`body.scrollWidth ≤ body.clientWidth`）
- [ ] `html, body` 设置 `overflow-x: hidden`
- [ ] `overscroll-behavior-y: none`（禁止橡皮筋回弹）
- [ ] `box-sizing: border-box` 在所有容器上
- [ ] 搜索栏所有元素在同一行（390px 视口下）

---

## D. Modal 弹窗

- [ ] 打开时 `body.style.position = 'fixed'`（iOS 必须）
- [ ] 关闭时恢复 `body.style` 并 `scrollTo(之前的 scrollY)`
- [ ] footer 使用 `display: flex`，不用 `display: block`
- [ ] 链接按钮文字颜色在紫色背景上可读（白色）

---

## E. Bottom Sheet

- [ ] `sheet-footer` 使用 `display: flex`（不是 none）
- [ ] `sheet-body` 设置 `overscroll-behavior: contain`
- [ ] 手势变量 `startY/currentY/isDragging` 已在对象初始化时声明
- [ ] Safe Area 底部适配：`padding-bottom: env(safe-area-inset-bottom)`

---

## F. Viewport 与 Safe Area

- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`
- [ ] **不要** 添加 `maximum-scale=1.0` 或 `user-scalable=no`（违反 WCAG）
- [ ] CSS 使用 `env(safe-area-inset-*)` 适配刘海屏

---

## G. 搜索与筛选

- [ ] 搜索框焦点时 `scrollIntoView({ behavior: 'smooth', block: 'start' })`
- [ ] 清空搜索时重置所有相关 filter（包括 `day`）
- [ ] Bottom Sheet 筛选的 `applyFilters()` 与 `currentFilters` 联动
- [ ] 筛选 chip 的 active 状态与 `currentFilters` 同步

---

## H. CSS 规范（逐步执行）

- [ ] **不新增** `!important`（用合理特异性替代）
- [ ] 移动端样式用 `@media (max-width: 768px)` 统一包裹
- [ ] 新增可点击元素必须设置 `touch-action: manipulation`
- [ ] Tab 不使用 `max-width` 截断，用 `overflow-x: auto` 滚动

---

## 自动化验证

每次提交前运行：
```bash
# 移动端回归测试（13 个用例）
node e2e/mobile-regression.cjs

# HTML 结构验证
node e2e/html-validate.cjs
```

**通过标准：全部通过，0 失败。**

---

*Last updated: 2026-06-01*
