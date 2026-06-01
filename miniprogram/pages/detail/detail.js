const app = getApp()

Page({
  data: {
    activity: null,
    formattedDesc: [],
    loading: true
  },

  onLoad(options) {
    const { id } = options
    const items = app.globalData.activities
    const activity = items.find(i => i.id === id)

    if (activity) {
      this._setActivity(activity)
    } else {
      const api = require('../../utils/api')
      api.getActivity(id).then(res => {
        this._setActivity(res.data || res)
      }).catch(() => {
        wx.showToast({ title: '活动不存在', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1500)
      })
    }
  },

  _setActivity(activity) {
    const formattedDesc = this._formatDescription(activity.description || '')
    this.setData({ activity, formattedDesc, loading: false })
    wx.setNavigationBarTitle({ title: activity.title })
  },

  /**
   * 格式化描述文本：识别关键段落，添加 emoji 图标
   */
  _formatDescription(desc) {
    if (!desc) return []

    // 清理文本
    let text = desc
      .replace(/注意事项：注意事项：/g, '注意事项：')
      .replace(/[！]{3,}/g, '！')
      .replace(/[!]{3,}/g, '！')
      .trim()

    // 已在上方信息栏展示的字段，从描述中去除
    const skipPatterns = [
      /时间[：:].+/,
      /价格[：:].+/,
      /地点[：:].+/,
      /地址[：:].+/,
      /费用[：:].*(?:泰铢|铢|人民币|元)/,
    ]

    const lines = text.split(/\n/).filter(line => {
      const trimmed = line.trim()
      if (!trimmed) return false
      return !skipPatterns.some(p => p.test(trimmed))
    })

    // 识别带 emoji 标注的段落
    const iconMap = {
      '适合人群': '👥',
      '活动特点': '✨',
      '课程周期': '📚',
      '语言': '🌐',
      '注意事项': '⚠️',
      '预约': '📋',
      '亮点': '🌟',
    }

    return lines.map(line => {
      const trimmed = line.trim()
      for (const [keyword, icon] of Object.entries(iconMap)) {
        if (trimmed.startsWith(keyword) || trimmed.includes(keyword + '：') || trimmed.includes(keyword + ':')) {
          return { icon, text: trimmed, highlight: true }
        }
      }
      return { icon: '', text: trimmed, highlight: false }
    })
  },

  onLocationTap() {
    const { activity } = this.data
    if (!activity || !activity.location) return

    if (activity.latitude && activity.longitude) {
      wx.openLocation({
        latitude: Number(activity.latitude),
        longitude: Number(activity.longitude),
        name: activity.title,
        address: activity.location
      })
    } else {
      wx.showActionSheet({
        itemList: ['复制地点名称', '复制完整地址'],
        success(res) {
          const text = res.tapIndex === 0
            ? activity.location
            : `${activity.title} - ${activity.location}`
          wx.setClipboardData({
            data: text,
            success() {
              wx.showToast({ title: '已复制，可粘贴到地图App', icon: 'none' })
            }
          })
        }
      })
    }
  },

  onSourceTap() {
    const url = this.data.activity.source && this.data.activity.source.url
    if (url) {
      wx.setClipboardData({
        data: url,
        success() {
          wx.showToast({ title: '链接已复制到剪贴板', icon: 'none' })
        }
      })
    }
  },

  onShareAppMessage() {
    const { activity } = this.data
    return {
      title: `${activity.title} — 清迈活动指南`,
      path: `/pages/detail/detail?id=${activity.id}`
    }
  }
})
