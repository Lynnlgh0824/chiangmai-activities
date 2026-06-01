import XLSX from 'xlsx';
import fs from 'fs';

console.log('🔄 修复活动编号并重新排列\n');

// 读取当前数据
const data = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));

// 重新编号为 0001-0018
data.forEach((item, index) => {
  item.activityNumber = (index + 1).toString().padStart(4, '0');
});

// 按编号排序
data.sort((a, b) => {
  return parseInt(a.activityNumber) - parseInt(b.activityNumber);
});

// 更新JSON
fs.writeFileSync('data/items.json', JSON.stringify(data, null, 2));

console.log('✅ 步骤1: 活动编号已重置 (0001-0018)');

// 读取Excel文件
const workbook = XLSX.readFile('清迈活动数据.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 转换为JSON
const excelData = XLSX.utils.sheet_to_json(worksheet);

console.log(`✅ 步骤2: 读取Excel文件，共 ${excelData.length} 行`);

// 去掉id列，保留活动编号作为主键
const cleanedData = excelData.map((row, index) => {
  const newRow = { ...row };
  delete newRow.id; // 删除id列
  // 确保有活动编号
  if (!newRow['活动编号']) {
    newRow['活动编号'] = (index + 1).toString().padStart(4, '0');
  }
  // 更新序号
  newRow['序号'] = index + 1;
  return newRow;
});

// 转换回工作表
const newWorksheet = XLSX.utils.json_to_sheet(cleanedData);
workbook.Sheets[sheetName] = newWorksheet;

// 保存Excel
XLSX.writeFile(workbook, '清迈活动数据.xlsx');

console.log('✅ 步骤3: 已删除Excel中的id列');
console.log('✅ 步骤4: 活动编号作为唯一标识');
console.log('\n📊 最终活动列表:');
data.forEach(item => {
  console.log(`  ${item.activityNumber} - ${item.title}`);
});
console.log('\n🎉 修复完成！下次导入将使用活动编号作为唯一标识。');
