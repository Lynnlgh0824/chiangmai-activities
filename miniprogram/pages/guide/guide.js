const api = require('../../utils/api')
const cache = require('../../utils/cache')

Page({
  data: {
    sections: [],
    expandedIndex: -1,
    loading: true,
    error: false
  },

  onLoad() {
    this.loadGuide()
  },

  onPullDownRefresh() {
    cache.remove('guide')
    this.setData({ loading: true, error: false })
    this._fetchGuide()
  },

  loadGuide() {
    const cached = cache.get('guide')
    if (cached) {
      this._parseGuide(cached)
      return
    }
    this._fetchGuide()
  },

  _fetchGuide() {
    api.getGuide().then(res => {
      const data = res.data || res
      cache.set('guide', data)
      this._parseGuide(data)
      wx.stopPullDownRefresh()
    }).catch(() => {
      this.setData({ loading: false, error: true })
      wx.stopPullDownRefresh()
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  _parseGuide(data) {
    const content = (typeof data === 'string') ? data : (data.content || '')
    if (!content) {
      this.setData({ sections: [], loading: false })
      return
    }
    const sections = this._splitIntoSections(content)
    this.setData({ sections, loading: false })
  },

  /**
   * 将 HTML 按 <h1> 标签拆分为章节，每章提取标题和内容文本
   */
  _splitIntoSections(html) {
    const parts = html.split(/<h1[^>]*>/i)
    const icons = ['✈️', '🛂', '🛬', '📱', '🚗', '🏥', '🇹🇭', '🍜', '💱', '📌']
    const sections = []

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]
      const closeIdx = part.search(/<\/h1>/i)
      if (closeIdx === -1) continue

      const rawTitle = part.substring(0, closeIdx)
      const title = this._stripTags(rawTitle).trim()
      const body = part.substring(closeIdx + 5)

      if (!title) continue

      // 按 <h3> 拆分子章节，保留结构
      const content = this._formatBody(body)

      sections.push({
        icon: icons[i - 1] || '📌',
        title,
        content
      })
    }

    return sections
  },

  /**
   * 格式化章节正文：h3→粗体标题，li→列表项，其余去标签
   */
  _formatBody(body) {
    let text = body

    // <h3> 标题 → 换行加粗
    text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n$1\n')
    // <li> → 换行 + 圆点
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '\n• $1')
    // <br> → 换行
    text = text.replace(/<br\s*\/?>/gi, '\n')
    // <p> → 换行
    text = text.replace(/<\/p>/gi, '\n')
    // <hr> → 分隔线
    text = text.replace(/<hr\s*\/?>/gi, '\n———\n')
    // 去掉剩余 HTML 标签
    text = this._stripTags(text)
    // 清理多余空行（保留最多一个）
    text = text.replace(/\n{3,}/g, '\n\n')
    // 去除首尾空白
    text = text.trim()

    return text
  },

  /**
   * 去除所有 HTML 标签，解码常见实体
   */
  _stripTags(html) {
    return html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  },

  onToggle(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      expandedIndex: this.data.expandedIndex === index ? -1 : index
    })
  },

  onRetry() {
    this.setData({ loading: true, error: false })
    this._fetchGuide()
  },

  onShareAppMessage() {
    return {
      title: '清迈旅行攻略 — 出发前必看',
      path: '/pages/guide/guide'
    }
  }
})
