import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('✅ 最终验证 - 数据隔离\n');

// Tab 0: 兴趣班（固定时间，排除市集和灵活时间）
const interestFixed = items.filter(item => {
    if (item.category === '市集') return false;
    if (item.flexibleTime === '是' || item.time === '灵活时间') return false;
    return true;
});

// Tab 1: 市集
const markets = items.filter(item => item.category === '市集');

// Tab 2: 灵活时间活动
const flexible = items.filter(item => item.flexibleTime === '是' || item.time === '灵活时间');

console.log('📅 兴趣班 (固定时间):', interestFixed.length, '个');
console.log('📋 市集:', markets.length, '个');
console.log('⏰ 灵活时间活动:', flexible.length, '个');
console.log('\n✅ 数据隔离验证:');
console.log('   总活动数:', items.length);
console.log('   兴趣班 + 市集 + 灵活时间 =', interestFixed.length + markets.length + flexible.length);

// 检查重叠
const flexibleMarkets = flexible.filter(item => item.category === '市集');
const flexibleInterest = flexible.filter(item => item.category !== '市集');

console.log('\n❓ 重叠检查:');
console.log('   灵活时间中是市集的:', flexibleMarkets.length, '个');
console.log('   灵活时间中是兴趣班的:', flexibleInterest.length, '个');
