import XLSX from 'xlsx';

console.log('📝 直接在Excel中添加市集数据...\n');

// 读取Excel
const workbook = XLSX.readFile('清迈活动数据.xlsx');
const sheetName = workbook.SheetNames[0];
const existingData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`✅ 当前Excel有 ${existingData.length} 行数据`);

// 市集数据
const markets = [
  {name: '宁曼路复古市集', location: 'One Nimman', detail: '清迈宁曼路（One Nimman商圈内）', time: '16:00-22:00', days: '周一,周二', note: '中古爱好者必逛'},
  {name: '宁曼路白色市集', location: 'One Nimman', detail: '清迈宁曼路（One Nimman商圈内）', time: '15:00-22:00', days: '周五,周六,周日,周一', note: '日式文艺市集'},
  {name: '云南早市', location: 'Yunnan Market', detail: '清迈古城以北', time: '05:00-12:00', days: '周五', note: '云南小吃'},
  {name: '周六夜市', location: 'Wua Lai Walking Street', detail: '古城南门附近', time: '17:00-23:00', days: '周六', note: '泰国美食'},
  {name: '周日夜市', location: 'Thapae Gate', detail: '古城东门内', time: '17:00-22:00', days: '周日', note: '寺庙前听DJ'},
  {name: '长康路夜市', location: 'Night Bazaar', detail: '古城东门外', time: '17:00-00:00', days: '周一,周二,周三,周四,周五,周六,周日', note: '观光客最爱'},
  {name: '椰林市集', location: 'Coconut Market', detail: 'Mae Rim区', time: '08:00-14:00', days: '周六,周日', note: '适合拍照'},
  {name: '雨林手作市集', location: 'Chamcha Market', detail: '山甘烹县边缘', time: '09:00-15:00', days: '周六,周日', note: '手工小物'},
  {name: '艺术村集市', location: 'Baan Kang Wat', detail: '悟孟寺附近', time: '10:00-18:00', days: '周二,周三,周四,周五,周六,周日', note: '艺术家作品'},
  {name: 'JING JAI 市集', location: 'Jing Jai Market', detail: '山甘烹县', time: '08:30-21:00', days: '周一,周二,周三,周四,周五', note: '手工艺市集'},
  {name: 'JING JAI 市集（周末版）', location: 'Jing Jai Market', detail: '山甘烹县', time: '06:30-22:00', days: '周六,周日', note: '周末版'},
  {name: '清迈大学前门夜市', location: 'Kad Na Mor Market', detail: '大学前门', time: '10:00-23:00', days: '周一,周二,周三,周四,周五,周六,周日', note: '学生天堂'},
  {name: '湄卡运河集市', location: 'Khlong Mae Kha', detail: '古城西北侧', time: '15:00-22:00', days: '周一,周二,周三,周四,周五', note: '日系风情'},
  {name: '面包集市', location: 'Nana Jungle', detail: 'Hang Dong区', time: '07:00-16:00', days: '周六,周日', note: ''},
  {name: '清迈跳蚤市集', location: '无明确标注', detail: 'Nong Ho区', time: '07:00-14:00', days: '周六,周日', note: ''},
  {name: '孟买市场', location: 'Muang Mai Market', detail: '瓦洛洛市场旁', time: '00:00-24:00', days: '周一,周二,周三,周四,周五,周六,周日', note: ''},
  {name: '瓦洛洛市场', location: 'Warorot Market', detail: '清迈唐人街', time: '08:00-17:00', days: '周一,周二,周三,周四,周五,周六,周日', note: ''}
];

// 计算编号
const maxNumber = Math.max(...existingData.map(d => parseInt(d['活动编号']) || 0));

const newRows = markets.map((m, i) => ({
  '序号': existingData.length + i + 1,
  '活动编号': (maxNumber + i + 1).toString().padStart(4, '0'),
  '活动标题': m.name,
  '分类': '市集',
  '地点': m.location,
  '价格': '免费',
  '需要预约': '否',
  '时间': m.time,
  '持续时间': '',
  '时间信息': '固定频率活动',
  '星期': m.days,
  '最低价格': 0,
  '最高价格': 0,
  '最大人数': '不限',
  '描述': m.detail + (m.note ? '。' + m.note : ''),
  '灵活时间': '否',
  '状态': '进行中'
}));

// 合并并保存
const allData = [...existingData, ...newRows];
workbook.Sheets[sheetName] = XLSX.utils.json_to_sheet(allData);
XLSX.writeFile(workbook, '清迈活动数据.xlsx');

console.log(`✅ 已添加 ${newRows.length} 个市集到Excel`);
console.log(`📊 Excel总行数: ${allData.length}`);
console.log('\n💡 下一步: npm run import-excel:smart');
