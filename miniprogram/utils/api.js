// =====================================================
// utils/api.js（v2：CDN 化）
// =====================================================
// 历史：原 Express 后端 /api/activities → 现 jsDelivr CDN /items.json
// 数据已经在 app.js 启动时拉到 globalData.activities，这里只做轻量代理
const app = getApp()

function request(path) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBase}${path}`,
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: reject
    })
  })
}

module.exports = {
  /**
   * 活动列表：直接从内存里取（避免重复 HTTP 请求）
   * 等价于旧 API get('/api/activities')
   */
  getActivities() {
    return Promise.resolve(app.globalData.activities || [])
  },

  /**
   * 单个活动详情：从内存里找
   * 等价于旧 API get('/api/activities/:id')
   */
  getActivity(id) {
    const items = app.globalData.activities || []
    return Promise.resolve(
      items.find(i => i.id === id || i.activityNumber === String(id) || i.activityNumber === id) || null
    )
  },

  /**
   * 攻略：拉 /guide.json（content 字段是 HTML 字符串）
   * 等价于旧 API get('/api/guide')
   */
  getGuide() {
    return request('/guide.json')
  },

  /**
   * 版本号：CDN 上 URL 自带版本，无需远程调用
   */
  getVersion() {
    return Promise.resolve('1.0.9')
  }
}
