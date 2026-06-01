// =====================================================
// 日志工具（生产环境自动禁用调试日志）
// =====================================================

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

/**
 * 日志工具对象
 * 在生产环境中禁用调试日志，仅保留错误和警告
 */
const logger = {
  /**
   * 调试日志 - 仅开发环境
   */
  debug: function(...args) {
    if (!isProduction) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * 信息日志 - 始终记录
   */
  info: function(...args) {
    console.log('[INFO]', ...args);
  },

  /**
   * 警告日志 - 始终记录
   */
  warn: function(...args) {
    console.warn('[WARN]', ...args);
  },

  /**
   * 错误日志 - 始终记录
   */
  error: function(...args) {
    console.error('[ERROR]', ...args);
  },

  /**
   * 成功日志 - 仅开发环境
   */
  success: function(...args) {
    if (!isProduction) {
      console.log('✅', ...args);
    }
  }
};

// 记录启动环境
if (isProduction) {
  console.log('🚀 生产环境模式 - 调试日志已禁用');
} else {
  console.log('🛠️  开发环境模式 - 所有日志已启用');
}

module.exports = { logger, isProduction, isDevelopment };
