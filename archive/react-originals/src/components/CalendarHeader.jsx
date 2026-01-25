/**
 * 日历表头组件 - 原型
 * 功能：显示周一到周日的日期，支持上一周/下一周切换
 */

import React, { useState } from 'react'

function CalendarHeader({ currentDate = new Date() }) {
  // 当前显示的周的基准日期（周一）
  const [currentMonday, setCurrentMonday] = useState(() => {
    return getMonday(currentDate)
  })

  // 获取指定日期所在周的周一
  function getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 调整到周一
    return new Date(d.setDate(diff))
  }

  // 切换到上一周
  const handlePrevWeek = () => {
    const newMonday = new Date(currentMonday)
    newMonday.setDate(newMonday.getDate() - 7)
    setCurrentMonday(newMonday)
  }

  // 切换到下一周
  const handleNextWeek = () => {
    const newMonday = new Date(currentMonday)
    newMonday.setDate(newMonday.getDate() + 7)
    setCurrentMonday(newMonday)
  }

  // 回到本周
  const handleToday = () => {
    setCurrentMonday(getMonday(new Date()))
  }

  // 生成本周7天的数据
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentMonday)
    date.setDate(currentMonday.getDate() + i)

    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    return {
      dayName: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
      dateNum: date.getDate(),
      isToday: isToday,
      fullDate: date
    }
  })

  return (
    <div style={{
      backgroundColor: '#fff',
      borderBottom: '2px solid #e0e0e0',
      padding: '12px 20px'
    }}>
      {/* 导航栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {currentMonday.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleToday}
            style={{
              padding: '6px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: '#fff',
              color: '#333',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            回到本周
          </button>
          <button
            onClick={handlePrevWeek}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: '#fff',
              color: '#333',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            ← 上一周
          </button>
          <button
            onClick={handleNextWeek}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: '#fff',
              color: '#333',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            下一周 →
          </button>
        </div>
      </div>

      {/* 日期行 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        textAlign: 'center'
      }}>
        {weekDates.map((day, index) => (
          <div
            key={index}
            style={{
              padding: '10px 8px',
              backgroundColor: day.isToday ? '#fff3cd' : '#f8f9fa',
              borderRadius: '8px',
              border: day.isToday ? '2px solid #ffc107' : '1px solid #e0e0e0'
            }}
          >
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '4px'
            }}>
              {day.dayName}
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: day.isToday ? 'bold' : 'normal',
              color: day.isToday ? '#ff6b6b' : '#333'
            }}>
              {day.dateNum}
            </div>
            {day.isToday && (
              <div style={{
                fontSize: '11px',
                color: '#ff6b6b',
                marginTop: '2px'
              }}>
                今天
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CalendarHeader
