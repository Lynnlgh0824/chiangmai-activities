import React from 'react'
import { dayNames } from '../data/weeklySchedule'
import './WeeklyCalendarView.css'

function WeeklyCalendarView({ activities = [], loading }) {
  // 分离有日期和无日期的活动
  const activitiesWithDate = activities.filter(a => {
    if (!a.date) return false
    const date = new Date(a.date)
    return date.getFullYear() > 2000 && !isNaN(date.getTime())
  })

  const activitiesWithoutDate = activities.filter(a => {
    if (!a.date && a.weekdays && a.weekdays.length > 0) return true
    return false
  })

  // 只使用有日期的活动生成日历
  const scheduleData = activitiesWithDate.length > 0 ? groupActivitiesByWeek(activitiesWithDate) : []

  // 将传入的活动按周分组
  function groupActivitiesByWeek(activities) {
    if (activities.length === 0) {
      return []
    }

    const weeks = []

    // 转换为周格式
    let currentWeek = {
      week: '活动列表',
      startDate: new Date(Math.min(...activitiesWithDate.map(a => new Date(a.date)))).toISOString().split('T')[0],
      endDate: new Date(Math.max(...activitiesWithDate.map(a => new Date(a.date)))).toISOString().split('T')[0],
      activities: activitiesWithDate.map(a => ({
        ...a,
        dayOfWeek: new Date(a.date).getDay()
      }))
    }

    weeks.push(currentWeek)
    return weeks
  }

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

  return (
    <div className="weekly-calendar-view">
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      ) : scheduleData.length === 0 && activitiesWithoutDate.length === 0 ? (
        <div className="no-activities">
          <div className="no-activities-icon">📅</div>
          <h3>暂无活动安排</h3>
          <p>当前没有安排任何课程活动</p>
          <p className="no-activities-hint">💡 提示：前往管理后台添加活动</p>
        </div>
      ) : scheduleData.length === 0 && activitiesWithoutDate.length > 0 ? (
        <div className="no-activities">
          <div className="no-activities-icon">📅</div>
          <h3>暂无具体日期的活动</h3>
          <p>但有 {activitiesWithoutDate.length} 个固定频率的活动</p>
          <p className="no-activities-hint">💡 提示：这些活动在"列表视图"中显示，或切换到列表视图查看</p>
        </div>
      ) : (
        <div className="weeks-container">
          {scheduleData.map((week, weekIndex) => (
            <div key={weekIndex} className="week-card">
              <div className="week-header">
                <h3 className="week-title">{week.week}</h3>
                <span className="week-date-range">
                  {week.startDate} ~ {week.endDate}
                </span>
              </div>

              <div className="calendar-grid">
                {/* 星期表头 */}
                {dayNames.map(day => (
                  <div key={day} className="calendar-day-header">{day}</div>
                ))}

                {/* 周一到周日的活动格子 */}
                {[1, 2, 3, 4, 5, 6, 0].map(dayIndex => {
                  const dayActivities = week.activities.filter(a => a.dayOfWeek === dayIndex)
                  const dayName = dayNames[dayIndex]
                  const displayDate = getDisplayDate(week, dayIndex)

                  return (
                    <div key={dayIndex} className={`calendar-day ${dayActivities.length > 0 ? 'has-activity' : ''}`}>
                      <div className="day-number">{displayDate}</div>
                      <div className="day-activities">
                        {dayActivities.map(activity => (
                          <div
                            key={activity.id}
                            className="activity-card-mini"
                            onClick={() => window.open(activity.source?.url || '#', '_blank')}
                            style={{ borderLeftColor: getCategoryColor(activity.category) }}
                          >
                            <div className="activity-time">{activity.time}</div>
                            <div className="activity-title">{activity.title}</div>
                            <div className="activity-location">📍 {activity.location}</div>
                            <div className="activity-price">{activity.price}</div>
                            {activity.enrolled && activity.capacity && (
                              <div className="activity-enrollment">
                                {activity.enrolled}/{activity.capacity}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {activitiesWithoutDate.length > 0 && (
          <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#667eea' }}>📌 固定频率的活动（{activitiesWithoutDate.length}个）</h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>
              以下活动没有设置具体日期，请切换到"列表视图"查看详情：
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {activitiesWithoutDate.slice(0, 5).map(activity => (
                <span
                  key={activity.id}
                  style={{
                    padding: '6px 12px',
                    background: 'white',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    border: `2px solid ${getCategoryColor(activity.category)}`
                  }}
                >
                  {activity.title}
                </span>
              ))}
              {activitiesWithoutDate.length > 5 && (
                <span style={{ padding: '6px 12px', color: '#666' }}>
                  ...还有 {activitiesWithoutDate.length - 5} 个
                </span>
              )}
            </div>
          </div>
        )}
      )}
    </div>
  )
}

// 获取显示的日期
function getDisplayDate(week, dayIndex) {
  const startDate = new Date(week.startDate)
  const targetDate = new Date(startDate)
  targetDate.setDate(startDate.getDate() + dayIndex)
  return targetDate.getDate()
}

export default WeeklyCalendarView
