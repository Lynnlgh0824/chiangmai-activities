# 清迈活动平台 API 文档

> 📅 版本：v2.0.0
> 🔄 最后更新：2026-01-25
> 🌐 基础URL：`http://localhost:3000/api`

---

## 📋 目录

- [概述](#概述)
- [认证](#认证)
- [活动 API](#活动-api)
- [上传 API](#上传-api)
- [数据格式](#数据格式)
- [错误处理](#错误处理)
- [示例代码](#示例代码)

---

## 概述

清迈活动平台提供 RESTful API 用于管理活动数据。

**技术栈：**
- Node.js + Express
- JSON 数据存储
- 文件上传支持（Multer）

**基础信息：**
- **端口：** 3000（默认）
- **数据格式：** JSON
- **字符编码：** UTF-8

---

## 认证

当前版本不需要认证（开放 API）。

生产环境部署时建议添加：
- API Key
- JWT Token
- Rate Limiting

---

## 活动 API

### 获取活动列表

```http
GET /api/activities
```

#### 查询参数

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `page` | number | ❌ | 页码（默认1） | `?page=1` |
| `limit` | number | ❌ | 每页数量（默认10） | `?limit=20` |
| `category` | string | ❌ | 活动分类 | `?category=瑜伽` |
| `search` | string | ❌ | 搜索关键词 | `?search=冥想` |
| `priceMin` | number | ❌ | 最低价格 | `?priceMin=0` |
| `priceMax` | number | ❌ | 最高价格 | `?priceMax=1000` |
| `status` | string | ❌ | 活动状态 | `?status=active` |
| `sortBy` | string | ❌ | 排序字段 | `?sortBy=price` |
| `sortOrder` | string | ❌ | 排序方向（asc/desc） | `?sortOrder=asc` |

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "晨间瑜伽课程",
      "category": "瑜伽",
      "description": "适合所有水平的瑜伽课程",
      "price": "300-500 ฿",
      "priceMin": 300,
      "priceMax": 500,
      "time": "07:00-08:30",
      "date": "周一至周五",
      "location": "清迈瑜伽中心",
      "status": "active",
      "images": ["https://example.com/image.jpg"],
      "url": "https://example.com",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-25T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

#### 使用示例

```javascript
// 获取瑜伽活动，按价格排序
const response = await fetch('/api/activities?category=瑜伽&sortBy=price&sortOrder=asc');
const data = await response.json();
```

---

### 获取单个活动

```http
GET /api/activities/:id
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 活动 ID |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "晨间瑜伽课程",
    "category": "瑜伽",
    "description": "适合所有水平的瑜伽课程",
    "price": "300-500 ฿",
    "priceMin": 300,
    "priceMax": 500,
    "time": "07:00-08:30",
    "date": "周一至周五",
    "location": "清迈瑜伽中心",
    "status": "active",
    "images": ["https://example.com/image.jpg"],
    "url": "https://example.com"
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "message": "活动未找到"
}
```

---

### 创建活动

```http
POST /api/activities
```

#### 请求头

```http
Content-Type: application/json
```

#### 请求体

```json
{
  "title": "新活动",
  "category": "瑜伽",
  "description": "活动描述",
  "price": "500 ฿",
  "priceMin": 500,
  "priceMax": 500,
  "time": "09:00-10:30",
  "date": "周末",
  "location": "清迈",
  "status": "active",
  "images": ["https://example.com/image.jpg"],
  "url": "https://example.com"
}
```

#### 响应示例

```json
{
  "success": true,
  "message": "活动创建成功",
  "data": {
    "id": 51,
    "title": "新活动",
    ...
  }
}
```

---

### 更新活动

```http
PUT /api/activities/:id
```

#### 请求体

同创建活动。

#### 响应示例

```json
{
  "success": true,
  "message": "活动更新成功",
  "data": {
    "id": 1,
    "title": "更新后的活动",
    ...
  }
}
```

---

### 删除活动

```http
DELETE /api/activities/:id
```

#### 响应示例

```json
{
  "success": true,
  "message": "活动删除成功"
}
```

---

## 上传 API

### 上传图片

```http
POST /api/upload
```

#### 请求类型

`multipart/form-data`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `image` | File | ✅ | 图片文件 |
| `type` | string | ❌ | 图片类型（activity/avatar）|

#### 文件限制

- **格式：** JPEG, JPG, PNG, GIF, WEBP
- **大小：** 最大 5MB
- **自动重命名：** 是

#### 响应示例

```json
{
  "success": true,
  "message": "图片上传成功",
  "data": {
    "filename": "image-1737824123456-123456789.jpg",
    "url": "/uploads/image-1737824123456-123456789.jpg",
    "size": 123456
  }
}
```

#### 使用示例

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('type', 'activity');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

---

## 数据格式

### 活动对象

```typescript
interface Activity {
  id: number;
  title: string;
  category: string;
  description: string;
  price: string;           // 显示文本，如 "300-500 ฿"
  priceMin: number;        // 最低价格
  priceMax: number;        // 最高价格
  time: string;            // 时间，如 "07:00-08:30"
  date: string;            // 日期，如 "周一至周五"
  weekdays?: string[];     // 星期数组
  location: string;
  duration?: string;       // 时长
  type: string;            // once/weekly
  status: string;          // active/inactive/draft
  images: string[];        // 图片 URL 数组
  url: string;             // 来源链接
  createdAt: string;
  updatedAt: string;
}
```

### 分类值

```javascript
const CATEGORIES = [
  '瑜伽',
  '冥想',
  '泰拳',
  '舞蹈',
  '户外',
  '烹饪',
  '按摩',
  '文化',
  '其他'
];
```

### 状态值

```javascript
const STATUSES = [
  'active',      // 进行中
  'inactive',    // 已结束
  'draft'        // 草稿
];
```

---

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源未找到 |
| 500 | 服务器错误 |

### 常见错误

#### 1. 活动未找到

```json
{
  "success": false,
  "message": "活动未找到"
}
```

**解决方案：** 检查活动 ID 是否正确

#### 2. 参数错误

```json
{
  "success": false,
  "message": "缺少必填字段：title"
}
```

**解决方案：** 检查请求体是否包含所有必填字段

#### 3. 文件上传失败

```json
{
  "success": false,
  "message": "只支持图片文件 (jpeg, jpg, png, gif, webp)"
}
```

**解决方案：** 确保上传的是支持的图片格式

---

## 示例代码

### JavaScript (Fetch)

```javascript
// 获取活动列表
async function getActivities(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/activities?${params}`);
  const data = await response.json();
  return data;
}

// 使用示例
const activities = await getActivities({
  category: '瑜伽',
  priceMin: 0,
  priceMax: 1000,
  sortBy: 'price',
  sortOrder: 'asc'
});

console.log(activities.data);
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000
});

// 获取活动列表
export const getActivities = (params) => {
  return api.get('/activities', { params });
};

// 创建活动
export const createActivity = (data) => {
  return api.post('/activities', data);
};

// 更新活动
export const updateActivity = (id, data) => {
  return api.put(`/activities/${id}`, data);
};

// 删除活动
export const deleteActivity = (id) => {
  return api.delete(`/activities/${id}`);
};
```

### React Hooks

```javascript
import { useState, useEffect } from 'axios';
import api from './api';

export function useActivities(filters = {}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const response = await api.get('/activities', { params: filters });
        setActivities(response.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [JSON.stringify(filters)]);

  return { activities, loading, error };
}

// 使用示例
function ActivityList() {
  const { activities, loading, error } = useActivities({
    category: '瑜伽',
    status: 'active'
  });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <ul>
      {activities.map(activity => (
        <li key={activity.id}>{activity.title}</li>
      ))}
    </ul>
  );
}
```

### cURL 示例

```bash
# 获取活动列表
curl "http://localhost:3000/api/activities?category=瑜伽&limit=10"

# 获取单个活动
curl "http://localhost:3000/api/activities/1"

# 创建活动
curl -X POST "http://localhost:3000/api/activities" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新活动",
    "category": "瑜伽",
    "description": "活动描述",
    "price": "500 ฿",
    "priceMin": 500,
    "priceMax": 500,
    "location": "清迈",
    "status": "active"
  }'

# 更新活动
curl -X PUT "http://localhost:3000/api/activities/1" \
  -H "Content-Type: application/json" \
  -d '{"title": "更新后的标题"}'

# 删除活动
curl -X DELETE "http://localhost:3000/api/activities/1"

# 上传图片
curl -X POST "http://localhost:3000/api/upload" \
  -F "image=@/path/to/image.jpg" \
  -F "type=activity"
```

---

## 性能优化

### 分页

建议使用分页避免一次加载过多数据：

```javascript
// ❌ 不推荐：加载所有数据
const all = await getActivities();

// ✅ 推荐：分页加载
const page1 = await getActivities({ page: 1, limit: 20 });
const page2 = await getActivities({ page: 2, limit: 20 });
```

### 缓存

对不常变化的数据使用缓存：

```javascript
// 简单缓存示例
const cache = new Map();

async function getCachedActivities(key, ttl = 60000) {
  if (cache.has(key)) {
    const cached = cache.get(key);
    if (Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
  }

  const data = await getActivities(key);
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

---

## 部署说明

### 环境变量

创建 `.env` 文件：

```env
PORT=3000
NODE_ENV=production
```

### CORS 配置

生产环境需要更新允许的源：

```javascript
// server.js
const allowedOrigins = [
  'https://your-domain.com',
  'https://your-app.vercel.app'
];
```

---

## 更新日志

### v2.0.0 (2025-01-25)

- ✅ 添加分页支持
- ✅ 添加多字段筛选
- ✅ 添加图片上传 API
- ✅ 优化错误处理
- ✅ 添加 CORS 支持

### v1.0.0 (2024-12-01)

- ✅ 初始版本
- ✅ 基础 CRUD 操作
- ✅ JSON 数据存储

---

## 支持

如有问题，请：

1. 查看 [问题排查指南](technical/问题排查指南.md)
2. 查看 [问题诊断步骤](technical/问题诊断步骤.md)
3. 提交 Issue

---

**维护者：** 项目开发团队
**最后更新：** 2026-01-25
**API 版本：** v2.0.0
