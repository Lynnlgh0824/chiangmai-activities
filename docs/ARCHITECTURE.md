# 清迈活动平台 - 项目架构文档

> 📅 版本：v2.0.0
> 🔄 最后更新：2026-01-25
> 🏗️ 架构类型：单页应用 + RESTful API

---

## 📋 目录

- [系统架构](#系统架构)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [数据流](#数据流)
- [部署架构](#部署架构)

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户层                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  用户浏览器   │  │  管理员界面   │  │  API 客户端   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                         前端层                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  React 18 + Vite                                              │
│  - 组件化 UI                                                 │
│  - 状态管理                                                  │
│  - 路由管理                                                  │
│                                                               │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                         后端层                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Node.js + Express                                            │
│  - RESTful API                                               │
│  - 文件上传 (Multer)                                         │
│  - CORS 支持                                                 │
│                                                               │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                         数据层                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  JSON 文件存储                                                │
│  - data/items.json                                          │
│  - 图片文件                                                  │
│  - 备份文件                                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 技术栈

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | UI 框架 |
| Vite | 5.0.0 | 构建工具 |
| Axios | 1.13.2 | HTTP 客户端 |
| CSS3 | - | 样式 |

### 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| Express | 4.19.2 | Web 框架 |
| Multer | 2.0.2 | 文件上传 |
| Dotenv | 17.2.3 | 环境变量 |

### 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| Nodemon | 3.1.0 | 热重载 |
| Concurrently | 8.2.0 | 并发运行 |

---

## 目录结构

### 项目根目录

```
Chiengmai/
├── docs/                   # 📚 文档目录
│   ├── API.md             # API 文档
│   ├── ARCHITECTURE.md    # 架构文档（本文件）
│   ├── README.md          # 文档导航
│   ├── data/              # 数据相关文档
│   ├── integration/       # 集成文档
│   ├── maintenance/       # 维护文档
│   ├── reports/           # 报告文档
│   └── technical/         # 技术文档
├── public/                # 🔓 静态文件
├── scripts/               # 🔧 工具脚本
│   └── verify-links.js   # 链接验证
├── src/                   # 💻 源代码
│   ├── components/        # React 组件
│   ├── data/              # 数据文件
│   ├── pages/             # 页面组件
│   ├── App.jsx           # 主应用
│   └── main.jsx          # 入口文件
├── uploads/               # 📤 上传文件
├── data/                  # 📊 数据存储
│   └── items.json        # 活动数据
├── server.js             # 🚀 服务器入口
├── package.json          # 📦 依赖配置
├── vite.config.js        # ⚙️ Vite 配置
├── .env                  # 🔐 环境变量
└── .gitignore           # 🚫 Git 忽略
```

### src/ 目录详解

```
src/
├── components/                    # React 组件
│   ├── AIImport.jsx              # AI 导入组件
│   ├── AIImport.css
│   ├── ScheduleListView.jsx      # 日程列表视图
│   ├── ScheduleListView.css
│   ├── WeeklyCalendarView.jsx    # 周历视图
│   └── WeeklyCalendarView.css
│
├── data/                         # 数据文件
│   ├── activities.js            # 活动数据
│   ├── flexibleActivities.js    # 灵活活动数据
│   └── weeklySchedule.js        # 周课表数据
│
├── pages/                        # 页面组件
│   ├── Schedule.jsx             # 日程页面
│   └── Schedule.css
│
├── App.jsx                      # 主应用组件
├── App.css                      # 全局样式
├── main.jsx                     # 应用入口
└── index.css                    # 基础样式
```

---

## 数据流

### 用户浏览活动流程

```
用户打开网页
    ↓
React 组件渲染
    ↓
调用 API (GET /api/activities)
    ↓
Express 接收请求
    ↓
读取 data/items.json
    ↓
返回 JSON 数据
    ↓
前端接收并渲染
    ↓
用户查看活动列表
```

### 管理员添加活动流程

```
管理员登录
    ↓
打开添加表单
    ↓
填写活动信息
    ↓
上传图片（可选）
    ↓
提交表单
    ↓
API 调用 (POST /api/activities)
    ↓
Express 验证数据
    ↓
保存到 items.json
    ↓
返回成功响应
    ↓
前端更新列表
```

### AI 智能导入流程

```
用户粘贴文本
    ↓
AI 解析（客户端）
    ↓
识别数据格式
    ↓
提取结构化数据
    ↓
预览解析结果
    ↓
确认并保存
    ↓
API 调用 (POST /api/activities)
    ↓
保存到数据库
```

---

## 部署架构

### 开发环境

```
本地机器 (localhost)
├── 前端: Vite Dev Server (端口 5173)
└── 后端: Node.js Server (端口 3000)
```

### 生产环境

#### 方案 1: Vercel 前端 + Railway 后端

```
┌─────────────────┐
│  Vercel (前端)   │
│  - React 构建    │
│  - 静态文件托管  │
└────────┬────────┘
         │
         │ HTTPS API 调用
         ▼
┌─────────────────┐
│ Railway (后端)   │
│  - Node.js API   │
│  - JSON 数据     │
└─────────────────┘
```

#### 方案 2: 单服务器部署

```
Nginx (反向代理)
    ├── /          → React 静态文件
    └── /api       → Node.js 后端
```

---

## 数据模型

### Activity 数据结构

```typescript
interface Activity {
  // 基础信息
  id: number;              // 唯一标识
  title: string;           // 活动标题
  category: string;        // 分类
  description: string;     // 描述

  // 价格信息
  price: string;           // 显示文本 "300-500 ฿"
  priceMin: number;        // 最低价格
  priceMax: number;        // 最高价格

  // 时间信息
  time: string;            // 时间 "07:00-08:30"
  date: string;            // 日期 "周一至周五"
  weekdays?: string[];     // 星期数组
  duration?: string;       // 时长 "2小时"

  // 类型信息
  type: string;            // once/weekly
  flexibleTime?: boolean;  // 是否无固定时间

  // 地点信息
  location: string;        // 地点
  address?: string;        // 详细地址

  // 状态信息
  status: string;          // active/inactive/draft

  // 媒体信息
  images: string[];        // 图片 URL 数组

  // 来源信息
  url: string;             // 来源链接
  source?: {               // 来源详情
    name: string;
    url: string;
    type: string;
  };

  // 时间戳
  createdAt: string;
  updatedAt: string;
}
```

---

## API 端点

### 活动管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/activities` | 获取活动列表 |
| GET | `/api/activities/:id` | 获取单个活动 |
| POST | `/api/activities` | 创建活动 |
| PUT | `/api/activities/:id` | 更新活动 |
| DELETE | `/api/activities/:id` | 删除活动 |

### 文件上传

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传图片 |
| GET | `/uploads/:filename` | 获取图片 |

### 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | API 健康状态 |

---

## 状态管理

### 前端状态

```javascript
// App.jsx
const [activities, setActivities] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

### 数据同步策略

1. **乐观更新**
   - 前端立即更新 UI
   - 后台同步到服务器
   - 失败时回滚

2. **实时同步**
   - 定期轮询（每30秒）
   - WebSocket（未来）

---

## 安全考虑

### CORS 配置

```javascript
// server.js
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://your-domain.vercel.app'
];
```

### 文件上传验证

```javascript
// 仅允许图片文件
const allowedTypes = /jpeg|jpg|png|gif|webp/;

// 文件大小限制
const maxSize = 5 * 1024 * 1024; // 5MB
```

### 输入验证

```javascript
// 验证必填字段
if (!title || !category || !location) {
  return res.status(400).json({
    success: false,
    message: '缺少必填字段'
  });
}
```

---

## 性能优化

### 前端优化

1. **代码分割**
   ```javascript
   const Schedule = lazy(() => import('./pages/Schedule'));
   ```

2. **懒加载**
   ```javascript
   <Suspense fallback={<Loading />}>
     <Schedule />
   </Suspense>
   ```

3. **防抖搜索**
   ```javascript
   const debouncedSearch = debounce(searchActivities, 500);
   ```

### 后端优化

1. **分页查询**
   ```javascript
   const startIndex = (page - 1) * limit;
   const paginatedItems = items.slice(startIndex, startIndex + limit);
   ```

2. **响应压缩**
   ```javascript
   app.use(compression());
   ```

3. **缓存策略**
   ```javascript
   app.use(express.static('public', {
     maxAge: '1d'
   }));
   ```

---

## 监控和日志

### 健康检查

```bash
curl http://localhost:3000/api/health
```

### 日志记录

```javascript
// 添加日志中间件
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

---

## 未来扩展

### 短期计划（1-3个月）

- [ ] 添加用户认证
- [ ] 实现数据缓存
- [ ] 添加搜索历史
- [ ] 优化移动端体验

### 中期计划（3-6个月）

- [ ] 迁移到数据库（PostgreSQL/MongoDB）
- [ ] 实现实时通知
- [ ] 添加数据导入导出
- [ ] 实现权限管理

### 长期计划（6-12个月）

- [ ] 微服务架构
- [ ] AI 推荐系统
- [ ] 数据分析看板
- [ ] 移动应用

---

## 相关文档

- [API 文档](API.md)
- [数据字段说明](data/活动字段说明-详细版.md)
- [部署指南](../免费部署指南.md)
- [问题排查指南](technical/问题排查指南.md)

---

**维护者：** 项目开发团队
**最后更新：** 2026-01-25
**架构版本：** v2.0.0
