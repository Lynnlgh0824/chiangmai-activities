import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const itemsJsonPath = path.join(__dirname, '../data/items.json');

const items = JSON.parse(fs.readFileSync(itemsJsonPath, 'utf-8'));

console.log('🔍 模拟 Tab 3 (🏪 活动网站) 的筛选逻辑\n');
console.log('原始数据总数:', items.length);

// 模拟 filterActivities() 中的 Tab 3 筛选
const tab3Filtered = items.filter(item => {
    return item.source && item.source.url && item.source.url.length > 0;
});

console.log('筛选后活动数:', tab3Filtered.length);
console.log('');

// 检查是否所有筛选出的活动都有有效的 source.url
console.log('✅ 验证每个活动的 source.url:');
let allValid = true;
tab3Filtered.forEach((item, index) => {
    const hasSource = !!item.source;
    const hasUrl = hasSource && !!item.source.url;
    const urlNotEmpty = hasUrl && item.source.url.length > 0;

    if (!hasSource || !hasUrl || !urlNotEmpty) {
        console.log(`❌ 第${index+1}个: ${item.title} - source无效`);
        allValid = false;
    } else {
        console.log(`✅ 第${index+1}个: ${item.title}`);
        console.log(`   分类: ${item.category}`);
        console.log(`   来源: ${item.source.name || '未命名'}`);
        console.log(`   URL: ${item.source.url}`);
        console.log('');
    }
});

console.log('\n📊 结论:');
console.log('- 应该显示的活动数:', tab3Filtered.length);
console.log('- 所有活动数据有效:', allValid ? '✅' : '❌');
console.log('\n💡 如果浏览器中没有显示，可能的原因:');
console.log('1. JavaScript 执行错误（检查浏览器控制台）');
console.log('2. websitesContainer 元素未找到');
console.log('3. HTML 渲染时出错');
