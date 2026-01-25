/**
 * AI 智能导入组件
 * 从小红书等平台复制文本，自动解析为结构化数据
 */

import { useState } from 'react'
import './AIImport.css'

function AIImport() {
  const [inputText, setInputText] = useState('')
  const [parsedData, setParsedData] = useState([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [showPreview, setShowPreview] = useState(false)

  // AI 智能解析文本
  const parseText = (text) => {
    // 按分隔符分割多条数据
    const items = text.split(/\n\s*-+\s*\n|\n\s*={3,}\s*\n/).filter(item => item.trim().length > 10)

    return items.map((item, index) => {
      const lines = item.split('\n').map(line => line.trim()).filter(line => line)

      const activity = {
        id: Date.now() + index,
        title: '',
        category: '其他',
        description: '',
        price: '待询价',
        priceMin: 0,
        priceMax: 0,
        time: '',
        date: '',
        weekdays: [],
        location: '清迈',
        duration: '2小时',
        flexibleTime: false,
        type: 'once', // once(临时) or weekly(固定频率)
        images: [],
        url: '',
      }

      // 提取标题（通常在前3行）
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i]
        if (line.length > 5 && line.length < 50 && !line.includes('￥') && !line.includes('฿')) {
          activity.title = line
          lines.splice(i, 1)
          break
        }
      }

      // 提取价格
      const pricePatterns = [
        /(\d+)\s*[-~至]\s*(\d+)\s*(฿|泰铢|THB|บาท)/,
        /(\d+)\s*(฿|泰铢|THB|บาท)/,
        /免费/i,
      ]

      for (const pattern of pricePatterns) {
        const match = text.match(pattern)
        if (match) {
          if (match[0].includes('免费')) {
            activity.price = '免费'
            activity.priceMin = 0
            activity.priceMax = 0
          } else if (match[2]) {
            // 价格范围
            activity.price = `${match[1]}-${match[2]}${match[3]}`
            activity.priceMin = parseInt(match[1])
            activity.priceMax = parseInt(match[2])
          } else {
            // 单一价格
            activity.price = match[0]
            activity.priceMin = parseInt(match[1])
            activity.priceMax = parseInt(match[1])
          }
          break
        }
      }

      // 提取时间
      const timePatterns = [
        /(\d{1,2}:\d{2})\s*[-~至to]*\s*(\d{1,2}:\d{2})/,
        /(\d{1,2})点(\d{0,2})\s*[-~至]*\s*(\d{1,2})点(\d{0,2})/,
      ]

      for (const pattern of timePatterns) {
        const match = text.match(pattern)
        if (match) {
          if (match[1].includes(':')) {
            activity.time = `${match[1]}-${match[2]}`
          } else {
            const startTime = `${match[1].padStart(2, '0')}:${match[2] || '00'}`
            const endTime = `${match[3].padStart(2, '0')}:${match[4] || '00'}`
            activity.time = `${startTime}-${endTime}`
          }
          break
        }
      }

      // 提取星期（固定频率）
      const weekdayMap = {
        '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 7,
      }

      for (const [day, num] of Object.entries(weekdayMap)) {
        if (text.includes(day)) {
          activity.weekdays.push(day)
          activity.type = 'weekly'
        }
      }

      // 提取日期（临时活动）
      const datePatterns = [
        /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})/,
        /(\d{1,2})[月/-](\d{1,2})/,
      ]

      for (const pattern of datePatterns) {
        const match = text.match(pattern)
        if (match) {
          if (match[1].length === 4) {
            activity.date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
          } else {
            const year = new Date().getFullYear()
            activity.date = `${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`
          }
          if (!activity.weekdays.length) {
            activity.type = 'once'
          }
          break
        }
      }

      // 提取地点
      const locationPatterns = [
        /清迈([^，。\n]{2,15})/,
        /宁曼路/,
        /古城/,
        /塔佩门/,
        /素贴山/,
        /湄平河/,
      ]

      for (const pattern of locationPatterns) {
        const match = text.match(pattern)
        if (match) {
          activity.location = match[0]
          break
        }
      }

      // 自动分类
      const categoryKeywords = {
        '瑜伽': ['瑜伽', 'Yoga', 'yoga'],
        '冥想': ['冥想', 'meditation', '冥想课'],
        '美食体验': ['烹饪', '美食', '泰餐', 'cooking', '厨艺'],
        '户外探险': ['泰拳', '拳击', '徒步', 'trekking'],
        '文化艺术': ['泰语', '文化', '艺术', '手工艺'],
      }

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
          activity.category = category
          break
        }
      }

      // 提取描述
      const descriptionLines = lines.filter(line =>
        line.length > 10 &&
        !line.includes('http') &&
        !line.includes('฿') &&
        !line.includes('￥')
      )
      activity.description = descriptionLines.slice(0, 3).join(' ').substring(0, 200)

      // 提取图片 URL
      const imagePatterns = [
        /https?:\/\/[^\s\n]+\.(jpg|jpeg|png|webp)/gi,
        /https?:\/\/sns-[\w\-]+\.xiaohongshu\.com[^\s\n]*/gi,
      ]

      for (const pattern of imagePatterns) {
        const matches = text.match(pattern)
        if (matches) {
          activity.images = matches.slice(0, 3)
          break
        }
      }

      // 提取来源链接
      const urlMatch = text.match(/https?:\/\/(?:www\.)?xiaohongshu\.com\/[^\s\n]*/i)
      if (urlMatch) {
        activity.url = urlMatch[0]
      }

      return activity
    })
  }

  const handleParse = () => {
    if (!inputText.trim()) {
      alert('请先粘贴文本内容')
      return
    }

    const data = parseText(inputText)
    setParsedData(data)
    setShowPreview(true)
    setPreviewIndex(0)
  }

  const handleClear = () => {
    setInputText('')
    setParsedData([])
    setShowPreview(false)
  }

  const currentData = parsedData[previewIndex] || {}

  return (
    <div className="ai-import-container">
      <div className="ai-import-header">
        <h1>🤖 AI 智能导入</h1>
        <p>从小红书等平台复制活动文本，AI 自动提取所有字段</p>
      </div>

      <div className="ai-import-content">
        {/* 输入区域 */}
        <div className="input-section">
          <h2>📝 粘贴活动文本</h2>
          <div className="input-tips">
            <p><strong>使用方法：</strong></p>
            <ol>
              <li>在小红书看到活动信息</li>
              <li>选择并复制文本（Ctrl+C / Cmd+C）</li>
              <li>粘贴到下方输入框</li>
              <li>点击"AI 智能解析"</li>
            </ol>
            <p className="tip">💡 一次可以粘贴多条，用 <code>---</code> 或 <code>===</code> 分隔</p>
          </div>

          <textarea
            className="text-input"
            placeholder="在此粘贴小红书活动文本...

示例：
清迈流瑜伽早课
时间：每周一三五 9:00-11:00
地点：宁曼路瑜伽馆
价格：500฿/节
适合所有级别的瑜伽爱好者"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={15}
          />

          <div className="button-group">
            <button className="parse-button" onClick={handleParse}>
              🤖 AI 智能解析
            </button>
            <button className="clear-button" onClick={handleClear}>
              🗑️ 清空
            </button>
          </div>
        </div>

        {/* 预览区域 */}
        {showPreview && parsedData.length > 0 && (
          <div className="preview-section">
            <div className="preview-header">
              <h2>👁️ 解析预览</h2>
              <div className="pagination">
                <button
                  onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                  disabled={previewIndex === 0}
                >
                  ← 上一条
                </button>
                <span>{previewIndex + 1} / {parsedData.length}</span>
                <button
                  onClick={() => setPreviewIndex(Math.min(parsedData.length - 1, previewIndex + 1))}
                  disabled={previewIndex === parsedData.length - 1}
                >
                  下一条 →
                </button>
              </div>
            </div>

            <div className="preview-form">
              <div className="form-row">
                <label>活动标题</label>
                <input
                  type="text"
                  value={currentData.title}
                  onChange={(e) => {
                    const newData = [...parsedData]
                    newData[previewIndex].title = e.target.value
                    setParsedData(newData)
                  }}
                  placeholder="活动标题"
                />
              </div>

              <div className="form-row">
                <label>分类</label>
                <select
                  value={currentData.category}
                  onChange={(e) => {
                    const newData = [...parsedData]
                    newData[previewIndex].category = e.target.value
                    setParsedData(newData)
                  }}
                >
                  <option value="瑜伽">瑜伽</option>
                  <option value="冥想">冥想</option>
                  <option value="户外探险">户外探险</option>
                  <option value="文化艺术">文化艺术</option>
                  <option value="美食体验">美食体验</option>
                  <option value="节庆活动">节庆活动</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div className="form-row">
                <label>活动类型</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name={`type-${previewIndex}`}
                      checked={currentData.type === 'once'}
                      onChange={() => {
                        const newData = [...parsedData]
                        newData[previewIndex].type = 'once'
                        setParsedData(newData)
                      }}
                    />
                    临时活动（一次性）
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`type-${previewIndex}`}
                      checked={currentData.type === 'weekly'}
                      onChange={() => {
                        const newData = [...parsedData]
                        newData[previewIndex].type = 'weekly'
                        setParsedData(newData)
                      }}
                    />
                    固定频率（每周重复）
                  </label>
                </div>
              </div>

              {currentData.type === 'weekly' ? (
                <div className="form-row">
                  <label>星期</label>
                  <input
                    type="text"
                    value={currentData.weekdays.join(',')}
                    onChange={(e) => {
                      const newData = [...parsedData]
                      newData[previewIndex].weekdays = e.target.value.split(',').map(s => s.trim())
                      setParsedData(newData)
                    }}
                    placeholder="周一,周三,周五"
                  />
                </div>
              ) : (
                <div className="form-row">
                  <label>具体日期</label>
                  <input
                    type="date"
                    value={currentData.date}
                    onChange={(e) => {
                      const newData = [...parsedData]
                      newData[previewIndex].date = e.target.value
                      setParsedData(newData)
                    }}
                  />
                </div>
              )}

              <div className="form-row">
                <label>时间</label>
                <input
                  type="text"
                  value={currentData.time}
                  onChange={(e) => {
                    const newData = [...parsedData]
                    newData[previewIndex].time = e.target.value
                    setParsedData(newData)
                  }}
                  placeholder="09:00-11:00"
                />
              </div>

              <div className="form-row">
                <label>地点</label>
                <input
                  type="text"
                  value={currentData.location}
                  onChange={(e) => {
                    const newData = [...parsedData]
                    newData[previewIndex].location = e.target.value
                    setParsedData(newData)
                  }}
                  placeholder="清迈宁曼路"
                />
              </div>

              <div className="form-row-group">
                <div className="form-row">
                  <label>价格显示</label>
                  <input
                    type="text"
                    value={currentData.price}
                    onChange={(e) => {
                      const newData = [...parsedData]
                      newData[previewIndex].price = e.target.value
                      setParsedData(newData)
                    }}
                    placeholder="500฿"
                  />
                </div>
                <div className="form-row">
                  <label>最低价格</label>
                  <input
                    type="number"
                    value={currentData.priceMin}
                    onChange={(e) => {
                      const newData = [...parsedData]
                      newData[previewIndex].priceMin = parseInt(e.target.value) || 0
                      setParsedData(newData)
                    }}
                  />
                </div>
                <div className="form-row">
                  <label>最高价格</label>
                  <input
                    type="number"
                    value={currentData.priceMax}
                    onChange={(e) => {
                      const newData = [...parsedData]
                      newData[previewIndex].priceMax = parseInt(e.target.value) || 0
                      setParsedData(newData)
                    }}
                  />
                </div>
              </div>

              <div className="form-row">
                <label>活动描述</label>
                <textarea
                  value={currentData.description}
                  onChange={(e) => {
                    const newData = [...parsedData]
                    newData[previewIndex].description = e.target.value
                    setParsedData(newData)
                  }}
                  rows={4}
                  placeholder="活动详细描述"
                />
              </div>

              <div className="form-row">
                <label>图片 URL（每行一个）</label>
                <textarea
                  value={currentData.images.join('\n')}
                  onChange={(e) => {
                    const newData = [...parsedData]
                    newData[previewIndex].images = e.target.value.split('\n').filter(url => url.trim())
                    setParsedData(newData)
                  }}
                  rows={3}
                  placeholder="https://..."
                />
              </div>

              <div className="form-row">
                <label>来源链接</label>
                <input
                  type="url"
                  value={currentData.url}
                  onChange={(e) => {
                    const newData = [...parsedData]
                    newData[previewIndex].url = e.target.value
                    setParsedData(newData)
                  }}
                  placeholder="https://xiaohongshu.com/..."
                />
              </div>
            </div>

            <div className="preview-actions">
              <button className="save-all-button" onClick={async () => {
                // 调用 API 保存所有数据
                try {
                  const response = await fetch('/api/activities/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parsedData)
                  })

                  if (response.ok) {
                    alert(`✅ 成功导入 ${parsedData.length} 条活动！`)
                    handleClear()
                  } else {
                    alert('❌ 保存失败，请重试')
                  }
                } catch (error) {
                  console.error('保存失败:', error)
                  alert('❌ 保存失败：' + error.message)
                }
              }}>
                💾 保存全部到数据库
              </button>

              <button className="export-excel-button" onClick={async () => {
                // 导出为 JSON 供 Excel 工具使用
                const dataStr = JSON.stringify(parsedData, null, 2)
                const blob = new Blob([dataStr], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `ai-import-${Date.now()}.json`
                a.click()
                alert('✅ 已导出 JSON 文件！\n\n请将文件放到 scraper 目录，然后运行：\nnode excel-writer-import.js')
              }}>
                📊 导出为 JSON（写入 Excel）
              </button>
            </div>
          </div>
        )}

        {/* 使用示例 */}
        <div className="examples-section">
          <h2>💡 使用示例</h2>
          <div className="example-card">
            <h3>示例 1：固定频率活动</h3>
            <pre>{`清迈流瑜伽早课
时间：每周一三五上午9-11点
地点：宁曼路瑜伽馆，清迈宁曼路1号
价格：500฿/节，首次免费体验
适合所有级别的瑜伽爱好者
包含瑜伽垫和茶点`}</pre>
            <p className="example-result">
              <strong>AI 解析结果：</strong><br/>
              ✓ 标题：清迈流瑜伽早课<br/>
              ✓ 类型：固定频率活动<br/>
              ✓ 星期：周一,周三,周五<br/>
              ✓ 时间：09:00-11:00<br/>
              ✓ 价格：500฿
            </p>
          </div>

          <div className="example-card">
            <h3>示例 2：临时活动</h3>
            <pre>{`泰式烹饪工作坊
时间：2025年2月1日下午2-5点
地点：清迈烹饪学校，老城中心
价格：500฿/人
学习制作冬阴功汤和泰式炒河粉`}</pre>
            <p className="example-result">
              <strong>AI 解析结果：</strong><br/>
              ✓ 标题：泰式烹饪工作坊<br/>
              ✓ 类型：临时活动<br/>
              ✓ 日期：2025-02-01<br/>
              ✓ 时间：14:00-17:00<br/>
              ✓ 价格：500฿
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIImport
