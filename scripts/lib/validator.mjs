/**
 * 数据验证模块
 */

// 验证规则配置
export const validationRules = {
    title: {
        required: true,
        minLength: 2,
        maxLength: 100
    },
    category: {
        required: true,
        allowed: ['瑜伽', '冥想', '舞蹈', '徒步', '泰拳', '攀岩', '健身', '户外探险', '文化艺术', '咏春拳']
    },
    price: {
        required: true,
        pattern: /(免费|泰铢|铢|walkin|捐赠|需购买)/
    },
    time: {
        required: false,
        pattern: /^(\d{2}:\d{2}(-|,|至)\d{2}:\d{2}|灵活时间|不限时|全天|[\u4e00-\u9fa5]+)/
    }
};

/**
 * 验证单个活动数据
 */
export function validateItem(item, rules = validationRules) {
    const errors = [];
    const warnings = [];

    Object.keys(rules).forEach(field => {
        const rule = rules[field];
        const value = item[field];

        // 必填检查
        if (rule.required && !value) {
            errors.push(`${field} 是必填字段`);
            return;
        }

        if (!value) return; // 非必填且为空，跳过其他检查

        // 长度检查
        if (rule.minLength && value.length < rule.minLength) {
            errors.push(`${field} 长度不能少于 ${rule.minLength} 个字符`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${field} 长度不能超过 ${rule.maxLength} 个字符`);
        }

        // 枚举值检查
        if (rule.allowed && !rule.allowed.includes(value)) {
            warnings.push(`${field} "${value}" 不在推荐列表中: ${rule.allowed.join(', ')}`);
        }

        // 正则检查
        if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${field} 格式不正确: ${value}`);
        }
    });

    return { errors, warnings };
}

/**
 * 验证活动列表
 */
export function validateItemList(items) {
    const results = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    items.forEach((item, index) => {
        const { errors, warnings } = validateItem(item);

        if (errors.length > 0 || warnings.length > 0) {
            results.push({
                index: index + 1,
                activityNumber: item.activityNumber || item['活动编号'] || 'N/A',
                title: item.title || '未命名',
                errors,
                warnings
            });

            totalErrors += errors.length;
            totalWarnings += warnings.length;
        }
    });

    return {
        results,
        totalErrors,
        totalWarnings,
        isValid: totalErrors === 0
    };
}

/**
 * 打印验证结果
 */
export function printValidationResults(validationResult) {
    const { results, totalErrors, totalWarnings, isValid } = validationResult;

    if (isValid) {
        console.log('✅ 所有数据验证通过！');
        return;
    }

    console.log(`\n⚠️  发现 ${totalErrors} 个错误, ${totalWarnings} 个警告:\n`);

    results.forEach(result => {
        const { index, activityNumber, title, errors, warnings } = result;

        if (errors.length > 0) {
            console.log(`❌ 第 ${index} 行 (${activityNumber}) - ${title}`);
            errors.forEach(err => console.log(`   - ${err}`));
        }

        if (warnings.length > 0) {
            console.log(`⚠️  第 ${index} 行 (${activityNumber}) - ${title}`);
            warnings.forEach(warn => console.log(`   - ${warn}`));
        }
    });

    console.log(`\n总计: ${totalErrors} 错误, ${totalWarnings} 警告`);
}
