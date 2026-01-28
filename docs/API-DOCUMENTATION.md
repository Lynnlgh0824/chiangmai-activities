# 清迈活动平台 API 文档

**版本**: v2.6.0
**基础URL**: `http://localhost:3000`
**认证方式**: API Key
**最后更新**: 2026-01-29

---

## 📋 目录

- [认证方式](#认证方式)
- [通用响应格式](#通用响应格式)
- [错误处理](#错误处理)
- [速率限制](#速率限制)
- [API端点](#api端点)
  - [健康检查](#健康检查)
  - [活动管理](#活动管理)
  - [项目管理](#项目管理)
  - [文件上传](#文件上传)
  - [数据导入导出](#数据导入导出)
  - [攻略管理](#攻略管理)
  - [需求日志](#需求日志)
  - [同步和修复](#同步和修复)

---

## 🔐 认证方式

### API Key认证

大多数写操作（POST、PUT、DELETE）需要API Key认证。

#### 获取API Key

**开发环境**: 使用默认密钥 `dev-api-key-change-in-production`

**生产环境**: 必须设置环境变量
```bash
export ADMIN_API_KEY=your-secure-api-key-here
```

#### 使用API Key

在请求头中添加 `X-API-Key`:

```bash
curl -H "X-API-Key: your-api-key" \
  -X POST http://localhost:3000/api/items
```

#### Node.js示例

```javascript
const response = await fetch('http://localhost:3000/api/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({ title: '新活动' })
});
```

#### 需要认证的端点

所有 `POST`、`PUT`、`DELETE` 请求都需要认证：
- `/api/activities` (POST/PUT/DELETE)
- `/api/items` (POST/PUT/DELETE)
- `/api/upload` (POST/DELETE)
- `/api/guide` (POST)
- `/api/import-excel` (POST)
- `/api/export-excel` (POST)
- 其他所有写操作

---

## 📊 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "Error Type",
  "message": "错误描述",
  "details": { ... }  // 仅开发环境
}
```

---

## ⚠️ 错误处理

### HTTP状态码

| 状态码 | 说明 | 示例 |
|--------|------|------|
| 200 | 成功 | 请求成功处理 |
| 400 | 请求错误 | 输入验证失败 |
| 401 | 未授权 | 缺少API Key |
| 403 | 禁止访问 | API Key无效 |
| 404 | 未找到 | 资源不存在 |
| 429 | 请求过多 | 超过速率限制 |
| 500 | 服务器错误 | 内部错误 |

### 错误示例

#### 401 未授权
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "缺少API密钥，请在请求头中提供 X-API-Key"
}
```

#### 403 禁止访问
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "API密钥无效"
}
```

#### 429 请求过多
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "请求过于频繁，请稍后再试",
  "retryAfter": 900
}
```

---

## 🚦 速率限制

### 限制策略

| 类型 | 限制 | 适用场景 |
|------|------|----------|
| 通用 | 100次/15分钟 | 所有API请求 |
| 写操作 | 20次/15分钟 | POST/PUT/DELETE |
| 严格 | 10次/分钟 | 敏感操作 |

### 响应头

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706491200000
```

### 处理429响应

```javascript
try {
  const response = await fetch(url);
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`请等待 ${retryAfter} 秒后重试`);
  }
} catch (error) {
  console.error('请求失败:', error);
}
```

---

## 🛣️ API端点

### 健康检查

#### GET /api/health

检查API服务状态。

**请求示例**:
```bash
curl http://localhost:3000/api/health
```

**响应示例**:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-01-29T10:30:00.000Z"
}
```

**认证**: 不需要

---

#### GET /api/version

获取数据版本号。

**请求示例**:
```bash
curl http://localhost:3000/api/version
```

**响应示例**:
```json
{
  "success": true,
  "version": "3.0.0",
  "timestamp": "2026-01-29T10:30:00.000Z",
  "count": 72
}
```

**认证**: 不需要

---

### 活动管理

#### GET /api/activities

获取所有活动数据。

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| limit | number | 否 | 限制返回数量（默认1000） |

**请求示例**:
```bash
curl http://localhost:3000/api/activities?limit=100
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1769349680301",
      "title": "瑜伽（Nong Buak Haad公园）",
      "category": "瑜伽",
      "location": "Nong Buak Haad公园",
      "time": "08:30-09:45",
      "price": "免费",
      "status": "进行中",
      "weekdays": ["周一", "周三", "周五"]
    }
  ]
}
```

**认证**: 不需要

---

#### POST /api/activities

创建新活动。

**请求头**:
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**请求体**:
```json
{
  "title": "新瑜伽活动",
  "description": "活动描述",
  "category": "瑜伽",
  "location": "清迈公园",
  "time": "08:00-09:00",
  "price": "免费",
  "date": "2026-01-30",
  "duration": "1小时",
  "latitude": 18.7883,
  "longitude": 98.9853,
  "maxParticipants": 20
}
```

**验证规则**:
- `title`: 1-200字符，必填
- `description`: 1-5000字符，必填
- `category`: 必须在允许列表中
- `latitude`: -90到90之间
- `longitude`: -180到180之间
- `maxParticipants`: 非负整数

**响应示例**:
```json
{
  "success": true,
  "data": { "id": "1769349680302", ... },
  "message": "创建成功"
}
```

**认证**: 需要

---

#### PUT /api/activities/:id

更新活动信息。

**请求头**:
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**URL参数**:
- `id`: 活动ID

**请求体**: 同POST /api/activities

**响应示例**:
```json
{
  "success": true,
  "data": { ... },
  "message": "更新成功"
}
```

**认证**: 需要

---

#### DELETE /api/activities/:id

删除活动。

**请求头**:
```http
X-API-Key: your-api-key
```

**URL参数**:
- `id`: 活动ID

**响应示例**:
```json
{
  "success": true,
  "message": "删除成功"
}
```

**认证**: 需要

---

### 项目管理

#### GET /api/items

获取所有项目（活动）。

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| limit | number | 否 | 限制返回数量 |
| status | string | 否 | 筛选状态（进行中、暂停、草稿） |
| category | string | 否 | 筛选分类 |

**请求示例**:
```bash
curl "http://localhost:3000/api/items?status=进行中&category=瑜伽"
```

**认证**: 不需要

---

#### POST /api/items

创建新项目。

**请求头**:
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**请求体**: 同POST /api/activities

**认证**: 需要

---

#### PUT /api/items/:id

更新项目信息。

**认证**: 需要

---

#### DELETE /api/items/:id

删除项目。

**认证**: 需要

---

### 文件上传

#### POST /api/upload

上传图片文件。

**请求头**:
```http
X-API-Key: your-api-key
Content-Type: multipart/form-data
```

**请求参数**:
- `image`: 图片文件（multipart/form-data）

**限制**:
- 文件大小: 最大2MB
- 允许格式: .jpg, .jpeg, .png, .gif, .webp
- 文件名长度: 最大255字符

**请求示例**:
```bash
curl -H "X-API-Key: your-api-key" \
  -F "image=@/path/to/image.jpg" \
  http://localhost:3000/api/upload
```

**响应示例**:
```json
{
  "success": true,
  "message": "上传成功",
  "data": {
    "filename": "image-1769349680301.jpg",
    "url": "/uploads/image-1769349680301.jpg",
    "size": 123456
  }
}
```

**认证**: 需要

---

#### DELETE /api/upload/:filename

删除上传的文件。

**URL参数**:
- `filename`: 文件名

**认证**: 需要

---

### 数据导入导出

#### POST /api/import-excel

从Excel文件导入数据。

**请求头**:
```http
X-API-Key: your-api-key
Content-Type: multipart/form-data
```

**请求参数**:
- `file`: Excel文件（.xlsx, .xls）

**认证**: 需要

---

#### POST /api/export-excel

导出数据到Excel文件。

**请求头**:
```http
X-API-Key: your-api-key
```

**响应示例**:
```json
{
  "success": true,
  "message": "导出成功",
  "filename": "activities-2026-01-29.xlsx"
}
```

**认证**: 需要

---

### 攻略管理

#### GET /api/guide

获取攻略信息。

**请求示例**:
```bash
curl http://localhost:3000/api/guide
```

**认证**: 不需要

---

#### POST /api/guide

保存攻略信息。

**请求头**:
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**请求体**:
```json
{
  "content": "<p>攻略内容</p>"
}
```

**验证规则**:
- `content`: 1-100000字符

**认证**: 需要

---

### 需求日志

#### GET /api/requirements-log

获取需求日志。

**查询参数**:
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| limit | number | 否 | 返回数量 |
| offset | number | 否 | 偏移量 |

**认证**: 不需要

---

#### POST /api/requirements-log

添加需求日志。

**请求头**:
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**认证**: 需要

---

#### PUT /api/requirements-log/:id

更新需求日志。

**认证**: 需要

---

#### DELETE /api/requirements-log/:id

删除需求日志。

**认证**: 需要

---

### 同步和修复

#### POST /api/sync-from-feishu

从飞书同步数据。

**认证**: 需要

---

#### POST /api/sync-manual

手动同步数据。

**认证**: 需要

---

#### POST /api/fix-missing-status

修复缺失的状态。

**认证**: 需要

---

#### POST /api/update-version

更新版本号。

**认证**: 需要

---

## 📝 客户端示例

### JavaScript (Fetch)

```javascript
// 获取活动列表
async function getActivities() {
  const response = await fetch('http://localhost:3000/api/activities');
  const result = await response.json();

  if (result.success) {
    console.log('活动列表:', result.data);
  }
}

// 创建新活动
async function createActivity(activityData) {
  const response = await fetch('http://localhost:3000/api/activities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your-api-key'
    },
    body: JSON.stringify(activityData)
  });

  const result = await response.json();

  if (result.success) {
    console.log('创建成功:', result.data);
  } else {
    console.error('创建失败:', result.message);
  }
}

// 上传图片
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    headers: {
      'X-API-Key': 'your-api-key'
    },
    body: formData
  });

  const result = await response.json();
  return result.data.url;
}
```

### cURL示例

```bash
# 获取活动
curl http://localhost:3000/api/activities

# 创建活动
curl -X POST http://localhost:3000/api/activities \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-api-key-change-in-production" \
  -d '{
    "title": "瑜伽活动",
    "description": "这是一个瑜伽活动",
    "category": "瑜伽",
    "location": "清迈公园",
    "time": "08:00-09:00",
    "price": "免费"
  }'

# 上传图片
curl -X POST http://localhost:3000/api/upload \
  -H "X-API-Key: dev-api-key-change-in-production" \
  -F "image=@/path/to/image.jpg"

# 删除活动
curl -X DELETE http://localhost:3000/api/activities/1769349680301 \
  -H "X-API-Key: dev-api-key-change-in-production"
```

### Python示例

```python
import requests

API_BASE = "http://localhost:3000"
API_KEY = "dev-api-key-change-in-production"

headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}

# 获取活动
response = requests.get(f"{API_BASE}/api/activities")
data = response.json()
print(data)

# 创建活动
activity_data = {
    "title": "瑜伽活动",
    "description": "这是一个瑜伽活动",
    "category": "瑜伽",
    "location": "清迈公园",
    "time": "08:00-09:00",
    "price": "免费"
}

response = requests.post(
    f"{API_BASE}/api/activities",
    json=activity_data,
    headers=headers
)
result = response.json()
print(result)

# 上传图片
files = {"image": open("image.jpg", "rb")}
response = requests.post(
    f"{API_BASE}/api/upload",
    headers={"X-API-Key": API_KEY},
    files=files
}
result = response.json()
print(result)
```

---

## 🧪 测试API

### 使用测试仪表板

访问 [http://localhost:3000/test-dashboard-enhanced.html](http://localhost:3000/test-dashboard-enhanced.html) 进行API测试。

### 常见测试场景

```bash
# 1. 测试健康检查
curl http://localhost:3000/api/health

# 2. 测试获取活动
curl http://localhost:3000/api/activities

# 3. 测试API Key认证（应该成功）
curl -H "X-API-Key: dev-api-key-change-in-production" \
  -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"title":"测试"}'

# 4. 测试缺少API Key（应该返回401）
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"title":"测试"}'

# 5. 测试无效API Key（应该返回403）
curl -H "X-API-Key: invalid-key" \
  -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"title":"测试"}'

# 6. 测试速率限制（快速发送多个请求）
for i in {1..150}; do
  curl http://localhost:3000/api/activities &
done
wait
# 应该在第101个请求时收到429
```

---

## 📖 附录

### 允许的活动分类

```javascript
[
  '瑜伽', '冥想', '舞蹈', '泰拳', '音乐', '文化艺术', '健身',
  '市集', '灵活时间活动', '活动网站', '攻略信息', '其他'
]
```

### 数据模型

#### 活动对象

```typescript
interface Activity {
  id?: string;
  _id?: string;
  title: string;              // 1-200字符
  description: string;        // 1-5000字符
  category: string;           // 允许的分类
  location?: string;          // 地点名称
  time?: string;              // 时间（HH:MM或"灵活时间"）
  price?: string;             // 价格显示
  status: string;             // "进行中" | "暂停" | "草稿"
  latitude?: number;         // -90到90
  longitude?: number;        // -180到180
  maxParticipants?: number;   // 非负整数
  source?: {
    name: string;
    url: string;
    type: string;
    lastUpdated: string;
  };
}
```

---

## 📞 支持

如有问题，请查看：
- [故障排查指南](./TROUBLESHOOTING.md)
- [部署指南](./DEPLOYMENT-GUIDE.md)
- [开发者指南](./DEVELOPER-GUIDE.md)

---

**API版本**: v2.6.0
**最后更新**: 2026-01-29
**状态**: ✅ 生产就绪
