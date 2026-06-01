#!/usr/bin/env node

/**
 * 统一的数据验证模块
 * 用于 Excel 导入和数据验证
 *
 * 核心原则：
 * - 灵活的验证规则（宽松模式）
 * - 强调数据完整性（活动编号唯一性）
 * - 友好的错误提示
 */

// =====================================================
// 价格格式验证
// =====================================================

/**
 * 价格格式验证（宽松模式）
 * 允许格式：免费、100฿、100-500฿、1,000฿、walkin、待定、TBD
 * 或者包含泰铢/铢的文字描述、捐赠、购买等
 *
 * @param {string} price - 价格字符串
 * @returns {Object} { valid: boolean, error?: string, suggestion?: string }
 */
export function validatePrice(price) {
  if (!price || price.trim() === '') {
    return {
      valid: false,
      error: '价格不能为空',
      suggestion: '请填写价格，例如："免费"、"100฿"、"捐赠"'
    };
  }

  const trimmedPrice = price.trim();

  // 特殊值
  const specialValues = ['免费', 'walkin', 'walk-in', '待定', 'TBD', 'tbd', 'Walk In', '捐赠', '捐赠 '];
  if (specialValues.includes(trimmedPrice)) return { valid: true };

  // 包含"免费"的文字
  if (trimmedPrice.includes('免费')) return { valid: true };

  // 包含"捐赠"或"购买"的文字描述
  if (trimmedPrice.includes('捐赠') || trimmedPrice.includes('购买')) return { valid: true };

  // 标准格式：100฿、1,000฿、100-500฿
  const patterns = [
    /^\d+฿$/,                    // 100฿
    /^[\d,]+฿$/,                  // 1,000฿
    /^\d+-\d+฿$/                  // 100-500฿
  ];

  for (const pattern of patterns) {
    if (pattern.test(trimmedPrice)) return { valid: true };
  }

  // 包含泰铢符号或文字：50泰铢、1100铢、100฿等
  if (/[฿泰铢铢]/.test(trimmedPrice)) return { valid: true };

  // 包含数字的合理价格描述
  if (/\d+/.test(trimmedPrice)) return { valid: true };

  // 其他任何非空文本都作为有效价格（允许自定义描述）
  if (trimmedPrice.length > 0) return { valid: true };

  return {
    valid: false,
    error: '价格格式错误',
    suggestion: '请检查价格格式，例如："免费"、"100฿"、"50泰铢"、"捐赠"'
  };
}

// =====================================================
// 时间格式验证
// =====================================================

/**
 * 时间格式验证（宽松模式）
 * 允许格式：HH:MM-HH:MM、多个时间段（逗号分隔）、灵活时间、待定
 *
 * @param {string} time - 时间字符串
 * @returns {Object} { valid: boolean, error?: string, suggestion?: string }
 */
export function validateTime(time) {
  if (!time || time.trim() === '') {
    return {
      valid: false,
      error: '时间不能为空',
      suggestion: '请填写时间，例如："09:00-10:30" 或 "灵活时间"'
    };
  }

  const trimmedTime = time.trim();

  // 特殊值
  if (['灵活时间', '待定', 'TBD', '全天'].includes(trimmedTime)) {
    return { valid: true };
  }

  // 匹配单个或多个时间段：08:30-09:45 或 09:30-10:30, 18:30-19:30
  const timePattern = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}(,\s*\d{1,2}:\d{2}-\d{1,2}:\d{2})*$/;

  if (timePattern.test(trimmedTime)) {
    return { valid: true };
  }

  // 如果包含日期描述（如"每周三、六、日"），直接接受为有效
  // 这种情况下活动时间不是标准的HH:MM格式，而是描述性的
  if (trimmedTime.includes('周') || trimmedTime.includes('每天') ||
      trimmedTime.includes('课程') || trimmedTime.includes('登记') ||
      trimmedTime.includes('推荐') || trimmedTime.includes('标准')) {
    return { valid: true };
  }

  return {
    valid: false,
    error: '时间格式错误',
    suggestion: '请使用格式：HH:MM-HH:MM 或 HH:MM-HH:MM, HH:MM-HH:MM，例如："08:30-09:45" 或 "09:30-10:30, 18:30-19:30"'
  };
}

// =====================================================
// 星期枚举验证
// =====================================================

/**
 * 星期枚举验证（宽松模式）
 * 允许空值（灵活时间活动）
 *
 * @param {string|array} weekdays - 星期（字符串或数组）
 * @returns {Object} { valid: boolean, error?: string, suggestion?: string }
 */
export function validateWeekdays(weekdays) {
  const validDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // 空值或未定义 - 允许（灵活时间活动）
  if (!weekdays || (Array.isArray(weekdays) && weekdays.length === 0)) {
    return { valid: true };
  }

  // 特殊值（必须在字符串分割之前检查）
  if (typeof weekdays === 'string') {
    // 如果是特殊值，直接返回有效
    if (['灵活时间', '待定', 'TBD', '无固定时间', '-', '每天'].includes(weekdays)) {
      return { valid: true };
    }
    // 否则分割后检查
    const daysArray = weekdays.split(/[,，、]/).map(d => d.trim()).filter(d => d);
    return validateWeekdays(daysArray);
  }

  // 如果是数组，检查每个元素
  if (Array.isArray(weekdays)) {
    // 检查是否包含特殊值（如只有"无固定时间"的数组）
    if (weekdays.length === 1 && ['灵活时间', '待定', 'TBD', '无固定时间', '-', '每天'].includes(weekdays[0])) {
      return { valid: true };
    }
    const invalid = weekdays.filter(day => day && !validDays.includes(day));
    if (invalid.length > 0) {
      return {
        valid: false,
        error: `星期格式错误：${invalid.join(', ')}`,
        suggestion: '星期只能是：周一、周二、周三、周四、周五、周六、周日'
      };
    }
    return { valid: true };
  }

  return { valid: true };
}

// =====================================================
// 必填字段验证
// =====================================================

/**
 * 必填字段验证
 * 注意：weekdays 不是必填字段（灵活时间活动）
 *
 * @param {Object} item - 活动对象
 * @returns {Object} { valid: boolean, errors?: Array }
 */
export function validateRequiredFields(item) {
  const required = ['title', 'category', 'location', 'time'];
  const errors = [];

  const fieldNameMap = {
    title: '活动标题',
    category: '分类',
    location: '地点',
    time: '时间'
  };

  required.forEach(field => {
    const value = item[field];
    const isEmpty = !value ||
                   (typeof value === 'string' && value.trim() === '') ||
                   (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      errors.push({
        field,
        fieldName: fieldNameMap[field] || field,
        error: `${fieldNameMap[field]}不能为空`,
        suggestion: '此字段为必填项，请填写内容'
      });
    }
  });

  if (errors.length > 0) {
    return {
      valid: false,
      errors
    };
  }

  return { valid: true };
}

// =====================================================
// 活动编号唯一性验证
// =====================================================

/**
 * 验证活动编号是否唯一
 * 支持自动生成新编号
 *
 * @param {string} activityNumber - 活动编号
 * @param {Array} existingData - 现有数据数组
 * @param {Object} currentItem - 当前正在处理的活动对象
 * @param {Array} currentBatchData - 当前批次数据（用于检测Excel内部重复）
 * @returns {Object} { valid: boolean, error?: string, suggestion?: string, autoGenerated?: boolean }
 */
export function validateActivityNumberUnique(activityNumber, existingData = [], currentItem = {}, currentBatchData = []) {
  // 允许空值（后续会自动生成）
  if (!activityNumber || activityNumber.trim() === '') {
    return {
      valid: true,
      willAutoGenerate: true,
      suggestion: '活动编号为空，将自动生成'
    };
  }

  const num = activityNumber.trim();

  // 检查是否在现有数据中已存在（排除自己）
  const existsInDatabase = existingData.some(item => {
    const existingNum = String(item.activityNumber || item['活动编号'] || '');
    // 如果是更新操作，跳过自己
    if (currentItem.activityNumber && existingNum === String(currentItem.activityNumber)) {
      return false;
    }
    return existingNum === num;
  });

  if (existsInDatabase) {
    return {
      valid: false,
      error: `活动编号 "${num}" 已存在于数据库中`,
      suggestion: '请使用不同的活动编号，或清空编号以自动生成'
    };
  }

  // 检查当前批次中是否重复（排除自己）
  const existsInBatch = currentBatchData.some((item, index) => {
    if (item._tempIndex === undefined || item._tempIndex === currentItem._tempIndex) {
      return false; // 跳过自己
    }
    return String(item.activityNumber || item['活动编号'] || '') === num;
  });

  if (existsInBatch) {
    return {
      valid: false,
      error: `活动编号 "${num}" 在当前导入批次中重复`,
      suggestion: '请确保每个活动的编号唯一，或清空编号以自动生成'
    };
  }

  return { valid: true };
}

/**
 * 为新活动生成唯一的活动编号
 *
 * @param {Array} existingData - 现有数据数组
 * @returns {string} 新的活动编号（格式：0001, 0002, ...）
 */
export function generateActivityNumber(existingData = []) {
  // 提取所有现有的活动编号
  const existingNumbers = existingData
    .map(item => {
      const num = String(item.activityNumber || item['活动编号'] || '');
      const match = num.match(/^\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter(num => num > 0);

  // 找到最大编号
  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;

  // 生成新编号（格式：0001, 0002, ...）
  const newNumber = maxNumber + 1;
  return String(newNumber).padStart(4, '0');
}

// =====================================================
// 综合验证
// =====================================================

/**
 * 对单个活动项进行完整验证
 *
 * @param {Object} item - 活动对象
 * @param {number} index - 在数组中的索引（用于错误提示）
 * @param {Object} options - 验证选项
 * @param {Array} options.existingData - 现有数据（用于唯一性检查）
 * @param {Array} options.currentBatchData - 当前批次数据（用于批次内重复检查）
 * @param {boolean} options.checkUniqueness - 是否检查唯一性（默认：true）
 * @param {boolean} options.autoGenerateNumbers - 是否自动生成编号（默认：false）
 * @param {boolean} options.checkTitleUniqueness - 是否检查标题唯一性（默认：true）
 * @returns {Object} { valid: boolean, errors: Array, autoGenerated?: boolean }
 */
export function validateItem(item, index = 0, options = {}) {
  const {
    existingData = [],
    currentBatchData = [],
    checkUniqueness = true,
    autoGenerateNumbers = false,
    checkTitleUniqueness = true
  } = options;

  const errors = [];
  const rowCount = index + 1;
  const itemTitle = item.title || '未命名活动';
  let autoGenerated = false;

  // 标记当前项的索引，用于批次内重复检查
  item._tempIndex = index;

  // 1. 必填字段检查
  const requiredCheck = validateRequiredFields(item);
  if (!requiredCheck.valid) {
    requiredCheck.errors.forEach(err => {
      errors.push({
        ...err,
        itemCount: rowCount,
        item: itemTitle
      });
    });
  }

  // 2. 价格格式验证
  if (item.price) {
    const priceCheck = validatePrice(item.price);
    if (!priceCheck.valid) {
      errors.push({
        field: 'price',
        fieldName: '价格',
        itemCount: rowCount,
        item: itemTitle,
        ...priceCheck
      });
    }
  }

  // 3. 时间格式验证
  if (item.time) {
    const timeCheck = validateTime(item.time);
    if (!timeCheck.valid) {
      errors.push({
        field: 'time',
        fieldName: '时间',
        itemCount: rowCount,
        item: itemTitle,
        ...timeCheck
      });
    }
  }

  // 4. 星期枚举验证
  if (item.weekdays) {
    const weekdaysCheck = validateWeekdays(item.weekdays);
    if (!weekdaysCheck.valid) {
      errors.push({
        field: 'weekdays',
        fieldName: '星期',
        itemCount: rowCount,
        item: itemTitle,
        ...weekdaysCheck
      });
    }
  }

  // 5. 活动编号唯一性验证
  if (checkUniqueness) {
    const uniquenessCheck = validateActivityNumberUnique(
      item.activityNumber,
      existingData,
      item,
      currentBatchData
    );

    if (!uniquenessCheck.valid) {
      errors.push({
        field: 'activityNumber',
        fieldName: '活动编号',
        itemCount: rowCount,
        item: itemTitle,
        ...uniquenessCheck
      });
    } else if (uniquenessCheck.willAutoGenerate && autoGenerateNumbers) {
      // 自动生成活动编号
      const newNumber = generateActivityNumber(existingData);
      item.activityNumber = newNumber;
      item.id = newNumber; // 同时更新 id
      existingData.push(item); // 添加到现有数据中，避免重复生成
      autoGenerated = true;
    }
  }

  // 6. 活动标题唯一性验证
  if (checkTitleUniqueness) {
    const titleCheck = validateTitleUnique(
      item.title,
      existingData,
      item,
      currentBatchData
    );

    if (!titleCheck.valid) {
      errors.push({
        field: 'title',
        fieldName: '活动标题',
        itemCount: rowCount,
        item: itemTitle,
        ...titleCheck
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    autoGenerated
  };
}

/**
 * 验证活动标题是否唯一
 *
 * @param {string} title - 活动标题
 * @param {Array} existingData - 现有数据数组
 * @param {Object} currentItem - 当前正在处理的活动对象
 * @param {Array} currentBatchData - 当前批次数据（用于检测Excel内部重复）
 * @returns {Object} { valid: boolean, error?: string, suggestion?: string, duplicates?: Array }
 */
export function validateTitleUnique(title, existingData = [], currentItem = {}, currentBatchData = []) {
  if (!title || title.trim() === '') {
    return {
      valid: false,
      error: '活动标题不能为空',
      suggestion: '请填写活动标题'
    };
  }

  const trimmedTitle = title.trim();

  // 检查是否在现有数据中已存在（排除自己）
  const duplicatesInDatabase = existingData.filter(item => {
    const existingTitle = (item.title || item['活动标题'] || '').trim();
    // 如果是更新操作，跳过自己
    if (currentItem.title && existingTitle === currentItem.title.trim()) {
      return false;
    }
    return existingTitle === trimmedTitle;
  });

  if (duplicatesInDatabase.length > 0) {
    return {
      valid: false,
      error: `活动标题 "${trimmedTitle}" 已存在于数据库中`,
      suggestion: '请使用不同的活动标题，或确认是否要更新现有活动',
      duplicates: duplicatesInDatabase.map(item => ({
        number: item.activityNumber || item['活动编号'],
        title: item.title || item['活动标题'],
        category: item.category || item['分类']
      }))
    };
  }

  // 检查当前批次中是否重复（排除自己）
  const duplicatesInBatch = currentBatchData.filter((item, index) => {
    if (item._tempIndex === undefined || item._tempIndex === currentItem._tempIndex) {
      return false; // 跳过自己
    }
    const batchTitle = (item.title || item['活动标题'] || '').trim();
    return batchTitle === trimmedTitle;
  });

  if (duplicatesInBatch.length > 0) {
    return {
      valid: false,
      error: `活动标题 "${trimmedTitle}" 在当前导入批次中重复`,
      suggestion: '请确保每个活动的标题唯一',
      duplicates: duplicatesInBatch.map(item => ({
        number: item.activityNumber || item['活动编号'],
        title: item.title || item['活动标题'],
        category: item.category || item['分类']
      }))
    };
  }

  return { valid: true };
}

/**
 * 批量验证活动数据
 *
 * @param {Array} items - 活动数组
 * @param {Object} options - 验证选项
 * @param {boolean} options.autoGenerateNumbers - 是否自动生成编号（默认：false）
 * @param {boolean} options.checkTitleUniqueness - 是否检查标题唯一性（默认：true）
 * @returns {Object} { valid: boolean, validData: Array, errors: Array, summary: Object }
 */
export function validateBatch(items, options = {}) {
  const {
    existingData = [],
    autoGenerateNumbers = false,
    checkTitleUniqueness = true
  } = options;

  const allErrors = [];
  const validData = [];
  const autoGeneratedCount = { count: 0 };

  items.forEach((item, index) => {
    const validation = validateItem(item, index, {
      existingData,
      currentBatchData: items,
      checkUniqueness: true,
      autoGenerateNumbers,
      checkTitleUniqueness
    });

    if (validation.valid) {
      validData.push(item);
      if (validation.autoGenerated) {
        autoGeneratedCount.count++;
      }
    } else {
      allErrors.push(...validation.errors);
    }
  });

  // 清理临时字段
  items.forEach(item => {
    delete item._tempIndex;
  });

  return {
    valid: allErrors.length === 0,
    validData,
    errors: allErrors,
    summary: {
      total: items.length,
      success: validData.length,
      failed: allErrors.length,
      autoGenerated: autoGeneratedCount.count
    }
  };
}

// =====================================================
// 冲突检测
// =====================================================

/**
 * 检测时间和地点冲突
 *
 * @param {Array} newData - 新数据数组
 * @param {Array} existingData - 现有数据数组
 * @returns {Array} 冲突列表
 */
export function detectTimeLocationConflicts(newData, existingData) {
  const conflicts = [];

  newData.forEach(newItem => {
    existingData.forEach(oldItem => {
      // 跳过同一个活动
      if (newItem.activityNumber === oldItem.activityNumber) {
        return;
      }

      // 如果两者都没有星期信息，跳过冲突检测
      if (!newItem.weekdays || !oldItem.weekdays) {
        return;
      }

      // 确保weekdays是数组
      const newWeekdays = Array.isArray(newItem.weekdays) ? newItem.weekdays : [];
      const oldWeekdays = Array.isArray(oldItem.weekdays) ? oldItem.weekdays : [];

      // 如果有一个为空，跳过
      if (newWeekdays.length === 0 || oldWeekdays.length === 0) {
        return;
      }

      // 检测时间冲突（至少有一个相同的星期）
      const timeOverlap = newWeekdays.some(day =>
        oldWeekdays.includes(day)
      );

      // 检测地点冲突
      const locationConflict = newItem.location === oldItem.location;

      if (timeOverlap && locationConflict) {
        conflicts.push({
          existing: oldItem,
          incoming: newItem,
          type: 'time_location_conflict',
          message: `活动"${newItem.title}"与"${oldItem.title}"在同一时间同一地点`,
          severity: 'warning' // 不阻止导入，只警告
        });
      }
    });
  });

  return conflicts;
}
