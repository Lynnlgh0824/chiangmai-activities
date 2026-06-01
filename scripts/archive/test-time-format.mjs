#!/usr/bin/env node

/**
 * 测试时间格式判断逻辑
 */

console.log('🧪 测试时间格式判断逻辑\n');

// 时间格式判断函数（与前端一致）
function isSpecificTimeFormat(time) {
    if (!time || typeof time !== 'string') return false;

    // 匹配格式：数字:数字-数字:数字
    // 例如：09:30-10:30, 8:00-18:00, 19:00-23:00
    const timePattern = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}/;
    return timePattern.test(time);
}

// 测试用例
const testCases = [
    // 应该返回 true 的用例
    { time: '09:30-10:30', expected: true, description: '标准时间格式' },
    { time: '8:00-18:00', expected: true, description: '单 digit 小时' },
    { time: '19:00-23:00', expected: true, description: '晚间时间' },
    { time: '00:00-24:00', expected: true, description: '全天营业' },
    { time: '09:30-10:30, 18:30-19:30', expected: true, description: '多个时间段' },
    { time: '09:30-10:30,14:00-16:00', expected: true, description: '多个时间段（无空格）' },

    // 应该返回 false 的用例
    { time: '灵活时间', expected: false, description: '灵活时间文本' },
    { time: '待定', expected: false, description: '待定' },
    { time: 'TBD', expected: false, description: '英文缩写' },
    { time: '', expected: false, description: '空字符串' },
    { time: null, expected: false, description: 'null' },
    { time: undefined, expected: false, description: 'undefined' },
    { time: '推荐初学者参加21天课程', expected: false, description: '描述性文本' },
    { time: '每周三、六、日', expected: false, description: '星期描述' },
    { time: '9am-5pm', expected: false, description: '非冒号格式' },
    { time: '上午9点-下午5点', expected: false, description: '中文描述' }
];

console.log('测试结果：\n');
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    const result = isSpecificTimeFormat(testCase.time);
    const status = result === testCase.expected ? '✅ 通过' : '❌ 失败';

    if (result === testCase.expected) {
        passed++;
    } else {
        failed++;
    }

    console.log(`${index + 1}. ${testCase.description}`);
    console.log(`   输入: "${testCase.time}"`);
    console.log(`   期望: ${testCase.expected}`);
    console.log(`   实际: ${result}`);
    console.log(`   ${status}`);
    console.log('');
});

console.log('═════════════════════════════');
console.log(`总计: ${testCases.length} 个测试`);
console.log(`通过: ${passed} 个`);
console.log(`失败: ${failed} 个`);
console.log(`成功率: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
    console.log('\n✨ 所有测试通过！');
} else {
    console.log('\n⚠️  有测试失败，请检查逻辑');
    process.exit(1);
}
