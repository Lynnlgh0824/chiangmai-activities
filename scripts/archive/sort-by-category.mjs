import XLSX from 'xlsx';
import fs from 'fs';

console.log('开始读取Excel文件...');

// 读取Excel文件
const workbook = XLSX.readFile('./清迈活动数据.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 转换为JSON数据
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('原始数据条数:', data.length);

// 查找分类字段
const sampleRow = data[0];
console.log('数据字段:', Object.keys(sampleRow).join(', '));

// 按分类排序
const categoryField = '分类';

if (!sampleRow.hasOwnProperty(categoryField)) {
  console.error('未找到分类字段！');
  process.exit(1);
}

// 排序
data.sort((a, b) => {
  const categoryA = a[categoryField] || '';
  const categoryB = b[categoryField] || '';
  return categoryA.localeCompare(categoryB, 'zh-CN');
});

// 统计分类
const categoryStats = {};
data.forEach(row => {
  const category = row[categoryField] || '未分类';
  categoryStats[category] = (categoryStats[category] || 0) + 1;
});

console.log('\n分类统计:');
Object.entries(categoryStats)
  .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
  .forEach(([category, count]) => {
    console.log(`  ${category}: ${count}条`);
  });

// 创建新工作表
const newWorksheet = XLSX.utils.json_to_sheet(data);
const newWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);

// 备份
const backupPath = './清迈活动数据.backup.xlsx';
fs.copyFileSync('./清迈活动数据.xlsx', backupPath);
console.log('\n已备份原文件到:', backupPath);

// 写入新文件
XLSX.writeFile(newWorkbook, './清迈活动数据.xlsx');

console.log('\n✅ 排序完成！');
