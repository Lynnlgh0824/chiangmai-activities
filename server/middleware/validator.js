// =====================================================
// 输入验证模块（防止恶意数据注入）
// =====================================================

/**
 * 验证器对象 - 提供各种数据验证函数
 */
const validator = {
  /**
   * 验证必填字段
   */
  required: (value, fieldName = '字段') => {
    if (value === null || value === undefined || value === '') {
      return { valid: false, error: `${fieldName}不能为空` };
    }
    return { valid: true };
  },

  /**
   * 验证字符串长度
   */
  length: (value, min, max, fieldName = '字段') => {
    if (value === null || value === undefined) return { valid: true }; // 可选字段
    const len = value.length;
    if (len < min || len > max) {
      return { valid: false, error: `${fieldName}长度必须在${min}-${max}个字符之间` };
    }
    return { valid: true };
  },

  /**
   * 验证是否为有效字符串
   */
  isString: (value, fieldName = '字段') => {
    if (value === null || value === undefined) return { valid: true }; // 可选
    if (typeof value !== 'string') {
      return { valid: false, error: `${fieldName}必须是字符串` };
    }
    return { valid: true };
  },

  /**
   * 验证是否为数字
   */
  isNumber: (value, fieldName = '字段') => {
    if (value === null || value === undefined) return { valid: true }; // 可选
    if (typeof value !== 'number' || isNaN(value)) {
      return { valid: false, error: `${fieldName}必须是数字` };
    }
    return { valid: true };
  },

  /**
   * 验证是否为布尔值
   */
  isBoolean: (value, fieldName = '字段') => {
    if (value === null || value === undefined) return { valid: true }; // 可选
    if (typeof value !== 'boolean') {
      return { valid: false, error: `${fieldName}必须是布尔值` };
    }
    return { valid: true };
  },

  /**
   * 验证是否为数组
   */
  isArray: (value, fieldName = '字段') => {
    if (value === null || value === undefined) return { valid: true }; // 可选
    if (!Array.isArray(value)) {
      return { valid: false, error: `${fieldName}必须是数组` };
    }
    return { valid: true };
  },

  /**
   * 验证URL格式
   */
  isURL: (value, fieldName = '字段') => {
    if (!value || value === '') return { valid: true }; // 可选
    try {
      new URL(value);
      // 拒绝危险协议
      if (value.toLowerCase().startsWith('javascript:')) {
        return { valid: false, error: `${fieldName}不能使用javascript协议` };
      }
      return { valid: true };
    } catch (e) {
      return { valid: false, error: `${fieldName}必须是有效的URL` };
    }
  },

  /**
   * 验证经纬度
   */
  isCoordinate: (value, fieldName = '坐标') => {
    if (value === null || value === undefined || value === '') return { valid: true }; // 可选
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, error: `${fieldName}必须是数字` };
    }
    return { valid: true };
  },

  /**
   * 验证分类是否在允许列表中
   */
  isCategory: (value) => {
    if (!value) return { valid: true }; // 可选
    const allowedCategories = [
      '瑜伽', '冥想', '舞蹈', '泰拳', '音乐', '文化艺术', '健身',
      '市集', '灵活时间活动', '活动网站', '攻略信息', '其他'
    ];
    if (!allowedCategories.includes(value)) {
      return { valid: false, error: `分类必须是以下之一：${allowedCategories.join(', ')}` };
    }
    return { valid: true };
  },

  /**
   * 验证价格格式
   */
  isPrice: (value, fieldName = '价格') => {
    if (!value || value === '') return { valid: true }; // 可选
    // 允许的格式：数字、货币符号+数字、"免费"、数字范围等
    const pricePattern = /^[\d\s¥￥$€£฿.,+-]+|免费|待定|灵活时间$/;
    if (!pricePattern.test(value)) {
      return { valid: false, error: `${fieldName}格式无效` };
    }
    return { valid: true };
  },

  /**
   * 验证时间格式
   */
  isTime: (value, fieldName = '时间') => {
    if (!value || value === '') return { valid: true }; // 可选
    // 允许的格式：HH:MM、灵活时间、多时段等
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]|灵活时间|待定$/;
    if (!timePattern.test(value.trim())) {
      return { valid: false, error: `${fieldName}格式无效，应为HH:MM或"灵活时间"` };
    }
    return { valid: true };
  },

  /**
   * 净化字符串（移除危险字符）
   */
  sanitize: (value) => {
    if (typeof value !== 'string') return value;
    // 移除控制字符（除了换行、制表符、回车）
    return value.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  },

  /**
   * 验证并清理活动数据
   */
  validateActivity: (data) => {
    const errors = [];

    // 验证标题
    let result = validator.required(data.title, '标题');
    if (!result.valid) errors.push(result.error);
    result = validator.length(data.title, 1, 200, '标题');
    if (!result.valid) errors.push(result.error);
    result = validator.isString(data.title, '标题');
    if (!result.valid) errors.push(result.error);

    // 验证描述
    result = validator.required(data.description, '描述');
    if (!result.valid) errors.push(result.error);
    result = validator.length(data.description, 1, 5000, '描述');
    if (!result.valid) errors.push(result.error);
    result = validator.isString(data.description, '描述');
    if (!result.valid) errors.push(result.error);

    // 验证分类（可选但必须在允许列表中）
    if (data.category) {
      result = validator.isCategory(data.category);
      if (!result.valid) errors.push(result.error);
    }

    // 验证地点
    if (data.location) {
      result = validator.length(data.location, 0, 200, '地点');
      if (!result.valid) errors.push(result.error);
      result = validator.isString(data.location, '地点');
      if (!result.valid) errors.push(result.error);
    }

    // 验证时间
    if (data.time) {
      result = validator.isTime(data.time, '时间');
      if (!result.valid) errors.push(result.error);
    }

    // 验证价格
    if (data.price) {
      result = validator.isPrice(data.price, '价格');
      if (!result.valid) errors.push(result.error);
    }

    // 验证坐标
    if (data.latitude !== undefined && data.latitude !== null) {
      result = validator.isCoordinate(data.latitude, '纬度');
      if (!result.valid) errors.push(result.error);
      const lat = parseFloat(data.latitude);
      if (lat < -90 || lat > 90) {
        errors.push('纬度必须在-90到90之间');
      }
    }

    if (data.longitude !== undefined && data.longitude !== null) {
      result = validator.isCoordinate(data.longitude, '经度');
      if (!result.valid) errors.push(result.error);
      const lon = parseFloat(data.longitude);
      if (lon < -180 || lon > 180) {
        errors.push('经度必须在-180到180之间');
      }
    }

    // 验证URL
    if (data.source && data.source.url) {
      result = validator.isURL(data.source.url, '来源URL');
      if (!result.valid) errors.push(result.error);
    }

    // 验证人数限制
    if (data.maxParticipants !== undefined) {
      result = validator.isNumber(data.maxParticipants, '最大人数');
      if (!result.valid) errors.push(result.error);
      if (data.maxParticipants < 0) {
        errors.push('最大人数不能为负数');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * 验证并清理攻略内容
   */
  validateGuide: (data) => {
    const errors = [];

    if (data.content !== undefined) {
      let result = validator.required(data.content, '内容');
      if (!result.valid) errors.push(result.error);
      result = validator.isString(data.content, '内容');
      if (!result.valid) errors.push(result.error);
      // 限制内容长度，防止DoS
      result = validator.length(data.content, 1, 100000, '内容'); // 100KB限制
      if (!result.valid) errors.push(result.error);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

module.exports = { validator };
