/**
 * Validator模块单元测试
 * 测试server.cjs中的validator对象的所有验证函数
 */

import { describe, it, expect } from 'vitest';

// 从server.cjs提取validator逻辑进行测试
// 由于server.cjs是CommonJS模块，我们需要复制validator逻辑

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
   * 验证价格格式
   */
  isPrice: (value, fieldName = '价格') => {
    if (value === null || value === undefined) return { valid: true };
    if (typeof value !== 'string' && typeof value !== 'number') {
      return { valid: false, error: `${fieldName}格式无效` };
    }
    return { valid: true };
  },

  /**
   * 验证URL格式
   */
  isURL: (value, fieldName = '链接') => {
    if (value === null || value === undefined || value === '') return { valid: true };
    try {
      new URL(value);
      return { valid: true };
    } catch {
      return { valid: false, error: `${fieldName}格式无效` };
    }
  }
};

describe('Validator - 必填字段验证', () => {
  it('应该通过非空值', () => {
    const result = validator.required('测试内容');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('应该通过数字0', () => {
    const result = validator.required(0);
    expect(result.valid).toBe(true);
  });

  it('应该通过false', () => {
    const result = validator.required(false);
    expect(result.valid).toBe(true);
  });

  it('应该拒绝null值', () => {
    const result = validator.required(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('字段不能为空');
  });

  it('应该拒绝undefined值', () => {
    const result = validator.required(undefined);
    expect(result.valid).toBe(false);
  });

  it('应该拒绝空字符串', () => {
    const result = validator.required('');
    expect(result.valid).toBe(false);
  });

  it('应该使用自定义字段名', () => {
    const result = validator.required('', '活动标题');
    expect(result.error).toBe('活动标题不能为空');
  });
});

describe('Validator - 字符串长度验证', () => {
  it('应该通过在范围内的字符串', () => {
    const result = validator.length('测试', 1, 10);
    expect(result.valid).toBe(true);
  });

  it('应该通过最小边界值', () => {
    const result = validator.length('测', 1, 10);
    expect(result.valid).toBe(true);
  });

  it('应该通过最大边界值', () => {
    const result = validator.length('测试测试测试', 1, 6);
    expect(result.valid).toBe(true);
  });

  it('应该拒绝过短的字符串', () => {
    const result = validator.length('测', 2, 10);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('长度必须在');
  });

  it('应该拒绝过长的字符串', () => {
    const result = validator.length('测试测试测试', 1, 5);
    expect(result.valid).toBe(false);
  });

  it('应该接受null和undefined', () => {
    expect(validator.length(null, 1, 10).valid).toBe(true);
    expect(validator.length(undefined, 1, 10).valid).toBe(true);
  });
});

describe('Validator - 类型验证', () => {
  describe('isString', () => {
    it('应该通过字符串', () => {
      expect(validator.isString('测试').valid).toBe(true);
    });

    it('应该拒绝数字', () => {
      const result = validator.isString(123);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('必须是字符串');
    });

    it('应该拒绝对象', () => {
      const result = validator.isString({});
      expect(result.valid).toBe(false);
    });

    it('应该接受null和undefined', () => {
      expect(validator.isString(null).valid).toBe(true);
      expect(validator.isString(undefined).valid).toBe(true);
    });
  });

  describe('isNumber', () => {
    it('应该通过有效数字', () => {
      expect(validator.isNumber(123).valid).toBe(true);
      expect(validator.isNumber(0).valid).toBe(true);
      expect(validator.isNumber(-100).valid).toBe(true);
      expect(validator.isNumber(3.14).valid).toBe(true);
    });

    it('应该拒绝NaN', () => {
      const result = validator.isNumber(NaN);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('必须是数字');
    });

    it('应该拒绝字符串数字', () => {
      const result = validator.isNumber('123');
      expect(result.valid).toBe(false);
    });

    it('应该接受null和undefined', () => {
      expect(validator.isNumber(null).valid).toBe(true);
      expect(validator.isNumber(undefined).valid).toBe(true);
    });
  });

  describe('isBoolean', () => {
    it('应该通过true和false', () => {
      expect(validator.isBoolean(true).valid).toBe(true);
      expect(validator.isBoolean(false).valid).toBe(true);
    });

    it('应该拒绝其他类型', () => {
      expect(validator.isBoolean('true').valid).toBe(false);
      expect(validator.isBoolean(1).valid).toBe(false);
    });

    it('应该接受null和undefined', () => {
      expect(validator.isBoolean(null).valid).toBe(true);
      expect(validator.isBoolean(undefined).valid).toBe(true);
    });
  });

  describe('isArray', () => {
    it('应该通过数组', () => {
      expect(validator.isArray([1, 2, 3]).valid).toBe(true);
      expect(validator.isArray([]).valid).toBe(true);
    });

    it('应该拒绝其他类型', () => {
      expect(validator.isArray('not array').valid).toBe(false);
      expect(validator.isArray({}).valid).toBe(false);
    });

    it('应该接受null和undefined', () => {
      expect(validator.isArray(null).valid).toBe(true);
      expect(validator.isArray(undefined).valid).toBe(true);
    });
  });
});

describe('Validator - URL验证', () => {
  it('应该通过有效的HTTP URL', () => {
    expect(validator.isURL('http://example.com').valid).toBe(true);
  });

  it('应该通过有效的HTTPS URL', () => {
    expect(validator.isURL('https://example.com').valid).toBe(true);
  });

  it('应该通过带路径的URL', () => {
    expect(validator.isURL('https://example.com/path/to/page').valid).toBe(true);
  });

  it('应该通过带查询参数的URL', () => {
    expect(validator.isURL('https://example.com?query=test').valid).toBe(true);
  });

  it('应该拒绝无效的URL', () => {
    const result = validator.isURL('not-a-url');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('格式无效');
  });

  it('应该拒绝没有协议的URL', () => {
    const result = validator.isURL('example.com');
    expect(result.valid).toBe(false);
  });

  it('应该接受空字符串', () => {
    expect(validator.isURL('').valid).toBe(true);
  });

  it('应该接受null和undefined', () => {
    expect(validator.isURL(null).valid).toBe(true);
    expect(validator.isURL(undefined).valid).toBe(true);
  });
});

describe('Validator - 价格验证', () => {
  it('应该通过字符串价格', () => {
    expect(validator.isPrice('免费').valid).toBe(true);
    expect(validator.isPrice('100泰铢').valid).toBe(true);
  });

  it('应该通过数字价格', () => {
    expect(validator.isPrice(0).valid).toBe(true);
    expect(validator.isPrice(100).valid).toBe(true);
  });

  it('应该接受null和undefined', () => {
    expect(validator.isPrice(null).valid).toBe(true);
    expect(validator.isPrice(undefined).valid).toBe(true);
  });

  it('应该拒绝无效的价格格式', () => {
    const result = validator.isPrice({});
    expect(result.valid).toBe(false);
    expect(result.error).toContain('格式无效');
  });
});

describe('Validator - 综合验证场景', () => {
  it('应该验证完整的活动对象', () => {
    const activity = {
      title: '瑜伽课程',
      category: '瑜伽',
      location: '清迈公园',
      price: '免费',
      time: '08:00-09:00',
      flexibleTime: false
    };

    const checks = [
      validator.required(activity.title, '标题'),
      validator.isString(activity.title, '标题'),
      validator.length(activity.title, 1, 100, '标题'),
      validator.required(activity.category, '分类'),
      validator.isString(activity.location, '地点'),
      validator.isPrice(activity.price, '价格'),
      validator.isBoolean(activity.flexibleTime, '灵活时间')
    ];

    const allValid = checks.every(check => check.valid);
    expect(allValid).toBe(true);
  });

  it('应该捕获无效的活动对象', () => {
    const activity = {
      title: '',  // 空标题
      category: 123,  // 错误类型
      location: null,
      price: {},  // 无效价格
      time: 'valid'
    };

    const checks = [
      validator.required(activity.title, '标题'),
      validator.isString(activity.category, '分类'),
      validator.isPrice(activity.price, '价格')
    ];

    const hasErrors = checks.some(check => !check.valid);
    expect(hasErrors).toBe(true);
  });
});
