#!/usr/bin/env node

/**
 * 添加松德寺 (Wat Suan Dok) 到Excel
 */

import XLSX from 'xlsx';

console.log('🏛️  开始添加松德寺数据到Excel...\n');

// 读取Excel
const workbook = XLSX.readFile('清迈活动数据.xlsx');
const sheetName = workbook.SheetNames[0];
const existingData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`✅ 当前Excel有 ${existingData.length} 行数据`);

// 计算编号
const maxNumber = Math.max(...existingData.map(d => parseInt(d['活动编号']) || 0));
const newNumber = maxNumber + 1;
const activityNumber = String(newNumber).padStart(4, '0');

console.log(`🔢 新活动编号: ${activityNumber}\n`);

// 松德寺数据
const watSuanDok = {
  '序号': existingData.length + 1,
  '活动编号': activityNumber,
  '活动标题': '松德寺 (Wat Suan Dok)',
  '分类': '冥想',
  '地点': '139 Suthep Rd, Suthep, Mueang Chiang Mai District, Chiang Mai 50200（松德寺内，冥想中心位于寺庙后方，可询问"Monk Chat Meditation Center"）',
  '价格': '免费（随喜捐赠）',
  '需要预约': '否',
  '时间': '17:00-19:00',
  '持续时间': '2小时',
  '时间信息': '固定频率活动',
  '星期': '周一,周三,周五',
  '最低价格': 0,
  '最高价格': 0,
  '最大人数': 0,
  '描述': `适合人群：对佛教文化、冥想感兴趣，希望与僧侣交流的游客和初学者。

活动特点：由僧侣亲自指导，内容包括基础冥想和佛教哲学讲解，氛围轻松友好。提供非正式的佛教僧侣对话，了解佛教、泰国文化和冥想，无需是佛教徒即可参与。由Mahachulalongkornrajavidyalaya佛教大学清迈校区协办。

⚠️ 注意：有不同信息源显示活动时间可能在周二、周四、周六的17:30开始，建议出行前通过官网或邮件核实。

额外项目：
- 1日冥想静修：每周五 09:00-17:00
- 2日冥想静修：每周二、周三

语言：英语
费用：免费（随喜捐赠）
预约：直接参加即可，无需预约

官网：https://www.monkchat.net/
邮箱：monkchat2023@gmail.com
电话：+66 (0)84 609 1357
Facebook：https://www.facebook.com/MonkChatCNX/

TripAdvisor评分：4.9/5（200+评论）`,
  '灵活时间': '否',
  '状态': '进行中'
};

// 检查标题是否已存在
const existingTitles = new Set(
  existingData.map(d => (d['活动标题'] || '').trim()).filter(Boolean)
);

if (existingTitles.has(watSuanDok['活动标题'].trim())) {
  console.log('❌ 活动标题已存在:', watSuanDok['活动标题']);
  console.log('⚠️  此活动可能已经导入，请检查Excel数据！');
  process.exit(1);
}

console.log('✅ 标题检查通过：无重复\n');

// 添加新数据
const allData = [...existingData, watSuanDok];

// 写入Excel
const newWorksheet = XLSX.utils.json_to_sheet(allData);
workbook.Sheets[sheetName] = newWorksheet;

// 备份原文件
const backupFile = '清迈活动数据.backup.xlsx';
const fs = await import('fs');
if (fs.existsSync(backupFile)) {
  fs.unlinkSync(backupFile);
}
fs.copyFileSync('清迈活动数据.xlsx', backupFile);
console.log('💾 已备份原文件到:', backupFile);

// 保存新文件
XLSX.writeFile(workbook, '清迈活动数据.xlsx');
console.log('✅ 已保存新文件: 清迈活动数据.xlsx\n');

// 输出添加的活动
console.log('📊 已添加活动：\n');
console.log(`   [${watSuanDok['活动编号']}] ${watSuanDok['活动标题']}`);
console.log(`   📍 ${watSuanDok['地点'].substring(0, 50)}...`);
console.log(`   ⏰ ${watSuanDok['时间']} (${watSuanDok['星期']})`);
console.log(`   💰 ${watSuanDok['价格']}`);
console.log(`   📝 描述长度: ${(watSuanDok['描述'] || '').length} 字符\n`);

console.log(`✅ 成功添加 1 个寺庙活动！`);
console.log(`📊 总活动数量: ${allData.length}`);
