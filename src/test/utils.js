import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// 创建自定义 render 函数，包含 Router
export function renderWithRouter(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route)

  return {
    user: undefined,
    ...render(ui, { wrapper: BrowserRouter })
  }
}

// 等待元素出现
export async function waitForElementToBeRemoved(callback) {
  const { waitForElementToBeRemoved: waitForRemoved } = await import('@testing-library/react')
  return waitForRemoved(callback)
}

// 模拟延迟
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
