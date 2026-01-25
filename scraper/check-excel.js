const XLSX = require('xlsx');

console.log('=== 检查新写入的数据（第51-70行）===\n');

const workbook = XLSX.readFile('../清迈活动数据.xlsx');
const sheet = workbook.Sheets['全部活动'];

// 读取第51-55行的数据
for (let row = 51; row <= 55; row++) {
  console.log(`第${row}行数据:`);
  const title = sheet['B' + row]?.v;
  const category = sheet['C' + row]?.v;
  const price = sheet['L' + row]?.v;
  const timeInfo = sheet['F' + row]?.v;
  const weekday = sheet['G' + row]?.v;
  const time = sheet['H' + row]?.v;
  const location = sheet['J' + row]?.v;

  console.log(`  标题: ${title}`);
  console.log(`  分类: ${category} | 价格: ${price}`);
  console.log(`  类型: ${timeInfo}`);
  console.log(`  时间: ${weekday || ''} ${time}`);
  console.log(`  地点: ${location}`);
  console.log('');
}

// 检查所有69行数据
console.log('\n=== 总数据统计 ===');
const allData = XLSX.utils.sheet_to_json(sheet);
console.log(`总行数: ${allData.length}`);

// 统计有效数据
let validCount = 0;
allData.forEach((row, i) => {
  if (row['活动标题*'] && row['活动标题*'] !== 'undefined') {
    validCount++;
  }
});
console.log(`有效数据行数: ${validCount}`);
