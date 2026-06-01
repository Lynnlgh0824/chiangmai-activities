#!/usr/bin/env node

/**
 * 添加新活动到数据表格
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('📝 添加新活动...\n');

// 新活动数据
const newActivity = {
    title: '清迈粘粘瀑布 (Bua Tong Sticky Waterfall)',
    category: '运动',
    location: 'Namtok Bua Tong-Nam Phu Chet Si National Park，位于清迈北部约60公里处',
    price: '免费进入',
    time: '灵活时间',
    duration: '2-3小时',
    timeInfo: '开放时间：08:00-17:00',
    weekdays: [],
    flexibleTime: '是',
    status: '草稿',
    requireBooking: '是',
    maxParticipants: '不限',
    description: `活动亮点：在瀑布上徒手攀爬、逆流而上、水中嬉戏、拍照打卡，体验"人猿泰山"般的乐趣。

适合人群：喜欢大自然、寻求轻度冒险的旅行者；非常适合家庭亲子游。

介绍信息：
交通方式：包车/拼车（如双条车）是最佳选择。无公共交通直达，返程时很难打车，务必提前安排好往返车辆。
费用：免费进入。
开放时间：08:00 - 17:00。
建议游玩时长：在瀑布区域游玩2-3小时左右比较充裕。`,
    frequency: 'once',
    source: {
        name: '手动添加',
        type: 'manual',
        lastUpdated: new Date().toISOString()
    }
};

// 生成活动编号（找到最大的编号+1）
const maxId = Math.max(...items.map(item => {
    const id = item.id || item.activityNumber || '0';
    return parseInt(id.toString().replace(/\D/g, ''));
}), 0);

const newId = (maxId + 1).toString().padStart(4, '0');
newActivity.id = newId;
newActivity.activityNumber = newId;

console.log('📋 新活动信息:');
console.log(`  活动编号: ${newActivity.id}`);
console.log(`  活动标题: ${newActivity.title}`);
console.log(`  分类: ${newActivity.category}`);
console.log(`  时间: ${newActivity.time}`);
console.log(`  灵活时间: ${newActivity.flexibleTime}\n`);

// 添加到数据数组
items.push(newActivity);

// 按活动编号排序
items.sort((a, b) => {
    const idA = parseInt(a.id || a.activityNumber || '0');
    const idB = parseInt(b.id || b.activityNumber || '0');
    return idA - idB;
});

// 保存数据
fs.writeFileSync(itemsJsonPath, JSON.stringify(items, null, 2), 'utf-8');

console.log(`✅ 活动已添加！`);
console.log(`   总活动数: ${items.length}`);
console.log(`   新活动编号: ${newId}`);

// 自动导出Excel
console.log(`\n📤 正在导出 Excel...`);
try {
    const { execSync } = require('child_process');
    execSync('npm run export-to-excel', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    console.log(`\n✅ Excel 已导出到: 清迈活动数据-导出.xlsx`);
} catch (error) {
    console.log(`\n⚠️ Excel 导出失败，请手动运行: npm run export-to-excel`);
}
