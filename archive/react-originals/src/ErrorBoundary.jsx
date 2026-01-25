/**
 * 错误边界组件
 * 捕获React组件树中的JavaScript错误，显示友好的错误信息
 */
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ React Error Boundary caught an error:', error)
    console.error('Error Info:', errorInfo)

    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '50px',
          textAlign: 'center',
          backgroundColor: '#fff3cd',
          borderRadius: '10px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#856404' }}>⚠️ 页面加载出错</h2>
          <p style={{ color: '#856404', marginTop: '10px' }}>
            抱歉，页面遇到了一些问题
          </p>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', color: '#856404' }}>
              <strong>🔍 查看错误详情</strong>
            </summary>
            <div style={{
              marginTop: '10px',
              padding: '15px',
              backgroundColor: '#fff',
              borderRadius: '5px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              <div><strong>Error:</strong> {this.state.error?.toString()}</div>
              <div style={{ marginTop: '10px' }}>
                <strong>Stack:</strong>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: '5px' }}>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
              <div style={{ marginTop: '15px', fontSize: '14px' }}>
                <strong>💡 建议操作：</strong>
                <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                  <li>刷新浏览器 (Cmd+Shift+R / Ctrl+Shift+R)</li>
                  <li>检查浏览器控制台的Console标签查看详细错误</li>
                  <li>如果问题持续，请重新启动开发服务器</li>
                </ul>
              </div>
            </div>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
