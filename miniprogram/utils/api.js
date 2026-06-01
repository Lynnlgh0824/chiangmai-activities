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
  getActivities() {
    return request('/api/activities')
  },

  getActivity(id) {
    return request(`/api/activities/${id}`)
  },

  getGuide() {
    return request('/api/guide')
  },

  getVersion() {
    return request('/api/version')
  }
}
