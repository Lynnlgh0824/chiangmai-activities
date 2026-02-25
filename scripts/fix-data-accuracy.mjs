#!/usr/bin/env node
/**
 * 自动修复数据准确性问题
 * 基于联网校验报告自动更新数据
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'items.json');

console.log('🔧 开始自动修复数据准确性问题...\n');

// 读取数据
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// 修复记录
const fixes = [];

// ========== 修复 1: 实弹射击价格 (ID: 0017) ==========
const shootingIndex = data.findIndex(item => item.id === '0017');
if (shootingIndex !== -1) {
  const oldPrice = data[shootingIndex].price;
  data[shootingIndex].price = '1500-3000泰铢/人（含场地+枪租+培训）';
  data[shootingIndex].minPrice = 1500;
  data[shootingIndex].maxPrice = 3000;
  data[shootingIndex].description = `实弹射击体验，位于清迈市区。

价格说明：
- 22口径：50发2000泰铢
- 9mm口径：50发3300泰铢
- 枪租：500泰铢
- 场地费：500泰铢
- 培训费：2000泰铢

⚠️ 注意事项：
- 必须携带护照原件
- 需提前3天预约，支付50%定金
- 中午12-13点休息，18点关门
- 地址：Tambon Chang Phueak, Mueang Chiang Mai District`;

  fixes.push({
    id: '0017',
    title: '实弹射击',
    field: 'price',
    old: oldPrice,
    new: data[shootingIndex].price
  });
}

// ========== 修复 2: 高尔夫练习场价格 (ID: 0016) ==========
const golfIndex = data.findIndex(item => item.id === '0016');
if (golfIndex !== -1) {
  const oldPrice = data[golfIndex].price;
  data[golfIndex].price = '35-50泰铢/50个球';
  data[golfIndex].minPrice = 35;
  data[golfIndex].maxPrice = 50;

  fixes.push({
    id: '0016',
    title: '高尔夫练习场',
    field: 'price',
    old: oldPrice,
    new: data[golfIndex].price
  });
}

// ========== 修复 3: 复古市集时间 (ID: 0022) ==========
const vintageIndex = data.findIndex(item => item.id === '0022');
if (vintageIndex !== -1) {
  const oldTime = data[vintageIndex].time;
  const oldDesc = data[vintageIndex].description;

  data[vintageIndex].time = '周一、周二 16:00-22:00';
  data[vintageIndex].weekdays = ['周一', '周二'];
  data[vintageIndex].description = `One Nimman 复古/跳蚤市场，每周一和周二举办。

特色：
- 复古服饰和手工艺品
- 独立设计师品牌
- 创意市集
- 美食摊位
- 现场音乐表演

⚠️ 注意：
不是"每月第1个周五"，那是Nimmanhaemin Art & Design Promenade (NAP)年度活动（通常12月初）`;

  fixes.push({
    id: '0022',
    title: '复古市集 (One Nimman)',
    field: 'time',
    old: oldTime,
    new: data[vintageIndex].time
  });
}

// ========== 修复 4: 周日夜市开始时间 (ID: 0026) ==========
const sundayIndex = data.findIndex(item => item.id === '0026');
if (sundayIndex !== -1) {
  const oldTime = data[sundayIndex].time;
  data[sundayIndex].time = '周日 16:00-22:00（16:00开始，17:00为高峰）';

  fixes.push({
    id: '0026',
    title: '周日夜市',
    field: 'time',
    old: oldTime,
    new: data[sundayIndex].time
  });
}

// ========== 修复 5: 椰林市集频率 (ID: 0028) ==========
const coconutIndex = data.findIndex(item => item.id === '0028');
if (coconutIndex !== -1) {
  const oldTime = data[coconutIndex].time;
  data[coconutIndex].time = '周五、周六、周日 08:00-15:00（周六日最活跃）';
  data[coconutIndex].weekdays = ['周五', '周六', '周日'];

  fixes.push({
    id: '0028',
    title: '椰林市集',
    field: 'time',
    old: oldTime,
    new: data[coconutIndex].time
  });
}

// ========== 修复 6: JING JAI 市集工作日时间 (ID: 0031) ==========
const jingjaiIndex = data.findIndex(item => item.id === '0031');
if (jingjaiIndex !== -1) {
  const oldTime = data[jingjaiIndex].time;
  data[jingjaiIndex].time = '工作日 08:00-20:00';

  fixes.push({
    id: '0031',
    title: 'JING JAI 市集（工作日）',
    field: 'time',
    old: oldTime,
    new: data[jingjaiIndex].time
  });
}

// ========== 修复 7: 朗奔寺禅修补充说明 (ID: 0058) ==========
const rampoengIndex = data.findIndex(item => item.id === '0058');
if (rampoengIndex !== -1) {
  const oldDesc = data[rampoengIndex].description;
  data[rampoengIndex].description = `朗奔寺/兰蓬寺禅修中心 (Wat Ram Poeng)，位于清迈素贴山区域。

禅修课程：
- **26天标准课程**：内观禅修完整课程
- **10天课程**：中级课程
- **1-3天体验**：入门体验课程

费用：免费（捐赠形式），注册费500泰铢

⚠️ 注意事项：
- 需提前预约
- 课程期间需遵守寺院规定
- 包含食宿
- 英语/泰语授课

官网：https://www.watrampoeng.com/vipassana-course/`;

  fixes.push({
    id: '0058',
    title: '朗奔寺/兰蓬寺禅修',
    field: 'description',
    old: '（补充课程选项）',
    new: '补充1-3天体验和10天选项'
  });
}

// ========== 修复 8: 松德寺冥想时间 (ID: 0067) ==========
const suandokIndex = data.findIndex(item => item.id === '0067');
if (suandokIndex !== -1) {
  const oldTime = data[suandokIndex].time;
  data[suandokIndex].time = '周五 09:00-17:00（一日冥想课程）';
  data[suandokIndex].weekdays = ['周五'];
  data[suandokIndex].description = `松德寺冥想中心 (Wat Suan Dok)，位于139 Suthep Rd。

主要活动：
- **周五一日冥想课程**：09:00-17:00
- Monk Chat 项目：与僧侣交流佛教文化

费用：免费（捐赠形式）

⚠️ 注意事项：
- 建议网上预约
- 英语授课
- 冥想中心位于寺庙后方，可询问"Monk Chat Meditation Center"
- 寺庙开放时间：05:00-20:00

官网：https://www.monkchat.net/`;

  fixes.push({
    id: '0067',
    title: '松德寺冥想',
    field: 'time',
    old: oldTime,
    new: data[suandokIndex].time
  });
}

// ========== 修复 9: 乌蒙寺禅修补充信息 (ID: 0057) ==========
const umongIndex = data.findIndex(item => item.id === '0057');
if (umongIndex !== -1) {
  data[umongIndex].description = `乌蒙寺禅修中心 (Wat Umong)，位于清迈市郊。

禅修课程：
- 3天起可参加
- 费用：约250泰铢/天（含食宿）
- 需现金支付

⚠️ 注意事项：
- 登记时间：建议早上8:30带行李前往
- 寺庙开放时间：05:00-20:00
- 英语/泰语授课
- 森林禅修环境

官网：https://www.watumong.com/wat-umong-meditation-center`;

  fixes.push({
    id: '0057',
    title: '乌蒙寺禅修',
    field: 'description',
    old: '（基础信息）',
    new: '补充开放时间和登记信息'
  });
}

// ========== 保存修复后的数据 ==========
fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

// ========== 打印修复报告 ==========
console.log('✅ 修复完成！\n');
console.log(`📊 共修复 ${fixes.length} 项数据：\n`);

fixes.forEach((fix, index) => {
  console.log(`${index + 1}. [${fix.id}] ${fix.title}`);
  console.log(`   字段: ${fix.field}`);
  console.log(`   原值: ${fix.old}`);
  console.log(`   新值: ${fix.new}\n`);
});

console.log('💾 数据已保存到:', DATA_FILE);
console.log('\n🔄 下一步：');
console.log('   1. 运行数据校验: npm run validate');
console.log('   2. 查看修改: git diff data/items.json');
console.log('   3. 提交修改: git add data/items.json && git commit');
