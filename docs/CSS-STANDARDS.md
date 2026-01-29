# CSS编写规范文档

**项目**: 清迈活动查询平台
**版本**: v1.0
**创建时间**: 2026-01-29
**维护者**: 开发团队
**更新频率**: 每月更新或需要时更新

---

## 📋 目录

1. [溢出保护标准](#溢出保护标准)
2. [盒模型规范](#盒模型规范)
3. [响应式规范](#响应式规范)
4. [选择器规范](#选择器规范)
5. [颜色和字体规范](#颜色和字体规范)
6. [动画和过渡规范](#动画和过渡规范)
7. [性能优化规范](#性能优化规范)
8. [代码组织规范](#代码组织规范)

---

## 🛡️ 溢出保护标准

### 核心原则

**所有容器和卡片元素必须添加溢出保护**

### 标准模式

#### 1. 基础容器溢出保护

**适用于**: 所有容器元素（div, section, article等）

```css
/* ✅ 标准模式 */
.container {
    /* 1. 限制最大宽度 */
    max-width: 100%;

    /* 2. 规范盒模型 */
    box-sizing: border-box;

    /* 3. 隐藏溢出内容 */
    overflow: hidden;
}
```

**解释**:
- `max-width: 100%` - 确保元素宽度不超过父容器
- `box-sizing: border-box` - padding和border包含在width内，不会增加元素总宽度
- `overflow: hidden` - 隐藏超出容器的内容，避免布局破坏

#### 2. 卡片元素溢出保护

**适用于**: 卡片、面板、弹窗等UI组件

```css
/* ✅ 卡片元素 */
.card, .panel, .modal {
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;

    /* 可选：添加内边距 */
    padding: 12px;
}
```

#### 3. 移动端强化保护

**适用于**: 移动端所有元素（≤768px）

```css
/* ✅ 移动端强化版 */
@media (max-width: 768px) {
    .element {
        max-width: 100% !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
    }
}
```

**注意**:
- 移动端使用 `!important` 覆盖PC端样式
- 同时设置 `max-width` 和 `width` 确保限制生效
- `overflow: hidden` 防止内容溢出

#### 4. 负边距特殊情况

**适用于**: 使用负边距扩展容器的元素

```css
/* ✅ 负边距时的正确做法 */
.element {
    margin: 0 -8px; /* 负边距扩展容器 */

    /* 必须调整width以抵消负边距 */
    max-width: 100% !important;
    width: calc(100% + 16px) !important; /* 100% + 左右负边距 */
    box-sizing: border-box !important;
    overflow: hidden !important;
}
```

**计算公式**:
```
width = 100% + |左边距| + |右边距|
例如: width = 100% + 8px + 8px = calc(100% + 16px)
```

#### 5. Flex/Grid子项溢出保护

**适用于**: Flex或Grid容器的子元素

```css
/* ✅ Flex子项 */
.flex-container .item {
    max-width: 100%;
    box-sizing: border-box;

    /* 根据需要设置flex属性 */
    flex: 0 0 auto; /* 不放大，不缩小，自然宽度 */

    /* 或允许弹性伸缩 */
    flex: 1 1 auto; /* 允许伸缩，但不超过100% */

    overflow: hidden;
}

/* ✅ Grid子项 */
.grid-container .item {
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;

    /* Grid会自动处理宽度 */
}
```

### 禁止模式

#### ❌ 错误示例1: 缺少溢出保护

```css
/* ❌ 错误：没有溢出保护 */
.card {
    padding: 12px;
    /* 当padding很大时，可能导致总宽度超出父容器 */
}
```

**修复**:
```css
/* ✅ 正确：添加溢出保护 */
.card {
    padding: 12px;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
}
```

#### ❌ 错误示例2: 使用content-box盒模型

```css
/* ❌ 错误：使用默认盒模型 */
.card {
    box-sizing: content-box; /* padding会增加元素总宽度 */
    width: 100%;
    padding: 20px;
    /* 总宽度 = 100% + 40px，会溢出 */
}
```

**修复**:
```css
/* ✅ 正确：使用border-box */
.card {
    box-sizing: border-box; /* padding包含在width内 */
    width: 100%;
    padding: 20px;
    /* 总宽度 = 100%，padding占用内部空间 */
}
```

#### ❌ 错误示例3: 固定宽度导致溢出

```css
/* ❌ 错误：固定宽度不考虑小屏幕 */
.card {
    width: 400px;
    /* 在375px屏幕上会溢出 */
}
```

**修复**:
```css
/* ✅ 正确：使用max-width限制 */
.card {
    width: 400px;
    max-width: 100%; /* 小屏幕上不超过100% */
    box-sizing: border-box;
}
```

### 检查清单

添加新样式时，必须检查：

- [ ] 添加了 `max-width: 100%`
- [ ] 添加了 `box-sizing: border-box`
- [ ] 添加了 `overflow: hidden`
- [ ] 移动端有对应的媒体查询样式
- [ ] 使用负边距时调整了width
- [ ] Flex/Grid子项有对应的溢出保护

---

## 📦 盒模型规范

### 核心原则

**所有元素统一使用 `border-box` 盒模型**

### 全局设置

```css
/* ✅ 项目全局盒模型设置 */
*, *::before, *::after {
    box-sizing: border-box;
}
```

**为什么使用border-box?**

| 盒模型 | width计算 | padding影响 | border影响 | 推荐度 |
|--------|----------|------------|-----------|--------|
| **content-box** (默认) | 只包含内容 | 增加总宽度 | 增加总宽度 | ❌ |
| **border-box** | 包含padding和border | 不增加总宽度 | 不增加总宽度 | ✅ |

### width vs max-width

```css
/* ✅ 推荐使用max-width */
.element {
    width: auto;        /* 自然宽度 */
    max-width: 100%;    /* 但不超过父容器 */
}

/* ✅ 或组合使用 */
.element {
    width: 400px;       /* PC端固定宽度 */
    max-width: 100%;    /* 移动端自适应 */
}

/* ❌ 避免：只使用width */
.element {
    width: 100%;        /* 可能导致子元素溢出 */
}
```

### padding使用规范

#### 1. 容器padding

```css
/* ✅ 正确：使用border-box */
.container {
    box-sizing: border-box;
    width: 100%;
    padding: 16px;
    /* 总宽度仍为100%，padding占用内部空间 */
}
```

#### 2. 卡片padding

```css
/* ✅ 卡片padding */
.card {
    box-sizing: border-box;
    max-width: 100%;
    padding: 12px 16px; /* 上12px，左右16px */
}
```

#### 3. 移动端padding

```css
/* ✅ 移动端减小padding */
@media (max-width: 768px) {
    .card {
        padding: 8px 12px; /* 减小padding节省空间 */
    }
}
```

### margin使用规范

#### 1. 正边距

```css
/* ✅ 正常使用margin */
.element {
    margin: 16px;
    box-sizing: border-box;
}
```

#### 2. 负边距

```css
/* ⚠️ 负边距需要特殊处理 */
.element {
    margin: 0 -8px;
    max-width: 100%;
    width: calc(100% + 16px); /* 抵消负边距 */
    box-sizing: border-box;
    overflow: hidden;
}
```

#### 3. margin合并

```css
/* ✅ 使用CSS变量避免margin合并 */
.element {
    margin-top: var(--space-md);
    margin-bottom: var(--space-md);
}
```

### border使用规范

```css
/* ✅ border包含在width内（border-box） */
.element {
    box-sizing: border-box;
    width: 100%;
    border: 2px solid #e0e0e0;
    /* 总宽度仍为100% */
}
```

---

## 📱 响应式规范

### 断点标准

```css
/* 项目标准断点 */
:root {
    --mobile-breakpoint: 768px;    /* 移动端 */
    --small-mobile-breakpoint: 374px; /* 小屏移动端 */
    --tablet-breakpoint: 1024px;   /* 平板 */
    --desktop-breakpoint: 1440px;  /* 桌面 */
}
```

### 移动优先策略

#### 1. 基础样式（移动端）

```css
/* ✅ 默认移动端样式 */
.element {
    width: 100%;
    padding: 12px;
    font-size: 14px;
}
```

#### 2. PC端增强

```css
/* ✅ PC端增强 */
@media (min-width: 769px) {
    .element {
        width: auto;
        padding: 16px;
        font-size: 16px;
    }
}
```

#### 3. 或PC优先（不推荐）

```css
/* ⚠️ PC优先（不推荐，但可接受） */
.element {
    width: 1200px; /* PC端 */
}

@media (max-width: 768px) {
    .element {
        width: 100%; /* 移动端 */
    }
}
```

### 媒体查询使用规范

#### 1. 移动端专属样式

```css
/* ✅ 移动端（≤768px） */
@media (max-width: 768px) {
    .selector {
        /* 移动端样式 */
    }
}
```

#### 2. 超小屏幕优化

```css
/* ✅ 小屏移动端（≤374px） */
@media (max-width: 374px) {
    .selector {
        /* 小屏优化 */
    }
}
```

#### 3. 平板适配

```css
/* ✅ 平板（769px - 1024px） */
@media (min-width: 769px) and (max-width: 1024px) {
    .selector {
        /* 平板样式 */
    }
}
```

### 响应式单位使用

```css
/* ✅ 推荐使用相对单位 */
.element {
    /* 宽度 */
    width: 100%;          /* 百分比 */
    max-width: 600px;     /* 固定最大值 */

    /* 字体 */
    font-size: 1rem;       /* 相对于根元素 */
    font-size: 16px;       /* 固定值 */

    /* 间距 */
    padding: 1em;          /* 相对于字体大小 */
    gap: 1rem;            /* 相对于根元素 */
}

/* ⚠️ 谨慎使用vw/vh */
.element {
    width: 50vw;          /* 视口宽度的50% */
    height: 100vh;         /* 视口高度的100% */
}
```

### 触摸目标规范

```css
/* ✅ 移动端触摸目标≥44px */
@media (max-width: 768px) {
    .button, .link, .card {
        min-width: 44px;   /* iOS/Android最小 */
        min-height: 44px;
        padding: 12px 16px;
    }
}
```

### 图片响应式

```css
/* ✅ 图片自适应 */
img {
    max-width: 100%;
    height: auto;
    display: block;
}
```

---

## 🎯 选择器规范

### 优先级管理

#### 1. 避免过度嵌套

```css
/* ❌ 错误：过度嵌套 */
.sidebar .widget .title .text {
    color: #333;
}

/* ✅ 正确：使用类名 */
.widget-title-text {
    color: #333;
}
```

#### 2. 使用BEM命名

```css
/* ✅ BEM命名 */
.block { }
.block__element { }
.block__element--modifier { }

/* 示例 */
.card { }
.card__title { }
.card__title--large { }
```

#### 3. 避免使用 !important

```css
/* ❌ 错误：滥用!important */
.element {
    color: red !important;
}

/* ✅ 正确：使用更具体的选择器 */
.parent .element {
    color: red;
}

/* ✅ 移动端可使用!important覆盖 */
@media (max-width: 768px) {
    .element {
        color: red !important; /* 覆盖PC端样式 */
    }
}
```

### 选择器性能

```css
/* ✅ 优先使用类选择器 */
.class-name { }

/* ⚠️ 限制使用属性选择器 */
[type="text"] { }

/* ❌ 避免使用通配符 */
* { }

/* ❌ 避免使用复杂选择器 */
body div ul li a span { }
```

---

## 🎨 颜色和字体规范

### CSS变量定义

```css
:root {
    /* 主色调 */
    --color-primary: #667eea;
    --color-primary-dark: #5568d3;
    --color-primary-light: #8b9ef5;

    /* 辅助色 */
    --color-secondary: #764ba2;
    --color-accent: #ffd700;

    /* 中性色 */
    --color-text-primary: #333333;
    --color-text-secondary: #666666;
    --color-text-hint: #999999;
    --color-border: #e0e0e0;

    /* 背景色 */
    --color-bg-primary: #ffffff;
    --color-bg-secondary: #f8f9fa;
    --color-bg-tertiary: #f5f5f5;

    /* 字体 */
    --font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-size-base: 16px;
    --line-height-base: 1.5;
}
```

### 字体使用规范

```css
/* ✅ 字体大小层级 */
h1 { font-size: 32px; }
h2 { font-size: 24px; }
h3 { font-size: 20px; }
h4 { font-size: 16px; }
body { font-size: 16px; }
small { font-size: 14px; }

/* ✅ 移动端字体 */
@media (max-width: 768px) {
    h1 { font-size: 24px; }
    h2 { font-size: 20px; }
    h3 { font-size: 18px; }
}
```

---

## 🎬 动画和过渡规范

### 性能优先

```css
/* ✅ 优先使用transform和opacity */
.animated {
    transition: transform 0.3s ease, opacity 0.3s ease;
    transform: translateX(0);
    opacity: 1;
}

.animated:hover {
    transform: translateX(10px);
    opacity: 0.8;
}
```

### 缓动函数

```css
/* ✅ 标准缓动函数 */
transition: all 0.3s ease;           /* 通用 */
transition: all 0.3s ease-in;        /* 淡入 */
transition: all 0.3s ease-out;       /* 淡出 */
transition: all 0.3s ease-in-out;    /* 淡入淡出 */
```

### 减少重绘

```css
/* ✅ 使用will-change提示浏览器 */
.animated {
    will-change: transform, opacity;
}

/* ❌ 不要滥用will-change */
.animated {
    will-change: all; /* 性能杀手 */
}
```

---

## ⚡ 性能优化规范

### 选择器优化

```css
/* ✅ 使用类选择器 */
.button { }

/* ⚠️ 限制使用属性选择器 */
input[type="text"] { }

/* ❌ 避免使用后代选择器 */
.container div span a { }
```

### 避免深层嵌套

```css
/* ❌ 错误：超过3层嵌套 */
.block .element .item .text {
    color: #333;
}

/* ✅ 正确：最多3层 */
.block .item .text {
    color: #333;
}
```

### 使用CSS变量

```css
/* ✅ 使用CSS变量复用 */
.button {
    padding: var(--space-sm) var(--space-md);
    color: var(--color-primary);
}
```

---

## 📁 代码组织规范

### CSS文件结构

```css
/* ========== 1. CSS变量 ========== */
:root { }

/* ========== 2. 全局重置 ========== */
*, *::before, *::after { }

/* ========== 3. 基础样式 ========== */
body { }

/* ========== 4. 布局组件 ========== */
.container { }
.grid { }

/* ========== 5. UI组件 ========== */
.button { }
.card { }

/* ========== 6. 工具类 ========== */
.text-center { }

/* ========== 7. 响应式 ========== */
@media (max-width: 768px) { }
```

### 注释规范

```css
/* ========== 2. 全局重置 ========== */

/* 单行注释：说明下面样式的作用 */
.element {
    /* 属性注释：解释为什么使用这个值 */
    max-width: 100%;
}

/* 多行注释：
   用于复杂的逻辑说明
   或重要的注意事项
*/
.element {
    width: 100%;
}
```

---

## ✅ 最佳实践总结

### 必做项

1. **所有元素使用border-box**
   ```css
   *, *::before, *::after {
       box-sizing: border-box;
   }
   ```

2. **所有容器添加溢出保护**
   ```css
   .container {
       max-width: 100%;
       box-sizing: border-box;
       overflow: hidden;
   }
   ```

3. **移动端单独考虑**
   ```css
   @media (max-width: 768px) {
       .element {
           max-width: 100% !important;
       }
   }
   ```

### 推荐项

4. **使用CSS变量**
5. **使用BEM命名**
6. **移动优先策略**
7. **性能优先的动画**

### 禁止项

8. ❌ 避免使用content-box
9. ❌ 避免固定宽度不考虑小屏幕
10. ❌ 避免过度嵌套选择器
11. ❌ 避免滥用!important

---

## 📚 参考资料

- [MDN - CSS盒模型](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Box_Model)
- [MDN - 媒体查询](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@media)
- [CSS-Tricks - Flexbox完整指南](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [CSS-Tricks - Grid完整指南](https://css-tricks.com/snippets/css/complete-guide-grid/)

---

**文档完成时间**: 2026-01-29
**文档版本**: v1.0
**维护者**: 开发团队

**核心价值**: 统一CSS编码标准，减少布局问题，提高代码质量！🎯✨
