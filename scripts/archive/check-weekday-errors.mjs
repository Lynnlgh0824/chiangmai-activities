import XLSX from 'xlsx';

const workbook = XLSX.readFile('清迈活动数据.xlsx');
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

const errors = data.filter(item => {
  const weekdays = item['星期'];
  if (!weekdays) return false;
  return weekdays.includes('无固定时间') || weekdays.includes('-') || weekdays.includes('无');
});

console.log('发现', errors.length, '个星期格式错误：\n');
errors.forEach(item => {
  console.log('[' + item['活动编号'] + '] ' + item['活动标题']);
  console.log('  星期:', item['星期']);
  console.log('');
});
