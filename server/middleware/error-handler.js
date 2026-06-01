const { logger } = require('./logger');

// =====================================================
// 统一错误处理中间件（防止敏感信息泄露）
// =====================================================

/**
 * 安全的错误响应函数
 * 在生产环境中隐藏敏感的内部信息
 */
function sendErrorResponse(res, error, statusCode = 500) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 记录完整错误到服务器日志
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // 返回给客户端的错误信息（根据环境）
  const response = {
    success: false,
    message: isDevelopment ? error.message : '请求处理失败，请稍后重试'
  };

  // 仅在开发环境返回详细错误信息
  if (isDevelopment) {
    response.stack = error.stack;
    response.details = error.toString();
  }

  res.status(statusCode).json(response);
}

/**
 * 全局错误处理中间件
 * 捕获所有未处理的错误
 */
function globalErrorHandler(err, req, res, next) {
  // Multer文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendErrorResponse(res, new Error('文件大小超过限制（最大2MB）'), 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return sendErrorResponse(res, new Error('文件数量超过限制'), 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return sendErrorResponse(res, new Error('意外的文件字段'), 400);
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return sendErrorResponse(res, err, 400);
  }

  // JSON解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendErrorResponse(res, new Error('JSON格式错误'), 400);
  }

  // 其他未预期错误
  sendErrorResponse(res, err, err.status || 500);
}

/**
 * 包装异步路由处理器的辅助函数
 * 自动捕获async/await错误
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Try-catch包装器
 * 用于同步函数的错误处理
 */
function tryCatch(res, operationName, fn) {
  try {
    fn();
  } catch (error) {
    sendErrorResponse(res, error, 500);
  }
}

module.exports = {
  sendErrorResponse,
  globalErrorHandler,
  asyncHandler,
  tryCatch
};
