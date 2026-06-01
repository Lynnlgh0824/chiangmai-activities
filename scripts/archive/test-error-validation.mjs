#!/usr/bin/env node

/**
 * 测试验证错误提示功能
 * 模拟包含各种错误的Excel数据
 */

import { validateBatch } from './validators.mjs';

console.log('🧪 测试数据验证错误提示功能\n');

// 模拟包含各种错误的数据
const testData = [
    {
        activityNumber: 'TEST001',
        title: '',  // 错误：标题为空
        category: '测试',
        location: '测试地点',
        time: '09:00-10:00',
        price: '免费',
        weekdays: '周一',
    },
    {
        activityNumber: 'TEST002',
        title: '测试活动2',
        category: '',  // 错误：分类为空
        location: '测试地点',
        time: '09:00-10:00',
        price: '免费',
        weekdays: '周一',
    },
    {
        activityNumber: 'TEST003',
        title: '测试活动3',
        category: '测试',
        location: '',  // 错误：地点为空
        time: '09:00-10:00',
        price: '免费',
        weekdays: '周一',
    },
    {
        activityNumber: 'TEST004',
        title: '测试活动4',
        category: '测试',
        location: '测试地点',
        time: '',  // 错误：时间为空
        price: '免费',
        weekdays: '周一',
    },
    {
        activityNumber: 'TEST005',
        title: '测试活动5',
        category: '测试',
        location: '测试地点',
        time: 'invalid-time',  // 错误：时间格式错误
        price: '免费',
        weekdays: '周一',
    },
    {
        activityNumber: 'TEST006',
        title: '测试活动6',
        category: '测试',
        location: '测试地点',
        time: '09:00-10:00',
        price: '',  // 错误：价格为空
        weekdays: '周一',
    },
    {
        activityNumber: 'TEST007',
        title: '测试活动7',
        category: '测试',
        location: '测试地点',
        time: '09:00-10:00',
        price: '免费',
        weekdays: '错误的星期',  // 错误：星期格式错误
    },
];

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('开始验证测试数据...\n');

const result = validateBatch(testData, {
    existingData: [],
    checkTitleUniqueness: false
});

console.log('📊 验证结果:');
console.log(`   总数: ${result.summary.total} 条`);
console.log(`   通过: ${result.summary.success} 条`);
console.log(`   失败: ${result.summary.failed} 条\n`);

if (result.errors.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⚠️  发现 ${result.errors.length} 个验证错误:\n`);

    // 显示所有错误
    result.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. 第${err.itemCount}行 "${err.item}":`);
        console.log(`      ❌ 字段: ${err.fieldName}`);
        console.log(`      📝 错误: ${err.error}`);
        if (err.suggestion) {
            console.log(`      💡 建议: ${err.suggestion}`);
        }
        console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 错误提示功能测试完成');
    console.log('\n💡 在实际导入时，这些错误会：');
    console.log('   1. 显示在控制台');
    console.log('   2. 保存到 logs/import-error-*.json');
    console.log('   3. 保存到 logs/import-error-*.md (Markdown格式)');
    console.log('   4. 导入过程会被中止，直到修正所有错误');
} else {
    console.log('✅ 所有数据验证通过');
}
