# CSS检查清单

**项目**: 清迈活动查询平台
**版本**: v1.0
**创建时间**: 2026-01-29
**维护者**: 开发团队
**使用场景**: 新增样式、提交代码、代码审查

---

## 📋 目录

1. [新增样式检查项](#新增样式检查项)
2. [提交代码检查项](#提交代码检查项)
3. [代码审查检查项](#代码审查检查项)
4. [常见问题清单](#常见问题清单)

---

## ✏️ 新增样式检查项

### 在编写新CSS样式之前，必须检查以下所有项目：

### 1. 溢出保护检查 ⭐⭐⭐

#### 1.1 容器和卡片元素

- [ ] **添加了 `max-width: 100%`**
  ```css
  .element {
      max-width: 100%;
  }
  ```

- [ ] **添加了 `box-sizing: border-box`**
  ```css
  .element {
      box-sizing: border-box;
  }
  ```

- [ ] **添加了 `overflow: hidden`**
  ```css
  .element {
      overflow: hidden;
  }
  ```

**检查方法**: 在开发者工具中检查元素，查看：
- Computed样式中 `max-width` 是否为 `100%`
- `box-sizing` 是否为 `border-box`
- `overflow` 是否为 `hidden`

#### 1.2 移动端特定元素

- [ ] **移动端使用 `!important` 覆盖**
  ```css
  @media (max-width: 768px) {
      .element {
          max-width: 100% !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
      }
  }
  ```

- [ ] **同时设置 `width` 和 `max-width`**
  ```css
  @media (max-width: 768px) {
      .element {
          width: 100% !important;
          max-width: 100% !important;
      }
  }
  ```

#### 1.3 负边距元素

- [ ] **负边距时调整了 `width`**
  ```css
  .element {
      margin: 0 -8px;
      width: calc(100% + 16px); /* 抵消负边距 */
  }
  ```

**计算公式**: `width = 100% + |左边距| + |右边距|`

#### 1.4 Flex/Grid子项

- [ ] **Flex子项有 `max-width`**
  ```css
  .flex-item {
      max-width: 100%;
      box-sizing: border-box;
  }
  ```

- [ ] **Grid子项有 `overflow: hidden`**
  ```css
  .grid-item {
      overflow: hidden;
  }
  ```

---

### 2. 盒模型检查 ⭐⭐⭐

#### 2.1 全局盒模型设置

- [ ] **项目已设置全局 `border-box`**
  ```css
  *, *::before, *::after {
      box-sizing: border-box;
  }
  ```

**检查方法**: 在开发者工具Console中运行：
```javascript
getComputedStyle(document.documentElement).boxSizing === 'border-box'
```

#### 2.2 元素盒模型

- [ ] **元素使用 `border-box` 或继承全局设置**
  ```css
  .element {
      box-sizing: border-box; /* 显式设置 */
  }
  ```

- [ ] **没有使用 `content-box`**
  ```css
  /* ❌ 禁止 */
  .element {
      box-sizing: content-box;
  }
  ```

#### 2.3 width使用

- [ ] **使用 `max-width` 而非仅使用 `width`**
  ```css
  /* ✅ 推荐 */
  .element {
      width: 400px;
      max-width: 100%;
  }

  /* ❌ 避免 */
  .element {
      width: 100%; /* 可能导致子元素溢出 */
  }
  ```

---

### 3. 响应式检查 ⭐⭐⭐

#### 3.1 移动端适配

- [ ] **有移动端媒体查询**
  ```css
  @media (max-width: 768px) {
      .element {
          /* 移动端样式 */
      }
  }
  ```

- [ ] **测试了最小屏幕（320px或375px）**
  ```css
  @media (max-width: 374px) {
      .element {
          /* 小屏优化 */
      }
  }
  ```

- [ ] **测试了最大屏幕（1920px或2560px）**
  ```css
  @media (min-width: 1921px) {
      .element {
          /* 大屏优化 */
      }
  }
  ```

#### 3.2 触摸目标

- [ ] **移动端按钮≥44px**
  ```css
  @media (max-width: 768px) {
      .button {
          min-width: 44px;
          min-height: 44px;
      }
  }
  ```

**检查方法**: 使用开发者工具移动设备模式，测量按钮尺寸。

#### 3.3 字体响应式

- [ ] **字体使用相对单位或媒体查询**
  ```css
  /* 方式1: 使用rem */
  .element {
      font-size: 1rem;
  }

  /* 方式2: 媒体查询 */
  @media (max-width: 768px) {
      .element {
          font-size: 14px;
      }
  }
  ```

---

### 4. 选择器检查 ⭐⭐

#### 4.1 选择器嵌套

- [ ] **选择器嵌套不超过3层**
  ```css
  /* ✅ 正确：2-3层 */
  .parent .child { }

  /* ❌ 错误：超过3层 */
  .block .element .item .text { }
  ```

**检查方法**: 数数选择器中有几个空格。

#### 4.2 !important使用

- [ ] **没有滥用 `!important`**
  ```css
  /* ✅ 允许使用 */
  @media (max-width: 768px) {
      .element {
          color: red !important; /* 覆盖PC端样式 */
      }
  }

  /* ❌ 禁止 */
  .element {
      color: red !important; /* 正常情况不应使用 */
  }
  ```

**使用原则**: 仅在以下情况使用：
- 移动端覆盖PC端样式
- 修复第三方库样式
- 紧急热修复

#### 4.3 命名规范

- [ ] **使用语义化类名**
  ```css
  /* ✅ 推荐：BEM命名 */
  .card { }
  .card__title { }
  .card__title--large { }

  /* ❌ 避免：无意义命名 */
  .div1 { }
  .red-text { }
  ```

---

### 5. 性能检查 ⭐⭐

#### 5.1 选择器性能

- [ ] **优先使用类选择器**
  ```css
  /* ✅ 快速 */
  .class-name { }

  /* ⚠️ 较慢 */
  [type="text"] { }

  /* ❌ 最慢 */
  body div ul li a { }
  ```

#### 5.2 动画性能

- [ ] **动画使用transform和opacity**
  ```css
  /* ✅ 推荐 */
  .animated {
      transition: transform 0.3s ease, opacity 0.3s ease;
  }

  /* ❌ 避免 */
  .animated {
      transition: width 0.3s ease, height 0.3s ease;
  }
  ```

#### 5.3 will-change使用

- [ ] **没有滥用 `will-change`**
  ```css
  /* ✅ 正确：指定具体属性 */
  .animated {
      will-change: transform, opacity;
  }

  /* ❌ 错误：指定所有属性 */
  .animated {
      will-change: all;
  }
  ```

---

### 6. 图片检查 ⭐

#### 6.1 图片响应式

- [ ] **图片设置了max-width**
  ```css
  img {
      max-width: 100%;
      height: auto;
  }
  ```

#### 6.2 图片懒加载

- [ ] **使用懒加载（如果适用）**
  ```html
  <img src="placeholder.jpg" data-src="actual.jpg" loading="lazy">
  ```

---

### 7. 兼容性检查 ⭐

#### 7.1 浏览器前缀

- [ ] **需要时添加浏览器前缀**
  ```css
  .element {
      -webkit-transform: translateX(10px);
      -ms-transform: translateX(10px);
      transform: translateX(10px);
  }
  ```

**检查方法**: 使用Can I Use查询CSS属性兼容性。

#### 7.2 降级方案

- [ ] **提供降级方案**
  ```css
  .element {
      background: #f0f0f0; /* 降级 */
      background: linear-gradient(...); /* 现代 */
  }
  ```

---

### 8. 可访问性检查 ⭐

#### 8.1 颜色对比度

- [ ] **文字对比度≥4.5:1**

**检查方法**: 使用WebAIM Contrast Checker检查。

#### 8.2 焦点样式

- [ ] **交互元素有焦点样式**
  ```css
  button:focus {
      outline: 2px solid #667eea;
  }
  ```

---

## 📤 提交代码检查项

### 在提交CSS代码到版本控制之前，必须检查：

### 1. 代码质量

- [ ] **代码格式化**
  - 使用Prettier或类似工具格式化
  - 缩进一致（2空格或4空格）
  - 每个规则后有空行

- [ ] **删除未使用的CSS**
  - 删除注释掉的大段代码
  - 删除未使用的类和ID
  - 使用PurgeCSS等工具清理

- [ ] **合并重复的样式**
  ```css
  /* ❌ 重复 */
  .element1 { color: red; }
  .element2 { color: red; }

  /* ✅ 合并 */
  .element1, .element2 {
      color: red;
  }
  ```

---

### 2. 测试验证

#### 2.1 多设备测试

- [ ] **测试PC端（1920px）**
  - 布局正常
  - 无横向滚动条
  - 所有元素可见

- [ ] **测试平板（768px）**
  - 布局适配正常
  - 触摸目标足够大

- [ ] **测试移动端（375px）**
  - 布局适配正常
  - 无元素溢出
  - 横向滚动流畅

- [ ] **测试小屏移动端（320px）**
  - 最小屏幕无问题
  - 无内容被截断

#### 2.2 多浏览器测试

- [ ] **Chrome** - 最新版本
- [ ] **Safari** - 最新版本
- [ ] **Firefox** - 最新版本
- [ ] **Edge** - 最新版本

#### 2.3 功能测试

- [ ] **所有交互功能正常**
  - 按钮可点击
  - 链接可访问
  - 表单可提交

- [ ] **动画流畅**
  - 无卡顿
  - 无掉帧
  - 过渡自然

---

### 3. 性能检查

#### 3.1 CSS大小

- [ ] **CSS文件大小合理**
  - 单文件< 50KB（未压缩）
  - 总CSS< 200KB（未压缩）

- [ ] **启用了Gzip压缩**
  - 检查HTTP响应头
  - `Content-Encoding: gzip`

#### 3.2 加载性能

- [ ] **关键CSS内联**
  - 首屏CSS直接在HTML中
  - 非关键CSS异步加载

- [ ] **使用了CSS压缩**
  - 使用cssnano或类似工具
  - 删除注释和空格

---

### 4. 代码审查准备

- [ ] **自审查代码**
  - 运行过本文档的"新增样式检查项"
  - 修复了所有发现的问题

- [ ] **更新相关文档**
  - 更新组件库文档
  - 更新CHANGELOG
  - 添加必要注释

- [ ] **准备测试环境**
  - 测试环境已部署
  - 所有测试用例可运行

---

### 5. Git提交规范

#### 5.1 Commit Message

- [ ] **使用了规范的Commit Message**
  ```
  feat: 添加活动卡片组件

  - 使用border-box盒模型
  - 添加溢出保护
  - 移动端自适应

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```

#### 5.2 提交内容

- [ ] **只提交相关文件**
  - 不包含node_modules
  - 不包含.DS_Store
  - 不包含构建产物

- [ ] **提交前已拉取最新代码**
  ```bash
  git pull origin main
  ```

- [ ] **无合并冲突**
  - 如有冲突已解决
  - 代码可正常运行

---

## 👁️ 代码审查检查项

### 审查他人CSS代码时，必须检查以下项目：

### 1. 溢出保护审查 ⭐⭐⭐

#### 1.1 容器元素

- [ ] **所有容器有 `max-width: 100%`**
  ```css
  .container {
      max-width: 100%; /* 必须有 */
  }
  ```

- [ ] **所有容器有 `box-sizing: border-box`**
  ```css
  .container {
      box-sizing: border-box; /* 必须有 */
  }
  ```

- [ ] **所有容器有 `overflow: hidden`**
  ```css
  .container {
      overflow: hidden; /* 必须有 */
  }
  ```

**审查方法**: 搜索所有新增的容器类，检查是否有这三行代码。

#### 1.2 移动端覆盖

- [ ] **移动端使用 `!important` 覆盖**
  ```css
  @media (max-width: 768px) {
      .container {
          max-width: 100% !important;
      }
  }
  ```

**审查方法**: 搜索所有 `@media (max-width: 768px)` 块，检查是否使用了`!important`。

---

### 2. 盒模型审查 ⭐⭐⭐

#### 2.1 全局设置

- [ ] **项目根元素设置了 `border-box`**
  ```css
  *, *::before, *::after {
      box-sizing: border-box;
  }
  ```

**审查方法**: 检查CSS文件开头是否有这个设置。

#### 2.2 显式盒模型

- [ ] **元素显式设置了 `box-sizing`**
  ```css
  .element {
      box-sizing: border-box; /* 推荐显式设置 */
  }
  ```

**审查方法**: 搜索所有新增类，检查是否设置了`box-sizing`。

---

### 3. 响应式审查 ⭐⭐⭐

#### 3.1 媒体查询

- [ ] **有移动端媒体查询**
  ```css
  @media (max-width: 768px) {
      /* 移动端样式 */
  }
  ```

- [ ] **有小屏幕媒体查询（≤374px）**
  ```css
  @media (max-width: 374px) {
      /* 小屏优化 */
  }
  ```

**审查方法**: 统计媒体查询数量，确保覆盖所有断点。

#### 3.2 触摸目标

- [ ] **移动端按钮≥44px**
  ```css
  @media (max-width: 768px) {
      .button {
          min-width: 44px;
          min-height: 44px;
      }
  }
  ```

**审查方法**: 使用开发者工具测量按钮尺寸。

---

### 4. 代码质量审查 ⭐⭐

#### 4.1 命名规范

- [ ] **使用了语义化类名**
  ```css
  /* ✅ 推荐 */
  .activity-card { }
  .user-profile { }

  /* ❌ 避免 */
  .div1 { }
  .red-box { }
  ```

#### 4.2 选择器嵌套

- [ ] **选择器嵌套≤3层**
  ```css
  /* ✅ 正确 */
  .container .card { }

  /* ❌ 错误 */
  body .container .card .title .text { }
  ```

**审查方法**: 数数选择器中空格的数量。

#### 4.3 !important使用

- [ ] **只在必要时使用 `!important`**
  - 移动端覆盖：✅
  - 修复第三方库：✅
  - 紧急热修复：✅
  - 其他情况：❌

**审查方法**: 搜索 `!important`，检查使用场景。

---

### 5. 性能审查 ⭐⭐

#### 5.1 选择器性能

- [ ] **没有使用低效选择器**
  ```css
  /* ❌ 避免 */
  body div ul li a { }

  /* ✅ 推荐 */
  .nav-link { }
  ```

**审查方法**: 使用Chrome DevTools的Performance工具分析。

#### 5.2 动画性能

- [ ] **动画使用了transform和opacity**
  ```css
  /* ✅ 推荐 */
  transition: transform 0.3s ease, opacity 0.3s ease;

  /* ❌ 避免 */
  transition: width 0.3s ease, height 0.3s ease;
  ```

**审查方法**: 检查所有`transition`和`animation`属性。

---

### 6. 测试审查 ⭐

#### 6.1 多设备测试

- [ ] **在375px设备上测试**
- [ ] **在320px设备上测试**
- [ ] **在1920px设备上测试**

**审查方法**: 要求开发者提供测试截图或视频。

#### 6.2 跨浏览器测试

- [ ] **Chrome测试通过**
- [ ] **Safari测试通过**
- [ ] **Firefox测试通过**

**审查方法**: 查看测试报告或亲自测试。

---

## 🔍 常见问题清单

### 问题1: 横向溢出

**检查项**:
- [ ] 有 `max-width: 100%`
- [ ] 有 `box-sizing: border-box`
- [ ] 有 `overflow: hidden`
- [ ] 负边距时调整了width

**修复方法**:
```css
.element {
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
}
```

---

### 问题2: 移动端布局错乱

**检查项**:
- [ ] 有移动端媒体查询
- [ ] 使用了 `!important` 覆盖
- [ ] 同时设置width和max-width

**修复方法**:
```css
@media (max-width: 768px) {
    .element {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
    }
}
```

---

### 问题3: 间距计算错误

**检查项**:
- [ ] 使用了border-box盒模型
- [ ] padding/margin值合理
- [ ] 使用了CSS变量统一管理

**修复方法**:
```css
:root {
    --space-header: 65px;
    --space-tab: 50px;
}

.element {
    padding-top: calc(
        var(--space-header) +
        var(--space-tab)
    );
}
```

---

### 问题4: 选择器优先级问题

**检查项**:
- [ ] 选择器嵌套≤3层
- [ ] 避免使用!important（除非必要）
- [ ] 使用语义化类名

**修复方法**:
```css
/* ❌ 不推荐 */
.parent .element {
    color: red !important;
}

/* ✅ 推荐 */
.element-specific {
    color: red;
}
```

---

## ✅ 快速检查脚本

### 在浏览器Console中运行

#### 检查溢出保护

```javascript
// 检查所有元素是否设置了max-width
const allElements = document.querySelectorAll('*');
let noMaxWidth = [];
allElements.forEach(el => {
    const styles = window.getComputedStyle(el);
    if (styles.width !== '0px' && styles.maxWidth === 'none') {
        noMaxWidth.push(el);
    }
});
console.log('没有设置max-width的元素:', noMaxWidth.length);
console.log(noMaxWidth);
```

#### 检查盒模型

```javascript
// 检查全局盒模型设置
const rootBoxSizing = getComputedStyle(document.documentElement).boxSizing;
console.log('全局盒模型:', rootBoxSizing);
if (rootBoxSizing !== 'border-box') {
    console.error('❌ 全局盒模型不是border-box!');
} else {
    console.log('✅ 全局盒模型正确');
}
```

---

## 📊 检查统计

### 使用频率统计

建议每周统计一次：

- [ ] 新增样式数量
- [ ] 发现问题数量
- [ ] 修复问题数量
- [ ] 平均修复时间

### 质量趋势

建议每月统计一次：

- [ ] 溢出问题发生率
- [ ] 移动端问题发生率
- [ ] 代码审查通过率
- [ ] 返工率

---

## 🎯 使用建议

### 日常使用

1. **新增样式前** - 运行"新增样式检查项"
2. **提交代码前** - 运行"提交代码检查项"
3. **审查代码时** - 运行"代码审查检查项"

### 团队协作

1. **代码审查** - 使用此清单作为审查依据
2. **知识传递** - 新人培训时学习此清单
3. **质量保证** - 定期检查团队遵循情况

### 持续改进

1. **收集反馈** - 记录检查中发现的问题
2. **更新清单** - 定期更新检查项
3. **优化流程** - 根据实际情况调整

---

**文档完成时间**: 2026-01-29
**文档版本**: v1.0
**维护者**: 开发团队

**核心价值**: 通过系统化检查，减少问题遗漏，提高代码质量！🎯✨
