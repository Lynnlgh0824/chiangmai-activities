import XLSX from 'xlsx';
import fs from 'fs';

// 读取JSON数据
const data = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));

console.log('📊 开始清理后台数据...');
console.log('清理前:', data.length, '个活动\n');

// 按ID去重（保留有activityNumber的版本）
const uniqueMap = new Map();

data.forEach(item => {
  const id = item.id || item._id;
  if (!id) return;

  // 如果已经存在这个ID
  if (uniqueMap.has(id)) {
    const existing = uniqueMap.get(id);
    // 保留有activityNumber的版本
    if (!existing.activityNumber && item.activityNumber) {
      uniqueMap.set(id, item);
    }
  } else {
    uniqueMap.set(id, item);
  }
});

const cleaned = Array.from(uniqueMap.values());

console.log('✅ 步骤1: 去重完成');
console.log('去重后:', cleaned.length, '个活动\n');

// 为缺少编号的活动添加编号
let maxNumber = 0;
cleaned.forEach(item => {
  if (item.activityNumber) {
    const num = parseInt(item.activityNumber);
    if (num > maxNumber) maxNumber = num;
  }
});

console.log('✅ 步骤2: 当前最大编号:', maxNumber);
console.log('开始为缺少编号的活动分配编号...\n');

// 为没有编号的活动分配编号
const needNumber = [];
cleaned.forEach((item, index) => {
  if (!item.activityNumber) {
    maxNumber++;
    item.activityNumber = maxNumber.toString().padStart(4, '0');
    needNumber.push(item);
  }
});

if (needNumber.length > 0) {
  console.log(`已为 ${needNumber.length} 个活动分配编号:`);
  needNumber.forEach(item => {
    console.log(`  ${item.activityNumber} - ${item.title}`);
  });
} else {
  console.log('所有活动都已有编号');
}

console.log('\n✅ 步骤3: 编号分配完成');

// 按activityNumber排序
cleaned.sort((a, b) => {
  return parseInt(a.activityNumber) - parseInt(b.activityNumber);
});

// 保存清理后的数据
fs.writeFileSync('data/items.json', JSON.stringify(cleaned, null, 2));

console.log('\n✅ 数据清理完成！');
console.log('=' .repeat(60));
console.log('📊 最终统计:');
console.log(`  总活动数: ${cleaned.length}`);
console.log(`  有编号: ${cleaned.length}`);
console.log(`  重复: 0`);
console.log('\n📋 活动列表:');
cleaned.forEach(item => {
  console.log(`  ${item.activityNumber} - ${item.title}`);
});
console.log('=' .repeat(60));
