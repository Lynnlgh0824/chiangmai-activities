#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🧘‍♀️ 禅修冥想活动导入验证\n');

// 读取数据
const dataPath = path.join(process.cwd(), 'data', 'items.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 筛选冥想活动
const meditationActivities = data
  .filter(item => item.category === '冥想')
  .sort((a, b) => parseInt(a.activityNumber) - parseInt(b.activityNumber));

console.log(`📊 找到 ${meditationActivities.length} 个冥想活动:\n`);

meditationActivities.forEach((m, index) => {
  console.log(`${index + 1}. ${m.activityNumber} - ${m.title}`);
  console.log(`   📍 地点: ${m.location}`);
  console.log(`   ⏰ 时间: ${m.time}`);
  console.log(`   💰 价格: ${m.price}`);
  console.log(`   📝 预约: ${m.needBooking || '未设置'}`);

  // 显示描述的前150个字符
  const descPreview = m.description ? m.description.substring(0, 150) + (m.description.length > 150 ? '...' : '') : '无描述';
  console.log(`   📄 描述: ${descPreview}`);

  // 检查是否包含语言、网站、联系方式信息
  const hasLanguage = m.description && m.description.includes('语言');
  const hasWebsite = m.description && m.description.includes('网站');
  const hasContact = m.description && m.description.includes('联系');

  console.log(`   ✅ 数据完整性:`);
  console.log(`      - 语言信息: ${hasLanguage ? '✓' : '✗'}`);
  console.log(`      - 网站信息: ${hasWebsite ? '✓' : '✗'}`);
  console.log(`      - 联系方式: ${hasContact ? '✓' : '✗'}`);
  console.log();
});

// 汇总信息
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 验证汇总:');
console.log(`   冥想活动总数: ${meditationActivities.length}`);
console.log(`   编号范围: ${meditationActivities[0]?.activityNumber || 'N/A'} - ${meditationActivities[meditationActivities.length - 1]?.activityNumber || 'N/A'}`);

// 检查数据完整性
const completeActivities = meditationActivities.filter(m =>
  m.description &&
  (m.description.includes('语言') || m.description.includes('网站') || m.description.includes('联系'))
);

console.log(`   完整信息活动: ${completeActivities.length}/${meditationActivities.length}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
