const app = getApp()

const PRICE_OPTIONS = ['全部', '免费', '<500泰铢', '<1000泰铢', '<1500泰铢', '>1500泰铢']
const WEEKDAY_OPTIONS = ['全部', '周一', '周二', '周三', '周四', '周五', '周六', '周日', '灵活时间']

Page({
  data: {
    items: [],
    filteredItems: [],
    categories: [],
    currentCategory: '全部',
    currentPrice: '全部',
    currentWeekday: '全部',
    currentSort: 'default', // default | price-asc | price-desc
    keyword: '',
    loading: true,
    error: false,
    priceOptions: PRICE_OPTIONS,
    weekdayOptions: WEEKDAY_OPTIONS,
    showFilters: false,     // 筛选面板展开状态
    activeFilterCount: 0,   // 当前激活的筛选数量
    hasFlexibleTime: false  // 是否有灵活时间活动
  },

  _debounceTimer: null,

  onLoad() {
    this.loadData()
  },

  onShow() {
    if (app.globalData.categories.length > 0 && this.data.categories.length === 0) {
      this.setData({ categories: app.globalData.categories })
    }
  },

  onPullDownRefresh() {
    this.setData({ loading: true, error: false })
    app.globalData._ready = false
    app.loadActivities()
    app.onActivitiesReady(() => {
      this._onDataReady()
      wx.stopPullDownRefresh()
    })
    setTimeout(() => {
      if (this.data.loading) {
        this.setData({ loading: false, error: true })
        wx.stopPullDownRefresh()
      }
    }, 8000)
  },

  loadData() {
    app.onActivitiesReady(() => this._onDataReady())
    setTimeout(() => {
      if (this.data.loading && !app.globalData._ready) {
        this.setData({ loading: false, error: true })
      }
    }, 5000)
  },

  _onDataReady() {
    const items = app.globalData.activities
    const hasFlexibleTime = items.some(i => i.flexibleTime === '是' || i.time === '灵活时间')
    this.setData({
      items,
      filteredItems: items,
      categories: app.globalData.categories,
      loading: false,
      error: false,
      hasFlexibleTime
    })
    this._filter()
  },

  onRetry() {
    this.setData({ loading: true, error: false })
    app.globalData._ready = false
    app.loadActivities()
    this.loadData()
  },

  // --- 搜索（带防抖）---
  onSearch(e) {
    const keyword = e.detail.value
    this.setData({ keyword })
    if (this._debounceTimer) clearTimeout(this._debounceTimer)
    this._debounceTimer = setTimeout(() => this._filter(), 300)
  },

  onClearSearch() {
    this.setData({ keyword: '' })
    this._filter()
  },

  // --- 分类筛选 ---
  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ currentCategory: category })
    this._filter()
  },

  // --- 价格筛选 ---
  onPriceTap(e) {
    const price = e.currentTarget.dataset.price
    this.setData({ currentPrice: price })
    this._filter()
  },

  // --- 星期筛选 ---
  onWeekdayTap(e) {
    const weekday = e.currentTarget.dataset.weekday
    this.setData({ currentWeekday: weekday })
    this._filter()
  },

  // --- 排序 ---
  onSortTap() {
    const sorts = ['default', 'price-asc', 'price-desc']
    const labels = ['默认排序', '价格↑', '价格↓']
    wx.showActionSheet({
      itemList: labels,
      success: (res) => {
        this.setData({ currentSort: sorts[res.tapIndex] })
        this._filter()
      }
    })
  },

  // --- 展开/收起筛选面板 ---
  onToggleFilters() {
    this.setData({ showFilters: !this.data.showFilters })
  },

  // --- 重置所有筛选 ---
  onResetFilters() {
    this.setData({
      currentCategory: '全部',
      currentPrice: '全部',
      currentWeekday: '全部',
      currentSort: 'default',
      keyword: ''
    })
    this._filter()
  },

  // --- 卡片点击 ---
  onCardTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  // --- 核心过滤逻辑 ---
  _filter() {
    const { items, currentCategory, currentPrice, currentWeekday, currentSort, keyword } = this.data
    let result = [...items]

    // 1. 分类筛选
    if (currentCategory !== '全部') {
      result = result.filter(i => i.category === currentCategory)
    }

    // 2. 价格筛选
    if (currentPrice !== '全部') {
      result = result.filter(i => {
        const min = i.minPrice || this._parsePrice(i.price)
        if (currentPrice === '免费') return min === 0 || (i.price && i.price.includes('免费'))
        if (currentPrice === '<500泰铢') return min > 0 && min < 500
        if (currentPrice === '<1000泰铢') return min > 0 && min < 1000
        if (currentPrice === '<1500泰铢') return min > 0 && min < 1500
        if (currentPrice === '>1500泰铢') return min >= 1500
        return true
      })
    }

    // 3. 星期筛选
    if (currentWeekday !== '全部') {
      if (currentWeekday === '灵活时间') {
        result = result.filter(i => i.flexibleTime === '是' || i.time === '灵活时间')
      } else {
        result = result.filter(i => {
          if (!i.weekdays) return false
          const days = Array.isArray(i.weekdays) ? i.weekdays : [i.weekdays]
          return days.some(d => d.includes(currentWeekday))
        })
      }
    }

    // 4. 关键词搜索
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      result = result.filter(i =>
        (i.title && i.title.toLowerCase().includes(kw)) ||
        (i.location && i.location.toLowerCase().includes(kw)) ||
        (i.description && i.description.toLowerCase().includes(kw))
      )
    }

    // 5. 排序
    if (currentSort === 'price-asc') {
      result.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0))
    } else if (currentSort === 'price-desc') {
      result.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0))
    }

    // 计算激活的筛选数量
    let activeFilterCount = 0
    if (currentCategory !== '全部') activeFilterCount++
    if (currentPrice !== '全部') activeFilterCount++
    if (currentWeekday !== '全部') activeFilterCount++

    this.setData({ filteredItems: result, activeFilterCount })
  },

  _parsePrice(priceStr) {
    if (!priceStr) return 0
    if (priceStr.includes('免费')) return 0
    const match = priceStr.match(/(\d+)/)
    return match ? parseInt(match[1]) : 0
  },

  onShareAppMessage() {
    return {
      title: '清迈活动指南 — 发现清迈好玩的事',
      path: '/pages/index/index'
    }
  }
})
