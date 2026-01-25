import React from 'react'
import './App.css'

function TestApp() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>✅ React 正常工作！</h1>
      <p>如果你能看到这个页面，说明 React 基础功能正常</p>
      <button onClick={() => alert('点击事件正常！')}>
        测试按钮
      </button>
      <hr style={{ margin: '30px 0' }} />
      <p>问题可能在 App.jsx 的逻辑中</p>
      <a href="/index.html">返回原始页面</a>
    </div>
  )
}

export default TestApp
