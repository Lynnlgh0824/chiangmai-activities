import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { activitiesData, getCategories } from './data/activities'
import { weeklyScheduleData, dayNames } from './data/weeklySchedule'
import './App.css'

// API 基础地址
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// API 客户端
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000
})

function App() {
  const [activities, setActivities] = useState(activitiesData) // 默认使用模拟数据
  const [loading, setLoading] = useState(false) // 不显示加载，直接展示数据
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [totalItems, setTotalItems] = useState(0)
  const [activeTab, setActiveTab] = useState(0) // 0=日历视图, 1=列表视图
  const itemsPerPage = 6

  const categories = getCategories()

  // 获取活动数据
  useEffect(() => {
    fetchActivities()
  }, [])

  // 当筛选条件改变时重新获取数据（如果使用 API）
  useEffect(() => {
    // 只有在使用 API 时才在翻页时重新获取
    // 本地筛选由 useMemo 自动处理
    if (totalItems > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentPage, sortBy])

  const fetchActivities = async () => {
    // 先尝试从 API 获取数据
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder: 'asc',
        status: 'active'
      }

      // 添加筛选参数
      if (selectedCategory !== '全部') {
        params.category = selectedCategory
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      // 价格筛选
      if (priceRange === 'free') {
        params.priceMin = 0
        params.priceMax = 0
      } else if (priceRange === 'low') {
        params.priceMax = 1500
      } else if (priceRange === 'high') {
        params.priceMin = 1500
      }

      const response = await api.get('/activities', { params })
      setActivities(response.data.data)
      setTotalItems(response.data.pagination?.totalItems || 0)
      return true
    } catch (error) {
      console.log('API 不可用，使用模拟数据')
      // API 不可用时回退到模拟数据
      setActivities(activitiesData)
      setTotalItems(activitiesData.length)
      return false
    }
  }

  // 初始化时检查 API 是否可用
  useEffect(() => {
    fetchActivities().then(() => setLoading(false))
  }, [])

  // 本地过滤（用于实时搜索）
  const filteredActivities = useMemo(() => {
    let result = activities

    // 分类筛选
    if (selectedCategory !== '全部') {
      result = result.filter(activity => activity.category === selectedCategory)
    }

    // 价格筛选
    if (priceRange === 'free') {
      result = result.filter(activity =>
        activity.price === '免费' || activity.price.includes('免费')
      )
    } else if (priceRange === 'low') {
      result = result.filter(activity => {
        const price = parseInt(activity.price.replace(/[^\d]/g, '')) || 0
        return !activity.price.includes('免费') && price < 1500
      })
    } else if (priceRange === 'high') {
      result = result.filter(activity => {
        const price = parseInt(activity.price.replace(/[^\d]/g, '')) || 0
        return price >= 1500
      })
    }

    // 搜索
    if (searchTerm) {
      result = result.filter(activity =>
        activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 排序
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.date) - new Date(b.date)
      } else if (sortBy === 'price-low') {
        const priceA = parseInt(a.price.replace(/[^\d]/g, '')) || 0
        const priceB = parseInt(b.price.replace(/[^\d]/g, '')) || 0
        return priceA - priceB
      } else if (sortBy === 'price-high') {
        const priceA = parseInt(a.price.replace(/[^\d]/g, '')) || 0
        const priceB = parseInt(b.price.replace(/[^\d]/g, '')) || 0
        return priceB - priceA
      }
      return 0
    })

    return result
  }, [activities, searchTerm, selectedCategory, priceRange, sortBy])

  // 分页计算
  const totalPages = Math.ceil(totalItems / itemsPerPage) || Math.ceil(filteredActivities.length / itemsPerPage)

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handlePriceRangeChange = (range) => {
    setPriceRange(range)
    setCurrentPage(1)
  }

  const handleSortChange = (sort) => {
    setSortBy(sort)
  }

  // 清除筛选
  const handleClearFilter = (filterType) => {
    if (filterType === 'category') {
      setSelectedCategory('全部')
    } else if (filterType === 'price') {
      setPriceRange('all')
    } else if (filterType === 'search') {
      setSearchTerm('')
    } else if (filterType === 'all') {
      setSelectedCategory('全部')
      setPriceRange('all')
      setSearchTerm('')
    }
    setCurrentPage(1)
  }

  // 获取当前筛选条件
  const getActiveFilters = () => {
    const filters = []
    if (selectedCategory !== '全部') {
      filters.push({ type: 'category', label: selectedCategory, key: '分类' })
    }
    if (priceRange !== 'all') {
      const priceLabels = {
        'free': '免费',
        'low': '1500฿以下',
        'high': '1500฿以上'
      }
      filters.push({ type: 'price', label: priceLabels[priceRange], key: '价格' })
    }
    if (searchTerm) {
      filters.push({ type: 'search', label: searchTerm, key: '搜索' })
    }
    return filters
  }

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

  // 渲染列表视图
  const renderListView = () => {
    const allActivities = weeklyScheduleData.flatMap(week => week.activities)

    return (
      <div className="schedule-list-compact">
        {allActivities.map(activity => (
          <div key={activity.id} className="schedule-item-compact">
            <div className="activity-info">
              <div className="activity-header-row">
                <span
                  className="category-tag-mini"
                  style={{ backgroundColor: getCategoryColor(activity.category) }}
                >
                  {activity.category}
                </span>
                <span className="activity-time-mini">{activity.time}</span>
              </div>
              <h4 className="activity-title-mini">{activity.title}</h4>
              <div className="activity-location-mini">📍 {activity.location}</div>
              <div className="activity-price-mini">{activity.price}</div>
            </div>
            {activity.enrolled && activity.capacity && (
              <div className="enrollment-mini">
                {activity.enrolled}/{activity.capacity}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // 渲染日历视图
  const renderCalendarView = () => {
    return (
      <div className="schedule-calendar-compact">
        {weeklyScheduleData.map((week, weekIndex) => (
          <div key={weekIndex} className="week-section">
            <div className="week-title">{week.week}</div>
            <div className="days-grid">
              {dayNames.map((dayName, dayIndex) => {
                const dayActivities = week.activities.filter(a => a.dayOfWeek === dayIndex)
                return (
                  <div
                    key={dayName}
                    className={`day-cell ${dayActivities.length > 0 ? 'has-activities' : ''}`}
                  >
                    <div className="day-name">{dayName}</div>
                    {dayActivities.map(activity => (
                      <div
                        key={activity.id}
                        className="activity-chip"
                        style={{ borderLeftColor: getCategoryColor(activity.category) }}
                        onClick={() => handleActivityClick(activity)}
                      >
                        <div className="chip-time">{activity.time}</div>
                        <div className="chip-title">{activity.title}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
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

  return (
    <div className="app">
      {/* 紧凑型头部 - 标题和搜索在同一行 */}
      <header className="header-compact">
        <h1>✨ 清迈活动</h1>

        {/* 搜索栏 */}
        <div className="search-section">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索活动、地点、关键词..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          <button className="search-btn">搜索</button>
        </div>
      </header>

      {/* 筛选区域（固定在顶部） */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <span className="filter-label">分类:</span>
            <div className="filter-chips">
              {categories.map(category => (
                <button
                  key={category}
                  className={`filter-chip ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">价格:</span>
            <div className="filter-chips">
              <button
                className={`filter-chip ${priceRange === 'all' ? 'active' : ''}`}
                onClick={() => handlePriceRangeChange('all')}
              >
                全部
              </button>
              <button
                className={`filter-chip ${priceRange === 'free' ? 'active' : ''}`}
                onClick={() => handlePriceRangeChange('free')}
              >
                免费
              </button>
              <button
                className={`filter-chip ${priceRange === 'low' ? 'active' : ''}`}
                onClick={() => handlePriceRangeChange('low')}
              >
                1500฿↓
              </button>
              <button
                className={`filter-chip ${priceRange === 'high' ? 'active' : ''}`}
                onClick={() => handlePriceRangeChange('high')}
              >
                1500฿↑
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选条件标签 */}
      {getActiveFilters().length > 0 && (
        <div className="active-filters show">
          {getActiveFilters().map(filter => (
            <div key={filter.type} className="filter-tag">
              {filter.key}: {filter.label}
              <button onClick={() => handleClearFilter(filter.type)}>✕</button>
            </div>
          ))}
          <button className="clear-all-btn" onClick={() => handleClearFilter('all')}>
            清除全部
          </button>
        </div>
      )}

      {/* Tab导航 */}
      <div className="tabs-nav">
        <div
          className={`tab-item ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => setActiveTab(0)}
        >
          <span className="tab-icon">📅</span>
          <span>日历视图</span>
        </div>
        <div
          className={`tab-item ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => setActiveTab(1)}
        >
          <span className="tab-icon">📋</span>
          <span>列表视图</span>
        </div>
      </div>

      {/* Tab内容 */}
      <div className="tab-content">
        {/* 日历Tab */}
        <div className={`tab-pane ${activeTab === 0 ? 'active' : ''}`}>
          {renderCalendarView()}
        </div>

        {/* 列表Tab */}
        <div className={`tab-pane ${activeTab === 1 ? 'active' : ''}`}>
          {/* 筛选提示信息 */}
          {getActiveFilters().length > 0 && (
            <div className="filter-info-banner">
              <div className="filter-info-content">
                <span className="filter-info-icon">🔍</span>
                <span className="filter-info-text">
                  已应用 <strong>{getActiveFilters().length}</strong> 个筛选条件，
                  找到 <strong>{filteredActivities.length}</strong> 个活动
                </span>
              </div>
            </div>
          )}

          {/* 活动网格 */}
          {filteredActivities.length > 0 ? (
            <div className="activities-grid">
              {filteredActivities.map(activity => (
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
              <h3>{loading ? '加载中...' : '没有找到符合条件的活动'}</h3>
              {!loading && <p>试试调整筛选条件或使用其他关键词</p>}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
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
                className="pagination-button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

        {/* 筛选条件标签 */}
        {getActiveFilters().length > 0 && (
          <div className="active-filters">
            <div className="filter-tags">
              {getActiveFilters().map(filter => (
                <div key={filter.type} className="filter-tag">
                  <span className="tag-label">{filter.key}: {filter.label}</span>
                  <button
                    className="tag-remove"
                    onClick={() => handleClearFilter(filter.type)}
                    aria-label={`清除${filter.key}筛选`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                className="clear-all-btn"
                onClick={() => handleClearFilter('all')}
              >
                清除全部
              </button>
            </div>
          </div>
        )}

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

        {/* 活动列表 */}
        {filteredActivities.length > 0 ? (
          <div className="activities-grid">
            {filteredActivities.map(activity => (
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
            <h3>{loading ? '加载中...' : '没有找到符合条件的活动'}</h3>
            {!loading && <p>试试调整筛选条件或使用其他关键词</p>}
          </div>
        )}

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
    </div>
  )
}

export default App
