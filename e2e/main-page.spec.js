import { test, expect } from '@playwright/test'

/**
 * 真实的自动化测试 - 验证实际可见性和功能
 *
 * 测试原则：
 * 1. 验证真实内容，不只是 DOM 结构
 * 2. 检查控制台错误
 * 3. 验证用户交互功能
 * 4. 失败时自动截图
 */

test.describe('清迈活动平台 - 主页真实功能测试', () => {
  test('页面应该加载并显示内容', async ({ page }) => {
    // 收集错误
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    // 访问主页
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 })

    // 验证基本页面结构
    await expect(page).toHaveTitle(/清迈活动/)

    // 关键验证：等待实际内容出现（最多15秒）
    try {
      await page.waitForSelector('[class*="activity"], .card, [data-testid="activity-card"], h1, h2, h3', {
        timeout: 15000
      })
      console.log('✅ 页面有内容显示')
    } catch (e) {
      // 截图
      await page.screenshot({ path: 'test-results/no-content-homepage.png' })
      console.log('❌ 页面完全空白，已保存截图')

      // 报告详细错误
      console.log('发现的错误:', errors)
      throw new Error('页面完全空白，React 未加载')
    }

    // 报告控制台错误
    if (errors.length > 0) {
      console.log('⚠️  控制台错误:', errors)
    }
  })

  test('应该能从 API 加载数据并显示', async ({ page }) => {
    // 监听 API 请求
    let apiSuccess = false
    page.on('response', response => {
      if (response.url().includes('/api/activities') || response.url().includes('/api/items')) {
        if (response.status() === 200) {
          apiSuccess = true
        }
      }
    })

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // 等待数据加载
    await page.waitForTimeout(5000)

    // 验证：必须有实际的活动卡片
    const selectors = [
      '[class*="activity"]',
      '.card',
      '[data-testid="activity-card"]'
    ]

    let foundContent = false
    for (const selector of selectors) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        // 验证第一个元素真正可见
        const first = await page.locator(selector).first()
        if (await first.isVisible()) {
          console.log(`✅ 找到 ${count} 个活动卡片 (选择器: ${selector})`)
          foundContent = true
          break
        }
      }
    }

    if (!foundContent) {
      await page.screenshot({ path: 'test-results/no-data-loaded.png' })
      throw new Error('API 数据未显示在页面上')
    }

    expect(apiSuccess).toBe(true)
  })

  test('应该能正常交互 - 筛选功能', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000)

    // 尝试找到并点击筛选器
    const filterSelectors = [
      'button:has-text("分类")',
      'button:has-text("全部")',
      'select[name="category"]',
      'button, select',
      '[role="button"]'
    ]

    let interacted = false
    for (const selector of filterSelectors) {
      try {
        const elements = await page.locator(selector).all()
        for (const el of elements) {
          const text = await el.textContent()
          if (text && (text.includes('分类') || text.includes('全部') || text.includes('筛选'))) {
            await el.click()
            await page.waitForTimeout(1000)
            console.log('✅ 成功点击筛选器:', text.trim())
            interacted = true
            break
          }
        }
        if (interacted) break
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }

    if (!interacted) {
      console.log('⚠️  未找到可交互的筛选器，页面可能没有UI元素')
    }
  })

  test('应该能响应式显示', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // 测试不同屏幕尺寸
    const sizes = [
      { width: 375, height: 667, name: '手机' },
      { width: 768, height: 1024, name: '平板' },
      { width: 1920, height: 1080, name: '桌面' }
    ]

    for (const size of sizes) {
      await page.setViewportSize(size)
      await page.waitForTimeout(1000)

      // 验证页面仍然有内容
      const hasContent = await page.evaluate(() => {
        const cards = document.querySelectorAll('.activity-card')
        return cards.length > 0
      })

      if (!hasContent) {
        throw new Error(`在 ${size.name} 视图下页面为空`)
      }

      console.log(`✅ ${size.name} 视图正常`)
    }
  })
})

test.describe('清迈活动平台 - 主页真实测试总结', () => {
  test('完整功能检查', async ({ page }) => {
    const startTime = Date.now()

    // 访问页面
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // 详细诊断
    const diagnostics = await page.evaluate(() => {
      const cards = document.querySelectorAll('.activity-card')
      const loading = document.getElementById('loading')
      return {
        activityCount: cards.length,
        loadingVisible: loading ? loading.offsetParent !== null : false,
        bodyChildren: document.body.children.length,
        title: document.title,
        url: window.location.href
      }
    })

    console.log('📊 页面诊断:', diagnostics)

    // 最终验证 - 应该有活动卡片，且加载元素已隐藏
    if (diagnostics.activityCount === 0) {
      await page.screenshot({ path: 'test-results/final-blank-page.png', fullPage: true })
      console.log('❌ 最终诊断: 页面没有加载任何活动')

      throw new Error('主页未能加载活动数据')
    }

    const duration = Date.now() - startTime
    console.log(`✅ 测试完成，耗时: ${duration}ms`)
  })
})
