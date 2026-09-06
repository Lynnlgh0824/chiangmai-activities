const cache = require('./utils/cache')

// =====================================================
// 数据源（v2：CDN 化，免备案、免服务器运维）
// =====================================================
// 本地开发（开发者工具）：http://localhost:4000（Express 后端，提供完整 /api/*）
// 体验版/正式版：jsDelivr CDN（GitHub 仓库 data/items.json + data/guide.json）
//   - jsDelivr 自动 HTTPS、自动 CDN 缓存
//   - 用 @main 跟随 main 分支最新；发新版前可改为 @commit-hash 强制失效缓存
//   - 国内可达，海外更快；不需要任何 API key
const PROD_DATA = 'https://cdn.jsdelivr.net/gh/Lynnlgh0824/chiengmai-activities@main/data'
const LOCAL_DATA = 'http://localhost:4000'

App({
  globalData: {
    // 微信小程序里 __wxConfig 不存在；正确做法是 wx.getAccountInfoSync()
    // develop=本地开发（模拟器/预览），trial=体验版，release=正式版
    apiBase: (() => {
      try {
        const info = wx.getAccountInfoSync && wx.getAccountInfoSync()
        const env = info && info.miniProgram && info.miniProgram.envVersion
        return env === 'develop' ? LOCAL_DATA : PROD_DATA
      } catch (e) {
        // 极少数旧基础库没 getAccountInfoSync → 默认走本地，方便开发者工具调试
        return LOCAL_DATA
      }
    })(),
    activities: [],
    categories: [],
    _readyCallbacks: [],
    _ready: false
  },

  onLaunch() {
    console.log('[app] apiBase =', this.globalData.apiBase, 'envVersion =',
      (wx.getAccountInfoSync && wx.getAccountInfoSync().miniProgram.envVersion))
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
    // 1) 缓存优先 → 首屏不白屏
    const cached = cache.get('activities')
    if (cached && cached.length > 0) {
      this.globalData.activities = cached
      this._buildCategories(cached)
      this._notifyReady()
    }

    // 2) 拉新版数据（CDN 上文件本身就是版本，无需再调 /api/version）
    this._fetchActivities()
  },

  _fetchActivities() {
    wx.request({
      url: `${this.globalData.apiBase}/items.json`,
      timeout: 10000,
      success: (res) => {
        if (res.statusCode !== 200) {
          console.warn('[app] /items.json HTTP', res.statusCode)
          return
        }

        // 兼容两种格式：
        //   - 直接数组: [...]
        //   - 包装对象: { success, data: [...], pagination }
        const raw = res.data
        const items = Array.isArray(raw) ? raw : (raw && raw.data) || []
        if (!items.length) {
          console.warn('[app] /items.json 解析后为空数组')
          return
        }

        this.globalData.activities = items
        this._buildCategories(items)
        cache.set('activities', items)
        this._notifyReady()
        console.log('[app] activities loaded:', items.length, '条')
      },
      fail: (err) => {
        console.warn('[app] /items.json 请求失败:', err && err.errMsg)
        // 失败时缓存已兜底，_ready 早已置 true
      }
    })
  },

  _buildCategories(items) {
    const cats = items.map(i => i.category).filter(Boolean)
    const unique = [...new Set(cats)]
    this.globalData.categories = ['全部', ...unique]
  }
})
