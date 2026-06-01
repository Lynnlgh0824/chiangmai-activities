// =====================================================
// 认证授权中间件
// =====================================================

/**
 * 从环境变量或使用默认API密钥
 * 生产环境必须设置ADMIN_API_KEY环境变量
 */
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-api-key-change-in-production';

/**
 * API密钥认证中间件
 * 验证请求头中的X-API-Key
 */
function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  // 检查API密钥是否存在
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: '缺少API密钥，请在请求头中提供 X-API-Key'
    });
  }

  // 验证API密钥
  if (apiKey !== ADMIN_API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'API密钥无效'
    });
  }

  // 认证成功，记录日志并继续
  console.log(`✅ API认证成功: ${req.method} ${req.url}`);
  next();
}

/**
 * 可选的API密钥认证
 * 如果提供了密钥则验证，否则继续
 * 用于某些需要区分用户和匿名请求的场景
 */
function optionalApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (apiKey && apiKey !== ADMIN_API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'API密钥无效'
    });
  }

  next();
}

// 启动时检查API密钥配置
if (ADMIN_API_KEY === 'dev-api-key-change-in-production' && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  警告: 使用默认API密钥！请在生产环境设置 ADMIN_API_KEY 环境变量');
} else {
  console.log('🔐 API认证已启用');
}

module.exports = {
  requireApiKey,
  optionalApiKey
};
