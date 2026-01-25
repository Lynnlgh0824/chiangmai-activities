import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import WeeklyCalendarView from '../components/WeeklyCalendarView'
import ScheduleListView from '../components/ScheduleListView'
import './Schedule.css'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''  // 使用空字符串，通过 Vite 代理访问后端
const api = axios.create({
  baseURL: `/api`,  // 直接使用 /api，由 Vite 代理转发到 http://localhost:3000
  timeout: 10000
})

function Schedule() {
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' | 'list'
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await api.get('/activities', {
        params: {
          limit: 50,
          sortBy: 'date',
          sortOrder: 'asc'
          // 移除 status: 'active' 筛选，获取所有活动（包括草稿、待开始、进行中等）
        }
      })
      setActivities(response.data.data || [])
    } catch (error) {
      // 使用模拟数据会由组件内部处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🗓️ 清迈周课表</h1>
            <p>发现本周免费兴趣课程和活动</p>
          </div>
          <Link to="/" className="back-button">
            <span>←</span>
            <span>返回活动列表</span>
          </Link>
        </div>

        <div className="view-toggle">
          <button
            className={`view-button ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <span>📅</span>
            <span>日历视图</span>
          </button>
          <button
            className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <span>📋</span>
            <span>列表视图</span>
          </button>
        </div>
      </div>

      <div className="schedule-content">
        {viewMode === 'calendar' ? (
          <WeeklyCalendarView activities={activities} loading={loading} />
        ) : (
          <ScheduleListView activities={activities} loading={loading} />
        )}
      </div>
    </div>
  )
}

export default Schedule
