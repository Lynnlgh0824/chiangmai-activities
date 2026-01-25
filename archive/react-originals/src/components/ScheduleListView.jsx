import React from 'react'
import { dayNames } from '../data/weeklySchedule'
import './ScheduleListView.css'

function ScheduleListView({ activities = [], loading }) {
  // 只使用真实数据，不再使用模拟数据
  const scheduleData = activities

  const getCategoryColor = (category) => {
    const colors = {
      '瑜伽': '#FF6B6B',
      '冥想': '#4ECDC4',
      '户外探险': '#FFE66D',
      '文化艺术': '#95E1D3',
      '美食体验': '#F38181',
      '其他': '#667eea'
    }
    return colors[category] || '#667eea'
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const options = { weekday: 'long', month: 'short', day: 'numeric' }
    return date.toLocaleDateString('zh-CN', options)
  }

  // 分离有日期和无日期的活动
  const activitiesWithDate = scheduleData.filter(a => {
    if (!a.date) return false
    const date = new Date(a.date)
    return date.getFullYear() > 2000 && !isNaN(date.getTime())
  })

  const activitiesWithoutDate = scheduleData.filter(a => {
    if (!a.date && a.weekdays && a.weekdays.length > 0) return true
    return false
  })

  // 有日期的活动按日期排序
  const sortedActivities = [...activitiesWithDate].sort((a, b) => {
    return new Date(a.date) - new Date(b.date)
  })

  // 无日期的活动添加在最后
  const allActivities = [...sortedActivities, ...activitiesWithoutDate]

  return (
    <div className="schedule-list-view">
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      ) : allActivities.length === 0 ? (
        <div className="no-activities">
          <div className="no-activities-icon">📅</div>
          <h3>暂无活动安排</h3>
          <p>当前没有安排任何课程活动</p>
          <p className="no-activities-hint">💡 提示：前往管理后台添加活动</p>
        </div>
      ) : (
        <div className="schedule-list">
          {allActivities.map(activity => {
            // 如果有日期，显示日期；如果没有日期，显示"无固定日期"
            const hasDate = activity.date && new Date(activity.date).getFullYear() > 2000
            const displayDay = hasDate ? dayNames[new Date(activity.date).getDay()] : '周'
            const displayDate = hasDate ? new Date(activity.date).getDate() : '∞'

            return (
              <div key={activity.id} className="schedule-item">
                <div className="date-badge">
                  <div className="date-day">
                    {displayDay}
                  </div>
                  <div className="date-number">
                    {displayDate}
                  </div>
                </div>

              <div className="activity-content">
                <div className="activity-header">
                  <span
                    className="category-tag"
                    style={{ backgroundColor: getCategoryColor(activity.category) }}
                  >
                    {activity.category}
                  </span>
                  {activity.price && (
                    <span className="price-badge">
                      {activity.price}
                    </span>
                  )}
                </div>

                <h3 className="activity-title">{activity.title}</h3>
                <p className="activity-description">{activity.description}</p>

                <div className="activity-meta">
                  <div className="meta-item">
                    <span>📅</span>
                    <span>
                      {hasDate ? formatDate(activity.date) : (
                        <span className="no-fixed-date">
                          无固定日期 · {activity.weekdays?.join('、') || '灵活安排'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span>⏰</span>
                    <span>{activity.time}</span>
                  </div>
                  <div className="meta-item">
                    <span>📍</span>
                    <span>{activity.location}</span>
                  </div>
                  {activity.teacher && (
                    <div className="meta-item">
                      <span>👨‍🏫</span>
                      <span>{activity.teacher}</span>
                    </div>
                  )}
                </div>

                {activity.enrolled && activity.capacity && (
                  <div className="enrollment-bar">
                    <div className="enrollment-progress">
                      <div
                        className="enrollment-fill"
                        style={{
                          width: `${(activity.enrolled / activity.capacity) * 100}%`,
                          backgroundColor: getCategoryColor(activity.category)
                        }}
                      ></div>
                    </div>
                    <span className="enrollment-text">
                      已报名 {activity.enrolled}/{activity.capacity}
                    </span>
                  </div>
                )}

                {activity.source?.url && (
                  <button
                    className="join-button"
                    onClick={() => window.open(activity.source.url, '_blank')}
                    style={{ backgroundColor: getCategoryColor(activity.category) }}
                  >
                    了解详情
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ScheduleListView
