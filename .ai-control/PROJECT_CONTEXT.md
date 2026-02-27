# 清迈活动平台 - 项目说明

---

## 项目信息

**项目名称**: 清迈活动探索平台 (Chiengmai Activities Platform)

**项目类型**: 静态Web应用 + Express.js 后端

**技术栈**:
- 前端: HTML5 + CSS3 + Vanilla JavaScript
- 后端: Node.js + Express.js
- 部署: Vercel

---

## 项目结构

```
Chiangmai/
├── public/                 # 静态资源目录
│   ├── index.html         # 主页
│   ├── css/
│   │   └── style.css      # 样式文件
│   ├── js/
│   │   └── app.js         # 业务逻辑
│   ├── data/
│   │   └── items.json     # 活动数据
│   └── tests/             # 测试工具目录
│       ├── index.html     # 测试中心
│       ├── test-activity-page-qa.html
│       └── test-mobile-optimization.html
├── .ai-control/           # AI自动验收控制
│   ├── ACTIVITY_PAGE_QA.md
│   ├── ACCEPTANCE.md
│   ├── ACCEPTANCE_TEST.md
│   └── ACCEPTANCE_REPORT.md (自动生成)
├── server.js              # Express服务器
└── package.json
```

---

## 核心功能

### 1. 活动列表展示

- 日历视图展示活动
- 按日期筛选活动
- 按分类Tab筛选

### 2. 分类导航

6个Tab:
- 兴趣班
- 市集
- 音乐
- 灵活时间活动
- 活动网站
- 攻略信息

### 3. 移动端优化

- 响应式布局
- Tab下拉菜单（移动端4个Tab + 更多）
- 固定顶部布局
- Bottom Sheet筛选

---

## 数据结构

### 活动数据 (items.json)

```json
{
  "title": "活动名称",
  "category": "分类",
  "day": "周几",
  "time": "时间",
  "location": "地点",
  "price": "价格",
  "flexibleTime": "是否灵活时间"
}
```

---

## 关键CSS类

### 结构类

- `.search-section` - 搜索栏
- `.tabs-nav` - Tab导航
- `.date-grid-header` - 日期选择器头部
- `.calendar-grid` - 活动列表网格
- `.day-cell` - 日期单元格

### 状态类

- `.active` - 激活状态
- `.selected` / `.selected-day` - 选中状态
- `.today` / `.today-header` - 今天标记
- `.dimmed` - 变暗状态

---

## 关键JavaScript函数

### Tab操作

- `switchTab(index)` - 切换Tab

### 日期操作

- `toggleDayFilter(day)` - 切换日期筛选

### 筛选操作

- `filterActivities()` - 筛选活动
- `updateViews()` - 更新视图

---

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产模式
npm start

# 运行测试
npm test
```

---

## 服务器配置

- **开发端口**: 4000
- **生产端口**: 3000 (环境变量 PORT)
- **数据API**: `/data/items.json`

---

## 部署信息

- **生产环境**: https://go-cnx.vercel.app
- **仓库**: https://github.com/Lynnlgh0824/chiangmai-activities

---

## 已知问题

### P0问题

1. **今天高亮不够明显**
   - 当前: 仅黄色边框 (2px solid #ffc107)
   - 期望: 实心背景 + "今天"标签

2. **首屏密度未验证**
   - 需要在实际浏览器中确认首屏活动数量

### 优化建议

1. 统一高亮颜色体系（当前蓝色+黄色混用）
2. 添加活动卡片点击跳转功能
3. 优化移动端下拉菜单交互
