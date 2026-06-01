#!/usr/bin/env node

/**
 * 将清吧数据添加到清迈活动数据.xlsx
 */

import XLSX from 'xlsx';
import fs from 'fs';

// Excel文件路径
const EXCEL_FILE = './清迈活动数据.xlsx';

// 清吧数据
const barsData = [
  {
    name: 'Riverside Bar & Restaurant',
    style: '傍晚：舒缓钢琴曲、吉他曲、民谣；深夜：本地及西方摇滚乐队轮演，氛围从静谧到热烈渐变',
    time: '10:00-01:00',
    location: '9-11 Charoenrat Road., Chiangmai 50000（河边位置，木结构老房子，辨识度高）',
    price: '本地啤酒：80-120；鸡尾酒：180-300；进口啤酒：120-180',
    description: '白天以餐食为主，傍晚开始有音乐演出，深夜达到氛围顶峰'
  },
  {
    name: 'North Gate Jazz Co-Op（北门爵士清吧）',
    style: '主打爵士乐，清迈北门老牌网红清吧，现场爵士乐队演出，氛围纯粹，无多余商业化装饰',
    time: '18:00-23:59',
    location: '95/1-2 Sri Phum Rd, 清迈古城北门边上，导航店名可直达',
    price: '本地啤酒：70-100；简易鸡尾酒：150-220',
    description: '19:00后开始正式音乐演出，每晚座无虚席，周末建议提前占位'
  },
  {
    name: 'Nap Gastrobar',
    style: '轻摇滚、民谣现场演出，搭配工业风装修，氛围随性放松，适合年轻人聚集',
    time: '10:00-01:00',
    location: 'Nimmanhaemin Rd.（宁曼路，对面是Mon Nom Sod，位于宁曼路核心商圈）',
    price: '本地啤酒：70-100；进口啤酒：100-160；鸡尾酒：160-280',
    description: '全天营业，18:00后开始有音乐演出，持续至深夜'
  },
  {
    name: 'Your Bar',
    style: '现场乐队+国际DJ驻场，音乐风格多样（流行、轻电子、民谣），氛围活跃有层次',
    time: '17:00-01:00',
    location: '6/F, Maya Mall（玛雅购物中心6楼，与其他顶楼清吧相邻）',
    price: '本地啤酒：80-110；鸡尾酒：180-300',
    description: '傍晚开始营业，19:00后音乐演出正式开始，夜间氛围最佳'
  },
  {
    name: 'Good View Bar and Restaurant',
    style: '现场乐队演出，音乐风格偏舒缓流行、泰式民谣，适配河边休闲氛围',
    time: '16:00-00:00',
    location: '清迈河边区域（人气较高，导航店名可直达）',
    price: '鸡尾酒：160-280；本地啤酒：75-105；无酒精鸡尾酒：90-150',
    description: '傍晚开始营业，晚餐时段同步有音乐演出，深夜结束'
  },
  {
    name: 'Crossroad Chiang Mai（北门跨界清吧）',
    style: '多元化现场音乐，涵盖吉他弹唱、民谣、轻摇滚，氛围自由惬意',
    time: '18:00-00:00',
    location: 'Amphoe Muang Chiang Mai, 清迈古城北门附近，小巷内',
    price: '本地啤酒：75-100；进口啤酒：100-150；无酒精饮品：80-120',
    description: '19:00后开启音乐演出，无固定乐队，每日演出风格略有差异'
  }
];

console.log('📋 开始添加清吧数据到Excel文件...\n');

// 读取Excel文件
console.log('📂 读取Excel文件:', EXCEL_FILE);
const workbook = XLSX.readFile(EXCEL_FILE);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 获取现有数据
const existingData = XLSX.utils.sheet_to_json(worksheet);

console.log('✅ 现有活动数量:', existingData.length);
console.log('');

// 获取当前最大活动编号
let maxNumber = 0;
existingData.forEach(item => {
  const num = parseInt(String(item['活动编号'] || '0').replace(/\D/g, ''));
  if (num > maxNumber) {
    maxNumber = num;
  }
});

console.log('📝 当前最大活动编号:', maxNumber);

// 生成新的活动编号
const startNumber = maxNumber + 1;
console.log('🔢 将从编号', startNumber, '开始添加\n');

// 获取最大序号
let maxSequence = 0;
existingData.forEach(item => {
  const seq = parseInt(item['序号'] || 0);
  if (seq > maxSequence) {
    maxSequence = seq;
  }
});

// 准备新数据
const newData = barsData.map((bar, index) => {
  const sequenceNumber = maxSequence + index + 1;
  const activityNumber = String(startNumber + index).padStart(4, '0');

  return {
    '序号': sequenceNumber,
    '活动编号': activityNumber,
    '活动标题': bar.name,
    '分类': '音乐',
    '地点': bar.location,
    '价格': bar.price,
    '需要预约': '否',
    '时间': bar.time,
    '持续时间': '',
    '时间信息': '固定频率活动',
    '星期': '', // 清吧一般每天都营业
    '最低价格': 0,
    '最高价格': 0,
    '最大人数': 0,
    '描述': `${bar.style}\n\n${bar.description}`,
    '灵活时间': '否',
    '状态': '进行中'
  };
});

// 合并数据
const allData = [...existingData, ...newData];

// 写入Excel
const newWorksheet = XLSX.utils.json_to_sheet(allData);
workbook.Sheets[sheetName] = newWorksheet;

// 备份原文件
const backupFile = EXCEL_FILE.replace('.xlsx', '.backup.xlsx');
if (fs.existsSync(backupFile)) {
  fs.unlinkSync(backupFile);
}
fs.copyFileSync(EXCEL_FILE, backupFile);
console.log('💾 已备份原文件到:', backupFile);

// 保存新文件
XLSX.writeFile(workbook, EXCEL_FILE);
console.log('✅ 已保存新文件:', EXCEL_FILE);
console.log('');

// 输出添加的活动列表
console.log('📊 已添加以下清吧活动：\n');
newData.forEach(item => {
  console.log(`  [${item['活动编号']}] ${item['活动标题']}`);
  console.log(`      📍 ${item['地点']}`);
  console.log(`      ⏰ ${item['时间']}`);
  console.log(`      💰 ${item['价格']}`);
  console.log('');
});

console.log(`✅ 成功添加 ${newData.length} 个清吧活动！`);
console.log(`📊 总活动数量: ${allData.length}`);
