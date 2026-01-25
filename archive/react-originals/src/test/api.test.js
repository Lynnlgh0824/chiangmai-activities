import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

// API 基础地址
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// 示例：API 测试
describe('API 测试示例', () => {
  // Mock axios
  vi.mock('axios')

  beforeEach(() => {
    // 每个测试前清除所有 mocks
    vi.clearAllMocks()
  })

  it('应该能够成功获取活动数据', async () => {
    const mockActivities = [
      { id: 1, name: '活动1', category: '美食' },
      { id: 2, name: '活动2', category: '观光' }
    ]

    // Mock axios.get 的响应
    axios.get.mockResolvedValue({
      data: mockActivities
    })

    // 调用 API
    const response = await axios.get(`${API_BASE}/api/activities`)

    // 验证
    expect(axios.get).toHaveBeenCalledWith(`${API_BASE}/api/activities`)
    expect(response.data).toEqual(mockActivities)
    expect(response.data).toHaveLength(2)
  })

  it('应该能够处理 API 错误', async () => {
    const mockError = new Error('Network Error')

    axios.get.mockRejectedValue(mockError)

    try {
      await axios.get(`${API_BASE}/api/activities`)
    } catch (error) {
      expect(error).toEqual(mockError)
    }

    expect(axios.get).toHaveBeenCalledWith(`${API_BASE}/api/activities`)
  })

  it('应该能够发送 POST 请求', async () => {
    const newActivity = {
      name: '新活动',
      category: '美食',
      price: 100
    }

    axios.post.mockResolvedValue({
      data: { id: 1, ...newActivity }
    })

    const response = await axios.post(`${API_BASE}/api/activities`, newActivity)

    expect(axios.post).toHaveBeenCalledWith(
      `${API_BASE}/api/activities`,
      newActivity
    )
    expect(response.data).toHaveProperty('id', 1)
    expect(response.data.name).toBe('新活动')
  })
})

// 示例：数据验证测试
describe('数据验证测试示例', () => {
  it('应该能够验证活动数据结构', () => {
    const activity = {
      id: 1,
      name: '清迈古城漫步',
      category: '观光',
      price: 200,
      description: '探索古城历史'
    }

    expect(activity).toHaveProperty('id')
    expect(activity).toHaveProperty('name')
    expect(activity).toHaveProperty('category')
    expect(activity).toHaveProperty('price')
    expect(activity).toHaveProperty('description')

    expect(typeof activity.id).toBe('number')
    expect(typeof activity.name).toBe('string')
    expect(typeof activity.price).toBe('number')
  })

  it('应该能够筛选活动数据', () => {
    const activities = [
      { id: 1, name: '活动1', category: '美食', price: 100 },
      { id: 2, name: '活动2', category: '观光', price: 200 },
      { id: 3, name: '活动3', category: '美食', price: 150 }
    ]

    // 筛选美食类活动
    const foodActivities = activities.filter(a => a.category === '美食')
    expect(foodActivities).toHaveLength(2)
    expect(foodActivities.every(a => a.category === '美食')).toBe(true)

    // 筛选价格小于 200 的活动
    const cheapActivities = activities.filter(a => a.price < 200)
    expect(cheapActivities).toHaveLength(2)
  })
})

// 示例：工具函数测试
describe('工具函数测试示例', () => {
  it('应该能够格式化价格', () => {
    const formatPrice = (price) => {
      return `฿${price.toLocaleString()}`
    }

    expect(formatPrice(100)).toBe('฿100')
    expect(formatPrice(1000)).toBe('฿1,000')
    expect(formatPrice(10000)).toBe('฿10,000')
  })

  it('应该能够格式化日期', () => {
    const formatDate = (date) => {
      const d = new Date(date)
      return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    expect(formatDate('2025-01-26')).toContain('2025')
    expect(formatDate('2025-01-26')).toContain('1月')
  })

  it('应该能够计算折扣价格', () => {
    const calculateDiscount = (price, discount) => {
      return Math.round(price * (1 - discount / 100))
    }

    expect(calculateDiscount(1000, 10)).toBe(900)
    expect(calculateDiscount(500, 20)).toBe(400)
    expect(calculateDiscount(200, 50)).toBe(100)
  })
})
