const CACHE_PREFIX = 'gocnx_'
const DEFAULT_TTL = 6 * 60 * 60 * 1000 // 6 hours

module.exports = {
  set(key, data, ttl = DEFAULT_TTL) {
    const record = {
      data,
      expire: Date.now() + ttl
    }
    wx.setStorageSync(`${CACHE_PREFIX}${key}`, record)
  },

  get(key) {
    const record = wx.getStorageSync(`${CACHE_PREFIX}${key}`)
    if (!record) return null
    if (Date.now() > record.expire) {
      wx.removeStorageSync(`${CACHE_PREFIX}${key}`)
      return null
    }
    return record.data
  },

  remove(key) {
    wx.removeStorageSync(`${CACHE_PREFIX}${key}`)
  },

  clear() {
    const res = wx.getStorageInfoSync()
    res.keys
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => wx.removeStorageSync(k))
  }
}
