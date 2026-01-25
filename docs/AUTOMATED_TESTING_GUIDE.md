# 清迈活动平台 - 自动化测试指南

## 概述

本项目包含完整的自动化测试套件，涵盖：
- **单元测试** - 使用 Vitest 测试组件和工具函数
- **API 集成测试** - 测试所有后端 API 端点
- **端到端测试** - 使用 Playwright 测试用户交互流程

## 测试结构

```
Chiengmai/
├── src/test/                    # 单元测试和 API 测试
│   ├── setup.js                 # 测试环境配置
│   ├── utils.js                 # 测试工具函数
│   ├── example.test.jsx         # 单元测试示例
│   ├── api.test.js              # API 测试示例
│   └── comprehensive-api.test.js # 完整 API 测试套件
├── e2e/                         # 端到端测试
│   ├── main-page.spec.js        # 主页 E2E 测试
│   └── admin-page.spec.js       # 后台管理 E2E 测试
├── playwright.config.js         # Playwright 配置
├── vitest.config.js             # Vitest 配置
└── test-all-e2e.sh              # 综合测试脚本
```

## 快速开始

### 1. 安装测试依赖

```bash
npm install
```

### 2. 启动服务

```bash
# 终端 1 - 启动前端和后端
npm run dev

# 或分别启动
npm run dev:client  # 前端 http://localhost:5173
npm run dev:server  # 后端 http://localhost:3000
```

### 3. 运行测试

#### 方式 1：使用综合测试脚本（推荐）

```bash
# 运行所有测试
./test-all-e2e.sh all

# 只运行单元测试
./test-all-e2e.sh unit

# 只运行 API 测试
./test-all-e2e.sh api

# 只运行 E2E 测试
./test-all-e2e.sh e2e

# 生成测试覆盖率报告
./test-all-e2e.sh coverage
```

#### 方式 2：单独运行测试

```bash
# 单元测试和 API 测试
npm test                    # 交互式模式
npm run test:run            # 命令行模式
npm run test:ui             # 可视化界面
npm run test:coverage       # 生成覆盖率报告

# E2E 测试
npx playwright test         # 运行所有 E2E 测试
npx playwright test --ui    # 可视化模式
npx playwright show-report  # 查看测试报告
```

## 测试覆盖范围

### 单元测试

- [x] 基础组件渲染
- [x] 组件属性和状态
- [x] 异步操作
- [x] Mock 函数
- [x] 快照测试
- [x] 路由测试
- [x] 条件渲染

**文件**: [src/test/example.test.jsx](src/test/example.test.jsx)

### API 集成测试

#### 健康检查
- [x] 根路由访问
- [x] API 健康状态检查

#### 活动管理 API (/api/activities)
- [x] GET - 获取活动列表（支持筛选、搜索、分页、排序）
- [x] GET - 获取单个活动
- [x] POST - 创建新活动
- [x] PUT - 更新活动
- [x] DELETE - 删除活动
- [x] 数据验证（必填字段）
- [x] 错误处理（404、400）

#### 后台管理 API (/api/items)
- [x] GET - 获取所有数据
- [x] GET - 获取单个数据项
- [x] POST - 创建新数据项
- [x] PUT - 更新数据项
- [x] DELETE - 删除数据项
- [x] 数据验证

#### 统计 API
- [x] GET /api/activities/stats/categories - 分类统计

#### 飞书集成 API
- [x] POST /api/sync-manual - 手动同步
- [x] POST /api/sync-from-feishu - Webhook 接收

#### 安全性
- [x] CORS 头验证
- [x] OPTIONS 请求支持

**文件**: [src/test/comprehensive-api.test.js](src/test/comprehensive-api.test.js)

### 端到端测试

#### 主页测试 ([e2e/main-page.spec.js](e2e/main-page.spec.js))
- [x] 页面加载
- [x] 活动列表显示
- [x] 分类筛选功能
- [x] 搜索功能
- [x] 查看活动详情
- [x] 响应式布局（手机、平板、桌面）
- [x] API 集成
- [x] 错误处理

#### 后台管理页面测试 ([e2e/admin-page.spec.js](e2e/admin-page.spec.js))
- [x] 页面加载
- [x] 数据列表显示
- [x] **新增活动** - 打开表单、填写数据、提交
- [x] **编辑活动** - 打开编辑、修改数据、保存
- [x] **删除活动** - 点击删除、确认删除
- [x] **搜索和筛选** - 搜索框、分类筛选
- [x] **数据验证** - 必填字段验证
- [x] **图片上传** - 文件上传功能
- [x] API 集成
- [x] 成功和错误处理

## 测试脚本说明

### 综合测试脚本 (test-all-e2e.sh)

自动化运行所有测试的便捷脚本，包含：
- 服务状态检查
- 单元测试执行
- API 测试执行
- E2E 测试执行
- 测试报告生成

**特性**:
- 彩色输出，易于阅读
- 错误处理和退出
- 测试报告生成
- 支持单独运行各类测试

### NPM Scripts

```json
{
  "test": "vitest",                      // Vitest 交互式模式
  "test:ui": "vitest --ui",              // Vitest 可视化界面
  "test:run": "vitest run",              // Vitest 命令行模式
  "test:coverage": "vitest run --coverage" // 生成覆盖率报告
}
```

### Playwright 命令

```bash
# 运行测试
npx playwright test

# 调试模式
npx playwright test --debug

# 可视化模式
npx playwright test --ui

# 查看报告
npx playwright show-report

# 安装浏览器
npx playwright install
```

## 测试数据和隔离

### 测试数据清理

API 测试中使用的测试数据会在测试后自动清理：
- 创建的测试活动会在测试结束后删除
- 使用唯一的 ID 标识测试数据

### Mock 数据

- API 测试使用真实的后端服务
- E2E 测试可以配置使用 Mock 数据或真实 API

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run tests
        run: ./test-all-e2e.sh all

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: playwright-report/
```

## 测试覆盖率

运行覆盖率测试：

```bash
npm run test:coverage
```

覆盖率报告会生成在 `coverage/` 目录。

打开报告：
```bash
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

## 故障排查

### 问题 1: 服务未运行

**错误**: `Error: connect ECONNREFUSED localhost:3000`

**解决**:
```bash
# 确保服务正在运行
npm run dev
```

### 问题 2: E2E 测试超时

**错误**: `Test timeout of 30000ms exceeded`

**解决**:
- 增加超时时间：`test.slow()`
- 检查网络连接
- 确保页面元素可访问

### 问题 3: Playwright 浏览器未安装

**错误**: `Executable doesn't exist at /path/to/chromium`

**解决**:
```bash
npx playwright install
```

### 问题 4: API 测试失败

**错误**: `Expected 200 but got 500`

**解决**:
- 检查后端服务日志
- 验证数据文件存在
- 确认环境变量配置

## 最佳实践

1. **测试隔离** - 每个测试应该独立运行，不依赖其他测试
2. **清理数据** - 测试后清理创建的数据
3. **使用描述性名称** - 测试名称应该清楚说明测试内容
4. **避免硬编码等待** - 使用 `waitForSelector` 而不是 `waitForTimeout`
5. **测试关键路径** - 优先测试核心功能和用户流程
6. **保持测试简单** - 一个测试只验证一个功能点

## 扩展测试

### 添加新的单元测试

```javascript
// src/test/new-component.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NewComponent } from '../NewComponent'

describe('NewComponent', () => {
  it('should render correctly', () => {
    render(<NewComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### 添加新的 API 测试

```javascript
// src/test/new-api.test.js
import { describe, it, expect } from 'vitest'
import axios from 'axios'

describe('New API', () => {
  it('should return data', async () => {
    const response = await axios.get('/api/new-endpoint')
    expect(response.status).toBe(200)
    expect(response.data.success).toBe(true)
  })
})
```

### 添加新的 E2E 测试

```javascript
// e2e/new-page.spec.js
import { test, expect } from '@playwright/test'

test('new page test', async ({ page }) => {
  await page.goto('/new-page')
  await expect(page.locator('h1')).toHaveText('New Page')
})
```

## 相关文档

- [Vitest 文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/react)
- [Playwright 文档](https://playwright.dev/)
- [项目架构文档](ARCHITECTURE.md)
- [API 文档](API.md)

## 支持

如有问题或建议，请：
- 提交 Issue
- 查看测试日志
- 运行 `npm run test:ui` 调试测试

---

**最后更新**: 2025-01-26
