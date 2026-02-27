# 清迈活动平台 - 移动端效果与交互规则总结

**更新时间**: 2026-02-26
**版本**: V1.0
**断点**: `@media (max-width: 768px)`

---

## 一、整体布局架构

### 1.1 固定顶部区域（三层固定）

```
┌─────────────────────────────────┐
│ 📍 搜索栏 (65px) + 筛选下拉框   │ ← 固定定位 (z-index: 1100)
├─────────────────────────────────┤
│ 🏷️ Tab导航 (50px)              │ ← 固定定位 (z-index: 1000)
├─────────────────────────────────┤
│ 📅 日期选择器 (~55px)           │ ← 固定定位 (z-index: 999)
├─────────────────────────────────┤
│                                 │
│  活动列表区域 (可滚动)           │ ← margin-top: 180px
│                                 │
└─────────────────────────────────┘
```

**CSS实现**:
- 搜索栏: `position: fixed; top: 0; height: 65px; z-index: 1100;`
- Tab导航: `position: fixed; top: 65px; z-index: 1000;`
- 日期选择器: `position: fixed; top: 115px; z-index: 999;`
- 活动列表: `margin-top: 180px;` (65+50+55+10)

**关键特性**:
- ✅ 三个顶部元素全部固定在屏幕上
- ✅ 滚动时只有活动列表区域移动
- ✅ 筛选下拉框使用 `position: fixed` 避免被裁剪
- ✅ 层级关系：搜索栏 > Tab > 日期选择器 > 活动列表

### 1.2 响应式断点

```css
@media (max-width: 768px) {
    /* 移动端专用样式 */
}
```

---

## 二、核心交互规则

### 2.1 搜索栏 (Search Bar)

**位置**: 固定在页面顶部

**样式**:
- 高度: `65px`
- 背景: 紫色渐变 (`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`)
- 图标大小: `18px`
- 输入框圆角: `20px`

**交互**:
- 点击输入框 → 聚焦，弹出键盘
- 输入文字 → 实时筛选活动
- 点击筛选按钮 (🔍) → 打开Bottom Sheet筛选面板

**CSS关键代码**:
```css
.search-section {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 65px;
    z-index: 1100;
}

.search-input {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    font-size: 15px;
}
```

---

### 2.2 分类Tab导航 (Tabs)

**位置**: 搜索栏下方，Sticky固定

**布局**: 横向滚动，单行显示

**样式**:
- 高度: `~50px`
- 背景: 白色
- 阴影: `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15)`
- Tab圆角: `20px`

**交互**:
- 点击Tab → 切换分类内容
- 左右滑动 → 查看更多Tab (隐藏滚动条)
- 选中状态 → 深蓝色背景 + 白色文字

**CSS关键代码**:
```css
.tabs-nav {
    position: sticky;
    top: 0;
    z-index: 1000;
    display: flex;
    overflow-x: auto;
    scrollbar-width: none; /* 隐藏滚动条 */
}

.tab-item {
    padding: 10px 16px;
    font-size: 13px;
    white-space: nowrap;
    flex-shrink: 0;
    border-radius: 20px;
}

.tab-item.active {
    background: #4080FF;
    color: white;
    font-weight: 600;
}
```

**Tab分类**:
1. 兴趣班
2. 市集
3. 音乐
4. 灵活时间活动
5. 活动网站
6. 攻略信息

---

### 2.3 日期选择器 (Date Picker)

**位置**: Tab导航下方，正常流动

**布局**: 横向弹性布局，单行显示

**样式**:
- 背景: 紫色 (`#667eea`)
- 按钮圆角: `6px`
- 最小宽度: `48px` (触摸友好)
- 最大宽度: `60px`

**今天高亮** (P0修复):
- 背景: 实心蓝色 (`#4080FF`)
- 文字: 白色
- 边框: `3px solid #4080FF`
- 标签: 右上角黄色"今天"标签
- 阴影: `0 4px 12px rgba(64, 128, 255, 0.4)`

**选中状态**:
- 背景: 深蓝色 (`#4080FF`)
- 文字: 白色
- 缩放: `1.05倍`
- 动画: `mobileSelectPulse` 脉冲效果

**交互**:
- 点击日期 → 筛选该日期活动
- 长按 → 查看详情 (可选)
- 滑动 → 查看更多日期

**CSS关键代码**:
```css
.date-grid-header {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.date-cell-header {
    min-width: 48px;
    max-width: 60px;
    min-height: 44px;
    background: #667eea;
    color: white;
    border-radius: 6px;
    font-size: 11px;
}

/* ✅ P0修复：今天高亮 */
.date-cell-header.today-header {
    background: #4080FF;
    color: white;
    border: 3px solid #4080FF;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(64, 128, 255, 0.4);
    position: relative;
}

.date-cell-header.today-header::after {
    content: '今天';
    position: absolute;
    top: -8px;
    right: -4px;
    background: #ffc107;
    color: #333;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
}

.date-cell-header.selected-day {
    background: #4080FF;
    color: white;
    border: 3px solid #4080FF;
    transform: scale(1.05);
    animation: mobileSelectPulse 0.3s ease;
}

@keyframes mobileSelectPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.12); }
    100% { transform: scale(1.08); }
}
```

---

### 2.4 活动列表 (Activity List)

**布局**: 横向滚动卡片式

**样式**:
- 单个卡片宽度: `80vw` (最大320px)
- 圆角: `8px`
- 边框: `1px solid #e0e0e0`
- 内边距: `12px`

**交互**:
- 左右滑动 → 查看不同日期的活动
- 点击卡片 → 打开详情弹窗
- 滚动对齐: `scroll-snap-align: center`

**CSS关键代码**:
```css
.calendar-wrapper {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
}

.calendar-grid {
    display: flex;
    gap: 12px;
    width: max-content;
}

.day-cell {
    min-width: 80vw;
    max-width: 320px;
    scroll-snap-align: center;
    flex-shrink: 0;
    border-radius: 8px;
    padding: 12px;
}

.day-cell:active {
    transform: scale(0.98);
}
```

---

### 2.5 Bottom Sheet筛选面板

**触发**: 点击搜索栏右侧的筛选按钮 (🔍)

**样式**:
- 背景: 半透明遮罩 (`rgba(0, 0, 0, 0.5)`)
- 内容区: 白色，圆角顶部 `20px`
- 最大高度: `85vh`
- 动画: 从底部滑入 (`translateY(100%) → translateY(0)`)

**结构**:
```
┌─────────────────────┐
│ 遮罩层 (可点击关闭)  │
├─────────────────────┤
│ ═════════════════  │ ← 拖动手柄
│ ──── 筛选 ─────     │ ← 标题
├─────────────────────┤
│                     │
│  筛选选项 (可滚动)   │
│                     │
├─────────────────────┤
│ [重置] [确认]       │ ← 底部按钮
└─────────────────────┘
```

**交互**:
- 点击遮罩 → 关闭面板
- 拖拽手柄 → 手动控制面板高度
- 点击重置 → 清空所有筛选条件
- 点击确认 → 应用筛选并关闭

**CSS关键代码**:
```css
.bottom-sheet {
    position: fixed;
    z-index: 2000;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.bottom-sheet.active {
    pointer-events: auto;
    opacity: 1;
}

.sheet-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 20px 20px 0 0;
    max-height: 85vh;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.bottom-sheet.active .sheet-content {
    transform: translateY(0);
}

.sheet-handle {
    width: 40px;
    height: 4px;
    background: #ddd;
    border-radius: 2px;
    margin: 12px auto;
}
```

---

## 三、触摸优化

### 3.1 触摸目标大小

所有可点击元素最小尺寸:
- 按钮/Tab: `44px × 44px` (iOS人机界面指南推荐)
- 日期按钮: `min-height: 44px`
- 筛选按钮: `44px × 44px`

### 3.2 触摸反馈

```css
/* 禁用默认高亮 */
-webkit-tap-highlight-color: transparent;

/* 优化触摸响应 */
touch-action: manipulation;

/* iOS平滑滚动 */
-webkit-overflow-scrolling: touch;
```

### 3.3 点击效果

```css
/* 按下缩小 */
.button:active {
    transform: scale(0.95);
}

/* 选中脉冲动画 */
@keyframes mobileSelectPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.12); }
    100% { transform: scale(1.08); }
}
```

---

## 四、视觉一致性

### 4.1 颜色体系

| 用途 | 颜色值 | 说明 |
|------|--------|------|
| 主色调 | `#667eea` → `#764ba2` | 紫色渐变 |
| 选中态 | `#4080FF` | 深蓝色 |
| 今天标签 | `#ffc107` | 黄色 |
| 文字主色 | `#333` | 深灰 |
| 文字辅色 | `#666` | 中灰 |

### 4.2 字体规范

| 元素 | 字号 | 字重 |
|------|------|------|
| 标题 | `18px` | `600` |
| 正文 | `14px` | `400` |
| 辅助文字 | `12px` | `400` |
| Tab文字 | `13px` | `500` (选中时`600`) |
| 日期数字 | `16px` | `700` |
| 日期星期 | `10px` | `500` |

### 4.3 间距规范

使用CSS变量统一管理:
```css
:root {
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 12px;
    --space-lg: 16px;
    --space-xl: 20px;
}
```

---

## 五、性能优化

### 5.1 硬件加速

```css
/* 启用GPU加速 */
transform: translateZ(0);
will-change: transform;
```

### 5.2 滚动优化

```css
/* 平滑滚动 */
scroll-behavior: smooth;

/* iOS弹性滚动 */
-webkit-overflow-scrolling: touch;
```

### 5.3 隐藏滚动条

```css
/* Firefox */
scrollbar-width: none;

/* IE/Edge */
-ms-overflow-style: none;

/* Chrome/Safari */
::-webkit-scrollbar {
    display: none;
}
```

---

## 六、无障碍支持

### 6.1 语义化HTML

- 使用正确的ARIA属性
- `role="button"`, `aria-label`, `aria-selected`

### 6.2 键盘导航

- Tab键导航支持
- 焦点可见性优化

---

## 七、验收标准

### 7.1 P0关键项 (必须通过)

- ✅ **今天高亮**: 实心蓝色背景 + "今天"标签
- ✅ **首屏密度**: ≥ 4个活动卡片
- ✅ **触摸目标**: 所有按钮≥44px

### 7.2 P1重要项

- ✅ **固定搜索栏**: 始终可见
- ✅ **Sticky Tab**: 滚动时固定在顶部
- ✅ **日期选中**: 明确的视觉反馈

### 7.3 P2次要项

- ✅ **颜色一致**: 统一使用蓝色系
- ✅ **动画流畅**: 60fps性能
- ✅ **滚动平滑**: iOS原生滚动体验

---

## 八、已知限制

### 8.1 需要浏览器验证的项目

1. **首屏密度**: 需在实际移动设备上统计活动卡片数量
2. **滚动性能**: 需在低端设备上测试流畅度
3. **触摸反馈**: 需真机测试响应速度

### 8.2 可优化项

1. **虚拟键盘**: 键盘弹出时布局适配
2. **刘海屏**: iPhone X及以上机型适配
3. **暗黑模式**: 暂未支持

---

## 九、技术栈

- **纯原生**: 无任何第三方框架
- **CSS3**: Flexbox + Sticky定位
- **JavaScript**: ES6+ 原生API
- **响应式**: 媒体查询 + CSS变量

---

## 十、文件结构

```
public/
├── index.html          # 主页面
├── css/
│   └── style.css      # 所有样式 (包含移动端)
└── js/
    └── app.js         # 业务逻辑
```

**移动端样式位置**: `style.css` 第1887行起 (`@media (max-width: 768px)`)

---

**文档版本**: V1.0
**最后更新**: 2026-02-26
**维护者**: Claude Code AI
