import XLSX from 'xlsx';

console.log('🧘‍♀️ 开始添加禅修冥想活动到Excel...\n');

// 读取Excel
const workbook = XLSX.readFile('清迈活动数据.xlsx');
const sheetName = workbook.SheetNames[0];
const existingData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`✅ 当前Excel有 ${existingData.length} 行数据`);

// 禅修冥想活动数据
const meditationActivities = [
  {
    name: 'Wat Tung Yu',
    description: '适合人群：初学者，希望灵活参与、无需预约的游客。小组冥想、佛法讲解、问答互动，氛围轻松。由美国老师David带领。',
    time: '每周三、六、日上午9:00-11:00',
    location: '清迈古城内，靠近女子监狱按摩店',
    price: '免费，随喜捐赠',
    language: '英语',
    website: 'BuddhaDailyWisdom.com',
    contact: 'BuddhaDailyWisdom.com 或 Facebook小组：Chiang Mai Meditation & Buddhist Study Community'
  },
  {
    name: '乌蒙寺 (Wat Umong)',
    description: '适合人群：希望进行数日沉浸式禅修，且日程要求相对宽松的体验者。日程相对宽松，可体验山林、洞穴冥想。课程周期3天起，可自选天数，一般不要求上交手机。',
    time: '每天开放进行禅修登记。课程3天起，可自选天数',
    booking: '建议早上8:30带行李直接前往登记',
    location: '清迈市郊的乌蒙寺',
    price: '约150泰铢/天（含食宿），需现金支付',
    language: '英语/泰语',
    contact: '通常无需提前网络预约'
  },
  {
    name: '朗奔寺/兰蓬寺 (Wat Ram Poeng)',
    description: '适合人群：寻求严肃、深度、长期内观禅修的修行者。专注于内观禅修，课程体系严谨。有严格戒律（如禁用电子设备、禁语）。',
    time: '标准课程周期较长，一般为7-45天，需要提前预约',
    location: '清迈素贴山区域',
    price: '免费（捐赠形式），课程费用包含食宿',
    language: '英语。有会讲中文的居士提供翻译协助',
    website: 'www.watrampoeng.net',
    contact: 'watrampoeng@hotmail.com'
  },
  {
    name: '国际内观禅修中心 (International Meditation Center Chom Tong)',
    description: '适合人群：追求传统、严格内观禅修，且时间充裕的修行者。泰国著名内观中心之一，注重个人冥想。',
    time: '推荐初学者参加21天课程，returning学员通常参加10天课程',
    location: '位于因他农山脚',
    price: '免费（捐赠形式）',
    language: '英语'
  }
];

// 计算编号
const maxNumber = Math.max(...existingData.map(d => parseInt(d['活动编号']) || 0));

// 检查标题是否已存在
console.log('🔍 检查活动标题是否已存在...\n');

const existingTitles = new Set(
  existingData.map(d => (d['活动标题'] || '').trim()).filter(Boolean)
);

const duplicateTitles = [];
meditationActivities.forEach(m => {
  if (existingTitles.has(m.name.trim())) {
    duplicateTitles.push(m.name);
  }
});

if (duplicateTitles.length > 0) {
  console.log('❌ 发现重复的活动标题:');
  duplicateTitles.forEach(title => {
    console.log(`  - ${title}`);
  });
  console.log('\n⚠️  这些活动已经存在于Excel中，请检查数据！');
  console.log('💡 如需更新现有活动，请手动编辑Excel');
  process.exit(1);
}

console.log('✅ 标题检查通过：无重复\n');

const newRows = meditationActivities.map((m, i) => {
  // 构建描述（合并所有信息）
  let description = m.description;

  if (m.language) {
    description += `\n语言：${m.language}`;
  }

  if (m.website && m.website !== '信息缺失') {
    description += `\n网站：${m.website}`;
  }

  if (m.contact && m.contact !== '信息缺失') {
    description += `\n联系方式：${m.contact}`;
  }

  // 推断需要预约
  let needBooking = '否';
  if (m.booking) {
    if (m.booking.includes('需要预约') || m.booking.includes('提前预约')) {
      needBooking = '是';
    }
  } else if (m.time && m.time.includes('需要提前预约')) {
    needBooking = '是';
  }

  return {
    '序号': existingData.length + i + 1,
    '活动编号': (maxNumber + i + 1).toString().padStart(4, '0'),
    '活动标题': m.name,
    '分类': '冥想',
    '地点': m.location,
    '价格': m.price,
    '需要预约': needBooking,
    '时间': m.time,
    '持续时间': '',
    '时间信息': '固定频率活动',
    '星期': '',
    '最低价格': 0,
    '最高价格': 0,
    '最大人数': '不限',
    '描述': description,
    '灵活时间': '否',
    '状态': '进行中'
  };
});

console.log(`\n📝 准备添加 ${newRows.length} 个禅修冥想活动:\n`);
newRows.forEach(row => {
  console.log(`  ${row['活动编号']} - ${row['活动标题']}`);
  console.log(`    时间: ${row['时间']}`);
  console.log(`    地点: ${row['地点']}`);
  console.log(`    价格: ${row['价格']}`);
  console.log(`    预约: ${row['需要预约']}`);
});

// 合并数据
const allData = [...existingData, ...newRows];

// 保存Excel
workbook.Sheets[sheetName] = XLSX.utils.json_to_sheet(allData);
XLSX.writeFile(workbook, '清迈活动数据.xlsx');

console.log(`\n✅ 已成功添加 ${newRows.length} 个禅修冥想活动到Excel`);
console.log(`📊 Excel总行数: ${allData.length}`);
console.log(`📋 编号范围: 0001 - ${newRows[newRows.length - 1]['活动编号']}`);
console.log('\n💡 下一步: npm run import-excel:smart');
