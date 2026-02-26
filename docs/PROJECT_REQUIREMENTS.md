# 清迈活动查询平台 - 完整需求文档

## 📋 项目概述

**项目名称**: 清迈活动查询平台 (Chiengmai Activities)
**版本**: v2.5.0
**项目类型**: Web应用（前后端分离）
**部署**: 本地开发 + Vercel生产部署
**最后更新**: 2026-01-29
**架构**: 6个Tab导航系统

### 项目简介
为清迈旅行者提供活动查询平台，包含兴趣班、市集、音乐、节庆活动等各类活动信息的展示、筛选和管理功能。

### 最新变更（v2.5.0）
- ✅ 新增独立音乐Tab（Tab 2）
- ✅ 优化Tab架构（5个→6个）
- ✅ 完善移动端和PC端适配
- ✅ 更新测试覆盖（10个测试套件，82个测试用例）

---

## 🏗️ 技术栈

### 前端
- **纯HTML/CSS/JavaScript** (无框架)
- **响应式设计** (移动端友好)
- **代码量**: ~3500行 (index.html)

### 后端
- **Node.js** + **Express.js**
- **代码量**: ~1000行 (server.cjs)

### 数据存储
- **JSON文件** (data/items.json)
- **Excel文件** (数据导入/导出)

### 第三方服务
- **飞书API** (数据同步)
- **Vercel** (部署平台)

---

## 📊 数据统计

### 当前数据量
- **总活动数**: 47个
- **分类数量**: 9个分类

### 分类分布
| 分类 | 数量 |
|------|------|
| 市集 | 17个 |
| 运动 | 6个 |
| 冥想 | 6个 |
| 音乐 | 6个 |
| 舞蹈 | 4个 |
| 健身 | 2个 |
| 文化艺术 | 2个 |
| 瑜伽 | 2个 |
| 泰拳 | 1个 |
| 徒步 | 1个 |

### 特殊数据
- **灵活时间活动**: 9个
- **有官方网站**: 23个
- **攻略页面**: 1个

---

## 🌐 前端页面

### 1. 首页 (index.html) - 用户端

**访问地址**:
- 本地: http://localhost:5173
- 生产: https://go-cnx.vercel.app

#### 功能模块

##### 6个Tab导航（最新架构 - 2026-01-29）
1. **📅 兴趣班** (Tab 0)
   - 数据筛选: `['瑜伽', '冥想', '舞蹈', '泰拳', '音乐', '文化艺术', '健身']`
   - 视图类型: 日历视图（周视图）
   - 活动数: 23个
   - 功能:
     - 显示周一到周日网格
     - 每日活动按时间排序
     - 周导航（上一周/下一周）

2. **📋 市集** (Tab 1)
   - 数据筛选: `category === '市集'`
   - 视图类型: 列表视图
   - 活动数: 17个
   - 功能:
     - 按时间排序（早的活动在前）
     - 点击星期筛选
     - 显示完整活动信息

3. **🎵 音乐** (Tab 2) ⭐ **独立Tab**
   - 数据筛选: `category === '音乐'`
   - 视图类型: 列表视图
   - 活动数: 6个
   - 功能:
     - 专注音乐类活动展示
     - 与兴趣班Tab完全独立
     - 简化音乐活动查找

4. **⏰ 灵活时间活动** (Tab 3)
   - 数据筛选: `flexibleTime === '是' || time === '灵活时间'`
   - 视图类型: 列表视图
   - 活动数: 9个

5. **🏪 活动网站** (Tab 4)
   - 数据筛选: `source.url` 存在
   - 视图类型: 网站卡片视图
   - 活动数: 23个
   - 功能: 点击卡片打开官方网站

6. **📖 攻略信息** (Tab 5)
   - 数据来源: `/api/guide`
   - 视图类型: 富文本内容
   - 功能: 显示旅行攻略

##### 筛选功能
- **日期筛选**: 点击星期筛选特定日期的活动
- **分类筛选**: 按活动分类筛选
- **价格筛选**: 免费/不同价格区间
- **搜索功能**: 搜索标题/地点/描述

##### 活动详情弹窗
- 显示完整活动信息
- 格式化描述文本
- 表情符号显示优化

##### 响应式设计
- 移动端适配
- 筛选状态栏
- 移动端筛选面板

### 2. 后台管理页面 (public/admin.html)

**访问地址**: http://localhost:3000/admin.html

#### 功能模块

##### 活动管理
- **列表展示**: 显示所有47个活动
- **新增活动**: 表单添加新活动
- **编辑活动**: 点击编辑现有活动
- **删除活动**: 删除不需要的活动
- **数据验证**: 必填字段验证

##### 字段管理
核心字段（17个）:
1. 活动编号 (activityNumber)
2. 活动标题 (title)
3. 分类 (category)
4. 地点 (location)
5. 价格 (price)
6. 时间 (time)
7. 持续时间 (duration)
8. 时间信息 (timeInfo)
9. 星期 (weekdays)
10. 序号 (sortOrder)
11. 最低价格 (minPrice)
12. 最高价格 (maxPrice)
13. 最大人数 (maxParticipants)
14. 描述 (description) - 已合并notes字段
15. 灵活时间 (flexibleTime) - 复选框
16. 状态 (status)
17. 需要预约 (requireBooking)

##### Excel集成
- **导入Excel**: 上传Excel文件批量导入
- **导出Excel**: 导出为Excel文件（17列）
- **自动同步**: 监听Excel文件变化自动导入
- **数据验证**: 导入时验证数据完整性

##### 图片上传
- 支持活动图片上传
- 最大5MB
- 格式: jpeg, jpg, png, gif, webp

##### 攻略管理
- **富文本编辑器**: 编辑攻略内容
- **工具栏**: 粗体/斜体/下划线/字体/颜色
- **自动保存**: 保存到服务器
- **样式统一**: 前后端样式一致

##### 工具栏固定
- **Sticky定位**: 滚动时工具栏固定在顶部
- **包含元素**:
  - 访问前端按钮
  - AI智能导入
  - 导入/导出Excel
  - 攻略管理
  - 分类/状态筛选
  - 新增活动按钮

---

## 🔌 API端点

### 活动相关

#### GET /api/activities
获取所有活动列表
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

#### GET /api/activities/:id
获取单个活动详情

#### POST /api/activities
创建新活动

#### PUT /api/activities/:id
更新活动

#### DELETE /api/activities/:id
删除活动

#### GET /api/activities/stats/categories
获取分类统计

### 数据管理

#### GET /api/items
获取所有项目（别名）

#### POST /api/import-excel
导入Excel数据
- 请求体: JSON字符串
- 解析Excel
- 验证数据
- 保存到items.json
- 导出Excel

#### POST /api/export-excel
导出Excel数据
- 读取items.json
- 生成Excel文件（17列）
- 返回文件下载

### 攻略相关

#### GET /api/guide
获取攻略内容
```json
{
  "success": true,
  "data": {
    "content": "<html内容>",
    "createdAt": "2026-01-26T16:36:48.273Z",
    "updatedAt": "2026-01-27T00:00:00.000Z"
  }
}
```

#### POST /api/guide
保存攻略内容
- 请求体: `{ content: "html内容" }`
- 保存到guide.json
- 更新updatedAt

### 文件上传

#### POST /api/upload
上传活动图片
- 最大5MB
- 保存到uploads目录

#### DELETE /api/upload/:filename
删除图片

### 其他

#### GET /api/health
健康检查

#### POST /api/sync-from-feishu
从飞书同步数据

#### POST /api/sync-manual
手动同步数据

---

## 📦 数据结构

### 活动对象 (Activity)

```javascript
{
  "activityNumber": "0001",           // 活动编号（唯一）
  "id": "0001",                        // ID（别名）
  "title": "瑜伽（Nong Buak Haad公园）", // 标题
  "category": "瑜伽",                  // 分类
  "location": "Nong Buak Haad公园",     // 地点
  "price": "免费",                     // 价格
  "time": "08:30-09:45",               // 时间
  "duration": "1小时15分钟",            // 持续时间
  "timeInfo": "固定频率活动",           // 时间信息
  "weekdays": ["周一", "周二", ...],     // 星期数组
  "sortOrder": 1,                      // 排序序号
  "minPrice": 0,                       // 最低价格
  "maxPrice": 0,                       // 最高价格
  "maxParticipants": "不限",            // 最大人数
  "description": "活动描述...",          // 描述（已合并notes）
  "flexibleTime": "否",                // 灵活时间（是/否）
  "status": "进行中",                  // 状态
  "requireBooking": "否",              // 需要预约（是/否）
  "source": {                          // 来源（可选）
    "name": "Facebook",
    "url": "https://...",
    "type": "facebook",
    "lastUpdated": "2026-01-26T16:30:42.310Z"
  }
}
```

### 攻略对象 (Guide)

```javascript
{
  "content": "<html内容>",              // 富文本内容
  "createdAt": "2026-01-26T16:36:48.273Z",
  "updatedAt": "2026-01-27T00:00:00.000Z"
}
```

---

## 🎨 UI/UX特性

### 1. Tab数据隔离
每个Tab的数据完全独立，互不影响：
- `filterActivities()` 根据Tab筛选数据
- 数据只在自己的Tab内显示
- 筛选条件仅在当前Tab生效

### 2. 时间排序
列表视图按时间排序：
- 提取开始时间: "08:30-09:45" → "08:30"
- 升序排列: 早的活动在前
- 灵活时间排最后: "99:99"

### 3. 字体大小统一
攻略信息样式统一：
- h1: 15px
- h2/h3: 14px
- p/li: 13px
- 自动清除内联样式

### 4. 粘性工具栏
后台工具栏固定在顶部：
- 滚动时不消失
- 方便随时操作

### 5. 响应式设计
- 移动端友好
- 自适应布局
- 移动端筛选面板

---

## 🔧 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动生产服务器
npm start

# 运行测试
npm test

# 导入Excel
npm run import-excel

# 导出Excel
npm run export-to-excel

# 监听Excel变化
npm run watch-excel
```

---

## 📝 最新优化记录 (2026-01-26 ~ 2026-01-27)

### 功能优化

#### 1. Tab系统重构
**问题**: 数据混在一起，Tab隔离不清晰

**解决方案**:
- 在 `filterActivities()` 中添加Tab筛选逻辑
- 移除 `updateViews()` 中的二次筛选
- 确保每个Tab数据完全独立

**代码位置**: [index.html:1783-1861](index.html#L1783-L1861)

#### 2. 攻略信息样式统一
**问题**: 前端显示字体大小不一致，与后台编辑器不同

**解决方案**:
- 添加 `.guide-content` CSS样式
- 与后台编辑器保持一致
- 自动清除内联样式
- 使用 `!important` 确保优先级

**代码位置**: [index.html:233-310](index.html#L233-L310)

#### 3. 后台工具栏固定
**需求**: 滚动时工具栏固定在顶部

**实现**:
- CSS: `position: sticky; top: 0;`
- 添加阴影增强视觉层次
- z-index确保在其他内容之上

**代码位置**: [admin.html:36-49](public/admin.html#L36-L49)

#### 4. 移除Tab数量显示
**需求**: Tab名称后面不显示活动数量

**实现**:
- 删除 `<span class="tab-count">` 元素
- 保留控制台统计功能
- 删除相关CSS样式

**代码位置**: [index.html:1316-1343](index.html#L1316-L1343)

#### 5. 富文本编辑器优化
**问题**: 复制粘贴时字体太大，样式混乱

**解决方案**:
- 缩小标题字体大小（h1: 15px, h2/h3: 14px）
- 使用 `!important` 覆盖内联样式
- 自动清除字体大小和颜色属性

**代码位置**: [admin.html:804-853](public/admin.html#L804-L853)

#### 6. 增加请求体大小限制
**问题**: 大量富文本内容被截断

**解决方案**:
- JSON limit: 100kb → 10mb
- URL-encoded limit: 100kb → 10mb

**代码位置**: [server.cjs:54-55](server.cjs#L54-L55)

### Bug修复

#### 1. 攻略API未生效
**问题**: 旧版本服务器进程占用端口

**解决**: 杀掉旧进程，重启服务器

#### 2. 日期显示重复
**问题**: 日期信息在3个地方显示

**解决**: 移除冗余的day-number显示

#### 3. 表情符号显示问题
**问题**: 复制粘贴的表情符号显示不正常

**解决**:
- 清除内联样式
- 确保UTF-8编码
- 增强CSS样式优先级

### 性能优化

#### 1. 减少DOM操作
- 只在Tab切换时更新视图
- 避免重复筛选数据

#### 2. 代码优化
- 移除二次筛选逻辑
- 简化数据流转

---

## 📂 文件结构

```
chiangmai-activities/
├── index.html              # 首页（用户端）~3500行
├── server.cjs              # 后端服务器 ~1000行
├── package.json            # 项目配置
├── data/
│   ├── items.json          # 活动数据（47个活动）
│   └── guide.json         # 攻略数据
├── public/
│   ├── admin.html         # 后台管理页面
│   └── ...               # 其他页面
├── scripts/
│   ├── export-json-to-excel.mjs    # 导出Excel
│   ├── import-excel-enhanced.mjs   # 导入Excel
│   ├── watch-excel.mjs             # 监听Excel
│   └── ...               # 其他脚本
├── uploads/                # 上传的图片
├── logs/                   # 日志文件
├── docs/                   # 文档
│   └── TAB_REQUIREMENTS.md # Tab需求文档
└── 清迈活动数据-导出.xlsx  # Excel数据文件
```

---

## 🎯 核心功能优先级

### P0 (核心功能)
- ✅ 5个Tab数据展示
- ✅ 活动详情查看
- ✅ 日历视图/列表视图
- ✅ 数据筛选（日期/分类/价格/搜索）
- ✅ 后台CRUD操作

### P1 (重要功能)
- ✅ Excel导入/导出
- ✅ 攻略信息管理
- ✅ 图片上传
- ✅ 响应式设计
- ✅ 数据隔离

### P2 (增强功能)
- ✅ 飞书数据同步
- ✅ 富文本编辑器
- ✅ 粘性工具栏
- ✅ 时间排序
- ✅ 样式统一

### P3 (可选功能)
- ⏳ 数据统计分析
- ⏳ 用户收藏
- ⏳ 评论系统
- ⏳ 分享功能

---

## 🔐 安全性

### 输入验证
- 必填字段验证
- 数据类型验证
- XSS防护（内容转义）

### 文件上传
- 文件类型限制
- 文件大小限制（5MB）
- 安全的文件名生成

### CORS配置
- 允许的源列表
- 开发环境通配符

---

## 🚀 部署

### 开发环境
```bash
npm run dev
```
- 前端: http://localhost:5173 (Vite)
- 后端: http://localhost:3000 (Express)

### 生产环境
- **前端**: Vercel自动部署
- **后端**: 需要单独部署（目前仅本地）

---

## 📈 未来规划

### 短期计划
- [ ] 添加更多活动数据
- [ ] 优化移动端体验
- [ ] 增加数据统计功能
- [ ] 多语言支持（中英泰）

### 长期计划
- [ ] 用户系统
- [ ] 预约功能
- [ ] 支付集成
- [ ] 评论和评分
- [ ] 社交分享

---

## 📞 联系方式

**项目维护**: Claude Code
**最后更新**: 2026-01-27
**文档版本**: v2.0.0

---

## 附录

### A. 快速开始

1. **克隆项目**
```bash
git clone <repository-url>
cd chiangmai-activities
```

2. **安装依赖**
```bash
npm install
```

3. **启动服务**
```bash
npm run dev
```

4. **访问应用**
- 前端: http://localhost:5173
- 后台: http://localhost:3000/admin.html

### B. 数据管理

**导入数据**:
1. 编辑 `清迈活动数据-导出.xlsx`
2. 后台上传文件
3. 系统自动导入

**导出数据**:
1. 后台点击"导出Excel"
2. 自动下载文件

### C. 常见问题

**Q: 为什么数据没有更新？**
A: 清除浏览器缓存（Ctrl+Shift+R）

**Q: 如何添加新活动？**
A: 后台管理页面 → 新增活动

**Q: Excel导入失败？**
A: 检查文件格式和列名是否正确（17列）

**Q: 筛选不生效？**
A: 确认在正确的Tab内使用筛选

---

**文档结束**
