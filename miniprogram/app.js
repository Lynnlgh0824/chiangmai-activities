const cache = require('./utils/cache')

App({
  globalData: {
    apiBase: 'http://localhost:4000',
    activities: [],
    categories: [],
    _readyCallbacks: [],
    _ready: false
  },

  onLaunch() {
    this.loadActivities()
  },

  /**
   * 注册数据就绪回调，避免页面无限轮询
   */
  onActivitiesReady(callback) {
    if (this.globalData._ready) {
      callback()
    } else {
      this.globalData._readyCallbacks.push(callback)
    }
  },

  _notifyReady() {
    this.globalData._ready = true
    this.globalData._readyCallbacks.forEach(cb => cb())
    this.globalData._readyCallbacks = []
  },

  loadActivities() {
    // 先尝试缓存
    const cached = cache.get('activities')
    if (cached && cached.length > 0) {
      this.globalData.activities = cached
      this._buildCategories(cached)
      this._notifyReady()
    }

    wx.request({
      url: `${this.globalData.apiBase}/api/version`,
      success: (res) => {
        if (res.statusCode !== 200 || !res.data || !res.data.version) {
          // 版本接口异常，如果有缓存就用缓存
          if (!this.globalData._ready && cached) {
            this.globalData.activities = cached
            this._buildCategories(cached)
            this._notifyReady()
          }
          return
        }

        const remoteVersion = res.data.version
        const cachedVersion = cache.get('data_version')

        if (cached && cachedVersion === remoteVersion) {
          // 缓存版本一致，已在上面使用
          if (!this.globalData._ready) {
            this.globalData.activities = cached
            this._buildCategories(cached)
            this._notifyReady()
          }
        } else {
          this._fetchActivities(remoteVersion)
        }
      },
      fail: () => {
        // 网络失败，使用缓存
        if (!this.globalData._ready && cached) {
          this.globalData.activities = cached
          this._buildCategories(cached)
          this._notifyReady()
        }
      }
    })
  },

  _fetchActivities(version) {
    wx.request({
      url: `${this.globalData.apiBase}/api/activities`,
      success: (res) => {
        if (res.statusCode !== 200) return

        // API 返回 { success, data: [...], pagination }，需要提取 data 数组
        const raw = res.data
        const items = Array.isArray(raw) ? raw : (raw.data || [])
        if (!items.length) return
        this.globalData.activities = items
        this._buildCategories(items)
        cache.set('activities', items)
        cache.set('data_version', version)
        this._notifyReady()
      },
      fail: () => {
        // 拉取失败，如果还没有数据就用旧缓存
        if (!this.globalData._ready) {
          const fallback = cache.get('activities')
          if (fallback) {
            this.globalData.activities = fallback
            this._buildCategories(fallback)
            this._notifyReady()
          }
        }
      }
    })
  },

  _buildCategories(items) {
    const cats = items.map(i => i.category).filter(Boolean)
    const unique = [...new Set(cats)]
    this.globalData.categories = ['全部', ...unique]
  }
})
