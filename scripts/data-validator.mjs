#!/usr/bin/env node
/**
 * 活动数据校验工具
 * 用于检查活动数据的准确性、完整性和一致性
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'items.json');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// ========== 校验规则定义 ==========

const validators = {
  // 1. 必填字段检查
  requiredFields: (item) => {
    const required = ['id', 'title', 'category', 'location', 'price', 'description', 'status'];
    const missing = required.filter(field => !item[field]);
    return missing.length === 0
      ? null
      : { type: 'error', field: 'required', message: `缺失必填字段: ${missing.join(', ')}` };
  },

  // 2. 字段长度检查
  fieldLength: (item) => {
    const issues = [];
    if (item.title && item.title.length < 3) {
      issues.push('标题过短（< 3字符）');
    }
    if (item.title && item.title.length > 100) {
      issues.push('标题过长（> 100字符）');
    }
    if (item.description && item.description.length < 20) {
      issues.push('描述过短（< 20字符）');
    }
    if (item.description && item.description.length > 2000) {
      issues.push('描述过长（> 2000字符）');
    }
    return issues.length === 0
      ? null
      : { type: 'warning', field: 'length', message: issues.join('; ') };
  },

  // 3. 价格格式检查
  priceFormat: (item) => {
    if (!item.price) return null;

    const issues = [];
    // 检查是否包含数字
    if (!/\d/.test(item.price)) {
      issues.push('价格缺少数字');
    }
    // 检查是否包含货币单位
    if (!item.price.match(/泰铢|铢|THB|฿|บาท/i)) {
      issues.push('缺少泰铢货币单位');
    }
    // 检查是否包含单位信息（如 /小时 /次）
    if (!item.price.match(/\/|每|每次|小时|天|次/)) {
      issues.push('缺少计价单位（如/小时/次）');
    }

    return issues.length === 0
      ? null
      : { type: 'warning', field: 'price', message: issues.join('; ') };
  },

  // 4. 状态值检查
  statusValue: (item) => {
    const validStatus = ['进行中', '已暂停', '草稿', '待开始', '已过期'];
    if (!item.status || validStatus.includes(item.status)) {
      return null;
    }
    return {
      type: 'error',
      field: 'status',
      message: `无效状态值: "${item.status}"，有效值为: ${validStatus.join(', ')}`
    };
  },

  // 5. 分类值检查
  categoryValue: (item) => {
    const validCategories = [
      '运动', '健身', '瑜伽', '舞蹈', '泰拳', '徒步', '冥想',
      '文化艺术', '音乐', '市集', '语言交换', '英语角', '咏春拳'
    ];
    if (!item.category) return null;

    // 检查是否为已知分类
    if (!validCategories.includes(item.category)) {
      return {
        type: 'warning',
        field: 'category',
        message: `未知分类: "${item.category}"`
      };
    }
    return null;
  },

  // 6. 星期数据检查
  weekdaysData: (item) => {
    if (!item.weekdays || item.weekdays.length === 0) {
      return null;
    }

    const validWeekdays = [
      '周一', '周二', '周三', '周四', '周五', '周六', '周日',
      '无固定时间', '工作日', '周末'
    ];

    const invalid = item.weekdays.filter(day => !validWeekdays.includes(day));
    if (invalid.length > 0) {
      return {
        type: 'error',
        field: 'weekdays',
        message: `无效的星期值: ${invalid.join(', ')}`
      };
    }
    return null;
  },

  // 7. 官网链接检查
  sourceLink: (item) => {
    if (!item.sourceLink || item.sourceLink === '') {
      return {
        type: 'info',
        field: 'sourceLink',
        message: '缺少官网链接'
      };
    }

    if (item.sourceLink && !item.sourceLink.match(/^https?:\/\//)) {
      return {
        type: 'error',
        field: 'sourceLink',
        message: '官网链接格式错误（应以 http:// 或 https:// 开头）'
      };
    }
    return null;
  },

  // 8. ID 唯一性检查（在主循环中处理）
  duplicateId: (item, allItems) => {
    const duplicates = allItems.filter(i => i.id === item.id);
    if (duplicates.length > 1) {
      return {
        type: 'error',
        field: 'id',
        message: `ID 重复，出现 ${duplicates.length} 次`
      };
    }
    return null;
  },

  // 9. 标题重复检查（在主循环中处理）
  duplicateTitle: (item, allItems) => {
    const duplicates = allItems.filter(i =>
      i.id !== item.id && i.title === item.title
    );
    if (duplicates.length > 0) {
      return {
        type: 'warning',
        field: 'title',
        message: `标题与 ${duplicates.map(d => d.id).join(', ')} 重复`
      };
    }
    return null;
  },

  // 10. 描述重复检查
  duplicateDescription: (item, allItems) => {
    if (!item.description || item.description.length < 50) return null;

    const duplicates = allItems.filter(i =>
      i.id !== item.id &&
      i.description &&
      i.description.length > 50 &&
      i.description === item.description
    );

    if (duplicates.length > 0) {
      return {
        type: 'warning',
        field: 'description',
        message: `描述与 ${duplicates.map(d => d.id).join(', ')} 完全相同`
      };
    }
    return null;
  },

  // 11. 电话号码检查
  phoneNumber: (item) => {
    const phonePatterns = [
      /电话|联系方式|预约|booking/i,
      /\d{3}[-\s]?\d{3}[-\s]?\d{4}/,
      /0[0-9]{8,10}/,
      /\+66[0-9]{8,10}/
    ];

    const hasPhoneInDesc = item.description &&
      phonePatterns.some(pattern => pattern.test(item.description));

    const hasPhoneInLink = item.sourceLink &&
      (item.sourceLink.includes('facebook') ||
       item.sourceLink.includes('line.me') ||
       item.sourceLink.includes('instagram'));

    if (!hasPhoneInDesc && !hasPhoneInLink && item.requireBooking === '是') {
      return {
        type: 'info',
        field: 'contact',
        message: '需要预约但缺少联系方式'
      };
    }
    return null;
  },

  // 12. 地点信息检查
  locationInfo: (item) => {
    if (!item.location) return null;

    const hasDetailedInfo =
      item.location.includes('清迈') ||
      item.location.match(/路|街|巷|区|塔|Temple|Wat/i);

    if (!hasDetailedInfo && item.location.length < 10) {
      return {
        type: 'info',
        field: 'location',
        message: '地点信息较简略，建议补充详细地址'
      };
    }
    return null;
  }
};

// ========== 主校验函数 ==========

function validateData() {
  log(colors.blue, '\n📊 开始数据校验...\n');

  // 读取数据文件
  if (!fs.existsSync(DATA_FILE)) {
    log(colors.red, `❌ 数据文件不存在: ${DATA_FILE}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  log(colors.blue, `📁 已加载 ${data.length} 条活动数据\n`);

  const results = {
    total: data.length,
    errors: [],
    warnings: [],
    infos: [],
    summary: {
      byField: {},
      byType: { error: 0, warning: 0, info: 0 }
    }
  };

  // 逐条校验
  data.forEach((item, index) => {
    const itemIssues = [];

    // 运行所有校验器
    Object.values(validators).forEach(validator => {
      try {
        const result = validator(item, data);
        if (result) {
          itemIssues.push(result);
        }
      } catch (error) {
        itemIssues.push({
          type: 'error',
          field: 'validator',
          message: `校验器执行错误: ${error.message}`
        });
      }
    });

    // 记录问题
    itemIssues.forEach(issue => {
      const record = {
        index: index + 1,
        id: item.id,
        title: item.title,
        ...issue
      };

      const targetArray = issue.type === 'info' ? 'infos' : issue.type + 's';
      results[targetArray].push(record);
      results.summary.byType[issue.type]++;

      // 按字段统计
      if (!results.summary.byField[issue.field]) {
        results.summary.byField[issue.field] = { error: 0, warning: 0, info: 0 };
      }
      results.summary.byField[issue.field][issue.type]++;
    });
  });

  // 打印结果
  printResults(results);

  // 返回退出码
  return results.summary.byType.error > 0 ? 1 : 0;
}

function printResults(results) {
  // 打印概览
  log(colors.blue, '\n📋 校验概览:\n');
  log(colors.green, `   ✅ 通过: ${results.total - results.errors.length - results.warnings.length}/${results.total}`);
  log(colors.red, `   ❌ 错误: ${results.errors.length}`);
  log(colors.yellow, `   ⚠️  警告: ${results.warnings.length}`);
  log(colors.blue, `   ℹ️  信息: ${results.infos.length}\n`);

  // 打印错误
  if (results.errors.length > 0) {
    log(colors.red, `\n❌ 错误详情 (${results.errors.length}):\n`);
    results.errors.forEach(err => {
      log(colors.red, `   [${err.id}] ${err.title}`);
      log(colors.red, `      ${err.field}: ${err.message}\n`);
    });
  }

  // 打印警告
  if (results.warnings.length > 0) {
    log(colors.yellow, `\n⚠️  警告详情 (${results.warnings.length}):\n`);
    results.warnings.forEach(warn => {
      log(colors.yellow, `   [${warn.id}] ${warn.title}`);
      log(colors.yellow, `      ${warn.field}: ${warn.message}\n`);
    });
  }

  // 打印信息
  if (results.infos.length > 0) {
    log(colors.blue, `\nℹ️  建议信息 (${results.infos.length}):\n`);
    results.infos.forEach(info => {
      log(colors.blue, `   [${info.id}] ${info.title}`);
      log(colors.blue, `      ${info.field}: ${info.message}\n`);
    });
  }

  // 按字段统计
  if (Object.keys(results.summary.byField).length > 0) {
    log(colors.blue, `\n📊 问题按字段分布:\n`);
    Object.entries(results.summary.byField).forEach(([field, counts]) => {
      log(colors.blue, `   ${field}:`);
      log(colors.red, `      错误: ${counts.error}`);
      log(colors.yellow, `      警告: ${counts.warning}`);
      log(colors.blue, `      信息: ${counts.info}`);
    });
  }

  // 打印建议
  printSuggestions(results);
}

function printSuggestions(results) {
  const suggestions = [];

  if (results.summary.byField.sourceLink?.error > 10) {
    suggestions.push('💡 建议补充官网链接，提升信息可信度');
  }

  if (results.summary.byField.price?.warning > 5) {
    suggestions.push('💡 建议统一价格格式，包含货币单位和计价单位');
  }

  if (results.summary.byField.contact?.info > 10) {
    suggestions.push('💡 建议添加联系电话或社交账号，方便用户预约');
  }

  if (results.summary.byField.description?.warning > 5) {
    suggestions.push('💡 建议补充更详细的活动描述');
  }

  if (suggestions.length > 0) {
    log(colors.blue, '\n💡 改进建议:\n');
    suggestions.forEach(s => log(colors.blue, `   ${s}`));
  }
}

// ========== 运行 ==========

const exitCode = validateData();
process.exit(exitCode);
