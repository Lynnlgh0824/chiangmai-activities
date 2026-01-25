import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderWithRouter } from './utils'

// 示例 1: 基础组件测试
describe('基础测试示例', () => {
  it('应该能够渲染简单的文本', () => {
    const TestComponent = () => <div>Hello Vitest</div>
    render(<TestComponent />)

    expect(screen.getByText('Hello Vitest')).toBeInTheDocument()
  })

  it('应该能够测试 React 组件的属性', () => {
    const Button = ({ label, disabled }) => (
      <button disabled={disabled}>{label}</button>
    )

    const { rerender } = render(<Button label="Click me" disabled={false} />)

    expect(screen.getByRole('button')).not.toBeDisabled()

    rerender(<Button label="Disabled" disabled={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

// 示例 2: 异步测试
describe('异步测试示例', () => {
  it('应该能够测试异步操作', async () => {
    const fetchData = () =>
      new Promise((resolve) => {
        setTimeout(() => resolve('Data loaded'), 100)
      })

    const result = await fetchData()
    expect(result).toBe('Data loaded')
  })

  it('应该能够使用 vi.fn() 创建 mock 函数', async () => {
    const mockFn = vi.fn()

    mockFn('hello')
    mockFn('world')

    expect(mockFn).toHaveBeenCalledTimes(2)
    expect(mockFn).toHaveBeenCalledWith('hello')
    expect(mockFn).toHaveBeenLastCalledWith('world')
  })
})

// 示例 3: 快照测试
describe('快照测试示例', () => {
  it('应该能够匹配组件快照', () => {
    const UserCard = ({ name, email }) => (
      <div className="user-card">
        <h3>{name}</h3>
        <p>{email}</p>
      </div>
    )

    const { container } = render(
      <UserCard name="张三" email="zhangsan@example.com" />
    )

    expect(container.firstChild).toMatchSnapshot()
  })
})

// 示例 4: 路由测试
describe('路由测试示例', () => {
  it('应该能够在不同路由下渲染组件', () => {
    const HomePage = () => <div>首页</div>
    const AboutPage = () => <div>关于我们</div>

    const { container: homeContainer } = renderWithRouter(<HomePage />, {
      route: '/'
    })
    expect(homeContainer.textContent).toContain('首页')

    const { container: aboutContainer } = renderWithRouter(<AboutPage />, {
      route: '/about'
    })
    expect(aboutContainer.textContent).toContain('关于我们')
  })
})

// 示例 5: 条件渲染测试
describe('条件渲染测试', () => {
  it('应该能够根据 props 显示不同内容', () => {
    const StatusMessage = ({ status }) => {
      if (status === 'loading') return <div>加载中...</div>
      if (status === 'error') return <div>出错了</div>
      if (status === 'success') return <div>成功！</div>
      return <div>未知状态</div>
    }

    const { rerender } = render(<StatusMessage status="loading" />)
    expect(screen.getByText('加载中...')).toBeInTheDocument()

    rerender(<StatusMessage status="error" />)
    expect(screen.getByText('出错了')).toBeInTheDocument()

    rerender(<StatusMessage status="success" />)
    expect(screen.getByText('成功！')).toBeInTheDocument()

    rerender(<StatusMessage status="unknown" />)
    expect(screen.getByText('未知状态')).toBeInTheDocument()
  })
})
