# Claude Code 自动执行验收流程

**严格按顺序执行：**

---

## Step 1：启动项目

**执行**:

```bash
npm install
npm run dev
```

**等待启动完成**:

```
Local: http://localhost:3000
```

---

## Step 2：打开首页

**访问**: `http://localhost:3000`

---

## Step 3：检查页面加载

**确认**:

- ✓ 页面加载成功
- ✓ 无白屏

**检查 Console**:

不能有：
- `error`
- `exception`
- `failed`

---

## Step 4：检查活动列表

**查找**: `.activity-list` 或 `.calendar-grid`

**必须存在**

**查找**: `.activity-card` 或 `.day-cell`

**数量必须 ≥ 3**

---

## Step 5：检查活动卡片内容

**每个卡片必须包含**:

- `img` 或活动封面
- `title` 或活动名称
- `time` 或活动时间
- `location` 或活动地点

---

## Step 6：测试点击行为

**点击**: `.activity-card` 或 `.day-cell:not(.dimmed)`

**必须**: 有点击反馈或跳转

---

## Step 7：测试 API

**请求**: `GET /api/activities` 或 `GET /data/items.json`

**必须返回**: 200

**且**: `data.length ≥ 3`

---

## Step 8：检查今天高亮（P0）

**查找**: `.today` 或 `.today-header`

**确认**:
- ✓ 今天元素存在
- ✓ 有明显视觉高亮（实心背景/高对比色/标签/强边框）
- ✓ 满足至少2条高亮条件

---

## Step 9：检查首屏密度（P0）

**统计**: 首屏可见活动卡片数量

**必须 ≥ 4**

---

## Step 10：检查交互功能

**确认函数存在**:
- ✓ `switchTab` 函数
- ✓ `toggleDayFilter` 或类似日期点击函数

---

## Step 11：生成验收报告

**创建**: `.ai-control/ACCEPTANCE_REPORT.md`

**写入**:

- 总结果：**PASS** 或 **FAIL**
- 每项测试详情
- 失败原因（如有）
- 优化建议
