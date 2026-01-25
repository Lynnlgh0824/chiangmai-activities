import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { getCategories } from './data/activities'
import './App.css'

// API 基础地址
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// API 客户端
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000
})

function App() {
  const [activities, setActivities] = useState([]) // 初始为空，从 API 获取
  const [loading, setLoading] = useState(true) // 显示加载状态
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [totalItems, setTotalItems] = useState(0)

  // 新增：主视图Tab状态（原型功能）
  const [mainViewMode, setMainViewMode] = useState('grid') // 'grid' (网格) 或 'calendar' (日历视图)

  // 原型筛选状态管理
  const [filterCategory, setFilterCategory] = useState('全部')
  const [filterPrice, setFilterPrice] = useState('全部')
  const [filterDay, setFilterDay] = useState(null) // 0-6 (周日到周六)，null表示全部

  const itemsPerPage = 6

  // 获取星期几名称
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  // 原型筛选功能 - 清除筛选
  const handleClearPrototypeFilter = (filterKey) => {
    if (filterKey === 'category') {
      setFilterCategory('全部')
    } else if (filterKey === 'price') {
      setFilterPrice('全部')
    } else if (filterKey === 'day') {
      setFilterDay(null)
    } else if (filterKey === 'all') {
      setFilterCategory('全部')
      setFilterPrice('全部')
      setFilterDay(null)
    }
  }

  // 原型筛选功能 - 应用筛选
  const applyPrototypeFilters = (activitiesToFilter) => {
    let result = activitiesToFilter

    // 分类筛选
    if (filterCategory !== '全部') {
      result = result.filter(activity => activity.category === filterCategory)
    }

    // 价格筛选
    if (filterPrice === '免费') {
      result = result.filter(activity =>
        activity.price === '免费' || activity.price.includes('免费')
      )
    } else if (filterPrice === '1500以下') {
      result = result.filter(activity => {
        const price = parseInt(activity.price.replace(/[^\d]/g, '')) || 0
        return !activity.price.includes('免费') && price < 1500
      })
    } else if (filterPrice === '1500以上') {
      result = result.filter(activity => {
        const price = parseInt(activity.price.replace(/[^\d]/g, '')) || 0
        return price >= 1500
      })
    }

    // 日期筛选（根据星期几）- 更宽松的匹配
    if (filterDay !== null) {
      result = result.filter(activity => {
        // 检查具体日期
        if (activity.date && activity.date !== '') {
          const date = new Date(activity.date)
          if (!isNaN(date.getTime())) {
            return date.getDay() === filterDay
          }
        }
        // 检查星期数组（用于每周重复的活动）
        if (activity.weekdays && activity.weekdays.length > 0) {
          return activity.weekdays.includes(dayNames[filterDay])
        }
        return false
      })
    }

    return result
  }

  const categories = getCategories()

  const fetchActivities = async () => {
    try {
      // 获取所有活动，不分页
      const response = await api.get('/activities', {
        params: {
          status: 'active',
          limit: 1000 // 获取所有活动
        }
      })
      setActivities(response.data.data)
      setTotalItems(response.data.pagination?.totalItems || response.data.data.length)
      console.log('已加载活动数量:', response.data.data.length)
      return true
    } catch (error) {
      console.error('获取活动数据失败:', error)
      setActivities([])
      setTotalItems(0)
      return false
    }
  }

  // 获取活动数据并初始化
  useEffect(() => {
    const init = async () => {
      await fetchActivities()
      setLoading(false)
    }
    init()
  }, [])

  // 翻页时滚动到顶部
  useEffect(() => {
    if (totalItems > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentPage])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCloseDetail = () => {
    setSelectedActivity(null)
  }

  const getCategoryColor = (category) => {
    const colors = {
      '瑜伽': '#FF6B6B',
      '冥想': '#4ECDC4',
      '户外探险': '#FFE66D',
      '文化艺术': '#95E1D3',
      '美食体验': '#F38181',
      '节庆活动': '#AA96DA',
      '其他': '#667eea'
    }
    return colors[category] || '#667eea'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) {
      return '随时可预约'
    }
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return '随时可预约'
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)

    const diffTime = targetDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // 获取星期几
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[targetDate.getDay()]
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dateStrFormatted = `${month}月${day}日`

    if (diffDays === 0) {
      return `今天 ${dateStrFormatted}`
    } else if (diffDays === 1) {
      return `明天 ${dateStrFormatted}`
    } else if (diffDays === -1) {
      return `昨天 ${dateStrFormatted}`
    } else if (diffDays > 1 && diffDays <= 7) {
      return `本周${weekday} ${dateStrFormatted}`
    } else if (diffDays < 0 && diffDays >= -7) {
      return `上周${weekday} ${dateStrFormatted}`
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }
  }

  const formatTime = (activity) => {
    if (activity.flexibleTime) {
      return activity.duration || '灵活时间'
    }
    return activity.time || ''
  }

  const getActivityImage = (activity) => {
    // 优先使用 images 数组
    if (activity.images && activity.images.length > 0) {
      const imgUrl = activity.images[0]
      // 验证图片URL是否有效
      if (imgUrl && (imgUrl.startsWith('http') || imgUrl.startsWith('/'))) {
        return imgUrl
      }
    }
    // 其次使用 image 字段（模拟数据）
    if (activity.image) {
      return activity.image
    }
    // 使用默认图片
    return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5'
  }

  // 获取响应式图片源
  const getImageSrcSet = (baseUrl) => {
    if (!baseUrl) return undefined
    // 如果是 Unsplash 图片，生成不同尺寸
    if (baseUrl.includes('unsplash.com')) {
      const separator = baseUrl.includes('?') ? '&' : '?'
      return {
        srcSet: `${baseUrl}${separator}w=400 400w, ${baseUrl}${separator}w=800 800w, ${baseUrl}${separator}w=1200 1200w`,
        sizes: '(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px'
      }
    }
    return undefined
  }

  const handleImageError = (e) => {
    // 图片加载失败时使用默认图片
    e.target.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=450&fit=crop'
  }

  // 图片加载状态管理
  const [imageLoadStatus, setImageLoadStatus] = useState({})

  const handleImageLoad = (activityId) => {
    setImageLoadStatus(prev => ({ ...prev, [activityId]: true }))
  }

  const handleImageLoadStart = (activityId) => {
    setImageLoadStatus(prev => ({ ...prev, [activityId]: false }))
  }

  if (loading && activities.length === 0) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  // 原型筛选功能 - 获取活动数量
  const filteredActivitiesForDisplay = useMemo(() => {
    return applyPrototypeFilters(activities)
  }, [activities, filterCategory, filterPrice, filterDay])

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <h1>✨ 清迈活动探索</h1>
          <p>发现泰北玫瑰城的精彩体验</p>
        </div>
        <div className="header-decoration"></div>
      </header>

      {/* 固定顶部筛选栏（原型功能） */}
      <div className="fixed-filter-bar">
        <div className="fixed-filter-container">
          {/* 筛选条件 */}
          <div className="filter-row">
            <div className="filter-group-inline">
              <span className="filter-label-inline">分类:</span>
              <div className="filter-chips-inline">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`filter-chip-yellow ${filterCategory === cat ? 'active' : ''}`}
                    onClick={() => setFilterCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group-inline">
              <span className="filter-label-inline">价格:</span>
              <div className="filter-chips-inline">
                {['全部', '免费', '1500以下', '1500以上'].map(price => (
                  <button
                    key={price}
                    className={`filter-chip-yellow ${filterPrice === price ? 'active' : ''}`}
                    onClick={() => setFilterPrice(price)}
                  >
                    {price === '全部' ? '全部' : (price === '免费' ? '🆓 免费' : (price === '1500以下' ? '💰 1500以下' : '💎 1500以上'))}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 活跃筛选标签 */}
          {(filterCategory !== '全部' || filterPrice !== '全部' || filterDay !== null) && (
            <div className="filter-tags-row">
              <div className="filter-tags">
                {filterCategory !== '全部' && (
                  <div className="filter-tag">
                    <span>分类: {filterCategory}</span>
                    <button onClick={() => handleClearPrototypeFilter('category')}>✕</button>
                  </div>
                )}
                {filterPrice !== '全部' && (
                  <div className="filter-tag">
                    <span>价格: {filterPrice}</span>
                    <button onClick={() => handleClearPrototypeFilter('price')}>✕</button>
                  </div>
                )}
                {filterDay !== null && (
                  <div className="filter-tag">
                    <span>日期: {dayNames[filterDay]}</span>
                    <button onClick={() => handleClearPrototypeFilter('day')}>✕</button>
                  </div>
                )}
                <button className="clear-all-btn" onClick={() => handleClearPrototypeFilter('all')}>
                  清除全部
                </button>
              </div>
            </div>
          )}

          {/* Tab切换和结果统计 */}
          <div className="tab-header-row">
            <div className="view-tabs">
              <button
                className={`tab-button ${mainViewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setMainViewMode('grid')}
              >
                📋 网格视图
              </button>
              <button
                className={`tab-button ${mainViewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setMainViewMode('calendar')}
              >
                📅 周视图
              </button>
              <button
                className={`tab-button ${mainViewMode === 'monthly' ? 'active' : ''}`}
                onClick={() => setMainViewMode('monthly')}
              >
                📆 月课表
              </button>
              <a
                href="/schedule"
                className="tab-button external-link"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                🔗 完整日历
              </a>
            </div>
            <div className="result-count">
              共 <span className="count-number">{filteredActivitiesForDisplay.length}</span> 个活动
              {process.env.NODE_ENV === 'development' && (
                <span style={{ fontSize: '12px', marginLeft: '10px', opacity: 0.7 }}>
                  (总数据: {activities.length})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '280px' }}>

        {/* 活动详情弹窗 */}
        {selectedActivity && (
          <div className="activity-detail-overlay" onClick={handleCloseDetail}>
            <div className="activity-detail-card" onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={handleCloseDetail}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
              </button>
              <div className="detail-header">
                <img
                  src={getActivityImage(selectedActivity)}
                  alt={selectedActivity.title}
                  className="detail-image"
                  onError={handleImageError}
                />
                <div className="detail-badge" style={{ backgroundColor: getCategoryColor(selectedActivity.category) }}>
                  {selectedActivity.category}
                </div>
              </div>
              <div className="detail-content">
                <h2>{selectedActivity.title}</h2>
                <div className="detail-price">{selectedActivity.price}</div>

                <div className="detail-info-grid">
                  <div className="info-item">
                    <span className="info-icon">📅</span>
                    <span className="info-value">{formatDate(selectedActivity.date)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">⏰</span>
                    <span className="info-value">{formatTime(selectedActivity)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">📍</span>
                    <span className="info-value">{selectedActivity.location}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">⏱️</span>
                    <span className="info-value">{selectedActivity.duration}</span>
                  </div>
                </div>

                {selectedActivity.maxParticipants > 0 && (
                  <div className="detail-participants">
                    <div className="participants-bar">
                      <div
                        className="participants-fill"
                        style={{
                          width: `${(selectedActivity.currentParticipants / selectedActivity.maxParticipants) * 100}%`,
                          backgroundColor: getCategoryColor(selectedActivity.category)
                        }}
                      ></div>
                    </div>
                    <span>已报名 {selectedActivity.currentParticipants}/{selectedActivity.maxParticipants}</span>
                  </div>
                )}

                <div className="detail-description">
                  <h4>活动介绍</h4>
                  <p>{selectedActivity.description}</p>
                </div>

                {selectedActivity.source?.url && (
                  <a
                    href={selectedActivity.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="book-button"
                  >
                    <span>查看详情</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 主视图：网格、日历或月课表 */}
        {mainViewMode === 'grid' ? (
          // 网格视图
          filteredActivitiesForDisplay.length > 0 ? (
            <div className="activities-grid">
              {filteredActivitiesForDisplay
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(activity => (
                <div
                  key={activity.id || activity._id}
                  className="activity-card"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="card-image-container">
                    {!imageLoadStatus[activity.id || activity._id] && (
                      <div className="image-placeholder">
                        <div className="placeholder-spinner"></div>
                      </div>
                    )}
                    <img
                      src={getActivityImage(activity)}
                      alt={activity.title}
                      className={`activity-image ${imageLoadStatus[activity.id || activity._id] ? 'loaded' : 'loading'}`}
                      onError={handleImageError}
                      onLoadStart={() => handleImageLoadStart(activity.id || activity._id)}
                      onLoad={() => handleImageLoad(activity.id || activity._id)}
                      loading="lazy"
                      decoding="async"
                      {...getImageSrcSet(getActivityImage(activity))}
                    />
                    <div
                      className="category-badge"
                      style={{ backgroundColor: getCategoryColor(activity.category) }}
                    >
                      {activity.category}
                    </div>
                  </div>
                  <div className="card-content">
                    <h3>{activity.title}</h3>
                    <div className="card-meta">
                      <div className="meta-item">
                        <span>📅</span>
                        <span>{formatDate(activity.date)}</span>
                      </div>
                      <div className="meta-item">
                        <span>⏰</span>
                        <span>{formatTime(activity)}</span>
                      </div>
                    </div>
                    <div className="card-location">📍 {activity.location}</div>
                    <div className="card-footer">
                      <div className="price-tag">{activity.price}</div>
                      {activity.maxParticipants > 0 && (
                        <div className="participant-status">
                          <span className="status-dot"></span>
                          <span>{activity.currentParticipants}/{activity.maxParticipants}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>没有找到符合条件的活动</h3>
              <p>试试调整筛选条件</p>
            </div>
          )
        ) : mainViewMode === 'calendar' ? (
          // 日历视图（原型功能）
          <div className="main-calendar-view">
            <div className="calendar-grid">
              {dayNames.map((dayName, dayIndex) => {
                const dayActivities = filteredActivitiesForDisplay.filter(activity => {
                  // 检查具体日期
                  if (activity.date) {
                    const date = new Date(activity.date)
                    if (!isNaN(date.getTime())) {
                      return date.getDay() === dayIndex
                    }
                  }
                  // 检查星期数组（每周重复的活动）
                  if (activity.weekdays && activity.weekdays.length > 0) {
                    return activity.weekdays.includes(dayName)
                  }
                  return false
                })

                const isDaySelected = filterDay === dayIndex
                const hasActivities = dayActivities.length > 0

                return (
                  <div
                    key={dayName}
                    className={`calendar-day-cell ${hasActivities ? 'has-activities' : ''} ${isDaySelected ? 'selected' : ''} ${filterDay !== null && !isDaySelected ? 'dimmed' : ''}`}
                    onClick={() => filterDay === dayIndex ? handleClearPrototypeFilter('day') : setFilterDay(dayIndex)}
                  >
                    <div className="day-header">
                      <div className="day-name">{dayName}</div>
                      <div className="day-count">{dayActivities.length}</div>
                    </div>
                    <div className="day-activities-list">
                      {dayActivities.slice(0, 5).map(activity => (
                        <div
                          key={activity.id || activity._id}
                          className="mini-activity-chip"
                          style={{ borderLeftColor: getCategoryColor(activity.category) }}
                        >
                          <div className="chip-time">{activity.time || formatTime(activity)}</div>
                          <div className="chip-title">{activity.title}</div>
                        </div>
                      ))}
                      {dayActivities.length > 5 && (
                        <div className="more-activities">
                          还有 {dayActivities.length - 5} 个活动...
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : mainViewMode === 'monthly' ? (
          // 月课表视图
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📆</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>月课表</h2>
            <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>
              查看完整月度活动安排
            </p>
            <a
              href="/schedule"
              style={{
                display: 'inline-block',
                padding: '15px 40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '30px',
                fontSize: '1.1rem',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              前往完整日历页面 →
            </a>
            <div style={{ marginTop: '40px', padding: '30px', background: '#f8f9fa', borderRadius: '12px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
              <h3 style={{ marginBottom: '15px', color: '#667eea' }}>💡 功能说明</h3>
              <div style={{ textAlign: 'left', lineHeight: '1.8' }}>
                <p>✨ 周视图：查看本周活动安排</p>
                <p>📋 列表视图：查看所有活动列表</p>
                <p>📆 月课表：查看月度活动安排</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-button prev-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"></path>
              </svg>
            </button>

            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`page-number ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-button next-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"></path>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
