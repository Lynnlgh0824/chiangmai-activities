# 清迈指南 API 接口文档

> Version: 1.0 | Last Updated: 2026-06-01
> Base URL: `https://gocnx.vercel.app` (生产) / `http://localhost:4000` (本地)

---

## 通用说明

### 认证

| 方式 | 说明 |
|------|------|
| 公开接口 | 无需认证（所有 GET 请求） |
| 写入接口 | 需要 `X-API-Key` Header |

### 限流

- 全局: 100 请求 / 15 分钟 / IP
- 超限返回 `429 Too Many Requests`

### 响应格式

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

错误响应：
```json
{
  "success": false,
  "message": "错误描述"
}
```

---

## 系统接口

### GET `/api/health`
健康检查。

**响应**: `{ success, message, timestamp }`

### GET `/api/version`
获取数据版本号（带缓存控制头）。

**响应**: `{ success, version, timestamp, count }`

### GET `/app/version`
获取应用版本信息。

**响应**: `{ success, version, fullVersion, codeName, buildDate, features, changelog }`

---

## 活动接口 (`/api/activities`)

### GET `/api/activities`
获取活动列表（支持筛选、搜索、排序、分页）。

**查询参数**:

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| category | string | - | 分类筛选 |
| search | string | - | 关键词搜索（中/英/泰） |
| priceMin | number | - | 最低价格 |
| priceMax | number | - | 最高价格 |
| status | string | - | 状态筛选 |
| page | number | 1 | 页码 |
| limit | number | 1000 | 每页数量 |
| sortBy | string | - | 排序字段: date/price/createdAt |
| sortOrder | string | - | asc/desc |

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "001",
      "title": "清迈清晨瑜伽",
      "description": "...",
      "category": "兴趣班",
      "date": "2026-06-15",
      "time": "07:00",
      "location": "宁曼路",
      "price": 0,
      "status": "进行中"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "itemsPerPage": 1000,
    "totalItems": 45,
    "totalPages": 1
  }
}
```

### GET `/api/activities/:id`
获取单个活动详情。

### POST `/api/activities` 🔒
创建活动。

**请求体**:
```json
{
  "title": "活动标题（必填）",
  "description": "活动描述（必填）",
  "category": "兴趣班",
  "date": "2026-06-15",
  "time": "07:00",
  "duration": "90分钟",
  "location": "清迈古城",
  "address": "具体地址",
  "price": 0,
  "currency": "THB",
  "maxParticipants": 20,
  "images": ["url1.jpg"],
  "language": "中/英",
  "tags": ["瑜伽", "免费"]
}
```

### PUT `/api/activities/:id` 🔒
更新活动（部分更新）。

### DELETE `/api/activities/:id` 🔒
删除活动。

### GET `/api/activities/stats/categories`
获取分类统计。

**响应**: `{ success, data: { "兴趣班": 12, "市集": 8, ... } }`

---

## 旧版兼容接口 (`/api/items`)

与 `/api/activities` 功能相同，保持向后兼容。字段名为中文映射到英文。

---

## 文件上传

### POST `/api/upload` 🔒
上传图片。

- 格式: jpg, jpeg, png, gif, webp
- 大小限制: 2MB
- 请求: `multipart/form-data`, field: `image`

**响应**: `{ success, data: { url, filename, size } }`

### DELETE `/api/upload/:filename` 🔒
删除已上传文件。

---

## Excel 导入导出

### POST `/api/import-excel` 🔒
从 Excel 导入数据（触发 `scripts/import-excel-enhanced.mjs`）。

### POST `/api/export-excel` 🔒
导出数据为 Excel 文件（下载 .xlsx）。

---

## 攻略接口

### GET `/api/guide`
获取旅行攻略内容。

### POST `/api/guide` 🔒
保存攻略内容。Body: `{ content }` (max 100,000 字符)

---

## 需求日志接口

### GET `/api/requirements-log`
获取所有需求日志。

### GET `/api/requirements-log/recent`
获取最近需求日志。Query: `limit` (默认 10)

### GET `/api/requirements-log/stats`
获取需求日志统计（按类型、分类、日期、影响级别）。

### POST `/api/requirements-log` 🔒
新增需求日志。

**请求体**: `{ type, category, title, description, details, impact, relatedFiles }`

### PUT `/api/requirements-log/:id` 🔒
更新需求日志。

### DELETE `/api/requirements-log/:id` 🔒
删除需求日志。

---

## 飞书同步接口

### POST `/api/sync-from-feishu` 🔒
接收飞书 Webhook，自动同步数据。

### POST `/api/sync-manual` 🔒
手动触发飞书同步。

---

## 数据修复接口

### POST `/api/auto-fix-all` 🔒
一键修复：修复缺失状态、暂停备注、更新版本。

### POST `/api/fix-missing-status` 🔒
修复缺失的 status 字段。

### POST `/api/fix-suspension-notes` 🔒
修复暂停活动的备注。

---

## 测试接口

### GET `/api/unit-tests/status`
检查单元测试文件状态。

### POST `/api/unit-tests/run` 🔒
运行 Vitest 单元测试。
