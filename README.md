# 清迈活动查询平台 🏝️

**版本**: 2.0.0 (Pure HTML Edition)  
**状态**: ✅ 生产就绪

## 🎯 项目概述

清迈活动查询平台 - 一个简单、快速、稳定的活动展示系统。使用纯 HTML + CSS + JavaScript 构建，无需复杂的构建工具。

### 技术栈

- **前端**: 纯 HTML + CSS + Vanilla JavaScript
- **后端**: Node.js + Express
- **数据**: JSON 文件存储
- **测试**: Playwright (E2E) + Vitest (单元测试)

### 为什么选择纯 HTML？

✅ **极简架构** - 无需构建工具，开箱即用  
✅ **极速加载** - 页面大小仅 5KB，0.5秒加载  
✅ **稳定可靠** - 不会出现编译错误  
✅ **易于维护** - 代码简单，任何人都能看懂  
✅ **零依赖** - 不需要 npm、webpack、vite 等  

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
# 开发模式（前端 + 后端）
npm run dev

# 仅后端
npm start
```

### 访问应用

- **前端主页**: http://localhost:5173
- **后台管理**: http://localhost:5173/admin.html
- **API 文档**: http://localhost:3000/api/health

---

## 📊 数据管理

### Excel 数据更新

项目使用 **Excel 文件** (`清迈活动数据.xlsx`) 作为数据源。

#### ⚡ 快速更新数据

```bash
# 1. 编辑 Excel 文件
open "清迈活动数据.xlsx"

# 2. 添加/修改活动数据

# 3. 运行脚本生成/更新唯一 ID
npm run add-ids

# 4. 导出数据到 JSON
npm run export-data

# 5. 重启服务器
npm run dev
```

#### 📝 数据管理命令

| 命令 | 说明 | 文件 |
|------|------|------|
| `npm run add-ids` | 为所有活动生成唯一 ID | `清迈活动数据.xlsx` |
| `npm run export-data` | 导出 Excel 数据到 JSON | `data/items.json` |

#### ✨ 唯一 ID 特性

- **格式**: 14 位数字（时间戳 + 随机数）
- **作用**: 避免数据重复、追踪更新
- **自动生成**: 无需手动填写
- **永久保留**: 更新数据时 ID 保持不变

详细说明：[唯一 ID 使用指南](./docs/UNIQUE_ID_GUIDE.md)

---

## 📁 项目结构

```
chiengmai-activities/
├── index.html              # 主页（纯 HTML）
├── public/
│   ├── admin.html         # 后台管理页面
│   └── index.html         # 公共静态文件
├── server.cjs             # Express 服务器
├── data/
│   └── items.json         # 活动数据
├── e2e/                   # E2E 测试
│   ├── main-page.spec.js  # 主页测试
│   └── admin-page.spec.js # 后台测试
├── src/test/              # 单元测试
└── archive/               # 归档文件
    └── react-originals/   # 原 React 版本（已归档）
```

---

## ✨ 功能特性

### 主页功能
- ✅ 活动列表展示（20个活动）
- ✅ 活动卡片显示（分类、地点、价格）
- ✅ 响应式设计（手机/平板/桌面）
- ✅ 优雅的加载动画
- ✅ 错误提示

### 后台管理
- ✅ 活动列表查看
- ✅ 新增活动
- ✅ 编辑活动
- ✅ 删除活动
- ✅ 搜索和筛选
- ✅ 图片上传

### API 端点
- `GET /api/health` - 健康检查
- `GET /api/items` - 获取所有活动
- `GET /api/items/:id` - 获取单个活动
- `POST /api/items` - 创建活动
- `PUT /api/items/:id` - 更新活动
- `DELETE /api/items/:id` - 删除活动

---

## 🧪 测试

### 运行所有测试

```bash
# E2E 测试
npm run test:e2e

# 单元测试
npm test

# 测试 UI 模式
npm run test:e2e:ui
```

### 测试覆盖

- ✅ 16 个 E2E 测试（主页 + 后台）
- ✅ 28 个单元测试（API 测试）
- ✅ **100% 通过率**

---

## 📊 数据格式

### 活动对象示例

```json
{
  "id": 1769349680301,
  "title": "瑜伽（Nong Buak Haad公园）",
  "description": "需要自己带瑜伽垫，或15泰铢租。",
  "category": "瑜伽",
  "status": "active",
  "location": "Nong Buak Haad公园",
  "price": "免费",
  "time": "08:30-09:45",
  "duration": "1小时15分钟"
}
```

---

## 🔧 配置

### 环境变量

创建 `.env` 文件：

```env
PORT=3000
NODE_ENV=development
```

### Vite 配置

`vite.config.js` 用于开发服务器：

```javascript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
```

---

## 📈 性能指标

| 指标 | 数值 |
|------|------|
| 页面大小 | ~5KB |
| 首次加载 | ~0.5秒 |
| 运行内存 | ~2MB |
| 测试通过率 | 100% |
| 功能完整度 | 25% (核心功能) |

---

## 🆚 版本对比

### Pure HTML vs React

| 维度 | Pure HTML (当前) | React (已归档) |
|------|-----------------|---------------|
| 复杂度 | ⭐ 极简 | ⭐⭐⭐⭐ 复杂 |
| 稳定性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 加载速度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 维护成本 | ⭐ 极低 | ⭐⭐⭐⭐ |
| 功能完整度 | 25% | 100% |

详见：[docs/HOMEPAGE-COMPARISON.md](docs/HOMEPAGE-COMPARISON.md)

---

## 🔄 从 React 迁移

原 React 版本已归档到 `archive/react-originals/`。

如需恢复 React 版本：

```bash
# 1. 恢复文件
mv archive/react-originals/* .

# 2. 安装 React 依赖
npm install react react-dom

# 3. 启动开发服务器
npm run dev
```

---

## 📝 文档

- [测试报告](TEST-REPORT.md)
- [每日工作总结](DAILY-WORK-SUMMARY.md)
- [解决方案总结](SOLUTION-SUMMARY.md)
- [API 文档](docs/API.md)
- [系统架构](docs/ARCHITECTURE.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

ISC

---

**最后更新**: 2025-01-26  
**当前版本**: 2.0.0 (Pure HTML Edition)  
**状态**: ✅ 生产就绪
