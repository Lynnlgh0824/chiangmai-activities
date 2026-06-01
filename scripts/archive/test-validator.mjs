import { validateWeekdays } from './validators.mjs';

console.log('测试验证器...\n');

const testCases = [
  '无固定时间',
  '-',
  '每天',
  '灵活时间',
  '周一,周二',
  '周三,周六,周日'
];

testCases.forEach(test => {
  const result = validateWeekdays(test);
  console.log(`输入: "${test}"`);
  console.log(`  结果: ${result.valid ? '✅ 通过' : '❌ 失败'}`);
  if (!result.valid) {
    console.log(`  错误: ${result.error}`);
  }
  console.log('');
});
