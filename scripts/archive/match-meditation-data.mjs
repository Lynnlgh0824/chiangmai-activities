import fs from 'fs';

console.log('🧘‍♀️ 禅修冥想活动数据匹配分析\n');

// 禅修冥想活动原始数据
const meditationActivities = [
  {
    name: 'Wat Tung Yu',
    description: '适合人群：初学者，希望灵活参与、无需预约的游客。小组冥想、佛法讲解、问答互动，氛围轻松。由美国老师David带领。',
    time: '每周三、六、日上午9:00-11:00',
    booking: '无需预约，直接参加即可',
    location: '清迈古城内，靠近女子监狱按摩店',
    price: '免费，随喜捐赠',
    language: '英语',
    website: 'BuddhaDailyWisdom.com',
    facebook: 'Facebook小组：Chiang Mai Meditation & Buddhist Study Community',
    contact: 'BuddhaDailyWisdom.com 或 Facebook小组'
  },
  {
    name: '乌蒙寺 (Wat Umong)',
    description: '适合人群：希望进行数日沉浸式禅修，且日程要求相对宽松的体验者。日程相对宽松，可体验山林、洞穴冥想。课程周期3天起，可自选天数，一般不要求上交手机。',
    time: '每天开放进行禅修登记。课程3天起，可自选天数',
    booking: '建议早上8:30带行李直接前往登记',
    location: '清迈市郊的乌蒙寺',
    price: '约150泰铢/天（含食宿），需现金支付',
    language: '英语/泰语',
    website: '信息缺失',
    facebook: '信息缺失',
    contact: '通常无需提前网络预约'
  },
  {
    name: '朗奔寺/兰蓬寺 (Wat Ram Poeng)',
    description: '适合人群：寻求严肃、深度、长期内观禅修的修行者。专注于内观禅修，课程体系严谨。有严格戒律（如禁用电子设备、禁语）。',
    time: '标准课程周期较长，一般为7-45天',
    booking: '需要提前预约',
    location: '清迈素贴山区域',
    price: '免费（捐赠形式），课程费用包含食宿',
    language: '英语。有会讲中文的居士提供翻译协助',
    website: 'www.watrampoeng.net',
    facebook: '信息缺失',
    contact: 'watrampoeng@hotmail.com'
  },
  {
    name: '国际内观禅修中心 (International Meditation Center Chom Tong)',
    description: '适合人群：追求传统、严格内观禅修，且时间充裕的修行者。泰国著名内观中心之一，注重个人冥想。',
    time: '推荐初学者参加21天课程，returning学员通常参加10天课程',
    booking: '信息缺失',
    location: '位于因他农山脚',
    price: '免费（捐赠形式）',
    language: '英语',
    website: '信息缺失',
    facebook: '信息缺失',
    contact: '信息缺失'
  },
  {
    name: '松德寺 (Wat Suan Dok)',
    description: '适合人群：对佛教文化感兴趣，想与僧侣交流的游客。提供"僧侣对话"(Monk Chat)活动，可了解僧侣生活与佛教文化。',
    time: '信息缺失',
    booking: '信息缺失',
    location: '松德寺',
    price: '信息缺失',
    language: '英语',
    website: '信息缺失',
    facebook: '信息缺失',
    contact: '信息缺失'
  }
];

// Excel字段映射规则
const fieldMapping = {
  name: '活动标题',
  description: '描述',
  time: '时间',
  booking: '需要预约',
  location: '地点',
  price: '价格',
  language: null, // Excel中没有语言字段，可以合并到描述中
  website: null,  // Excel中没有网站字段，可以合并到描述中
  facebook: null, // Excel中没有Facebook字段，可以合并到描述中
  contact: null   // Excel中没有联系方式字段，可以合并到描述中
};

console.log('📋 字段映射关系:\n');
Object.entries(fieldMapping).forEach(([source, target]) => {
  console.log(`  ${source.padEnd(15)} → ${target || '(合并到描述)'}`);
});

console.log('\n📊 数据处理规则:\n');
console.log('  1. 跳过"信息缺失"的记录');
console.log('  2. 将语言、网站、联系方式合并到描述');
console.log('  3. 时间格式保持原样');
console.log('  4. 价格保持原样');
console.log('  5. 需要预约：根据内容推断');

// 处理数据
console.log('\n🔄 数据转换结果:\n');
const processedData = [];

meditationActivities.forEach((activity, index) => {
  console.log(`\n【${index + 1}】${activity.name}`);

  // 检查是否有关键信息
  const hasEssentialInfo = activity.name &&
                              activity.description &&
                              activity.location &&
                              activity.location !== '信息缺失' &&
                              activity.time &&
                              activity.time !== '信息缺失';

  if (!hasEssentialInfo) {
    console.log(`  ⚠️  跳过：缺少关键信息`);
    return;
  }

  // 构建描述
  let description = activity.description;

  // 添加语言信息
  if (activity.language && activity.language !== '信息缺失') {
    description += `\n语言：${activity.language}`;
  }

  // 添加网站信息
  if (activity.website && activity.website !== '信息缺失') {
    description += `\n网站：${activity.website}`;
  }

  // 添加联系方式
  if (activity.contact && activity.contact !== '信息缺失') {
    description += `\n联系方式：${activity.contact}`;
  }

  // 推断需要预约
  let needBooking = '否';
  if (activity.booking) {
    if (activity.booking.includes('需要预约') || activity.booking.includes('提前预约')) {
      needBooking = '是';
    } else if (activity.booking.includes('无需预约')) {
      needBooking = '否';
    }
  }

  // 转换为Excel格式
  const excelRow = {
    '序号': index + 1,
    '活动编号': (36 + index + 1).toString().padStart(4, '0'), // 从0037开始
    '活动标题': activity.name,
    '分类': '冥想',
    '地点': activity.location,
    '价格': activity.price,
    '需要预约': needBooking,
    '时间': activity.time,
    '持续时间': '',
    '时间信息': '固定频率活动',
    '星期': '', // 从时间描述中提取
    '最低价格': 0,
    '最高价格': 0,
    '最大人数': '不限',
    '描述': description,
    '灵活时间': '否',
    '状态': '进行中'
  };

  // 显示映射结果
  console.log(`  ✅ 导入`);
  console.log(`     活动编号: ${excelRow['活动编号']}`);
  console.log(`     分类: 冥想`);
  console.log(`     时间: ${excelRow['时间']}`);
  console.log(`     地点: ${excelRow['地点']}`);
  console.log(`     价格: ${excelRow['价格']}`);
  console.log(`     需要预约: ${excelRow['需要预约']}`);

  processedData.push(excelRow);
});

console.log(`\n\n📊 统计结果:`);
console.log(`  原始数据: ${meditationActivities.length} 条`);
console.log(`  可导入: ${processedData.length} 条`);
console.log(`  跳过: ${meditationActivities.length - processedData.length} 条 (信息缺失)`);

// 保存为JSON预览
fs.writeFileSync('scripts/meditation-activities-preview.json', JSON.stringify(processedData, null, 2));
console.log(`\n💾 预览数据已保存: scripts/meditation-activities-preview.json`);

// 生成确认清单
console.log(`\n✅ 确认清单:`);
processedData.forEach(item => {
  console.log(`  [${item['活动编号']}] ${item['活动标题']}`);
  console.log(`    - 时间: ${item['时间']}`);
  console.log(`    - 地点: ${item['地点']}`);
  console.log(`    - 价格: ${item['价格']}`);
  console.log(`    - 预约: ${item['需要预约']}`);
});
