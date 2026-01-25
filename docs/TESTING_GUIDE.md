# 自动化测试指南

## 测试环境已配置完成！

### 📦 已安装的测试工具

- **Vitest** - 快速的单元测试框架（与 Vite 深度集成）
- **React Testing Library** - React 组件测试工具
- **jsdom** - DOM 环境模拟
- **@testing-library/user-event** - 用户交互模拟
- **@testing-library/jest-dom** - 自定义 DOM 断言
- **@vitest/ui** - 可视化测试界面

### 🚀 运行测试的命令

```bash
# 运行所有测试（监听模式）
npm run test

# 运行一次所有测试
npm run test:run

# 启动可视化测试界面
npm run test:ui

# 生成测试覆盖率报告
npm run test:coverage
```

### 📁 测试文件结构

```
src/
├── test/
│   ├── setup.js           # 测试环境配置
│   ├── utils.js           # 测试工具函数
│   ├── example.test.js    # 示例测试用例
│   └── api.test.js        # API 测试示例
├── components/
│   └── ComponentName.test.jsx  # 组件测试文件
```

### 📝 编写测试的基本步骤

#### 1. 组件测试示例

```jsx
// src/components/ActivityCard.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ActivityCard from './ActivityCard'

describe('ActivityCard 组件', () => {
  const mockActivity = {
    id: 1,
    name: '清迈古城漫步',
    category: '观光',
    price: 200,
    description: '探索古城历史'
  }

  it('应该渲染活动信息', () => {
    render(<ActivityCard activity={mockActivity} />)
    expect(screen.getByText('清迈古城漫步')).toBeInTheDocument()
    expect(screen.getByText('观光')).toBeInTheDocument()
  })

  it('应该显示正确的价格', () => {
    render(<ActivityCard activity={mockActivity} />)
    expect(screen.getByText(/200/)).toBeInTheDocument()
  })
})
```

#### 2. 测试组件交互

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('应该能够点击按钮', async () => {
  const user = userEvent.setup()
  const handleClick = vi.fn()

  render(<button onClick={handleClick}>点击我</button>)

  await user.click(screen.getByRole('button'))

  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

#### 3. 测试异步操作

```jsx
import { render, screen, waitFor } from '@testing-library/react'

it('应该能够加载数据', async () => {
  render(<ActivityList />)

  // 初始显示加载状态
  expect(screen.getByText('加载中...')).toBeInTheDocument()

  // 等待数据加载完成
  await waitFor(() => {
    expect(screen.getByText('清迈古城漫步')).toBeInTheDocument()
  })
})
```

#### 4. Mock API 请求

```javascript
import { vi, describe, it, expect } from 'vitest'
import axios from 'axios'

vi.mock('axios')

describe('API 测试', () => {
  it('应该能够获取活动列表', async () => {
    const mockData = [
      { id: 1, name: '活动1' },
      { id: 2, name: '活动2' }
    ]

    axios.get.mockResolvedValue({ data: mockData })

    const response = await axios.get('/api/activities')

    expect(response.data).toEqual(mockData)
    expect(axios.get).toHaveBeenCalledWith('/api/activities')
  })
})
```

### 🎯 测试最佳实践

1. **测试文件命名**: 组件测试文件应该命名为 `ComponentName.test.jsx`
2. **测试描述**: 使用清晰、描述性的测试名称（中文也可以）
3. **测试结构**: 使用 `describe` 分组相关测试
4. **测试覆盖率**: 目标是 80% 以上的代码覆盖率
5. **测试独立性**: 每个测试应该独立运行，不依赖其他测试
6. **Mock 外部依赖**: 对于 API、数据库等外部依赖，使用 Mock

### 📊 测试覆盖率

运行以下命令生成覆盖率报告：

```bash
npm run test:coverage
```

报告将生成在 `coverage/index.html`，在浏览器中打开查看详细覆盖率。

### 🔧 测试配置

测试配置文件位于：[vitest.config.js](../vitest.config.js)

主要配置：
- 测试环境：jsdom
- 全局 API：启用
- 测试设置文件：[src/test/setup.js](../src/test/setup.js)
- 覆盖率工具：v8

### 📚 参考资源

- [Vitest 官方文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/react)
- [测试最佳实践](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### 🎬 下一步

1. 为项目中的关键组件编写测试
2. 为 API 接口编写集成测试
3. 设置 CI/CD 自动运行测试
4. 定期检查测试覆盖率

开始编写测试吧！ 🚀
